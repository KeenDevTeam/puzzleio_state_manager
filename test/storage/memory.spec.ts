/**
 * Memory storage tests
 */

import 'mocha';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';

import { MemoryStorage } from '../../src/storage/memory';
import { StorageAdapter } from '../../src/type/storage-adapter';

chai.use(chaiAsPromised);

describe('[PuzzleIO][StateManager][Storage][Memory]', () => {

	describe('initialize', () => {

		it('should successfully called', async () => {

			const instance = new MemoryStorage();

			expect(instance).to.be.instanceOf(MemoryStorage);
			expect(instance.initialize()).to.be.eventually.eq(undefined);
		});

	});

	describe('save', () => {

		const instance: StorageAdapter = new MemoryStorage();
		let testFlowId: string | void = '';

		describe('success', () => {

			it('should save a new item when flowId is missing', async () => {

				expect(instance).to.be.instanceOf(MemoryStorage);

				testFlowId = await instance.save<number>(0);
				expect(testFlowId).to.be.a('string');

				const stackSize = await instance.getStackSize(testFlowId + '');
				expect(stackSize).to.be.a('number').that.is.eq(1);
			});

			it('should update current state using the previously added flowId', async () => {

				expect(instance).to.be.instanceOf(MemoryStorage);

				await instance.save<number>(1, testFlowId + '');
				expect(testFlowId).to.be.a('string');

				const stackSize = await instance.getStackSize(testFlowId + '');
				expect(stackSize).to.be.a('number').that.is.eq(2);
			});

		});
	});

	describe('load', () => {

		it('should return null when the key does not exist', async () => {

			const instance: StorageAdapter = new MemoryStorage();
			expect(instance).to.be.instanceOf(MemoryStorage);

			const state = await instance.load<number>('invalid-id');
			expect(state).to.be.null;
		});

		it('should return current value when the key exists', async () => {

			const instance: StorageAdapter = new MemoryStorage();
			expect(instance).to.be.instanceOf(MemoryStorage);

			const flowId = await instance.save<number>(0) as string;

			const currentValue = await instance.load<number>(flowId);
			expect(currentValue).to.be.a('number').that.is.eq(0);

			await instance.save<number>(currentValue! + 1, flowId); // eslint-disable-line @typescript-eslint/no-non-null-assertion
			const updatedValue = await instance.load<number>(flowId);
			expect(updatedValue).to.be.a('number').that.is.eq(1);
		});
	});

	describe('getStackSize', () => {

		it('should return 0 when the key does not exist', async () => {

			const instance: StorageAdapter = new MemoryStorage();
			expect(instance).to.be.instanceOf(MemoryStorage);

			const state = await instance.getStackSize('invalid-id');
			expect(state).to.be.a('number').that.is.eq(0);
		});

		it('should return current stack size when the key exists', async () => {

			const instance: StorageAdapter = new MemoryStorage();
			expect(instance).to.be.instanceOf(MemoryStorage);

			const flowId = await instance.save<number>(0) as string;
			const currentStackSize = await instance.getStackSize(flowId);
			expect(currentStackSize).to.be.a('number').that.is.eq(1);

			await instance.save<number>(1, flowId);
			const updatedStackSize = await instance.getStackSize(flowId);
			expect(updatedStackSize).to.be.a('number').that.is.eq(2);
		});

	});

	describe('history', () => {

		it('should return empty array when the key does not exist', async () => {

			const instance: StorageAdapter = new MemoryStorage();
			expect(instance).to.be.instanceOf(MemoryStorage);

			const history = await instance.history('invalid-id');
			expect(history).to.be.an('array').that.has.lengthOf(0);
		});

		it('should return current stacked items when the key exists', async () => {

			const instance: StorageAdapter = new MemoryStorage();
			expect(instance).to.be.instanceOf(MemoryStorage);

			const flowId = await instance.save<number>(0) as string;
			const currentHistory = await instance.history(flowId);
			expect(currentHistory).to.be.an('array').that.has.lengthOf(1);
			expect(currentHistory[0]).to.be.a('number').that.is.eq(0);

			await instance.save<number>(1, flowId);
			const updatedHistory = await instance.history(flowId);
			expect(updatedHistory).to.be.an('array').that.has.lengthOf(2);
			expect(updatedHistory[0]).to.be.a('number').that.is.eq(1);
			expect(updatedHistory[1]).to.be.a('number').that.is.eq(0);
		});

	});
});
