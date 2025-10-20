# DCCI Staff Dashboard

## Overview
The DCCI Staff Dashboard is a comprehensive protected interface that allows authenticated staff members to view, manage, and analyze form submissions from the compost form system. The dashboard provides insights into user activities.

## Dashboard Layout

### 🎛️ Sidebar Navigation
- **Home** (`/dashboard`) - Main dashboard with overview components
- **Reports** (`/dashboard/reports`) - PDF management and DNREC report generation
- **Logs** (`/dashboard/log`) - Detailed form submissions table
- **Settings** (`/dashboard/settings`) - Site management and configuration
- **Back to Website** - Return to public site with logout

### 🏠 Main Dashboard Features

#### 📊 Recent Activity Panel
- **Real-time Activity Feed**: Shows the 50 most recent user activities
- **Activity Types**: Measurements, adding material, moving operations, compost collection, issue reports
- **Details**: Timestamp, user name, site location, specific task performed
- **Interactive**: Click to view detailed submission information

#### 🚨 Alerts Panel
- **Contamination Alerts**: Litter and contamination reports requiring attention
- **Issue Alerts**: Problems like broken tools, odors, pests, or other site issues
- **Alert Management**: Mark alerts as resolved with confirmation workflow
- **Priority System**: Critical issues highlighted for immediate attention
- **Email Notifications**: Automatic email alerts sent to configured recipients when issues are reported

#### 📈 Weight Distribution Graph
- **Visual Analytics**: Interactive chart showing weight distribution across sites
- **Time-based Data**: Historical trends and patterns
- **Site Comparison**: Compare performance across different composting sites
- **Export Capabilities**: Download chart data for external analysis

#### 📅 Daily Calendar
- **Activity Calendar**: Visual representation of daily user activities
- **Site Overview**: See which sites are active on specific dates
- **Event Tracking**: Track special events, maintenance, and peak activity periods
- **Navigation**: Click dates to view detailed daily reports

## Dashboard Pages

### 📄 Reports Page (`/dashboard/reports`)
- **DNREC Report Generator**: Generate official compliance reports by year
- **PDF Manager**: Upload, manage, and organize PDF documents
- **Report Templates**: Pre-built templates for different report types
- **Export Options**: Download reports in various formats

### 📋 Logs Page (`/dashboard/log`)
- **Form Submissions Table**: Comprehensive table of all user submissions
- **Advanced Filtering**: Filter by date, site, user, or task type
- **Detailed Views**: Expandable rows with full submission details
- **Search Functionality**: Search by user name, site, or keywords
- **Bulk Operations**: Select multiple submissions for batch actions

### ⚙️ Settings Page (`/dashboard/settings`)
- **Site Manager**: Add, edit, and configure composting sites
- **Email Alert Recipients**: Manage email addresses that receive alerts for contamination and issues
- **User Management**: Manage staff accounts and permissions
- **System Configuration**: Configure email settings, notifications, and preferences
- **Data Management**: Backup, restore, and maintenance operations

### 📊 Individual Task Data Tables
These pages display data from specific database tables organized by task type:
- **Adding Material** (`/dashboard/adding-material`) - All entries from the "Adding Material" table
- **Measurements** (`/dashboard/measurements`) - All entries from the "Measurements" table
- **Moving Bins** (`/dashboard/moving-bins`) - All entries from the "Moving Day" table
- **Finished Compost** (`/dashboard/finished-compost`) - All entries from the "Finished Compost" table
- **Issues** (`/dashboard/issues`) - All entries from the "Issues" table
- **Contamination** (`/dashboard/contamination`) - All entries from the "Litter" table
- **Browns Bin** (`/dashboard/browns-bin`) - All entries from the "Browns Bin" table

Each page displays a dedicated table showing all entries from that specific database table, making it easier to focus on particular aspects of user activities.

## Database Tables Accessed

The dashboard fetches data from these Supabase tables:
- `Form Submission` - Main submission records
- `Site` - Site information and configuration
- `Measurements` - Bin temperature and moisture measurements
- `Adding Material` - Material addition tracking (1, 2, 3/browns)
- `Moving Day` - Moving operations between bins
- `Finished Compost` - Compost taken data
- `Browns Bin` - Browns bin management
- `Issues` - Problem reports and resolutions
- `Litter` - Contamination tracking and resolutions
- `alert_email_recipients` - Email addresses for alert notifications

