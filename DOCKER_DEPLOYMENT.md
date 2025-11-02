# Docker Deployment Guide - SIMPLIFIED

## 🚀 One-Command Deployment

This application is fully self-contained and auto-initializing. Database setup, test users, and sample data are all created automatically on first run.

## Quick Start - Docker

```bash
# Build and run with embedded PostgreSQL (one command!)
docker build -t godlan-portal .
docker run -d -p 5000:5000 --name godlan-portal godlan-portal

# Application will automatically:
# ✅ Create database and tables
# ✅ Generate 3 test users
# ✅ Seed templates and sample data
# ✅ Display login credentials in console
```

## Auto-Created Test Users

When the application starts for the first time, it automatically creates:
- **admin@godlan.com** / **Admin123!** (Admin role)
- **manager@godlan.com** / **Manager123!** (Admin role)  
- **john.smith@godlan.com** / **User123!** (User role)

## Environment Variables (Optional)

### For Production Use
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

## What Gets Auto-Initialized

On first startup, the application automatically creates:

✅ **Database Schema** - All tables and indexes  
✅ **3 Test Users** - Ready-to-use accounts with different roles  
✅ **3 Templates** - Professional Services, Manufacturing, Quick Start  
✅ **Sample Site** - With demo access code (shown in console)  
✅ **Sample Prospects** - Alex Carter, Morgan Lee  
✅ **Sample Content** - Documents and presentations  
✅ **Analytics Data** - Sample site views for testing

No manual seeding required! Everything is handled automatically.

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

## Simplified Deployment Features

### 🎯 Key Benefits
- **Zero Configuration Start** - Works out of the box with embedded PostgreSQL
- **Auto-Initialization** - Database, users, and data created automatically
- **Smart Defaults** - Session secrets auto-generated if not provided
- **Graceful Degradation** - Works without API keys (logs emails, disables uploads)
- **Port Conflict Handling** - Better error messages for port issues

### 🚢 Production Deployment

For production with external PostgreSQL:
```bash
docker run -d \
  -p 5000:5000 \
  -e DATABASE_URL="postgresql://user:pass@host/db" \
  -e SENDGRID_API_KEY="your-key" \
  -e NODE_ENV="production" \
  godlan-portal
```

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

## Troubleshooting

### Port 5000 Already in Use
```bash
# Kill existing process
pkill -f "node" || lsof -ti:5000 | xargs kill -9

# Or use different port
docker run -p 8080:5000 godlan-portal
```

### Login Issues
- Ensure you're using @godlan.com email addresses
- Check console for auto-generated credentials
- Database auto-initializes on first run only

### Reset Everything
```bash
# Remove container and volume for fresh start
docker rm -f godlan-portal
docker volume prune
docker run -d -p 5000:5000 --name godlan-portal godlan-portal
```

## Summary

The application is now **completely self-contained**:
- ✅ Database auto-creates on first run
- ✅ Test users generated automatically
- ✅ Templates and sample data seeded
- ✅ One command to start everything
- ✅ No manual scripts required
