import RedisStore from "connect-redis";
import { createClient } from "redis";

const host = process.env.REDIS_HOST ?? "localhost";
const port = process.env.REDIS_PORT ?? "6379";
const url = `redis://${host}:${port}`;

const redisClient = createClient({ url });
redisClient.connect().catch(console.error);

export const redisStore = new RedisStore({
  client: redisClient,
  prefix: "gift-store:",
});
