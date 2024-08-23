import { Client } from "pg";

const user = process.env.POSTGRES_USER ?? "postgres";
const password = process.env.POSTGRES_PASSWORD ?? "password";

const host = process.env.POSTGRES_HOST ?? "localhost";
const port = parseInt(process.env.POSTGRES_PORT ?? "5432");
const database = process.env.POSTGRES_DATABASE ?? "demo";

export function dbclient(database?: string) {
  return new Client({
    user,
    password,
    host,
    port,
    database,
  });
}

export async function initialize() {
  const client = dbclient();
  await client.connect();
  await client.query(`DROP DATABASE IF EXISTS ${database}`);
  await client.query(`CREATE DATABASE ${database}`);
  await client.end();
}

export async function seed() {
  const client = dbclient(database);
  await client.connect();

  await Promise.all([
    client.query("CREATE TABLE voucher (code TEXT, value REAL, used BOOLEAN)"),
    client.query("CREATE TABLE account (id SERIAL, email TEXT, balance REAL)"),
  ]);

  await client.query(
    "INSERT INTO account VALUES (69, 'user@email.com', 10.00)"
  );

  await client.end();
}
