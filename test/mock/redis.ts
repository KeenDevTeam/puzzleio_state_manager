/**
 * Redis factory
 */

import { join as joinPath, resolve as resolvePath } from 'path';

import { config as loadEnv } from 'dotenv';
import { get as env } from 'env-var';
import { RedisClient } from 'redis';

loadEnv({
	path: joinPath(resolvePath(__dirname, '..', '.env'))
});

const redisClientFactory = (url: string, db?: number, prefix: string = ''): Promise<RedisClient> =>
	new Promise<RedisClient>((resolve, reject) => {

		const client = new RedisClient({
			url,
			prefix,
			db,
		});

		client.on('ready', () => resolve(client));
		client.on('error', err => reject(err));
	});

export const createValidRedisClient = (prefix: string = ''): Promise<RedisClient> =>
	redisClientFactory(
		env('REDIS_URL').required().asUrlString(),
		env('REDIS_DB').required().asIntPositive(),
		prefix
	);
