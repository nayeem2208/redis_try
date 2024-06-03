import { createClient } from 'redis';
import dotenv from "dotenv";
dotenv.config();

const client = createClient({
  url: process.env.REDIS_URL,
  password:process.env.REDIS_PASSWORD
});

client.on('error', err => console.log('Redis Client Error', err));

async function redisConnect() {
  await client.connect();
}

export { redisConnect, client };
