/**
 * MongoDB storage
 */

import { ApplicationError, MissingArgumentError } from '@speedup/error';
import { MongoClient, Db, Collection, } from 'mongodb';
import { generate as generateId } from 'shortid';

import { StorageAdapter } from '../type/storage-adapter';

export type MongoStorageConfig = {

	/**
	 * Name of the target database (if it's not provided in the connection URI)
	 */
	databaseName?: string,

	/**
	 * Collection name for storing states
	 */
	collectionName: string,
};

export const defaultConfig: MongoStorageConfig = {
	collectionName: 'puzzleio_state',
};

const errors = {

	noFlowId: {
		code: 'E_NO_FLOW_ID',
		message: 'flowId must be a non-empty string.',
	},

	notConnected: {
		code: 'E_NOT_CONNECTED',
		message: 'No connection is established to the MongoDB server.',
	},

	notInitialized: {
		code: 'E_NOT_INITIALIZED',
		message: 'Make sure that you\'ve called the "initialize" method before performing any operation.',
	}
};

export class MongoStorage implements StorageAdapter {

	/**
	 * Connection
	 */
	private connection?: MongoClient;

	/**
	 * Current database
	 */
	private database?: Db;

	/**
	 * Current collection
	 */
	private collection?: Collection;

	/**
	 * Current configuration (overridden with the defaultConfig)
	 */
	private readonly config: MongoStorageConfig;

	constructor(mongoClient?: MongoClient, config?: MongoStorageConfig) {

		if (!mongoClient) { throw new MissingArgumentError('mongoClient'); }
		this.connection = mongoClient;

		// merge user-provided configuration with the default ones
		this.config = {
			...defaultConfig,
			...(config || {}),
		};

		this.database = this.connection!.db(this.config.databaseName); // eslint-disable-line @typescript-eslint/no-non-null-assertion
		this.collection = this.database.collection(this.config.collectionName);
	}

	/**
	 * Initialize the storage engine
	 */
	async initialize(): Promise<void> {

		// make sure the database is ready
		this.ensureDatabaseIsReady();
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
		const filter: any = {}; // eslint-disable-line @typescript-eslint/no-explicit-any
		let command: any = {}; // eslint-disable-line @typescript-eslint/no-explicit-any
		const currentDate: Date = new Date();

		if (!flowId) {
			flowId = await this.generateFlowId();
			isNew = true;

			// update command
			command = {
				...command,
				$set: {
					stack: [state],
					createdAt: currentDate,
					updatedAt: currentDate,
				}
			};
		}
		else {

			// update/command object
			command = {
				...command,
				$push: {
					stack: {
						$each: [state],
						$position: 0
					}
				},
				$set: {
					updatedAt: currentDate,
				}
			};
		}

		// add flow ID as query
		filter._id = flowId;

		// perform the query
		const result = await this.collection!.updateOne(filter, command, { upsert: true }); // eslint-disable-line @typescript-eslint/no-non-null-assertion

		if (isNew && result.upsertedCount !== 1) {
			throw new ApplicationError({
				code: 'E_SAVE_FAILED',
				message: 'Failed to create the new state.',
			});
		}

		if (!isNew && result.modifiedCount !== 1) {
			throw new ApplicationError({
				code: 'E_SAVE_FAILED',
				message: 'Failed to add state to the flow state\'s stack',
			});
		}

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

		// create query
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const findCursor = this
			.collection!.find(
				{
					_id: flowId
				}
			)
			.project(
				{
					stack: { $slice: 1 }
				}
			);

		// execute the search result
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const searchResult: Array<any> = await findCursor.toArray();

		// close the cursor
		await findCursor.close();

		// no search result
		if (searchResult.length === 0 || searchResult[0].stack.length === 0) { return null; }

		return searchResult[0].stack[0];
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

		// create query
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const findCursor = this.collection!.aggregate([
			{
				$match: {
					_id: flowId
				},
			},
			{
				$project: {
					stackSize: { $cond: { if: { $isArray: '$stack' }, then: { $size: '$stack' }, else: 0 } },
				}
			}
		]);

		// execute the search result
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const searchResult: Array<any> = await findCursor.toArray();

		// close the cursor
		await findCursor.close();

		// no search result
		if (searchResult.length === 0) { return 0; }

		// clone the retrieved state object
		const stackSize = searchResult[0].stackSize;

		return stackSize;
	}

	/**
	 * Get a flow history
	 * @param flowId Target flow ID
	 */
	async history(flowId: string): Promise<Array<any>> { // eslint-disable-line @typescript-eslint/no-explicit-any

		if (!flowId) {
			throw new ApplicationError({
				...errors.noFlowId,
			});
		}

		// make sure the database is ready
		this.ensureDatabaseIsReady();

		// create query
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const findCursor = this
			.collection!.find(
				{
					_id: flowId
				}
			)
			.project(
				{
					stack: 1
				}
			);

		// execute the search result
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const searchResult: Array<any> = await findCursor.toArray();

		// close the cursor
		await findCursor.close();

		// no search result
		if (searchResult.length === 0 || !searchResult[0].stack) { return []; }

		// clone the retrieved state object
		const stack = [...searchResult[0].stack];

		return stack;
	}

	/* Private methods */

	/**
	 * Generate a new unique flow ID
	 */
	private async generateFlowId(): Promise<string> {

		let flowId = '';
		let isUnique = false;

		while (!isUnique) {

			// generate a new random ID
			flowId = generateId();

			// check ID uniqueness
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			isUnique = (await this.collection!.countDocuments({ _id: flowId })) === 0;
		}

		return flowId;
	}

	/**
	 * Make sure that the connection to the database is established
	 */
	private ensureDatabaseIsReady(): void {
		if (!this.connection) { Promise.reject(new ApplicationError({ ...errors.notConnected })); }
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		if (!this.connection!.isConnected()) { Promise.reject(new ApplicationError({ ...errors.notConnected })); }

		if (!this.database) { Promise.reject(new ApplicationError({ ...errors.notInitialized })); }
		if (!this.collection) { Promise.reject(new ApplicationError({ ...errors.notInitialized })); }
	}
}
