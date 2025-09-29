# Regression Test Plan - Access Code System
## Date: January 30, 2025

### Test Environment
- Development server: http://localhost:5000
- Database: PostgreSQL (development)
- Email: SendGrid (live integration)

### Test Scope
1. **Authentication & Registration**
   - [ ] User login with @godlan.com email
   - [ ] Access code validation
   - [ ] User registration via access code
   - [ ] Email verification flow
   - [ ] Password setup after email verification

2. **Site Management**
   - [ ] Create new site
   - [ ] Edit existing site
   - [ ] Generate access code for site
   - [ ] View site list
   - [ ] Delete site

3. **Template System**
   - [ ] Load templates
   - [ ] Apply template to site
   - [ ] Variable substitution ({{prospect_name}}, {{company_name}})
   - [ ] Save site as template
   - [ ] Visual editor functionality

4. **Prospect Management**
   - [ ] Auto-create prospect on site creation
   - [ ] View prospect list
   - [ ] Update prospect information
   - [ ] Link prospect to site

5. **Content Library**
   - [ ] Upload files
   - [ ] View file library
   - [ ] Use files in sites
   - [ ] Delete files

6. **Public Site Access**
   - [ ] Access site with valid access code
   - [ ] Redirect to registration if not logged in
   - [ ] View site content after authentication
   - [ ] Site analytics tracking

7. **Admin Features**
   - [ ] Admin dashboard access
   - [ ] User management (admin only)
   - [ ] Site overview (admin only)

8. **Email System**
   - [ ] Access code invitation emails
   - [ ] Email verification emails
   - [ ] SendGrid integration

### Test Data
- Test User: sam.brown@godlan.com
- Test Admin: admin@godlan.com
- Test Sites: Multiple with different templates
- Test Access Codes: Generated during testing

### Expected Results
All features should work without errors, with proper data persistence and user feedback.