## Access Control

- **Authentication Required**: Only authenticated users can access `/dashboard/*`
- **Login Redirect**: Unauthenticated users are redirected to `/auth/login`
- **Public Forms**: The compost form remains publicly accessible at `/compost-form`
- **Session Management**: Automatic logout after inactivity, exiting tab, or refreshing the page

## Navigation

- **Home Page**: "Staff Login" button redirects to dashboard
- **Login Form**: Automatically redirects to dashboard after successful authentication
- **Direct URLs**: Navigate directly to any dashboard page
- **Sidebar Navigation**: Persistent navigation between dashboard sections

## Technical Implementation

### Core Components

#### Main Dashboard (`app/dashboard/page.tsx`)
- **Component**: `DashboardPage()` - Main dashboard page that checks if user is logged in
- **Key Variables**: `user` from authentication check
- **Layout**: Sidebar navigation + main content area with responsive grid

#### Navigation Sidebar (`components/dashboard-sidebar.tsx`)
- **Component**: `DashboardSidebar({ user })` - Left sidebar with navigation menu
- **Key Functions**: 
  - `handleBackToWebsite()` - Logs out user and returns to home page
  - `navigation` array - Defines all menu items (Home, Reports, Logs, Settings)
- **Props**: `user` object with name and email

#### Recent Activity (`components/recent-activity.tsx`)
- **Component**: `RecentActivity()` - Shows the 50 most recent user activities
- **Key Variables**: 
  - `activities` - Array of recent activities
  - `loading` - Shows spinner while loading data
- **Key Functions**: 
  - `fetchRecentActivity()` - Gets last 50 submissions from database
  - `generateActivityText()` - Converts database data into readable text
- **Code Logic**:
  ```typescript
  // Fetches submissions with joined data from all tables
  const { data: submissions } = await supabase
    .from('Form Submission')
    .select(`
      submission_id, timestamp, first_name, last_name, site_id,
      Site(site_name), Measurements(bin_type), "Adding Material"(bin_id),
      "Moving Day"(moving_id), "Finished Compost"(compost_id),
      "Browns Bin"(browns_id), Issues(issue_id), Litter(litter_id)
    `)
    .order('timestamp', { ascending: false })
    .limit(50);

  // Transforms each submission into activity records
  submissions?.forEach((submission) => {
    if (submission.Measurements?.length > 0) {
      activityRecords.push({
        id: `measurement-${submission.submission_id}`,
        activity: "Measuring",
        date_time: new Date(submission.timestamp).toLocaleString(),
        site: submission.Site?.site_name || `Site ${submission.site_id}`,
        user: `${submission.first_name} ${submission.last_name}`,
        submission_id: submission.submission_id
      });
    }
    // Similar logic for other activity types...
  });
  ```

#### Alerts Panel (`components/alerts-panel.tsx`)
- **Component**: `AlertsPanel()` - Shows contamination and issue alerts
- **Key Variables**: 
  - `alerts` - Array of current alerts
  - `resolving` - Loading state when resolving alerts
  - `showConfirmModal` - Controls modal visibility
- **Key Functions**: 
  - `fetchAlerts()` - Gets contamination and issue alerts from database
  - `showResolveConfirmation()` - Shows confirmation modal before resolving
  - `resolveAlert()` - Marks alerts as resolved
- **Code Logic**:
  ```typescript
  // Shows confirmation modal with detailed alert info
  const showResolveConfirmation = async (alert: Alert) => {
    if (alert.type === 'issue') {
      const { data: issueData } = await supabase
        .from('Issues')
        .select('*')
        .eq('issue_id', parseInt(alert.id.split('-')[1]))
        .single();
      setAlertDetails(issueData);
    } else {
      const { data: contaminationData } = await supabase
        .from('Litter')
        .select('*')
        .eq('litter_id', parseInt(alert.id.split('-')[1]))
        .single();
      setAlertDetails(contaminationData);
    }
    setSelectedAlert(alert);
    setShowConfirmModal(true);
  };

  // Resolves alert by updating database
  const confirmResolve = async () => {
    const tableName = selectedAlert.type === 'issue' ? 'Issues' : 'Litter';
    const idField = selectedAlert.type === 'issue' ? 'issue_id' : 'litter_id';
    const recordId = parseInt(selectedAlert.id.split('-')[1]);
    
    const updateData = selectedAlert.type === 'contamination' 
      ? { resolved: true, contamination_removed: contaminationRemoved }
      : { resolved: true };
    
    await supabase
      .from(tableName)
      .update(updateData)
      .eq(idField, recordId);
  };
  ```

