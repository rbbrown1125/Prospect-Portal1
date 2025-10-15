import { pool, db } from "../server/db";
import { users } from "../shared/schema";

function isConnectionRefused(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const maybeErrno = error as { code?: unknown; cause?: unknown };
  if (maybeErrno.code === "ECONNREFUSED" || maybeErrno.code === "ENOTFOUND") {
    return true;
  }

  if (maybeErrno.cause && typeof maybeErrno.cause === "object") {
    const { code } = maybeErrno.cause as { code?: unknown };
    if (code === "ECONNREFUSED" || code === "ENOTFOUND") {
      return true;
    }
  }

  return false;
}

interface CheckResult {
  name: string;
  status: "passed" | "failed" | "skipped";
  message: string;
}

async function checkDatabase(): Promise<CheckResult> {
  try {
    const client = await pool.connect();
    try {
      await client.query("select 1 as health_check");
    } finally {
      client.release();
    }

    const [user] = await db.select().from(users).limit(1);
    const message = user
      ? `Database reachable. Sample user: ${user.email}`
      : "Database reachable but contains no users.";

    return {
      name: "database",
      status: "passed",
      message,
    };
  } catch (error) {
    if (isConnectionRefused(error)) {
      return {
        name: "database",
        status: "skipped",
        message:
          "PostgreSQL service is unreachable. Ensure the bundled Docker container is running or provide DATABASE_URL to run this check.",
      };
    }

    return {
      name: "database",
      status: "failed",
      message: `Database connectivity check failed: ${(error as Error).message}`,
    };
  }
}

async function checkAirtable(): Promise<CheckResult> {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableName = process.env.AIRTABLE_TABLE_NAME ?? "Assets";

  if (!apiKey || !baseId) {
    return {
      name: "airtable",
      status: "skipped",
      message: "AIRTABLE_API_KEY or AIRTABLE_BASE_ID not provided. Skipping Airtable check.",
    };
  }

  const endpoint = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}?maxRecords=1`;

  try {
    const response = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const body = await response.text();
      return {
        name: "airtable",
        status: "failed",
        message: `Airtable responded with ${response.status}: ${body}`,
      };
    }

    return {
      name: "airtable",
      status: "passed",
      message: "Successfully queried Airtable base.",
    };
  } catch (error) {
    return {
      name: "airtable",
      status: "failed",
      message: `Airtable connectivity check failed: ${(error as Error).message}`,
    };
  }
}

async function checkSendGrid(): Promise<CheckResult> {
  const apiKey = process.env.SENDGRID_API_KEY;

  if (!apiKey) {
    return {
      name: "sendgrid",
      status: "skipped",
      message: "SENDGRID_API_KEY not provided. Skipping SendGrid check.",
    };
  }

  try {
    const response = await fetch("https://api.sendgrid.com/v3/user/account", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const body = await response.text();
      return {
        name: "sendgrid",
        status: "failed",
        message: `SendGrid responded with ${response.status}: ${body}`,
      };
    }

    return {
      name: "sendgrid",
      status: "passed",
      message: "Successfully queried SendGrid account endpoint.",
    };
  } catch (error) {
    return {
      name: "sendgrid",
      status: "failed",
      message: `SendGrid connectivity check failed: ${(error as Error).message}`,
    };
  }
}

async function checkApiServer(): Promise<CheckResult> {
  const endpoint = process.env.INTEGRATION_TEST_API;

  if (!endpoint) {
    return {
      name: "api",
      status: "skipped",
      message: "INTEGRATION_TEST_API not provided. Skipping API health check.",
    };
  }

  try {
    const response = await fetch(endpoint, { method: "GET" });

    if (!response.ok) {
      return {
        name: "api",
        status: "failed",
        message: `API health endpoint responded with ${response.status}`,
      };
    }

    return {
      name: "api",
      status: "passed",
      message: `API responded with ${response.status}.`,
    };
  } catch (error) {
    return {
      name: "api",
      status: "failed",
      message: `Failed to reach API health endpoint: ${(error as Error).message}`,
    };
  }
}

async function main() {
  const checks = await Promise.all([
    checkDatabase(),
    checkAirtable(),
    checkSendGrid(),
    checkApiServer(),
  ]);

  let hasFailure = false;

  for (const check of checks) {
    const indicator = check.status === "passed" ? "✅" : check.status === "skipped" ? "⚠️" : "❌";
    console.log(`${indicator} ${check.name}: ${check.message}`);
    if (check.status === "failed") {
      hasFailure = true;
    }
  }

  if (hasFailure) {
    process.exitCode = 1;
  }

  await pool.end().catch(() => undefined);
}

void main();
