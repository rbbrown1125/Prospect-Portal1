import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;
import { config } from "./config";

let pool: any;
let db: any;
let connectionAttempts = 0;

async function waitForDatabase(): Promise<boolean> {
  const maxAttempts = config.database.maxRetries;
  
  while (connectionAttempts < maxAttempts) {
    try {
      connectionAttempts++;
      console.log(`Attempting database connection (${connectionAttempts}/${maxAttempts})...`);
      
      // Try to connect
      const testPool = new Pool({
        connectionString: config.database.url,
        max: 1,
        connectionTimeoutMillis: 5000,
        query_timeout: 5000,
        statement_timeout: 5000,
        idle_in_transaction_session_timeout: 5000
      });
      
      // Test the connection
      await testPool.query('SELECT 1');
      await testPool.end();
      
      console.log('✅ Database connection successful!');
      return true;
      
    } catch (error: any) {
      console.log(`Database not ready: ${error.message}`);
      
      if (connectionAttempts < maxAttempts) {
        console.log(`Waiting ${config.database.retryDelay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, config.database.retryDelay));
      }
    }
  }
  
  return false;
}

export async function initializeDatabase() {
  // Wait for database to be ready
  const isReady = await waitForDatabase();
  
  if (!isReady) {
    console.error('❌ Could not connect to database after maximum attempts');
    console.log('🔧 Using in-memory fallback mode (data will not persist)');
    // Continue anyway - the app will work without database
    return null;
  }
  
  // Create the actual connection pool
  pool = new Pool({
    connectionString: config.database.url,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
  
  pool.on('error', (err: any) => {
    console.error('Unexpected error on idle client', err);
  });
  
  db = drizzle(pool);
  
  return { db, pool };
}

export { db, pool };