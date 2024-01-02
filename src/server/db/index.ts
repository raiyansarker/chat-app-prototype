import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

import { env } from "@/env";
import * as schema from "./schema";

export const db = drizzle(
  await mysql.createConnection({
    uri: env.DATABASE_URL,
  }),
  { mode: "planetscale", schema },
);
