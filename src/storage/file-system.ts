/**
 * FileSystem storage
 */

import { mkdirSync, existsSync, writeFileSync, readdirSync, readFileSync, } from 'fs';
import { join as joinPath, resolve as resolvePath, } from 'path';

import { ApplicationError, } from '@speedup/error';
import { generate as generateId } from 'shortid';

import { StorageAdapter } from '../type/storage-adapter';

export type FileSystemStorageConfig = {

	/**
	 * State storage root
	 */
	rootDir?: string,
};

export const defaultConfig: FileSystemStorageConfig = {
	rootDir: './state_data',
};

const errors = {

	noFlowId: {
		code: 'E_NO_FLOW_ID',
		message: 'flowId must be a non-empty string.',
	},

	notFound: {
		code: 'E_NOT_FOUND',
	},
};

export class FileSystemStorage implements StorageAdapter {

	/**
	 * Current configuration (overridden with the defaultConfig)
	 */
	private readonly config: FileSystemStorageConfig;

	constructor(config?: FileSystemStorageConfig) {

		// merge user-provided configuration with the default ones
		this.config = {
			...defaultConfig,
			...(config || {}),
		};

		// calculate absolute path to the storage directory
		this.config.rootDir = resolvePath(this.config.rootDir!); // eslint-disable-line @typescript-eslint/no-non-null-assertion
	}

	/**
	 * Initialize the storage engine
	 */
	async initialize(): Promise<void> {

		// make sure the storage is ready
		this.ensureDatabaseIsReady();
	}

	/**
	 * Add state for a new flow (initial state)
	 * @param state Initial state of the flow
	 */
	async save<T>(state: T): Promise<string>;

	/**
	 * Set the current state of a flow
	 * @param state Current state
	 * @param flowId Flow ID
	 */
	save<T>(state: T, flowId?: string): Promise<string> {

		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		return new Promise((resolve, reject) => {

			// make sure the database is ready
			this.ensureDatabaseIsReady();

			let isNew = false;
			const storagePath = this.getFlowPath();
			const currentDate: Date = new Date();

			if (!flowId) {
				flowId = this.generateFlowId();
				isNew = true;

				// create storage path
				mkdirSync(joinPath(storagePath, flowId));
			}

			// save application state
			writeFileSync(
				joinPath(storagePath, flowId, currentDate.valueOf().toString()),
				JSON.stringify(state),
				{
					encoding: 'utf-8',
				}
			);

			// apply a small wait here
			setTimeout(
				() => resolve(flowId),
				1,
			);
		});
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

		// make sure that the index is neither null nor undefined nor 0
		if (!index) { index = 0; }

		// make sure the database is ready
		this.ensureDatabaseIsReady();

		const storagePath = this.getFlowPath(flowId);
		if (!existsSync(storagePath)) { return null; }

		// list all states
		const states = readdirSync(storagePath);

		// read file content
		const stateContent = readFileSync(joinPath(storagePath, states[states.length - 1]), 'utf-8');

		// deserialize state
		const state = JSON.parse(stateContent);

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

		const storagePath = this.getFlowPath(flowId);
		if (!existsSync(storagePath)) { return 0; }

		// list all states
		const states = readdirSync(storagePath);

		return states.length;
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

		const storagePath = this.getFlowPath(flowId);
		if (!existsSync(storagePath)) { return []; }

		// list all states
		const stateFiles = readdirSync(storagePath);

		const states = stateFiles
			.reverse()
			.map(stateFile => JSON.parse(readFileSync(joinPath(storagePath, stateFile), 'utf-8')));

		return states;
	}

	/* Private methods */

	/**
	 * Generate a new unique flow ID
	 */
	private generateFlowId(): string {

		let flowId = '';
		let isUnique = false;

		while (!isUnique) {

			// generate a new random ID
			flowId = generateId();

			// check ID uniqueness
			isUnique = existsSync(this.getFlowPath(flowId)) === false;
		}

		return flowId;
	}

	private getFlowPath(...args: Array<string>): string {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		return joinPath(this.config.rootDir!, ...args);
	}

	/**
	 * Make sure that the connection to the database is established
	 */
	private ensureDatabaseIsReady(): void {
		const storagePath = this.getFlowPath();

		if (!existsSync(storagePath)) { Promise.reject(new ApplicationError({ ...errors.notFound, message: `Directory '${storagePath}' does not exist or permission is denied.` })); }
	}
}
