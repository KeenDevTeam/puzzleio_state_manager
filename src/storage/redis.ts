/**
 * Redis storage
 */

import { promisify } from 'util';

import { ApplicationError, MissingArgumentError } from '@speedup/error';
import { RedisClient, ServerInfo } from 'redis';
import { generate as generateId } from 'shortid';

import { StorageAdapter } from '../type/storage-adapter';

export type RedisStorageConfig = {

	/**
	 * Prefix for the keys
	 */
	prefix: string,
};

export const defaultConfig: RedisStorageConfig = {
	prefix: 'PZIO'
};

const errors = {

	noFlowId: {
		code: 'E_NO_FLOW_ID',
		message: 'flowId must be a non-empty string.',
	},

	notConnected: {
		code: 'E_NOT_CONNECTED',
		message: 'No connection is established to the redis server.',
	}
};

export class RedisStorage implements StorageAdapter {

	/**
	 * Connection
	 */
	private connection?: RedisClient;

	/**
	 * Current configuration (overridden with the defaultConfig)
	 */
	private readonly config: RedisStorageConfig;

	constructor(redisClient?: RedisClient, config?: RedisStorageConfig) {

		if (!redisClient) { throw new MissingArgumentError('redisClient'); }
		this.connection = redisClient;

		// merge user-provided configuration with the default ones
		this.config = {
			...defaultConfig,
			...(config || {}),
		};
	}

	/**
	 * Initialize the storage engine
	 */
	async initialize(): Promise<void> {

		// make sure the database is ready
		this.ensureDatabaseIsReady();

		await promisify<ServerInfo>(this.connection!.info).bind(this.connection!); // eslint-disable-line @typescript-eslint/no-non-null-assertion
	}

	/**
	 * Add state for a new flow (initial state)
	 * @param state Initial state of the flow
	 */
	async save<T>(state: T): Promise<string | void>;

	/**
	 * Set the current state of a flow
	 * @param state Current state
	 * @param flowId Flow ID
	 */
	async save<T>(state: T, flowId?: string): Promise<string | void> {

		// make sure the database is ready
		this.ensureDatabaseIsReady();

		let isNew = false;

		if (!flowId) {
			flowId = await this.generateFlowId();
			isNew = true;
		}

		// promisified function(s)
		const setKey = promisify<string, string>(this.connection!.set).bind(this.connection!);  // eslint-disable-line @typescript-eslint/no-non-null-assertion
		const lpush = promisify<string, string>(this.connection!.lpush).bind(this.connection!);  // eslint-disable-line @typescript-eslint/no-non-null-assertion

		if (isNew) {

			// reserve the name
			await setKey(
				this.prepareKeyName(
					flowId,
					'_'
				),
				JSON.stringify(true)
			);

			// set createdAt
			await setKey(
				this.prepareKeyName(
					flowId,
					'createdAt'
				),
				JSON.stringify(Date.now())
			);
		}

		// set updatedAt
		await setKey(
			this.prepareKeyName(
				flowId,
				'updatedAt'
			),
			JSON.stringify(Date.now())
		);

		// push the new state to the stack
		await lpush(
			this.prepareKeyName(
				flowId,
				'stack'
			),
			JSON.stringify(state)
		);

		// return newly created flow's ID
		if (isNew) { return flowId; }
	}

	/**
	 * Load a specific flow state
	 * @param flowId Target flow ID
	 */
	async load<T>(flowId: string): Promise<T | null>;
	/**
	 * Get a single item from the stack of a specific flow
	 * @param flowId Target flow ID
	 * @param index Target item index
	 */
	async load<T>(flowId: string, index?: number): Promise<T | null> {

		if (!flowId) {
			throw new ApplicationError({
				...errors.noFlowId,
			});
		}

		// make sure that the index is neither null or undefined nor 0
		if (!index) { index = 0; }

		// make sure the database is ready
		this.ensureDatabaseIsReady();

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const getByListIndex = promisify<string, number, string>(this.connection!.lindex).bind(this.connection!);

		const keyName: string = this.prepareKeyName(
			flowId,
			'stack'
		);

		// get the first item in the stack
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const serializedState: any = await getByListIndex(keyName, index);

		// deserialize the state
		const state: T = JSON.parse(serializedState);

		return state;
	}

	/**
	 * Get total items in the stack for a specific flow
	 * @param flowId Target flow ID
	 */
	async getStackSize(flowId: string): Promise<number> {

		if (!flowId) {
			throw new ApplicationError({
				...errors.noFlowId,
			});
		}

		// make sure the database is ready
		this.ensureDatabaseIsReady();

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const getListLength = promisify<string, number>(this.connection!.llen).bind(this.connection!);

		const keyName: string = this.prepareKeyName(
			flowId,
			'stack'
		);

		// get length of the stack
		const stackLength: number = await getListLength(keyName);

		return stackLength;
	}

	/**
	 * Get a flow history
	 * @param flowId Target flow ID
	 */
	async history(flowId: string): Promise<Array<any>> {  // eslint-disable-line @typescript-eslint/no-explicit-any

		if (!flowId) {
			throw new ApplicationError({
				...errors.noFlowId,
			});
		}

		// make sure the database is ready
		this.ensureDatabaseIsReady();

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const getListItems = promisify<string, number, number, Array<string>>(this.connection!.lrange).bind(this.connection!);

		const keyName: string = this.prepareKeyName(
			flowId,
			'stack'
		);

		// get total items in the stack
		const totalItems = await this.getStackSize(flowId);

		// get the first item in the stack
		const serializedListItems: Array<string> = await getListItems(keyName, 0, totalItems - 1);

		// iterate over the list and deserialize each item
		return serializedListItems.map(
			serializedListItem => JSON.parse(serializedListItem)
		);
	}

	/* Private methods */

	/**
	 * Generate a new unique flow ID
	 */
	private async generateFlowId(): Promise<string> {

		let flowId = '';
		let isUnique = false;

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const checkKeyExistence = promisify<string, number>(this.connection!.exists).bind(this.connection!);

		while (!isUnique) {

			// generate a new random ID
			flowId = generateId();

			const key: string = this.prepareKeyName(
				flowId,
				'_'
			);

			// check ID uniqueness
			isUnique = (await checkKeyExistence(key)) === 0;
		}

		return flowId;
	}

	/**
	 * Concatenate key components using colon (:)
	 * @param args Prepare redis-compatible key
	 */
	private prepareKeyName(...args: Array<string>): string {
		return [
			this.config.prefix,
			...args
		].join(':');
	}

	/**
	 * Make sure that the database and all the database-related objects are initialized
	 */
	private ensureDatabaseIsReady(): void {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		if (!this.connection) { Promise.reject(new ApplicationError({ ...errors.notConnected })); }
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		if (!this.connection!.connected) { Promise.reject(new ApplicationError({ ...errors.notConnected })); }
	}
}
