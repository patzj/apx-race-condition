import RedisStore from "connect-redis";
import { createClient } from "redis";

const redisClient = createClient();
redisClient.connect().catch(console.error);

export const redisStore = new RedisStore({
  client: redisClient,
  prefix: "gift-store:",
});
