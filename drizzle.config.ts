import { configDotenv } from "dotenv";
import { defineConfig } from "drizzle-kit";

configDotenv();

export default defineConfig({
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
});
