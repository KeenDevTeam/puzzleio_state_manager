/**
 * Storage adapter
 */

export interface StorageAdapter {

	/**
	 * Initialize the storage adapter
	 */
	initialize(): Promise<void>;

	/**
	 * Initialize a new flow state and return the created flow ID
	 * @param state Initial state of the flow
	 */
	save<T>(state: T): Promise<string>;

	/**
	 * Modify the current state of a flow by using its ID
	 * @param state Current state
	 * @param flowId Flow ID
	 */
	save<T>(state: T, flowId?: string): Promise<string>;

	/**
	 * Get current state of a flow by using its ID
	 * @param flowId Target flow ID
	 */
	load<T>(flowId: string): Promise<T | null>;

	/**
	 * Get a single item from the stack of a specific flow
	 * @param flowId Target flow ID
	 * @param index Target item index
	 */
	load<T>(flowId: string, index?: number): Promise<T | null>;

	/**
	 * Get total items in the stack for a specific flow
	 * @param flowId Target flow ID
	 */
	getStackSize(flowId: string): Promise<number>;

	/**
	 * Get a flow history
	 * @param flowId Target flow ID
	 */
	history(flowId: string): Promise<Array<any>>; // eslint-disable-line @typescript-eslint/no-explicit-any
}
