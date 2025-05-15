import { type Config } from "drizzle-kit";

import { env } from "./src/env";

export default {
  schema: "./src/app/server/db/schema.ts",
  dialect: "sqlite",

  out: "./drizzle",
  dbCredentials: {
    url: env.DATABASE_URL,
  },

} satisfies Config;
