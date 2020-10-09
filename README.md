
# PuzzleIO / State Manager

Manage the state of your workflows with ease using a variety of storage engines including memory (RAM), file system, MongoDB and redis.

[![NPM version][npm-image]][npm-url]
[![NPM downloads][downloads-image]][downloads-url]

## Installation

```sh

# NPM
npm i @puzzleio/state-manager --save

# Yarn
yarn install @puzzleio/state-manager

```

## Usage

For using each of the adapters, please follow the instruction below.

1. Prepare instance requirements (e.g. redis client, mongodb client and etc).
2. Instantiate the adapter class (create a new instance of adapter).
3. Call initialize method of the adapter instance.
4. Start using the driver.

### Javascript

```js

const stateManager = require('@puzzleio/state-manager');



// MemoryStorage

// Step 1
// No requirements

// Step 2
const inMemory = new stateManager.storage.memory.MemoryStorage();

// Step 3
await inMemory.initialize();

// Step 4
let flowId = await inMemory.save(100);
// flowId is a random 8 character length string

let currentState = await inMemory.load(flowId); // or provide the index await inMemory.load(flowId, 0);
// currentState = 100

let stackSize = await inMemory.getStackSize(flowId);
// stackSize = 1 (we saved one item in the stack)

await inMemory.save(flowId, currentState + 1);

currentState = await inMemory.load(flowId); // or provide the index await inMemory.load(flowId, 0);
// currentState = 101

stackSize = await inMemory.getStackSize(flowId);
// stackSize = 2 (we saved two items in the stack)

let history = await inMemory.history(flowId);
// history = [ 101, 100 ];



// FileSystem

const { resolve, join } = require('path');

// Step 1
const fileSystemConfig = {
    rootDir: resolve(join(__dirname, 'state'))
};

// Step 2
const fileSystem = new stateManager.storage.fileSystem.FileSystemStorage(fileSystemConfig);

// Step 3
await fileSystem.initialize();

// Step 4
let flowId = await fileSystem.save(100);
// flowId is a random 8 character length string

let currentState = await fileSystem.load(flowId); // or provide the index await fileSystem.load(flowId, 0);
// currentState = 100

let stackSize = await fileSystem.getStackSize(flowId);
// stackSize = 1 (we saved one item in the stack)

await fileSystem.save(flowId, currentState + 1);

currentState = await fileSystem.load(flowId); // or provide the index await fileSystem.load(flowId, 0);
// currentState = 101

stackSize = await fileSystem.getStackSize(flowId);
// stackSize = 2 (we saved two items in the stack)

let history = await fileSystem.history(flowId);
// history = [ 101, 100 ];


// MongoDB

// Step 1
const mongodbConfig = {
    databaseName: 'my_app',
    collectionName: 'my_app_state',
};

// Step 2
const mongoStorage = new stateManager.storage.mongoDB.MongoStorage(mongodbClient, mongodbConfig);

// Step 3
await mongoStorage.initialize();

// Step 4
let flowId = await mongoStorage.save(100);
// flowId is a random 8 character length string

let currentState = await mongoStorage.load(flowId); // or provide the index await mongoStorage.load(flowId, 0);
// currentState = 100

let stackSize = await mongoStorage.getStackSize(flowId);
// stackSize = 1 (we saved one item in the stack)

await mongoStorage.save(flowId, currentState + 1);

currentState = await mongoStorage.load(flowId); // or provide the index await mongoStorage.load(flowId, 0);
// currentState = 101

stackSize = await mongoStorage.getStackSize(flowId);
// stackSize = 2 (we saved two items in the stack)

let history = await mongoStorage.history(flowId);
// history = [ 101, 100 ];


// Redis

// Step 1
const redisConfig = {
    prefix: 'MYAPP:',
};

// Step 2
const redisStorage = new stateManager.storage.redis.RedisStorage(redisClient, redisConfig);

// Step 3
await redisStorage.initialize();

// Step 4
let flowId = await redisStorage.save(100);
// flowId is a random 8 character length string

let currentState = await redisStorage.load(flowId); // or provide the index await redisStorage.load(flowId, 0);
// currentState = 100

let stackSize = await redisStorage.getStackSize(flowId);
// stackSize = 1 (we saved one item in the stack)

await redisStorage.save(flowId, currentState + 1);

currentState = await redisStorage.load(flowId); // or provide the index await redisStorage.load(flowId, 0);
// currentState = 101

stackSize = await redisStorage.getStackSize(flowId);
// stackSize = 2 (we saved two items in the stack)

let history = await redisStorage.history(flowId);
// history = [ 101, 100 ];


```