#### Weight Distribution Graph (`components/weight-distribution-graph.tsx`)
- **Component**: `WeightDistributionGraph()` - Shows weight data in chart format
- **Key Variables**: 
  - `chartData` - Processed data for the chart
  - `selectedSite` - Currently selected site for filtering
- **Key Functions**: 
  - `fetchWeightData()` - Gets weight data from database
  - `processChartData()` - Formats data for chart display

#### Daily Calendar (`components/daily-calendar.tsx`)
- **Component**: `DailyCalendar()` - Shows daily activity calendar
- **Key Variables**: 
  - `calendarData` - Events and activities for each day
  - `selectedDate` - Currently selected date
- **Key Functions**: 
  - `fetchCalendarData()` - Gets daily activity data
  - `handleDateClick()` - Handles date selection

#### Form Submissions Table (`components/form-submissions-table.tsx`)
- **Component**: `FormSubmissionsTable()` - Main table showing all form submissions
- **Key Variables**: 
  - `submissions` - Array of all form submissions
  - `loading` - Shows loading spinner
  - `error` - Shows error messages
- **Key Functions**: 
  - `fetchSubmissions()` - Gets all submissions from database
  - `handleViewDetails()` - Opens detailed view modal
- **Features**: Filtering, search, and cleanup functionality
- **Code Logic**:
  ```typescript
  // Fetches all submissions with site information
  const fetchSubmissions = async () => {
    const { data, error } = await supabase
      .from('Form Submission')
      .select(`
        submission_id, timestamp, site_id, first_name, last_name, user_email,
        Site(site_name)
      `)
      .order('timestamp', { ascending: false });
    
    if (error) throw error;
    setSubmissions(data || []);
  };

  // Cleanup function removes empty submissions
  const handleDryRun = async () => {
    const emptySubmissions = submissions.filter(submission => {
      // Check if submission has no related data in any table
      return !hasRelatedData(submission.submission_id);
    });
    
    if (emptySubmissions.length > 0) {
      const { error } = await supabase
        .from('Form Submission')
        .delete()
        .in('submission_id', emptySubmissions.map(s => s.submission_id));
    }
  };
  ```

#### PDF Manager (`components/pdf-manager.tsx`)
- **Component**: `PDFManager()` - Manages PDF file uploads and storage
- **Key Variables**: 
  - `files` - Array of uploaded PDF files
  - `uploading` - Shows upload progress
- **Key Functions**: 
  - `fetchFiles()` - Gets list of PDF files from storage
  - `handleUpload()` - Uploads new PDF files
  - `handleDelete()` - Removes PDF files

#### Site Manager (`components/site-manager.tsx`)
- **Component**: `SiteManager()` - Manages composting site information
- **Key Variables**: 
  - `sites` - Array of all composting sites
  - `editing` - Controls edit mode for forms
- **Key Functions**: 
  - `fetchSites()` - Gets all sites from database
  - `handleSave()` - Saves new or updated site information
  - `handleDelete()` - Removes sites from database

#### Email Recipients Manager (`components/email-recipients-manager.tsx`)
- **Component**: `EmailRecipientsManager()` - Manages email addresses for alerts
- **Key Variables**: 
  - `recipients` - Array of email addresses that receive alerts
  - `newEmail` - Form input for adding new emails
  - `loading` - Shows loading spinner
  - `saving` - Shows save progress
- **Key Functions**: 
  - `fetchRecipients()` - Gets all email recipients from database
  - `addRecipient()` - Adds new email address for alerts
  - `deleteRecipient()` - Removes email address from alerts
