import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "postgresql://postgres@127.0.0.1:5432/prospect_portal";
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
