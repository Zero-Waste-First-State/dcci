# Supabase Setup & Management Guide

## What is Supabase?

Supabase is an open-source Firebase alternative that provides a complete backend-as-a-service platform. It combines a PostgreSQL database with real-time subscriptions, authentication, file storage, and auto-generated APIs.

### Key Features
- **PostgreSQL Database**: Full-featured relational database with real-time capabilities
- **Authentication**: Built-in user management with email, OAuth, and magic links
- **Row Level Security (RLS)**: Fine-grained access control at the database level
- **Storage**: File upload and management with CDN delivery
- **Edge Functions**: Serverless functions for custom business logic
- **Auto-generated APIs**: REST APIs generated from your database schema
- **Real-time**: Live data synchronization across clients

## How DCCI Uses Supabase

The DCCI composting application uses Supabase as its complete backend infrastructure:

### 1. Database Management
- **Form Data Storage**: All user submissions, measurements, and site data
- **User Authentication**: Staff login and session management
- **Relational Structure**: Connected tables with foreign key relationships

### 2. Authentication System
- **Staff Access**: Protected dashboard routes for authenticated users
- **Session Management**: Automatic login/logout and session persistence
- **Password Reset**: Email-based password recovery system

### 3. File Storage
- **PDF Management**: DNREC reports and document storage
- **Public Access**: Files accessible via CDN URLs

### 4. Real-time Features
- **Live Updates**: Dashboard components update automatically when data changes
- **Activity Feeds**: Real-time display of recent user activities

## Database Schema

### Main Tables

| Table Name | Purpose | Key Fields |
|------------|---------|------------|
| `Form Submission` | Main submission records | submission_id, timestamp, first_name, last_name, user_email, site_id |
| `Site` | Composting site information | site_id, site_name |
| `Measurements` | Bin temperature and moisture data | measurement_id, submission_id, bin_type, temp_left, temp_middle, temp_right |
| `Adding Material` | Material addition tracking | bin_id, submission_id, bin_type, greens_pounds, greens_gallons, browns_gallons |
| `Moving Day` | Bin movement operations | moving_id, submission_id, move_bin1_bin2, move_bin2_bin3, etc. |
| `Finished Compost` | Compost collection data | compost_id, submission_id, gallons_compost_taken |
| `Browns Bin` | Browns bin management | browns_id, submission_id, bin_a_browns_gallons, bin_b_browns_gallons |
| `Issues` | Problem reports | issue_id, submission_id, broken_tools, bad_odors, etc. |
| `Litter` | Contamination tracking | litter_id, submission_id, bin_1_contaminated, plastic_trash, etc. |
| `alert_email_recipients` | Email notification list | id, email |

### Table Relationships
- All task tables reference `submission_id` from the main `Form Submission` table
- `Form Submission` links to `Site` via `site_id`
- One submission can have multiple related records across different task tables

## Row Level Security (RLS)

### What is RLS?
Row Level Security is a PostgreSQL feature that allows you to control which rows users can access in database tables. When RLS is enabled, PostgreSQL checks each row against security policies before allowing access.

### Current RLS Setup
The DCCI application uses RLS to ensure only authenticated staff can access dashboard data:

```sql
-- Example policy for authenticated users
CREATE POLICY "Allow authenticated users to view form submissions" ON "Form Submission"
    FOR SELECT USING (auth.role() = 'authenticated');
```

### Policy Types
- **SELECT**: Controls read access to data
- **INSERT**: Controls creation of new records
- **UPDATE**: Controls modification of existing records
- **DELETE**: Controls removal of records

### Common RLS Patterns
```sql
-- Allow all authenticated users
USING (auth.role() = 'authenticated')

-- Allow specific user
USING (auth.uid() = user_id)

-- Allow users to see only their own data
USING (auth.uid() = user_id_column)
```

## Managing Supabase

