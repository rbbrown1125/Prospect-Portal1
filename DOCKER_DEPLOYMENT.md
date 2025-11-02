# Docker Deployment Guide

## Overview
This application is designed to be deployed both on Replit and as a Docker container for local/production deployment. The codebase maintains proper separation between client and server, uses environment variables for configuration, and follows security best practices.

## Environment Variables Required

### Required for Full Functionality
```bash
# Database (PostgreSQL)
DATABASE_URL=postgresql://user:password@host:port/database

# SendGrid Email Integration (Optional - gracefully degrades if not set)
SENDGRID_API_KEY=your_sendgrid_api_key_here

# Airtable File Storage (Optional - for file uploads)
AIRTABLE_API_KEY=your_airtable_api_key_here
AIRTABLE_BASE_ID=your_airtable_base_id_here
AIRTABLE_TABLE_NAME=Assets
AIRTABLE_ATTACHMENT_FIELD=File

# Session Secret
SESSION_SECRET=your_secure_random_session_secret_here

# Environment
NODE_ENV=production
```

### Environment Variable Details

1. **DATABASE_URL**: PostgreSQL connection string
   - Required for the application to function
   - Format: `postgresql://username:password@hostname:port/database_name`

2. **SENDGRID_API_KEY**: SendGrid API key for sending emails
   - Optional - email functionality will be disabled if not set
   - Used for verification emails and access code invitations
   - The application logs email attempts when this is not set (development mode)

3. **AIRTABLE_API_KEY & AIRTABLE_BASE_ID**: Airtable configuration for file storage
   - Optional - needed only if using Airtable for file uploads
   - Can use local file storage as alternative

4. **SESSION_SECRET**: Secret key for session encryption
   - Required for secure session management
   - Should be a long, random string

## Docker Configuration

The existing `Dockerfile` and `docker-entrypoint.sh` are configured and ready to use.

### Building the Docker Image
```bash
docker build -t godlan-portal .
```

### Running the Container
```bash
docker run -d \
  -p 5000:5000 \
  -e DATABASE_URL="postgresql://user:password@host:port/database" \
  -e SENDGRID_API_KEY="your_sendgrid_key" \
  -e AIRTABLE_API_KEY="your_airtable_key" \
  -e AIRTABLE_BASE_ID="your_base_id" \
  -e SESSION_SECRET="your_session_secret" \
  -e NODE_ENV="production" \
  --name godlan-portal \
  godlan-portal
```

### Using Docker Compose
Create a `docker-compose.yml`:
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=postgresql://user:password@postgres:5432/godlan_portal
      - SENDGRID_API_KEY=${SENDGRID_API_KEY}
      - AIRTABLE_API_KEY=${AIRTABLE_API_KEY}
      - AIRTABLE_BASE_ID=${AIRTABLE_BASE_ID}
      - SESSION_SECRET=${SESSION_SECRET}
      - NODE_ENV=production
    depends_on:
      - postgres
  
  postgres:
    image: postgres:16
    environment:
      - POSTGRES_DB=godlan_portal
      - POSTGRES_USER=godlan
      - POSTGRES_PASSWORD=secure_password_here
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## Test Users Created

The application has been seeded with 6 test users for development and testing:

| Email | Password | Role | Name |
|-------|----------|------|------|
| admin@godlan.com | Admin123! | Admin | Admin User |
| manager@godlan.com | Manager123! | Admin | Sarah Johnson |
| john.smith@godlan.com | User123! | User | John Smith |
| emily.chen@godlan.com | User123! | User | Emily Chen |
| mike.davis@godlan.com | User123! | User | Mike Davis |
| jamie.sales@godlan.com | SamplePass123! | Admin | Jamie Sales |

**Note**: All users must have @godlan.com email addresses to access the application.

## Database Seeding

The database has been populated with:
- **6 users** (5 test users + 1 sample user)
- **6 templates** (automatically seeded on first run)
- **1 sample site** ("Acme Onboarding Portal")
- **2 prospects** (Alex Carter, Morgan Lee)
- **3 content items** (sample documents)
- **6 site views** (analytics data)

### Running Seed Scripts Manually
```bash
# Seed sample data (creates sample site, prospects, content)
npm run seed:samples

# Create additional test users
tsx scripts/create-test-users.ts
```

## Security Features

✅ **Client/Server Separation**: Frontend and backend are properly separated
✅ **Environment Variables**: All secrets use environment variables (no hardcoded keys)
✅ **Password Hashing**: bcrypt/scrypt used for password storage
✅ **Session Management**: Secure session handling with PostgreSQL store
✅ **Email Validation**: Restricted to @godlan.com domain
✅ **Role-Based Access**: Admin and User roles implemented
✅ **SQL Injection Protection**: Drizzle ORM with parameterized queries
✅ **Graceful Degradation**: Email features degrade gracefully when API keys not set

## API Integration Status

### SendGrid (Email)
- **Status**: Configured with environment variables
- **Functionality**: Email verification, access code invitations
- **Fallback**: Logs emails to console when API key not set
- **Setup Required**: Add SENDGRID_API_KEY to environment variables

### Airtable (File Storage)
- **Status**: Configured with environment variables
- **Functionality**: File upload and storage
- **Fallback**: Can use local file system storage
- **Setup Required**: Add AIRTABLE_API_KEY and AIRTABLE_BASE_ID if using Airtable

## Production Deployment Checklist

- [ ] Set strong SESSION_SECRET
- [ ] Configure DATABASE_URL for production database
- [ ] Add SENDGRID_API_KEY for email functionality
- [ ] (Optional) Add AIRTABLE credentials for cloud file storage
- [ ] Set NODE_ENV=production
- [ ] Configure reverse proxy (nginx) for SSL/TLS
- [ ] Set up database backups
- [ ] Configure logging and monitoring
- [ ] Review and update CORS settings if needed
- [ ] Set up health check endpoints

## Local Development

For local development without Docker:
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

## Notes

- The application binds to `0.0.0.0:5000` by default (Docker-friendly)
- Templates are automatically seeded on first application start
- The database schema uses Drizzle ORM with PostgreSQL
- All file paths are relative and portable for Docker deployment
