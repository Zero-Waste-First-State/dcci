# Prompt for Claude: DCCI Admin Manual - Navigating Supabase & GitHub

You are tasked with creating a comprehensive, user-friendly manual for administrators at DCCI (Delaware Center for Compost Innovation) on how to navigate and use Supabase and GitHub for managing the composting system. This manual should focus primarily on Supabase user management, but also cover other essential features of both platforms. The manual should be clear, step-by-step, and suitable for non-technical administrators.

## Context About the System

DCCI operates a composting data collection system with:
- **Public-facing compost form**: Where site members submit composting data (measurements, material additions, issues, etc.)
- **Staff dashboard**: A protected interface at `/dashboard` where authenticated staff members can view, manage, and analyze form submissions
- **Authentication system**: Uses Supabase (a backend-as-a-service platform) for user authentication and database management

## System Architecture

### User Management Methods
There are **two ways** to manage users who can access the staff dashboard:

1. **In-App User Creation** (Limited functionality)
   - Location: Staff Dashboard → Settings page → User Management section
   - What it does: Allows creating new user accounts directly from the dashboard
   - Limitations: Only shows the currently logged-in user's information, not all users in the system

2. **Supabase Dashboard** (Full user management)
   - Location: supabase.com → Your DCCI project → Authentication → Users
   - What it does: Complete user management interface with all registered staff members
   - Full capabilities: View all users, invite users, reset passwords, disable/enable accounts, delete users, view login history

## What Admins Can Do

### In Supabase Dashboard (Full Management):
- ✅ **View all users**: See complete list of all registered staff members
- ✅ **Invite new users**: Send email invitations to new staff members
- ✅ **Remove users**: Delete users from the system completely
- ✅ **Send password reset**: Trigger "forgot password" emails for any user
- ✅ **View user activity**: See login history, last sign-in times, and session information
- ✅ **Manage user status**: Enable/disable user accounts temporarily
- ✅ **View user details**: Email addresses, account creation dates, email confirmation status

### In-App Dashboard (Limited):
- ✅ **Create new users**: Add new staff accounts with email and password
- ✅ **View current user**: See information about the currently logged-in user only

## What Admins CANNOT Do

- ❌ **Edit user information**: Cannot change user emails, names, or other profile data directly
- ❌ **Set passwords directly**: Cannot directly set or change user passwords (must use password reset flow)
- ❌ **View passwords**: User passwords are encrypted and not accessible
- ❌ **View all users in-app**: The in-app interface only shows the current logged-in user

## Manual Requirements

Create a manual that includes:

### 1. Introduction Section
- What the manual is for (navigating Supabase and GitHub for DCCI system management)
- Who should use it (DCCI administrators)
- Overview of why these platforms are important for system management
- Brief overview of what each platform does:
  - Supabase: Backend database, authentication, and user management
  - GitHub: Code repository and version control

### 2. Prerequisites
- What access is needed:
  - Supabase account with project owner/admin permissions
  - GitHub account with repository access
- How to access each platform:
  - Supabase: supabase.com
  - GitHub: github.com
- Account setup and login instructions

### 3. PART 1: Navigating and Using Supabase (PRIMARY FOCUS)

#### 3.1 Getting Started with Supabase
- How to log in to supabase.com
- Understanding the Supabase dashboard layout
- How to select and navigate to the DCCI project
- Overview of the main navigation menu:
  - Table Editor
  - SQL Editor
  - Authentication
  - Storage
  - Edge Functions
  - Database
  - Logs
  - Settings

#### 3.2 User Management (PRIMARY FOCUS - DETAILED SECTION)
This is the most important section and should be covered extensively:

##### 3.2.1 Accessing User Management
- Navigating to Authentication → Users
- Understanding the Users interface layout
- What information is displayed in the users list

##### 3.2.2 Viewing All Users
- How to see the complete list of registered staff members
- Understanding user information displayed:
  - Email addresses
  - Account creation dates
  - Last sign-in times
  - Email confirmation status
  - User status (active/disabled)
- How to interpret user status indicators
- Understanding email confirmation status
- Viewing detailed user information
- Using search and filter options

