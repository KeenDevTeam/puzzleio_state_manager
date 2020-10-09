/**
 * Memory (In-Memory) storage
 */

import { ApplicationError, } from '@speedup/error';
import { generate as generateId } from 'shortid';

import { StorageAdapter } from '../type/storage-adapter';

const errors = {

	noFlowId: {
		code: 'E_NO_FLOW_ID',
		message: 'flowId must be a non-empty string.',
	}
};

export type MemoryStateModel = {

	stack: Array<any>, // eslint-disable-line @typescript-eslint/no-explicit-any

	createdAt: Date,
	updatedAt: Date,
}

export class MemoryStorage implements StorageAdapter {

	/**
	 * Application state
	 */
	private readonly state: { [key: string]: MemoryStateModel } = {};

	/**
	 * Initialize the storage engine
	 */
	async initialize(): Promise<void> { } // eslint-disable-line @typescript-eslint/no-empty-function

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
	async save<T>(state: T, flowId?: string): Promise<string> {

		let isNew = false;

		if (!flowId) {
			flowId = await this.generateFlowId();
			isNew = true;
		}

		const currentDate = new Date();

		if (isNew) {

			this.state[flowId] = {

				stack: [],

				createdAt: currentDate,
				updatedAt: currentDate,
			};
		}

		this.state[flowId].stack.push(state);
		this.state[flowId].updatedAt = currentDate;

		return flowId;
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

		const state = this.state[flowId];
		if (state === undefined) { return null; }

		return state.stack.reverse()[index];
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

		const state = this.state[flowId];
		if (state === undefined) { return 0; }

		return state.stack.length;
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

		const state = this.state[flowId];
		if (state === undefined) { return []; }

		return [...state.stack.reverse()];
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
			isUnique = this.state[flowId] === undefined;
		}

		return flowId;
	}
}
