import { Pool, type PoolConfig } from "pg";

const config: PoolConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
};

const pool = new Pool(config);

export default pool;