### TypeScript

```ts

import * as stateManager from '@puzzleio/state-manager';

// MemoryStorage

// Step 1
// No requirements

// Step 2
const inMemory = new stateManager.storage.memory.MemoryStorage();

// Step 3
await inMemory.initialize();

// Step 4
let flowId = await inMemory.save(100);
// flowId is a random 8 character length string

let currentState = await inMemory.load(flowId); // or provide the index await inMemory.load(flowId, 0);
// currentState = 100

let stackSize = await inMemory.getStackSize(flowId);
// stackSize = 1 (we saved one item in the stack)

await inMemory.save(flowId, currentState + 1);

currentState = await inMemory.load(flowId); // or provide the index await inMemory.load(flowId, 0);
// currentState = 101

stackSize = await inMemory.getStackSize(flowId);
// stackSize = 2 (we saved two items in the stack)

let history = await inMemory.history(flowId);
// history = [ 101, 100 ];



// FileSystem

import { resolve, join } from 'path';

// Step 1
const fileSystemConfig = {
    rootDir: resolve(join(__dirname, 'state'))
};

// Step 2
const fileSystem = new stateManager.storage.fileSystem.FileSystemStorage(fileSystemConfig);

// Step 3
await fileSystem.initialize();

// Step 4
let flowId = await fileSystem.save(100);
// flowId is a random 8 character length string

let currentState = await fileSystem.load(flowId); // or provide the index await fileSystem.load(flowId, 0);
// currentState = 100

let stackSize = await fileSystem.getStackSize(flowId);
// stackSize = 1 (we saved one item in the stack)

await fileSystem.save(flowId, currentState + 1);

currentState = await fileSystem.load(flowId); // or provide the index await fileSystem.load(flowId, 0);
// currentState = 101

stackSize = await fileSystem.getStackSize(flowId);
// stackSize = 2 (we saved two items in the stack)

let history = await fileSystem.history(flowId);
// history = [ 101, 100 ];


// MongoDB

// Step 1
const mongodbConfig = {
    databaseName: 'my_app',
    collectionName: 'my_app_state',
};

// Step 2
const mongoStorage = new stateManager.storage.mongoDB.MongoStorage(mongodbClient, mongodbConfig);

// Step 3
await mongoStorage.initialize();

// Step 4
let flowId = await mongoStorage.save(100);
// flowId is a random 8 character length string

let currentState = await mongoStorage.load(flowId); // or provide the index await mongoStorage.load(flowId, 0);
// currentState = 100

let stackSize = await mongoStorage.getStackSize(flowId);
// stackSize = 1 (we saved one item in the stack)

await mongoStorage.save(flowId, currentState + 1);

currentState = await mongoStorage.load(flowId); // or provide the index await mongoStorage.load(flowId, 0);
// currentState = 101

stackSize = await mongoStorage.getStackSize(flowId);
// stackSize = 2 (we saved two items in the stack)

let history = await mongoStorage.history(flowId);
// history = [ 101, 100 ];


// Redis

// Step 1
const redisConfig = {
    prefix: 'MYAPP:',
};

// Step 2
const redisStorage = new stateManager.storage.redis.RedisStorage(redisClient, redisConfig);

// Step 3
await redisStorage.initialize();

// Step 4
let flowId = await redisStorage.save(100);
// flowId is a random 8 character length string

let currentState = await redisStorage.load(flowId); // or provide the index await redisStorage.load(flowId, 0);
// currentState = 100

let stackSize = await redisStorage.getStackSize(flowId);
// stackSize = 1 (we saved one item in the stack)

await redisStorage.save(flowId, currentState + 1);

currentState = await redisStorage.load(flowId); // or provide the index await redisStorage.load(flowId, 0);
// currentState = 101

stackSize = await redisStorage.getStackSize(flowId);
// stackSize = 2 (we saved two items in the stack)

let history = await redisStorage.history(flowId);
// history = [ 101, 100 ];

```

And you're good to go!

## License

[npm-image]: https://img.shields.io/npm/v/@puzzleio/state-manager.svg?color=orange
[npm-url]: https://npmjs.org/package/@puzzleio/state-manager
[downloads-image]: https://img.shields.io/npm/dt/@puzzleio/state-manager.svg
[downloads-url]: https://npmjs.org/package/@puzzleio/state-manager
