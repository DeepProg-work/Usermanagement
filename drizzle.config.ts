import { type Config } from "drizzle-kit";

import { env } from "./src/env.mjs";

export default {
  schema: "./src/app/server/db/schema.ts",
   dialect: "sqlite", // <-- ADD THIS LINE
 // driver: "better-sqlite3", 

  out: "./drizzle",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
verbose: true,
} satisfies Config;
