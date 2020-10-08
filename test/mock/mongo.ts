/**
 * Mongo factory
 */

import { join as joinPath, resolve as resolvePath } from 'path';

import { config as loadEnv } from 'dotenv';
import { get as env } from 'env-var';
import { MongoClient } from 'mongodb';

loadEnv({
	path: joinPath(resolvePath(__dirname, '..', '.env'))
});

const mongoClientFactory = (url: string,): Promise<MongoClient> =>
	new Promise<MongoClient>((resolve, reject) => {

		const client = new MongoClient(
			url,
			{
				useUnifiedTopology: true,
			}
		);

		client.connect()
			.then(client => resolve(client))
			.catch(reject);
	});

export const createValidMongoClient = (): Promise<MongoClient> =>
	mongoClientFactory(env('MONGO_URL').required().asUrlString());
