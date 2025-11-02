// Hardcoded configuration - no external dependencies needed
export const config = {
  // Database - use local PostgreSQL or fallback to in-memory
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/prospect_portal',
    maxRetries: 30,
    retryDelay: 2000
  },
  
  // Session configuration
  session: {
    secret: process.env.SESSION_SECRET || 'hardcoded-secret-key-for-testing-change-in-production-abc123xyz789',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  },
  
  // Email configuration (disabled by default)
  email: {
    sendgrid: {
      apiKey: process.env.SENDGRID_API_KEY || '',
      fromEmail: 'noreply@godlan.com',
      enabled: false // Disable email sending completely
    }
  },
  
  // File storage (use local filesystem)
  storage: {
    airtable: {
      apiKey: process.env.AIRTABLE_API_KEY || '',
      baseId: process.env.AIRTABLE_BASE_ID || '',
      enabled: false // Disable Airtable completely
    },
    local: {
      uploadDir: '/tmp/uploads',
      enabled: true
    }
  },
  
  // Application settings
  app: {
    port: 5000,
    host: '0.0.0.0',
    env: process.env.NODE_ENV || 'development'
  }
};

// Test users that will always exist
export const TEST_USERS = [
  {
    email: 'admin@godlan.com',
    password: 'Admin123!',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin'
  },
  {
    email: 'manager@godlan.com',
    password: 'Manager123!',
    firstName: 'Sarah',
    lastName: 'Johnson',
    role: 'admin'
  },
  {
    email: 'john.smith@godlan.com',
    password: 'User123!',
    firstName: 'John',
    lastName: 'Smith',
    role: 'user'
  }
];