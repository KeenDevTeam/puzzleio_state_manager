/**
 * Mongo storage tests
 */

import 'mocha';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';

import { createValidMongoClient } from '../mock/mongo';

import { MongoStorage, defaultConfig as MongoStorageDefaultConfig } from '../../src/storage/mongo';
import { StorageAdapter } from '../../src/type/storage-adapter';

chai.use(chaiAsPromised);

const custom_db_name = 'puzzleio_state_test';

describe('[PuzzleIO][StateManager][Storage][Mongo]', () => {

	describe('constructor', () => {

		it('should fail if redisClient is undefined', () => {
			expect(() => new MongoStorage()).throw('\'mongoClient\' is not provided (null or undefined).');
		});

		it('should successfully return an instance of MongoStorage', async () => {

			const instance = new MongoStorage(
				await createValidMongoClient()
			);

			expect(instance).to.be.instanceOf(MongoStorage);
		});

		it('should successfully return an instance of MongoStorage with provided configuration', async () => {

			const instance = new MongoStorage(
				await createValidMongoClient(),
				{
					databaseName: custom_db_name,
					collectionName: 'puzzleio_state_test',
				}
			);

			expect(instance).to.be.instanceOf(MongoStorage);
		});

	});

	describe('initialize', () => {

		it('should successfully called', async () => {

			const instance = new MongoStorage(
				await createValidMongoClient()
			);

			expect(instance).to.be.instanceOf(MongoStorage);
			expect(instance.initialize()).to.be.eventually.eq(undefined);
		});

	});

	describe('save', () => {

		let testFlowId: string | void = '';

		describe('success', () => {

			it('should save a new item when flowId is missing', async () => {

				const instance: StorageAdapter = new MongoStorage(await createValidMongoClient(),);
				expect(instance).to.be.instanceOf(MongoStorage);

				testFlowId = await instance.save<number>(0);
				expect(testFlowId).to.be.a('string');

				const stackSize = await instance.getStackSize(testFlowId + '');
				expect(stackSize).to.be.a('number').that.is.eq(1);
			});

			it('should update current state using the previously added flowId', async () => {

				const instance: StorageAdapter = new MongoStorage(await createValidMongoClient(),);
				expect(instance).to.be.instanceOf(MongoStorage);

				await instance.save<number>(1, testFlowId + '');
				expect(testFlowId).to.be.a('string');

				const stackSize = await instance.getStackSize(testFlowId + '');
				expect(stackSize).to.be.a('number').that.is.eq(2);
			});

		});
	});

	describe('load', () => {

		it('should return null when the key does not exist', async () => {

			const instance: StorageAdapter = new MongoStorage(await createValidMongoClient(),);
			expect(instance).to.be.instanceOf(MongoStorage);

			const state = await instance.load<number>('invalid-id');
			expect(state).to.be.null;
		});

		it('should return current value when the key exists', async () => {

			const instance: StorageAdapter = new MongoStorage(await createValidMongoClient(),);
			expect(instance).to.be.instanceOf(MongoStorage);

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

			const instance: StorageAdapter = new MongoStorage(await createValidMongoClient(),);
			expect(instance).to.be.instanceOf(MongoStorage);

			const state = await instance.getStackSize('invalid-id');
			expect(state).to.be.a('number').that.is.eq(0);
		});

		it('should return current stack size when the key exists', async () => {

			const instance: StorageAdapter = new MongoStorage(await createValidMongoClient(),);
			expect(instance).to.be.instanceOf(MongoStorage);

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

			const instance: StorageAdapter = new MongoStorage(await createValidMongoClient(),);
			expect(instance).to.be.instanceOf(MongoStorage);

			const history = await instance.history('invalid-id');
			expect(history).to.be.an('array').that.has.lengthOf(0);
		});

		it('should return current stacked items when the key exists', async () => {

			const instance: StorageAdapter = new MongoStorage(await createValidMongoClient(),);
			expect(instance).to.be.instanceOf(MongoStorage);

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

	after(async () => {

		const client = await createValidMongoClient();

		await client.db(custom_db_name).dropDatabase();
		await client.db(MongoStorageDefaultConfig.databaseName).dropDatabase();
	});
});