- **Code Logic**:
  ```typescript
  // Adds new email recipient
  const addRecipient = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase
      .from('alert_email_recipients')
      .insert({ email: newEmail.trim() })
      .select()
      .single();

    if (error) throw error;
    setRecipients(prev => [data, ...prev]);
    setNewEmail("");
  };

  // Removes email recipient
  const deleteRecipient = async (id: number) => {
    const { error } = await supabase
      .from('alert_email_recipients')
      .delete()
      .eq('id', id);

    if (error) throw error;
    setRecipients(prev => prev.filter(recipient => recipient.id !== id));
  };
  ```

## Edit Functionality

### Dashboard Edit Capabilities
The dashboard provides **edit functionality** for various components that allows staff to modify data **after** it has been submitted to the database. This is different from the user form system, where users edit their entries before submission.

### Edit Methods in Dashboard

#### 1. Site Management (`components/site-manager.tsx`)
- **Purpose**: Add, edit, and configure composting sites
- **Edit Mode**: Toggle between view and edit modes for site information
- **Key Functions**:
  - `handleSave()` - Saves new or updated site information
  - `handleDelete()` - Removes sites from database
- **Code Logic**:
  ```typescript
  // Edit mode controls form visibility
  const [editing, setEditing] = useState(false);
  
  // Save site changes to database
  const handleSave = async (siteData) => {
    if (editing) {
      // Update existing site
      const { error } = await supabase
        .from('Site')
        .update(siteData)
        .eq('site_id', siteData.site_id);
    } else {
      // Create new site
      const { error } = await supabase
        .from('Site')
        .insert(siteData);
    }
  };
  ```

#### 2. Email Recipients Management (`components/email-recipients-manager.tsx`)
- **Purpose**: Manage email addresses that receive alert notifications
- **Edit Operations**: Add new recipients, delete existing ones
- **Key Functions**:
  - `addRecipient()` - Adds new email address for alerts
  - `deleteRecipient()` - Removes email address from alerts
- **Code Logic**:
  ```typescript
  // Add new email recipient
  const addRecipient = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase
      .from('alert_email_recipients')
      .insert({ email: newEmail.trim() })
      .select()
      .single();

    if (error) throw error;
    setRecipients(prev => [data, ...prev]);
    setNewEmail("");
  };

  // Remove email recipient
  const deleteRecipient = async (id: number) => {
    const { error } = await supabase
      .from('alert_email_recipients')
      .delete()
      .eq('id', id);

    if (error) throw error;
    setRecipients(prev => prev.filter(recipient => recipient.id !== id));
  };
  ```

#### 3. Alert Resolution (`components/alerts-panel.tsx`)
- **Purpose**: Mark contamination and issue alerts as resolved
- **Edit Operations**: Update alert status, add resolution details
- **Key Functions**:
  - `showResolveConfirmation()` - Shows confirmation modal before resolving
  - `resolveAlert()` - Marks alerts as resolved in database
- **Code Logic**:
  ```typescript
  // Resolves alert by updating database
  const confirmResolve = async () => {
    const tableName = selectedAlert.type === 'issue' ? 'Issues' : 'Litter';
    const idField = selectedAlert.type === 'issue' ? 'issue_id' : 'litter_id';
    const recordId = parseInt(selectedAlert.id.split('-')[1]);
    
    const updateData = selectedAlert.type === 'contamination' 
      ? { resolved: true, contamination_removed: contaminationRemoved }
      : { resolved: true };
    
    await supabase
      .from(tableName)
      .update(updateData)
      .eq(idField, recordId);
  };
  ```

#### 4. PDF Management (`components/pdf-manager.tsx`)
- **Purpose**: Upload, manage, and organize PDF documents
- **Edit Operations**: Upload new files, delete existing files
- **Key Functions**:
  - `handleUpload()` - Uploads new PDF files to storage
  - `handleDelete()` - Removes PDF files from storage

#### 5. Form Submissions Cleanup (`components/form-submissions-table.tsx`)
- **Purpose**: Remove empty or invalid form submissions
- **Edit Operations**: Bulk delete empty submissions
- **Key Functions**: 
  - `handleDryRun()` - Identifies and removes empty submissions
