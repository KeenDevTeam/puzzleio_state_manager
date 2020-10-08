/**
 * FileSystem storage tests
 */

import { mkdirSync, } from 'fs';
import { join as joinPath, resolve as resolvePath, } from 'path';

import 'mocha';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { sync as rimraf } from 'rimraf';

import { FileSystemStorage } from '../src/storage/file-system';
import { StorageAdapter } from '../src/type/storage-adapter';

chai.use(chaiAsPromised);

const stateFolderName = resolvePath(joinPath(__dirname, 'test_state'));

describe('[PuzzleIO][StateManager][Storage][FileSystem]', () => {

	before(async () => {
		mkdirSync(stateFolderName);
	});

	after(async () => {
		rimraf(stateFolderName);
	});

	describe('initialize', () => {

		it('should successfully called', async () => {

			const instance = new FileSystemStorage({
				rootDir: stateFolderName,
			});

			expect(instance).to.be.instanceOf(FileSystemStorage);
			expect(instance.initialize()).to.be.eventually.eq(undefined);
		});

	});

	describe('save', () => {

		let testFlowId: string | void = '';

		describe('success', () => {

			it('should save a new item when flowId is missing', async () => {

				const instance: StorageAdapter = new FileSystemStorage({
					rootDir: stateFolderName,
				});
				expect(instance).to.be.instanceOf(FileSystemStorage);

				testFlowId = await instance.save<number>(0);
				expect(testFlowId).to.be.a('string');

				const stackSize = await instance.getStackSize(testFlowId + '');
				expect(stackSize).to.be.a('number').that.is.eq(1);
			});

			it('should update current state using the previously added flowId', async () => {

				const instance: StorageAdapter = new FileSystemStorage({
					rootDir: stateFolderName,
				});
				expect(instance).to.be.instanceOf(FileSystemStorage);

				await instance.save<number>(1, testFlowId + '');
				expect(testFlowId).to.be.a('string');

				const stackSize = await instance.getStackSize(testFlowId + '');
				expect(stackSize).to.be.a('number').that.is.eq(2);
			});

		});
	});

	describe('load', () => {

		it('should return null when the key does not exist', async () => {

			const instance: StorageAdapter = new FileSystemStorage({
				rootDir: stateFolderName,
			});
			expect(instance).to.be.instanceOf(FileSystemStorage);

			const state = await instance.load<number>('invalid-id');
			expect(state).to.be.null;
		});

		it('should return current value when the key exists', async () => {

			const instance: StorageAdapter = new FileSystemStorage({
				rootDir: stateFolderName,
			});
			expect(instance).to.be.instanceOf(FileSystemStorage);

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

			const instance: StorageAdapter = new FileSystemStorage({
				rootDir: stateFolderName,
			});
			expect(instance).to.be.instanceOf(FileSystemStorage);

			const state = await instance.getStackSize('invalid-id');
			expect(state).to.be.a('number').that.is.eq(0);
		});

		it('should return current stack size when the key exists', async () => {

			const instance: StorageAdapter = new FileSystemStorage({
				rootDir: stateFolderName,
			});
			expect(instance).to.be.instanceOf(FileSystemStorage);

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

			const instance: StorageAdapter = new FileSystemStorage({
				rootDir: stateFolderName,
			});
			expect(instance).to.be.instanceOf(FileSystemStorage);

			const history = await instance.history('invalid-id');
			expect(history).to.be.an('array').that.has.lengthOf(0);
		});

		it('should return current stacked items when the key exists', async () => {

			const instance: StorageAdapter = new FileSystemStorage({
				rootDir: stateFolderName,
			});
			expect(instance).to.be.instanceOf(FileSystemStorage);

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
