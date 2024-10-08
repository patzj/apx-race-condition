import mysql from "mysql2/promise";
import { v4 as uuidv4 } from "uuid";

const user = process.env.MYSQL_USER ?? "root";
const password = process.env.MYSQL_PASSWORD ?? "password";

const host = process.env.MYSQL_HOST ?? "localhost";
const port = parseInt(process.env.MYSQL_PORT ?? "3306");
const database = process.env.MYSQL_DATABASE ?? "demo";

async function connect(database?: string) {
  return await mysql.createConnection({
    user,
    password,
    host,
    port,
    database,
  });
}

async function lockTables(conn: mysql.Connection) {
  const lock = "LOCK TABLES account WRITE, voucher WRITE";
  await conn.query(lock);
  conn.unprepare(lock);
}

async function unlockTables(conn: mysql.Connection) {
  const unlock = "unlock tables";
  await conn.query(unlock);
  conn.unprepare(unlock);
}

export async function initialize() {
  const conn = await connect();
  await conn.execute(`DROP DATABASE IF EXISTS ${database}`);
  await conn.execute(`CREATE DATABASE ${database}`);
  await conn.end();
}

export async function seed() {
  const conn = await connect(database);

  await Promise.all([
    conn.execute("CREATE TABLE voucher (code TEXT, value REAL, used BOOLEAN)"),
    conn.execute("CREATE TABLE account (id SERIAL, email TEXT, balance REAL)"),
  ]);

  await conn.query("INSERT INTO account VALUES (69, 'user@email.com', 10.00)");
  await conn.end();
}

export async function getBalance(accountId: string | number): Promise<number> {
  const conn = await connect(database);
  const [results]: any[][] = await conn.query(
    "SELECT balance FROM account WHERE id=?",
    [accountId]
  );

  let balance = 0;
  if (results.length === 1) {
    balance = results[0]["balance"];
  }

  conn.end();
  return balance;
}

export async function buyItem(accountId: string, itemId: string) {
  const conn = await connect(database);
  await conn.beginTransaction();
  await lockTables(conn);

  let balance = 0;
  let value = 0;
  let code = "";
  let flag = "";

  try {
    const [results]: any[][] = await conn.query(
      "SELECT balance FROM account WHERE id=?",
      [accountId]
    );

    if (results.length === 1) {
      balance = results[0]["balance"];
    }

    switch (itemId) {
      case "1":
        value = 10;
        code = uuidv4();
        break;
      case "0":
        value = 100;
        flag = "APX{R@c3_t0_th3_F1n1$h}";
        break;
      default:
        throw new Error("Item not found.");
    }

    if (value > balance) {
      throw new Error("Insufficient balance.");
    }

    balance -= value;
    await Promise.all([
      conn.query("INSERT INTO voucher VALUES (?,?,?)", [code, value, false]),
      conn.query("UPDATE account SET balance=? WHERE id=?", [
        balance,
        accountId,
      ]),
    ]);
    await conn.commit();
  } catch (err: any) {
    await conn.rollback();
    throw new Error(err.message);
  } finally {
    unlockTables(conn);
    await conn.end();
  }

  return { flag, code, balance };
}

export async function redeemVoucher(accountId: string, code: string) {
  const conn = await connect(database);
  await conn.beginTransaction();

  try {
    const [vouchers]: any[][] = await conn.query(
      "SELECT value FROM voucher WHERE code=? AND used=?",
      [code, false]
    );

    let value = 0;
    if (vouchers.length === 1) {
      value = vouchers[0]["value"];
    } else {
      throw new Error("Invalid gift card.");
    }

    await Promise.all([
      conn.query("UPDATE voucher SET used=? WHERE code=?", [true, code]),
      conn.query("UPDATE account SET balance=balance+? WHERE id=?", [
        value,
        accountId,
      ]),
    ]);

    await conn.commit();
  } catch (err: any) {
    await conn.rollback();
    throw new Error(err.message);
  } finally {
    await conn.end();
  }
}
