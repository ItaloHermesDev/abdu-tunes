import "server-only";

import mysql, { type Pool, type PoolOptions, type RowDataPacket } from "mysql2/promise";
import { getEnv } from "@/lib/env";

type GlobalMysql = typeof globalThis & { __abduMysql?: Pool };

export function getPool() {
  const g = globalThis as GlobalMysql;
  if (!g.__abduMysql) {
    const env = getEnv();
    const options: PoolOptions = {
      host: env.dbHost,
      port: env.dbPort,
      user: env.dbUser,
      password: env.dbPassword,
      database: env.dbName,
      waitForConnections: true,
      connectionLimit: 8,
      namedPlaceholders: false,
      charset: "utf8mb4",
    };
    g.__abduMysql = mysql.createPool(options);
  }
  return g.__abduMysql;
}

export async function query<T extends RowDataPacket = RowDataPacket>(
  sql: string,
  args: Array<string | number | null> = [],
) {
  const [rows] = await getPool().execute<T[]>(sql, args);
  return { rows: rows as unknown as Array<Record<string, unknown>> };
}

export async function exec(sql: string, args: Array<string | number | null> = []) {
  await getPool().execute(sql, args);
}