##### 3.2.3 Adding New Users
- **Option A: Inviting Users via Email**
  - Step-by-step invitation process
  - How to access the "Invite User" feature
  - Filling out the invitation form
  - What the user receives in their email
  - What happens after they accept the invitation
  - Tracking invitation status
  
- **Option B: Creating Users Directly**
  - When this option is available
  - Step-by-step user creation process
  - Required fields and information
  - Setting initial password (if applicable)
  
- **When to use each method**
- Best practices for adding new staff members

##### 3.2.4 Managing Existing Users
- **Password Reset**:
  - When to use this feature
  - Step-by-step process to send password reset email
  - How to access the password reset option
  - What the user experiences when they receive the reset email
  - Troubleshooting if reset email doesn't arrive
  - Common issues and solutions
  
- **Disabling Users**:
  - When to disable vs. delete
  - How to temporarily disable access
  - Step-by-step disabling process
  - How to re-enable a disabled account
  - Understanding the difference between disabled and deleted
  
- **Deleting Users**:
  - When deletion is appropriate
  - ⚠️ Warning about permanent data removal
  - Step-by-step deletion process
  - Confirmation dialogs and safety measures
  - What data is removed when a user is deleted
  - Impact on associated data

##### 3.2.5 Viewing User Activity
- How to access login history
- Understanding session information
- Interpreting last sign-in times
- Identifying inactive accounts
- Viewing user metadata and profile information
- Understanding user roles and permissions

##### 3.2.6 User Management Best Practices
- Regular review of user access
- Removing inactive users
- Security considerations
- Password policy management

#### 3.3 Database Management in Supabase
- **Table Editor**:
  - How to navigate to Table Editor
  - Viewing data in tables
  - Understanding the DCCI database structure:
    - Form Submission table
    - Site table
    - Measurements table
    - Adding Material table
    - Moving Day table
    - Finished Compost table
    - Issues table
    - Litter table
    - alert_email_recipients table
  - How to view and filter table data
  - Editing data directly in tables (when appropriate)
  - Adding new records
  - Deleting records (with warnings)

- **SQL Editor**:
  - How to access SQL Editor
  - Understanding when to use SQL queries
  - Running example queries for DCCI:
    - View all submissions with site names
    - Count submissions by site
    - Find recent contamination reports
    - Get adding material data for specific sites
    - Check measurements for bins
  - Understanding query results
  - Safety considerations when running SQL

#### 3.4 Storage Management
- **Accessing Storage**:
  - Navigating to Storage section
  - Understanding storage buckets
  - Viewing uploaded files (PDFs, images, etc.)
  
- **File Management**:
  - Viewing file details, sizes, and access URLs
  - Uploading new files
  - Organizing files in folders
  - Setting file permissions
  - Deleting files
  - Understanding DCCI storage usage (DNREC reports, site documents)

#### 3.5 Authentication Settings
- **Accessing Authentication Settings**:
  - Navigating to Authentication → Settings
  - Understanding available configuration options
  
- **Email Configuration**:
  - Email templates for password reset
  - Email confirmation settings
  - Customizing email content (if applicable)
  
- **Security Settings**:
  - Password requirements
  - Session timeout configuration
  - Rate limiting settings
  - Understanding security best practices

#### 3.6 Monitoring & Logs
- **Database Logs**:
  - How to access database logs
  - Monitoring query performance
  - Understanding log entries
  - Debugging database issues
  
- **Authentication Logs**:
  - How to access authentication logs
  - Monitoring login attempts
  - Tracking password resets
  - Identifying authentication issues
  
- **API Logs**:
  - How to access API logs
  - Monitoring API usage
  - Understanding request/response information

#### 3.7 Settings & Configuration
- **Project Settings**:
  - Accessing project settings
  - Understanding API keys:
    - Anon Key (public, safe for client-side)
    - Service Role Key (private, never expose)
  - Viewing project URL and keys
  - Key rotation and security
  
- **Billing & Usage**:
  - Accessing billing information
  - Understanding usage metrics
  - Monitoring costs
  - Setting up usage alerts

### 4. PART 2: Navigating and Using GitHub

#### 4.1 Getting Started with GitHub
- How to log in to github.com
- Understanding the GitHub interface
- How to navigate to the DCCI repository
- Understanding repository structure
- Overview of main navigation elements:
  - Code tab
  - Issues tab
  - Pull Requests tab
  - Actions tab
  - Settings tab