### Accessing Supabase Dashboard
1. Go to [supabase.com](https://supabase.com)
2. Sign in to your account
3. Select your DCCI project

### Database Management

#### Viewing Data
1. Navigate to **Table Editor**
2. Select any table to view its data
3. Use filters and search to find specific records

#### Modifying Data
1. Click on any cell to edit data directly
2. Use the **Insert** button to add new records
3. Use the **Delete** button to remove records

#### Running SQL Queries
1. Go to **SQL Editor**
2. Write custom queries to:
   - View data across multiple tables
   - Update multiple records at once
   - Create reports and analytics
   - Manage RLS policies

#### DCCI-Specific Example Queries
```sql
-- View all submissions with site names (DCCI sites)
SELECT fs.*, s.site_name 
FROM "Form Submission" fs
JOIN "Site" s ON fs.site_id = s.site_id
ORDER BY fs.timestamp DESC;

-- Count submissions by DCCI site
SELECT s.site_name, COUNT(*) as submission_count
FROM "Form Submission" fs
JOIN "Site" s ON fs.site_id = s.site_id
GROUP BY s.site_name;

-- Find recent contamination reports at DCCI sites
SELECT fs.first_name, fs.last_name, s.site_name, l.*
FROM "Litter" l
JOIN "Form Submission" fs ON l.submission_id = fs.submission_id
JOIN "Site" s ON fs.site_id = s.site_id
WHERE l.contamination = true
ORDER BY fs.timestamp DESC;

-- Get adding material data for specific DCCI site
SELECT am.*, fs.first_name, fs.last_name, s.site_name
FROM "Adding Material" am
JOIN "Form Submission" fs ON am.submission_id = fs.submission_id
JOIN "Site" s ON fs.site_id = s.site_id
WHERE s.site_name = 'Working Site 1'
ORDER BY fs.timestamp DESC;

-- Check measurements for bins at DCCI sites
SELECT m.*, fs.first_name, fs.last_name, s.site_name
FROM "Measurements" m
JOIN "Form Submission" fs ON m.submission_id = fs.submission_id
JOIN "Site" s ON fs.site_id = s.site_id
WHERE m.bin_type IN ('bin_1', 'bin_2', 'bin_3')
ORDER BY fs.timestamp DESC;
```

### User Management

#### Viewing Users
1. Go to **Authentication** → **Users**
2. See all registered staff members
3. View user details, login history, and session status

#### Managing Users
- **Invite Users**: Send email invitations to new staff
- **Reset Passwords**: Force password resets for users
- **Disable Users**: Temporarily disable access
- **Delete Users**: Remove users from the system

#### Owner Permissions
As a Supabase project owner, you have additional user management capabilities:

**What You CAN Do:**
- **Add Users**: Invite new staff members via email
- **Remove Users**: Delete users from the system completely
- **Send Password Reset**: Trigger "forgot password" emails for any user
- **View User Activity**: See login history and session information
- **Manage User Status**: Enable/disable user accounts

**What You CANNOT Do:**
- **Edit User Information**: Cannot change user emails, names, or other profile data
- **Set Passwords**: Cannot directly set or change user passwords
- **View Passwords**: User passwords are encrypted and not accessible

**Important Notes:**
- Users must manage their own profile information (email, name, etc.)
- Password changes must be initiated by the user through the "forgot password" flow
- You can send password reset links to help users regain access to their accounts
- Deleting a user removes all their data and cannot be undone

#### User Roles
Currently, all authenticated users have the same permissions. For future enhancements, you can implement role-based access:
```sql
-- Example: Create role-based policies
CREATE POLICY "Staff can view all data" ON "Form Submission"
    FOR SELECT USING (auth.jwt() ->> 'role' = 'staff');
```

### Storage Management

#### Viewing Files
1. Go to **Storage**
2. Browse uploaded files (PDFs, images, etc.)
3. View file details, sizes, and access URLs

#### Managing Files
- **Upload Files**: Add new documents and reports
- **Organize**: Create folders and move files
- **Set Permissions**: Control who can access files
- **Delete Files**: Remove outdated or incorrect files

#### Storage Buckets
The DCCI application uses storage for:
- **DNREC Reports**: Generated PDF reports
- **Site Documents**: Site-specific files and images
- **User Uploads**: Any files uploaded through the dashboard

### Authentication Settings

#### Email Configuration
1. Go to **Authentication** → **Settings**
2. Configure email templates for:
   - Password reset emails
   - Email confirmation
   - Magic link authentication (not used in DCCI)

#### OAuth Providers (Not Currently Used)
DCCI currently uses email/password authentication only. OAuth providers can be configured for future use if needed.

#### Security Settings
- **Password Requirements**: Set minimum length and complexity
- **Session Timeout**: Configure automatic logout
- **Rate Limiting**: Prevent brute force attacks

### Edge Functions

#### What are Edge Functions?
Edge Functions are serverless functions that run close to your users for better performance. The DCCI application uses them for:

- **Email Notifications**: Sending alerts when issues are reported
- **Data Processing**: Custom business logic for form submissions
- **API Integrations**: Connecting with external services

#### Managing Functions
1. Go to **Edge Functions**
2. View deployed functions
3. Monitor logs and performance
4. Deploy new functions or updates

### Monitoring & Logs

#### Database Logs
1. Go to **Logs** → **Database**
2. Monitor query performance
3. Debug RLS policy issues
4. Track slow queries

#### Authentication Logs
1. Go to **Logs** → **Auth**
2. Monitor login attempts
3. Track password resets
4. Debug authentication issues

#### API Logs
1. Go to **Logs** → **API**
2. Monitor API usage
3. Track request/response times
4. Debug API errors

## Development & Deployment

### Local Development
The application connects to Supabase using environment variables:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Database Migrations
1. Use **Database** → **Migrations** to track schema changes
2. Create migration files for database updates
3. Apply migrations to different environments

### Backup & Recovery
1. Go to **Settings** → **Database**
2. Configure automatic backups
3. Set up point-in-time recovery
4. Export data for local development

## Security Best Practices

### RLS Policies
- Always enable RLS on sensitive tables
- Use specific policies rather than broad permissions
- Regularly audit and test policies
- Document policy purposes and requirements

### API Keys
- Keep service role keys secure and never expose them
- Rotate keys regularly
- Use different keys for different environments
- Monitor key usage and access

### Data Protection
- Enable encryption at rest and in transit
- Implement proper backup strategies
- Use strong authentication requirements
- Regularly update dependencies and security patches

### Getting Help
- **Supabase Documentation**: [docs.supabase.com](https://docs.supabase.com)
- **Community Support**: [github.com/supabase/supabase/discussions](https://github.com/supabase/supabase/discussions)

## Project-Specific Configuration

### Current Setup
- **Database**: PostgreSQL with RLS enabled
- **Authentication**: Email/password with password reset
- **Storage**: PDF file management for reports
- **Real-time**: Live dashboard updates
- **Edge Functions**: Email notification system

### Environment Variables
```env
# Required for all environments
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Required for server-side operations
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional: Custom configuration
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

### API Keys & Security

#### Key Types
- **Anon Key**: Public key for client-side operations, respects RLS policies
- **Service Role Key**: Private key for server-side operations, bypasses RLS policies

#### Managing Keys
1. Go to **Settings** → **API**
2. View your project URL and keys
3. Regenerate keys if compromised
4. Copy keys for environment variables

#### Security Notes
- **Anon Key**: Safe to expose in client-side code, respects RLS
- **Service Role Key**: Keep secret, never expose in client code
- **Key Rotation**: Regularly rotate keys for security
- **Environment Separation**: Use different keys for dev/staging/production

### Database Performance

#### Performance Monitoring
1. Go to **Logs** → **Database**
2. Monitor slow queries and performance
3. Add indexes if needed for frequently accessed columns

**Note**: For most DCCI operations, performance optimization is not critical due to the small scale of data.

### Real-time Features

#### How Real-time Works
The DCCI application uses Supabase real-time for:
- **Live Dashboard Updates**: Recent activity and alerts update automatically
- **Session Synchronization**: Multiple users see changes in real-time
- **Data Consistency**: Ensures all users see the same data

#### Managing Real-time
Real-time is automatically configured for the DCCI dashboard. No additional setup is needed.

### Webhooks & Integrations (Future Use)

#### Database Webhooks
Webhooks can be set up for external integrations if needed in the future:
1. Go to **Database** → **Webhooks**
2. Create webhooks for table changes
3. Configure HTTP endpoints to receive notifications

**Note**: DCCI currently uses Edge Functions for email notifications instead of webhooks.

### Billing & Usage

#### Current Supabase Pricing (2024)

**Free Tier (Hobby Plan)**
- **Database**: 500MB storage, 2GB bandwidth
- **Authentication**: 50,000 monthly active users
- **Storage**: 1GB file storage, 2GB bandwidth
- **Edge Functions**: 500,000 invocations/month
- **Real-time**: 200 concurrent connections
- **Cost**: $0/month

**Pro Plan**
- **Database**: 8GB storage, 250GB bandwidth
- **Authentication**: 100,000 monthly active users
- **Storage**: 100GB file storage, 250GB bandwidth
- **Edge Functions**: 2M invocations/month
- **Real-time**: 500 concurrent connections
- **Cost**: $25/month

**Team Plan**
- **Database**: 8GB storage, 250GB bandwidth
- **Authentication**: 100,000 monthly active users
- **Storage**: 100GB file storage, 250GB bandwidth
- **Edge Functions**: 2M invocations/month
- **Real-time**: 500 concurrent connections
- **Cost**: $599/month (includes team features)

#### What Drives Costs

**Database Costs**
- **Storage**: $0.125/GB/month for Pro plan
- **Bandwidth**: $0.09/GB for Pro plan
- **DCCI Impact**: Form submissions, measurements, and site data
- **Optimization**: Regular cleanup of old submissions, compress data

**Authentication Costs**
- **Monthly Active Users**: Counted per unique user per month
- **DCCI Impact**: Staff members logging into dashboard
- **Optimization**: Remove inactive users, implement session management

**Storage Costs**
- **File Storage**: $0.021/GB/month for Pro plan
- **Bandwidth**: $0.09/GB for Pro plan
- **DCCI Impact**: PDF reports, site documents, user uploads
- **Optimization**: Compress PDFs, remove old files, use CDN

**Edge Functions Costs**
- **Invocations**: $2/1M invocations for Pro plan
- **Execution Time**: $0.0000002/GB-second
- **DCCI Impact**: Email notifications, data processing
- **Optimization**: Optimize function code, batch operations

**Real-time Costs**
- **Concurrent Connections**: $10/100 connections/month for Pro plan
- **DCCI Impact**: Dashboard live updates, multiple staff sessions
- **Optimization**: Limit real-time to essential tables only

#### Monitoring Usage
1. Go to **Settings** → **Billing**
2. View current usage and costs
3. Monitor database size, API calls, and storage
4. Set up usage alerts

#### Usage Types
- **Database**: Storage size, query count, connection time
- **Authentication**: User count, API calls
- **Storage**: File storage size, bandwidth
- **Edge Functions**: Function invocations, execution time

#### DCCI-Specific Cost Considerations

**Current Usage Patterns**
- **Database**: Growing with form submissions (likely <1GB for small-medium operations)
- **Authentication**: Low (staff members only)
- **Storage**: Moderate (PDF reports, site documents)
- **Functions**: Low (email notifications)
- **Real-time**: Low (dashboard updates)