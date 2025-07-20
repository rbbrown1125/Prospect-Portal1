# ProspectShare - Sales Prospect Site Builder

## Overview
ProspectShare is a web application that allows users to share file-focused content with sales prospects through individually generated, password-protected sites using customizable templates. The application emphasizes file sharing capabilities with easy prospect name and company variable editing, featuring a visual no-code editor, team collaboration, and comprehensive prospect management. Authentication is restricted to @godlan.com users with a Godlan-branded landing page.

## Project Architecture
- **Frontend**: React.js with Wouter routing, Tailwind CSS, TypeScript
- **Backend**: Express.js server with custom authentication
- **Database**: PostgreSQL with Drizzle ORM
- **Templates**: Dynamic content system with variable substitution
- **File Management**: Content library with categorization
- **Authentication**: @godlan.com email restriction

## Recent Changes
**January 20, 2025**
- ✅ Fixed runtime JavaScript error "Can't find variable: templates" by adding proper TypeScript types
- ✅ Cleaned up massive template duplicates in database (removed 63+ duplicate entries)
- ✅ Removed all Analytics and Startup category templates as requested
- ✅ Updated site references to use correct template IDs after cleanup
- ✅ Added proper type annotations to template-preview and site-viewer components
- ✅ Resolved all LSP diagnostics and TypeScript errors

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