#### 4.2 Repository Navigation
- **Code Tab**:
  - Understanding the file structure
  - Viewing files and folders
  - Understanding branches (main, development, etc.)
  - How to view file contents
  - Understanding commit history
  - Viewing recent changes
  
- **Repository Structure Overview**:
  - Key directories and their purposes:
    - `/app` - Application pages and routes
    - `/components` - Reusable UI components
    - `/lib` - Utility functions and configurations
    - `/public` - Static assets
  - Important files:
    - `README.md` - Project documentation
    - Configuration files
    - Package files

#### 4.3 Understanding Commits and History
- What are commits?
- How to view commit history
- Understanding commit messages
- Viewing changes in commits
- Understanding who made changes and when
- Viewing file change history

#### 4.4 Pull Requests
- What are pull requests?
- How to view open pull requests
- Understanding pull request status
- How to review pull request changes
- Understanding merge status
- When pull requests are used

#### 4.5 Issues
- What are GitHub Issues?
- How to view open issues
- Understanding issue labels and status
- How to create a new issue
- How to comment on issues
- Understanding issue workflow

#### 4.6 GitHub Actions (CI/CD)
- What are GitHub Actions?
- How to view workflow runs
- Understanding deployment status
- Viewing build logs
- Understanding automated deployments
- When actions run (on push, on PR, etc.)

#### 4.7 Repository Settings
- **Accessing Settings**:
  - How to navigate to repository settings
  - Understanding available settings sections
  
- **Important Settings**:
  - Repository visibility
  - Collaborators and access
  - Branch protection rules
  - Webhooks and integrations
  - Environment variables (if applicable)

#### 4.8 Common GitHub Tasks for Admins
- Viewing recent code changes
- Understanding deployment status
- Checking for open issues or pull requests
- Viewing project activity
- Understanding release history
- Accessing documentation files

### 5. Integration Between Supabase and GitHub
- How Supabase and GitHub work together
- Understanding that code changes in GitHub affect the application
- How database changes in Supabase affect the application
- When to use each platform for different tasks
- Understanding the relationship between:
  - Code repository (GitHub) and application functionality
  - Database (Supabase) and data management
  - How deployments connect both systems

### 6. Common Scenarios & Troubleshooting

#### Supabase Scenarios:
- **New staff member needs access**: Complete step-by-step guide using Supabase
- **Staff member forgot password**: How to help them reset it via Supabase
- **Staff member left the organization**: How to remove their access in Supabase
- **User account not receiving confirmation email**: Troubleshooting steps
- **User can't log in after account creation**: Common issues and solutions
- **Need to temporarily revoke access**: How to disable an account
- **Viewing who has access**: How to see all current users in Supabase
- **Need to view form submission data**: How to access database tables
- **Need to check system logs**: How to access and interpret logs

#### GitHub Scenarios:
- **Need to see what changed recently**: How to view commit history
- **Checking if deployment succeeded**: How to view GitHub Actions
- **Reporting a bug or issue**: How to create a GitHub Issue
- **Understanding code structure**: How to navigate repository files
- **Checking documentation**: How to find and read README files

### 7. Security Best Practices

#### Supabase Security:
- Password requirements and recommendations
- When to review user access
- Importance of removing inactive users
- Account security considerations
- API key security (never expose service role key)
- Understanding Row Level Security (RLS)

#### GitHub Security:
- Repository access management
- Understanding branch protection
- Code review practices
- Secure handling of sensitive information

### 8. Important Notes & Limitations

#### Supabase Limitations:
- Users must manage their own profile information
- Password changes must be initiated by users through "forgot password" flow
- Admins can send password reset links but cannot set passwords directly
- Deleting a user removes all their data and cannot be undone
- Email confirmation is required for new accounts
- All authenticated users currently have the same permissions (no role-based access yet)

#### GitHub Limitations:
- Admins typically don't need to make code changes
- Code changes should go through pull request process
- Understanding read-only vs. write access

### 9. Quick Reference Guide
- **Supabase Quick Actions**:
  - Quick navigation paths for common tasks
  - User management shortcuts
  - Database access shortcuts
  - Log access shortcuts
  