- **Code Logic**:
  ```typescript
  // Cleanup function removes empty submissions
  const handleDryRun = async () => {
    const emptySubmissions = submissions.filter(submission => {
      // Check if submission has no related data in any table
      return !hasRelatedData(submission.submission_id);
    });
    
    if (emptySubmissions.length > 0) {
      const { error } = await supabase
        .from('Form Submission')
        .delete()
        .in('submission_id', emptySubmissions.map(s => s.submission_id));
    }
  };
  ```

### What Staff Can Edit

**Site Configuration:**
- Site names, locations, and settings
- Add new composting sites
- Remove inactive sites

**Alert Management:**
- Mark contamination alerts as resolved
- Mark issue reports as resolved
- Add resolution details and notes

**Email Notifications:**
- Add new email recipients for alerts
- Remove email addresses from alert list
- Manage notification preferences

**File Management:**
- Upload new PDF documents
- Delete outdated or incorrect PDFs
- Organize document storage

**Data Cleanup:**
- Remove empty form submissions
- Clean up invalid or duplicate entries
- Maintain data integrity

### Key Points
- **Post-Submission Editing**: Dashboard editing happens after data is already in the database
- **Staff-Only Access**: Only authenticated staff can perform edit operations
- **Data Integrity**: All edits are logged and tracked in the database
- **Confirmation Workflows**: Critical operations require confirmation before execution
- **Real-Time Updates**: Changes are immediately reflected in the dashboard interface
- **Audit Trail**: All modifications are tracked with timestamps and user information

### Data Fetching Patterns

#### Database Connection
The dashboard connects to Supabase database in two ways:

- **Server Components** (pages): Use `createClient()` from `@/lib/supabase/server`
  - Run on the server before sending to browser
  - Used for authentication checks and initial data loading

- **Client Components** (interactive parts): Use `createClient()` from `@/lib/supabase/client`
  - Run in the user's browser
  - Used for user interactions and dynamic data updates

- **Authentication**: `supabase.auth.getUser()` checks if user is logged in

#### Database Queries
The dashboard uses Supabase queries to get data:

```typescript
// Get recent activities - joins multiple tables
const { data: submissions } = await supabase
  .from('Form Submission')
  .select(`
    submission_id, timestamp, first_name, last_name, site_id,
    Site(site_name),
    Measurements(bin_type),
    "Adding Material"(bin_id),
    Issues(issue_id)
  `)
  .order('timestamp', { ascending: false })
  .limit(50);

// Get specific issue details
const { data: issues } = await supabase
  .from('Issues')
  .select('*')
  .eq('issue_id', issueId)
  .single();
```

#### Data Types
The dashboard uses these data structures:

```typescript
// Activity record structure - used by Recent Activity component
// Defines the format for displaying user activities in the dashboard
interface ActivityRecord {
  id: string;
  activity: string;        // Description like "Added material to Bin 1"
  date_time: string;
  site: string;
  user: string;
  submission_id: number;
}

// Alert structure - used by Alerts Panel component
// Defines the format for contamination and issue alerts
interface Alert {
  id: string;
  type: 'contamination' | 'issue';
  site: string;
  date_time: string;
  user: string;
  description: string;
  submission_id: number;
}
```

**Where these interfaces are defined:**
- `ActivityRecord` - Defined in `components/recent-activity.tsx` (lines 6-13)
- `Alert` - Defined in `components/alerts-panel.tsx` (lines 6-14)

These TypeScript interfaces ensure type safety and help developers understand the expected data structure when working with these components.

#### State Management
Components use React state to manage data:

- **useState**: Each component stores its own data
  - Example: `const [activities, setActivities] = useState([])`
  - React automatically updates the UI when data changes

- **Loading States**: Show spinners while data loads
  - Example: `const [loading, setLoading] = useState(true)`

- **Error Handling**: Show user-friendly error messages
  - Try-catch blocks handle database errors

- **Data Formatting**: Convert database data to readable format
  - Example: "2024-01-15T10:30:00Z" becomes "Jan 15, 2024 at 10:30 AM"

### Key Files to Understand
- `app/dashboard/page.tsx` - Main dashboard structure
- `components/dashboard-sidebar.tsx` - Navigation system
- `components/form-submissions-table.tsx` - Core data display
- `components/email-recipients-manager.tsx` - Email alert management
- `lib/supabase/` - Database connection utilities