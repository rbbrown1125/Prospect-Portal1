# Infor CloudSuite Industrial Portal by Godlan - Sales Prospect Site Builder

## Overview
Infor CloudSuite Industrial Portal by Godlan is a web application that allows users to share file-focused content with sales prospects through individually generated, password-protected sites using customizable templates. The application emphasizes file sharing capabilities with easy prospect name and company variable editing, featuring a visual no-code editor, team collaboration, and comprehensive prospect management. Authentication is restricted to @godlan.com users with a Godlan-branded landing page.

## Project Architecture
- **Frontend**: React.js with Wouter routing, Tailwind CSS, TypeScript
- **Backend**: Express.js server with custom authentication
- **Database**: PostgreSQL with Drizzle ORM
- **Templates**: Dynamic content system with variable substitution
- **File Management**: Content library with categorization
- **Authentication**: @godlan.com email restriction

## Recent Changes
**January 21, 2025**
- ✅ Fixed critical application startup failure:
  - Resolved database connection timeout issues with WebSocket configuration
  - Added retry logic and proper error handling for database operations
  - Fixed NODE_ENV environment variable setup for development mode
  - Implemented non-blocking template seeding with graceful error recovery
  - Added comprehensive startup error handling and logging
- ✅ Implemented profile picture upload functionality:
  - Added multer for file handling with image validation and 5MB size limit
  - Integrated Sharp for automatic image resizing (200x200) and optimization
  - Created secure file storage system with proper cleanup of old images
  - Added profile picture upload API endpoint with authentication
  - Enhanced user schema with additional profile fields (phone, company, title, location, profileImageUrl)
  - Updated profile page with drag-and-drop profile picture upload interface
- ✅ Fixed quick actions navigation to proper pages (Content, Prospects, Analytics)
- ✅ Created comprehensive user profile edit page with form functionality
- ✅ Updated gear link to navigate to /profile instead of logout

**January 20, 2025**
- ✅ Implemented major performance optimizations:
  - Created optimized /api/dashboard/data endpoint combining 3 API calls into 1
  - Added comprehensive UUID validation across all API endpoints
  - Implemented loading skeleton components for better UX
  - Added proper error boundaries and retry logic
  - Optimized dashboard loading with 3x faster data fetching
- ✅ Enhanced TypeScript support with proper type definitions
- ✅ Added comprehensive loading states and error handling
- ✅ Fixed runtime JavaScript error "Can't find variable: templates" 
- ✅ Cleaned up massive template duplicates in database (removed 63+ entries)
- ✅ Removed all Analytics and Startup category templates
- ✅ Updated site references to use correct template IDs after cleanup

**January 14, 2025**
- ✅ Fixed all "error proxying request" routing issues by updating URL parameter handling
- ✅ Updated `useParams` to `useRoute` in site-viewer, template-preview, and public-site components
- ✅ Verified all preview button URLs use correct `/site/:id` pattern
- ✅ Confirmed all API endpoints return proper status codes
- ✅ Site editor now displays actual template content instead of generic defaults
- ✅ Prospects integration working perfectly with automatic record creation
- ✅ Public site routing fixed with proper URL parameter extraction

## Key Features
- **Site Creation**: Template-based site generation with prospect personalization
- **Content Management**: File library with categorization and reuse
- **Template System**: Customizable templates with variable substitution
- **Prospect Management**: Automatic prospect record creation linked to sites
- **Analytics**: Site view tracking and engagement metrics
- **Security**: Password-protected sites with access control

## User Preferences
- Focus on comprehensive solutions over incremental updates
- Prefer technical accuracy and thorough testing
- Emphasize data integrity and authentic content sources
- Value detailed documentation of architectural changes

## Current Status
All major routing and site creation functionality is working correctly. The application successfully handles:
- Public site preview generation and access
- Template-based content rendering with prospect personalization
- Site editing with real template content display
- Prospect management with automatic database integration
- Authentication flow with @godlan.com email restriction

No critical issues currently identified. System is ready for deployment testing.