- **GitHub Quick Actions**:
  - Repository navigation shortcuts
  - Viewing recent changes
  - Checking deployment status
  
- **Contact Information**: Support resources or who to contact for help

## Writing Style Guidelines

- **Tone**: Professional but friendly, suitable for non-technical administrators
- **Clarity**: Use simple language, avoid technical jargon when possible
- **Structure**: Use clear headings, numbered steps, bullet points
- **Visual aids**: Include placeholders for screenshots throughout:
  - "[Screenshot: Supabase Dashboard Home]"
  - "[Screenshot: Supabase Users Page]"
  - "[Screenshot: User Invitation Form]"
  - "[Screenshot: GitHub Repository Home]"
  - "[Screenshot: GitHub Commit History]"
  - And other relevant screenshots
- **Examples**: Use realistic examples (e.g., "staff@dcci.org" instead of "user@example.com")
- **Warnings**: Clearly highlight important warnings and irreversible actions with ⚠️ symbols
- **Completeness**: Cover all features mentioned above
- **Focus**: While covering both platforms, give significantly more detail and depth to Supabase user management (Section 3.2) as it's the primary focus

## Technical Details to Reference

### Supabase:
- The system uses Supabase for authentication, database, and storage
- User accounts are stored in Supabase's authentication system
- Database: PostgreSQL with Row Level Security (RLS)
- Main database tables: Form Submission, Site, Measurements, Adding Material, Moving Day, Finished Compost, Issues, Litter, alert_email_recipients
- Minimum password length: 6 characters
- Email confirmation is required for account activation
- All authenticated users have equal permissions (no admin/regular user distinction yet)
- Storage used for: DNREC reports (PDFs), site documents

### GitHub:
- Repository name: dcci-h4i (or similar)
- Main branch: typically `main`
- Framework: Next.js
- Deployment: Connected to Vercel (automatic deployments)
- Key directories: `/app`, `/components`, `/lib`, `/public`

### Application:
- The staff dashboard is located at `/dashboard` (relative to the main website)
- Settings page is at `/dashboard/settings`
- Production domain: h4i.plasticfreedelaware.org (or similar)

## Additional Context

### Supabase Features Used by DCCI:
- **Authentication**: Email/password authentication (no OAuth or magic links currently)
- **Database**: PostgreSQL with multiple tables for composting data
- **Storage**: File storage for PDFs and documents
- **Real-time**: Live updates for dashboard (automatic)
- **Edge Functions**: Email notifications when issues are reported

### User Management Notes:
- The in-app User Management component (in Settings page) shows a note: "This shows information for the currently logged-in user. To view all users in the system, you would need admin privileges or a custom user management system. For now, you can create new users using the form above."
- The system sends email confirmations automatically when new users are created
- Users receive an email with a confirmation link that redirects to `/dashboard` after confirmation
- Full user management is done through Supabase dashboard, not the in-app interface

### GitHub Context:
- Repository contains Next.js application code
- Changes to code are tracked through commits
- Pull requests are used for code review before merging
- GitHub Actions handle automated deployments to Vercel
- Documentation files (README.md, etc.) are stored in the repository

---

**Your task**: Create a comprehensive, well-organized manual following the structure and requirements above. The manual should:

1. **Focus primarily on Supabase user management** (Section 3.2) - this should be the most detailed section with extensive step-by-step instructions, screenshots placeholders, and examples.

2. **Cover Supabase navigation comprehensively** - Help admins understand how to navigate all major Supabase features they might need (database, storage, logs, settings).

3. **Cover GitHub navigation** - Provide sufficient detail for admins to understand and navigate the repository, view changes, check deployment status, and understand the codebase structure.

4. **Be practical and actionable** - Include clear step-by-step instructions, troubleshooting guidance, and important warnings where appropriate.

5. **Be suitable for non-technical administrators** - Use simple language, avoid unnecessary technical jargon, and explain concepts clearly.

6. **Include visual guidance** - Add screenshot placeholders throughout to help admins know what they should be seeing at each step.

Make the manual practical, easy to follow, and comprehensive enough that an administrator can confidently navigate both platforms to manage the DCCI system.

