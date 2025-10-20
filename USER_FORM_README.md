# User Form Data System Documentation

## Overview

This document explains the architecture and implementation of the user form data system in the DCCI application. The system manages multi-step form data collection for various composting tasks while maintaining data persistence across page navigation.

## Architecture Overview

The application uses a **hybrid storage approach** combining URL parameters and localStorage to maintain form data throughout the user experience:

### Storage Strategy

1. **URL Parameters (Primary Navigation)**
   - **Purpose**: Maintains core form data across page navigation
   - **Data**: `site`, `firstName`, `lastName`, `tasks`, `submissionId`
   - **Persistence**: Survives page refreshes and browser navigation
   - **Usage**: Passed through Next.js `searchParams`

2. **localStorage (Task-Specific Data)**
   - **Purpose**: Stores detailed task-specific form data
   - **Keys**: 
     - `user_form_${siteId}` - Basic user info
     - `task_${taskType}_${submissionId}` - Task-specific data
   - **Persistence**: Survives page refreshes, cleared on submission

### How the Strategies Work Together

The hybrid approach combines the reliability of URL parameters with the flexibility of localStorage. **URL parameters act as the "backbone"** - they carry essential navigation data (user identity, site, and task selection) that must survive page refreshes and browser navigation. This ensures users can always return to their form session even if they accidentally close their browser or navigate away. **localStorage serves as the "workspace"** - it stores the detailed form data that users are actively filling out, allowing them to work on complex multi-field forms without losing progress.

This dual strategy solves several user experience problems: users can refresh the page without losing their work, they can navigate back and forth between form steps, and they can resume their session even after closing the browser. The URL parameters provide the "what" (which user, site, and task), while localStorage provides the "how" (the specific data they've entered). When a user submits the form, the system combines both data sources - the URL parameters provide the user context and task identification, while localStorage provides all the detailed form responses. This approach also enables the system to handle complex scenarios like users switching between different bin types while preserving relevant data, or users going back to modify previous steps without losing their current progress.

## User Flow & Components

The form system follows this user journey:

```
1. Site Selection → 2. Task Selection → 3. Task Form → 4. Additional Tasks → 5. Litter Page → 6. Issue Corner → 7. Submit → 8. Thank You
```

### 1. Site Selection (`app/compost-form/page.tsx`)
- **Purpose**: First page users see - site selection with optional password protection
- **Component Used**: Built-in form (no separate component)
- **Key Logic**: 
  - Fetches sites from database
  - Handles password protection for restricted sites
  - Navigates to task selection with site ID
- **Data Flow**: Site ID → URL parameter to task selection

### 2. Task Selection (`app/compost-form/task-selection/page.tsx`)
- **Purpose**: User enters name/email and selects their task
- **Component Used**: `TaskSelection` from `components/task-selection.tsx`
- **Key Variables**: 
  - `firstName`, `lastName`, `email` - User information
  - `selectedTask` - Chosen task type
- **Key Functions**:
  - `handleSubmit()` - Validates and navigates to task page
- **Code Logic**:
  ```typescript
  // Save data to localStorage on every change
  // This ensures user data is preserved if they refresh the page
  useEffect(() => {
    // Only save if user has entered certain data
    if (firstName || lastName || email || selectedTask) {
      const data = {
        firstName, lastName, email, selectedTask, siteId,
        timestamp: new Date().toISOString() // Track when data was saved
      };
      // Save to localStorage with site-specific key
      localStorage.setItem(`compost_form_${siteId}`, JSON.stringify(data));
    }
  }, [firstName, lastName, email, selectedTask, siteId]);

  // Navigate to task with URL parameters
  const handleSubmit = (e: React.FormEvent) => {
    // Create URL parameters with all form data
    const params = new URLSearchParams({
      site: siteId.toString(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      tasks: selectedTask,
      submissionId: `temp_${Date.now()}` // Generate unique submission ID
    });
    // Navigate to the specific task page with all data in URL
    router.push(`/compost-form/task-selection/${task.path}?${params.toString()}`);
  };
  ```
- **Data Flow**: User info + task choice → URL parameters to task page

### 3. Task Forms (`app/compost-form/task-selection/{task}/page.tsx`)
- **Purpose**: Each task has its own page for data collection
- **Components Used**:
  - `AddingMaterial` from `components/adding-material.tsx`
  - `MeasuringBin` from `components/measuring-bin.tsx`
  - `MovingBins` from `components/moving-bins.tsx`
  - `FinishedCompost` from `components/finished-compost.tsx`

#### Adding Material (`components/adding-material.tsx`)
- **Component**: Form for adding greens and browns to composting bins
- **Key Variables**:
  - `binType` - Selected bin (Bin 1, Bin 2, Bin 3, Browns Bins)
  - `greensPounds`, `greensGallons` - Greens material amounts
  - `brownsGallons` - Browns material amount
  - `redLine` - Whether red line was reached
- **Code Logic**:
  ```typescript
  // Preserves data when switching between similar bin types
  const handleBinTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newBinType = e.target.value;
    const currentBinType = taskData.binType;
    
    // Define which bins are "regular" bins (similar functionality)
    const isRegularBin = (bin: string) => bin === "bin1" || bin === "bin2" || bin === "bin3";
    
    // Only preserve data if switching between similar bin types
    const shouldPreserveData = isRegularBin(currentBinType) && isRegularBin(newBinType);
    
    if (shouldPreserveData) {
      // Keep existing data, just change the bin type
      setTaskData(prev => ({ ...prev, binType: newBinType }));
    } else {
      // Clear all data when switching to/from browns bins (different functionality)
      setTaskData({
        binType: newBinType,
        greensPounds: "", greensGallons: "", brownsGallons: "",
        redLine: false, // ... other fields reset
      });
    }
  };
  ```

#### Measuring Bin (`components/measuring-bin.tsx`)
- **Component**: Form for measuring bin temperatures and moisture
- **Key Variables**:
  - `binType` - Selected bin (Bin 1, Bin 2, Bin 3, Bin 4, Steel Bins)
  - `tempLeft`, `tempMiddle`, `tempRight` - Temperature readings
  - `leftSqueeze`, `middleSqueeze`, `rightSqueeze` - Moisture test results
  - `leftCorrectiveActions`, `middleCorrectiveActions`, `rightCorrectiveActions` - Actions taken
- **Code Logic**:
  ```typescript
  // Preserves data when switching between regular bins (1, 2, 3)
  const updateTaskData = (field: keyof TaskData, value: string) => {
    if (field === 'binType') {
      // Define which bins are "regular" bins (similar measurement process)
      const isRegularBin = (bin: string) => bin === "bin_1" || bin === "bin_2" || bin === "bin_3";
      const shouldPreserveData = isRegularBin(currentBinType) && isRegularBin(value);
      
      if (shouldPreserveData) {
        // Keep existing measurement data, just change the bin type
        setTaskData(prev => ({ ...prev, binType: value }));
      } else {
        // Clear all data when switching to/from special bins (Bin 4, Steel Bins)
        // These have different measurement requirements
        setTaskData({
          binType: value,
          tempLeft: "", tempMiddle: "", tempRight: "",
          leftSqueeze: "", middleSqueeze: "", rightSqueeze: "",
          // ... other fields reset
        });
      }
    } else {
      // For non-binType fields, just update the specific field
      setTaskData(prev => ({ ...prev, [field]: value }));
    }
  };
  ```

#### Moving Bins (`components/moving-bins.tsx`)
- **Component**: Form for tracking bin movement operations
- **Key Variables**:
  - `moveBin1Bin2`, `moveBin2Bin3`, `moveBin3Bin4`, `moveBin4SteelBins` - Movement checkboxes
- **Purpose**: Records which bins were moved during the session

#### Finished Compost (`components/finished-compost.tsx`)
- **Component**: Form for recording finished compost collection
- **Key Variables**:
  - `gallonsCompostTaken` - Amount of finished compost collected
- **Purpose**: Tracks how much finished compost was taken from the site

**Common Task Form Logic**:
```typescript
// Load form data from URL and task data from localStorage
useEffect(() => {
  // Parse core form data from URL parameters
  const data = parseFormDataFromURL(searchParams);
  setFormData(data);
  
  // Load any previously saved task-specific data
  const savedData = localStorage.getItem(`task_${taskType}_${data.submissionId}`);
  if (savedData) {
    try {
      const loadedData = JSON.parse(savedData);
      // Merge saved data with default task data
      setTaskData(prev => ({ ...prev, ...loadedData }));
    } catch (error) {
      console.error("Error loading saved task data:", error);
    }
  }
}, [searchParams]);

// Save task data on every change
// This ensures user progress is preserved if they navigate away
useEffect(() => {
  if (formData) {
    // Save task data with unique key based on task type and submission ID
    localStorage.setItem(`task_${taskType}_${formData.submissionId}`, JSON.stringify(taskData));
  }
}, [taskData, formData]);
```
- **Data Flow**: Task data → localStorage + URL to additional tasks

### 4. Additional Tasks (`app/compost-form/additional-tasks/page.tsx`)
- **Purpose**: Collects additional task information (litter, issues)
- **Component Used**: `AdditionalTasks` from `components/additional-tasks.tsx`
- **Key Logic**: 
  - Receives all previous data via URL
  - Collects additional task details
  - Navigates to litter page
- **Data Flow**: Additional data → URL to litter page

### 5. Litter Page (`app/compost-form/litter-page/page.tsx`)
- **Purpose**: Collects contamination and litter information
- **Component Used**: `LitterPage` from `components/litter-page.tsx`
- **Key Logic**:
  - Records contamination details
  - Navigates to issue corner
- **Data Flow**: Litter data → URL to issue corner

### 6. Issue Corner (`app/compost-form/issue-corner/page.tsx`)
- **Purpose**: Collects problem reports (broken tools, odors, pests)
- **Component Used**: `IssueCorner` from `components/issue-corner.tsx`
- **Key Logic**:
  - Records issue details
  - Navigates to submit page
- **Data Flow**: Issue data → URL to submit page

### 7. Submit Page (`components/submit-form.tsx`)
- **Component**: Final submission page that combines all form data and saves to database
- **Key Variables**:
  - `formData` - Core form data from URL parameters
  - `taskData` - All task-specific data loaded from localStorage
  - `issueData` - Issue reporting data from localStorage
  - `litterData` - Contamination data from localStorage
  - `submissionId` - Real database ID after successful submission
- **Key Functions**:
  - `handleSubmit()` - Main submission logic that saves all data to database
  - `handleEditTask()` - Allows editing of task data before submission
  - `handleDeleteTask()` - Allows removal of task data before submission
  - `fetchSiteName()` - Gets site name for display and email alerts
- **Code Logic**:

  **Data Loading (useEffect)**:
  ```typescript
  // Load all form data when component mounts
  useEffect(() => {
    // Parse core form data from URL parameters
    const data = parseFormDataFromURL(searchParams);
    if (!data) {
      setMessage("Error: Missing form data. Please start over.");
      return;
    }
    setFormData(data);

    // Fetch site name for display
    fetchSiteName(data.site).then(name => setSiteName(name));

    // Load all task data from localStorage for this submission
    const taskTypes = ['add_material', 'measure_bin', 'move_bins', 'finished_compost'];
    const allTaskData: Record<string, TaskData | TaskData[]> = {};
    
    taskTypes.forEach(taskType => {
      const savedData = localStorage.getItem(`task_${taskType}_${data.submissionId}`);
    if (savedData) {
      try {
          const taskData = JSON.parse(savedData);
          // Handle moving bins as array for consistent display
          if (taskType === 'move_bins' && !Array.isArray(taskData)) {
            allTaskData[taskType] = [taskData];
          } else {
            allTaskData[taskType] = taskData;
          }
      } catch (error) {
          console.error(`Error loading task data for ${taskType}:`, error);
        }
      }
    });
    
    setTaskData(allTaskData);

    // Load issue and litter data from localStorage
    const savedIssueData = localStorage.getItem(`issue_corner_${data.submissionId}`);
    const savedLitterData = localStorage.getItem(`litter_${data.submissionId}`);
    // ... parse and set issue/litter data
  }, [searchParams]);
  ```

  **Main Submission Logic (handleSubmit)**:
  ```typescript
  const handleSubmit = async (e: React.FormEvent) => {
    // ... validation and setup code ...
    
    try {
      const supabase = createClient();

      // Step 1: Create the main form submission record
      const { data: submissionData, error: submissionError } = await supabase
        .from("Form Submission")
        .insert({
          timestamp: new Date().toISOString(),
          first_name: formData.firstName,
          last_name: formData.lastName,
          user_email: formData.email,
          site_id: formData.site
        })
        .select()
        .single();

      const newSubmissionId = submissionData.submission_id;

      // Step 2: Insert all task-specific data into appropriate tables
      for (const [taskId, data] of Object.entries(taskData)) {
        if (data) {
          const tasksToProcess = Array.isArray(data) ? data : [data];
          
          for (const taskData of tasksToProcess) {
            switch (taskId) {
              case 'measure_bin':
                // Insert into Measurements table with temperature, moisture, corrective actions
                // ... measurement data insertion code ...
                break;
              case 'add_material':
                if (taskData.binType === 'browns') {
                  // Insert into Browns Bin table
                  // ... browns bin data insertion code ...
                } else {
                  // Insert into Adding Material table for regular bins (1, 2, 3)
                  // ... regular bin data insertion code ...
                }
                break;
              case 'move_bins':
                // Insert into Moving Day table with movement checkboxes
                // ... moving bins data insertion code ...
                break;
              case 'finished_compost':
                // Insert into Finished Compost table with gallons taken
                // ... finished compost data insertion code ...
                break;
            }
          }
        }
      }

      // Step 3: Insert issue data if any issues were reported
      if (Object.values(issueData).some(value => value === true || (typeof value === 'string' && value.trim()))) {
        // Insert into Issues table with broken tools, odors, pests, etc.
        // ... issue data insertion code ...
      }

      // Step 4: Insert litter data only if contamination was found
      // Note: Litter data is ALWAYS inserted if contamination=true, regardless of whether it was removed
      if (litterData.contamination === true) {
        // Insert into Litter table with contamination details and removal status
        // ... litter data insertion code ...
      }

      // Step 5: Send alert emails if there are issues or contamination
      if (hasIssues || hasContamination) {
        // Send email notifications to configured recipients
        // ... email alert code ...
      }

      // Step 6: Clear localStorage data for this submission
      // ... localStorage cleanup code ...

      // Step 7: Navigate to thank you page
      // ... navigation code ...

    } catch (error) {
      // ... error handling code ...
    }
  };
  ```
- **Data Flow**: All data → Database + redirect to thank you

### 8. Thank You Page (`app/compost-form/thank-you/page.tsx`)
- **Purpose**: Confirmation page after successful submission
- **Component Used**: Built-in success page (no separate component)
- **Key Logic**: Shows success message and option to start new form

## Mobile-Friendly Design

### Mobile Optimization Features

The DCCI user form system is designed with mobile users in mind, as many composting volunteers will be using mobile devices while at the composting sites. The system includes several mobile-friendly features:

#### 1. Responsive Form Layouts
```typescript
// Form containers that adapt to screen size
<div className="max-w-md mx-auto p-4 md:p-6">
  {/* max-w-md: Maximum width for mobile-friendly forms */}
  {/* mx-auto: Center the form on larger screens */}
  {/* p-4 md:p-6: Smaller padding on mobile, larger on desktop */}
  
  <form className="space-y-4 md:space-y-6">
    {/* space-y-4: Reduced vertical spacing on mobile */}
    {/* md:space-y-6: More spacing on larger screens */}
  </form>
</div>
```

#### 2. Touch-Friendly Input Fields
```typescript
// Input fields optimized for mobile touch interaction
<Input 
  className="h-12 md:h-10 px-4 text-base"
  // h-12: 48px height on mobile (minimum touch target size)
  // md:h-10: 40px height on larger screens
  // px-4: Adequate horizontal padding for touch
  // text-base: Readable font size on mobile
/>
```

#### 3. Mobile-Optimized Navigation
```typescript
// Navigation buttons that work well on mobile
<div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
  {/* flex-col: Stack buttons vertically on mobile */}
  {/* sm:flex-row: Horizontal layout on larger screens */}
  
  <Button className="w-full sm:w-auto">
    {/* w-full: Full width on mobile for easier tapping */}
    {/* sm:w-auto: Auto width on larger screens */}
    Continue
  </Button>
</div>
```

#### 4. Responsive Data Display
```typescript
// Data tables that adapt to mobile screens
<div className="overflow-x-auto">
  {/* overflow-x-auto: Horizontal scroll on mobile for wide tables */}
  <table className="min-w-full">
    {/* min-w-full: Ensure table takes full width */}
  </table>
</div>

// Card layouts that stack on mobile
<div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
  {/* grid-cols-1: Single column on mobile */}
  {/* md:grid-cols-2: Two columns on medium screens and up */}
</div>
```

#### 5. Mobile-Specific Considerations
- **Large Touch Targets**: All interactive elements meet the 44px minimum touch target size
- **Readable Typography**: Font sizes scale appropriately for mobile readability
- **Simplified Navigation**: Form steps are clearly indicated and easy to navigate on mobile
- **Optimized Images**: Images are sized appropriately for mobile bandwidth and display
- **Gesture Support**: Swipe gestures and mobile-specific interactions are supported where appropriate

### Mobile User Experience
The form system prioritizes the mobile experience because:
- **Field Use Case**: Many users will be filling out forms while physically at composting sites
- **Device Access**: Volunteers may primarily use mobile devices for quick data entry
- **Portability**: Mobile devices are more convenient for on-site data collection
- **Accessibility**: Mobile-friendly design improves accessibility for all users

## Data Management Utilities

### Core Utilities (`lib/utils.ts`)
- **Component**: Data parsing and URL management functions
- **Key Functions**: 
  - `parseFormDataFromURL()` - Converts URL parameters to form data
  - `createFormDataURL()` - Creates URLs with form data
- **Code Logic**:
  ```typescript
  // Core form data interface - used for navigation and data management
  // Note: This is NOT the same as what gets saved to Supabase
  interface FormData {
    site: number;           // Site ID for navigation
    firstName: string;      // User's first name
    lastName: string;       // User's last name  
    email: string;          // User's email
    tasks: string;          // Task type identifier (for navigation/routing)
    submissionId: string;   // Temporary ID for localStorage keys
  }
  
  // What actually gets saved to Supabase:
  // - Form Submission table: site_id, first_name, last_name, user_email, timestamp
  // - Task-specific tables: the actual form data (measurements, materials, etc.)
  // - The 'tasks' string is used by the submit page to determine which task data to load

  // Parse URL parameters into FormData
  export function parseFormDataFromURL(searchParams: URLSearchParams): FormData | null {
    // Extract all required parameters from the URL
    const site = searchParams.get('site');
    const firstName = searchParams.get('firstName');
    const lastName = searchParams.get('lastName');
    const email = searchParams.get('email');
    const tasks = searchParams.get('tasks');
    const submissionId = searchParams.get('submissionId');

    // Validate that all required parameters exist
    // If any are missing, return null to indicate invalid data
    if (!site || !firstName || !lastName || !email || !tasks || !submissionId) {
      return null;
    }

    // Convert and return the form data object
    // Note: site is converted from string to number
    return {
      site: Number(site),
      firstName,
      lastName,
      email,
      tasks,
      submissionId
    };
  }
  ```

## Database Schema

The system saves data to multiple Supabase tables:

### Main Tables
- **Form Submission**: Core user information (name, email, site, timestamp)
- **Measurements**: Measuring bin task data (temperatures, moisture, corrective actions)
- **Adding Material**: Adding material task data (greens/browns amounts, bin types)
- **Moving Day**: Moving bins task data (which bins to move)
- **Finished Compost**: Finished compost task data (gallons taken)
- **Browns Bin**: Browns bin management data
- **Issues**: Problem reports (broken tools, odors, pests, etc.)
- **Litter**: Contamination tracking data

### Table Relationships
- All task tables reference `submission_id` from Form Submission
- One submission can have one record in each task table
- Form Submission links to Site table via `site_id`

## File Structure Reference

### Compost Form Folder Structure
```
app/compost-form/
├── page.tsx                    # Site selection page
├── task-selection/
│   ├── page.tsx               # Task selection page
│   ├── adding-material/
│   │   └── page.tsx           # Adding material task page
│   ├── measuring-bin/
│   │   └── page.tsx           # Measuring bin task page
│   ├── moving-bins/
│   │   └── page.tsx           # Moving bins task page
│   └── finished-compost/
│       └── page.tsx           # Finished compost task page
├── additional-tasks/
│   └── page.tsx               # Additional tasks page
├── litter-page/
│   └── page.tsx               # Litter/contamination page
├── issue-corner/
│   └── page.tsx               # Issues reporting page
├── submit/
│   └── page.tsx               # Final submission page
└── thank-you/
    └── page.tsx               # Success confirmation page
```

### Component Library
```
components/
├── volunteer-form.tsx         # Site selection (legacy name - these are users)
├── task-selection.tsx         # Task selection form
├── adding-material.tsx        # Adding material task form
├── measuring-bin.tsx          # Measuring bin task form
├── moving-bins.tsx            # Moving bins task form
├── finished-compost.tsx       # Finished compost task form
├── additional-tasks.tsx       # Additional tasks form
├── litter-page.tsx            # Litter/contamination form
├── issue-corner.tsx           # Issues reporting form
└── submit-form.tsx            # Final submission form

lib/
└── utils.ts                  # Data management utilities
```

## Edit Functionality

### User Edit Capabilities
Users can edit their form entries **before** submitting to the database using two different methods. This is **NOT** editing the database itself, but rather editing the data they're about to submit.

### Two Edit Methods

#### 1. Edit/Delete Modals (Task Data)
For task data (measurements, adding material, moving bins, finished compost), users can use **edit and delete modals** on the submit page because going back would create new entries and lose the current data they would have wanted to edit.

```typescript
// Edit task data before submission
const handleEditTask = (taskType: string, taskIndex: number = -1) => {
  setEditingTaskType(taskType);
  setEditingTaskIndex(taskIndex);
  
  // Get the current task data from localStorage
  const currentTaskData = taskData[taskType];
  if (Array.isArray(currentTaskData)) {
    setEditFormData(currentTaskData[taskIndex] || {});
  } else {
    setEditFormData(currentTaskData || {});
  }
  
  setShowEditModal(true);
};

// Save edited data back to localStorage
const handleSaveEdit = () => {
  if (!editingTaskType) return;

  const updatedTaskData = { ...taskData };
  const currentTaskData = updatedTaskData[editingTaskType];

  if (Array.isArray(currentTaskData)) {
    // Update specific instance in array
    currentTaskData[editingTaskIndex] = editFormData;
  } else {
    // Update single task
    updatedTaskData[editingTaskType] = editFormData;
  }

  setTaskData(updatedTaskData);

  // Update localStorage with edited data
  if (formData) {
    localStorage.setItem(`task_${editingTaskType}_${formData.submissionId}`, JSON.stringify(updatedTaskData[editingTaskType]));
  }

  handleCloseEditModal();
};
```

#### 2. Browser Back Navigation (Issues & Contamination)
For issues and contamination data, users can use the **browser back button** to return to those pages because they don't have the same data loss problem as task forms.

### What Users Can Edit

**Using Edit/Delete Modals:**
- **Task Data**: Modify measurements, material amounts, bin movements, finished compost amounts
- **Multiple Task Entries**: Edit or delete individual task entries without losing others

**Using Browser Back Navigation:**
- **Issue Reports**: Go back to Issue Corner to change or remove issue selections
- **Contamination Data**: Return to Litter Page to update litter/contamination details
- **Additional Tasks**: Go back to Additional Tasks page to add any additional task information

### Data Persistence During Navigation
```typescript
// All form data is automatically saved to localStorage on every change
useEffect(() => {
  if (formData) {
    // Save task data with unique key based on task type and submission ID
    localStorage.setItem(`task_${taskType}_${formData.submissionId}`, JSON.stringify(taskData));
  }
}, [taskData, formData]);

// When users navigate back, data is automatically loaded from localStorage
useEffect(() => {
  const savedData = localStorage.getItem(`task_${taskType}_${data.submissionId}`);
  if (savedData) {
    try {
      const loadedData = JSON.parse(savedData);
      // Merge saved data with default task data
      setTaskData(prev => ({ ...prev, ...loadedData }));
    } catch (error) {
      console.error("Error loading saved task data:", error);
    }
  }
}, [searchParams]);
```

### Key Points
- **No Database Access**: Users never directly edit database records, just insert
- **Two Edit Methods**: Modals for task data, back navigation for issues/contamination
- **localStorage Persistence**: All edits are automatically saved to browser localStorage
- **Data Loss Prevention**: Edit modals prevent losing task data when going back would create new entries
- **Submission Required**: Changes only take effect when the form is finally submitted
- **Data Integrity**: Original form data is preserved until final submission

### Debug Tools
- **Browser DevTools**: Inspect localStorage and Network tabs
- **Console Logs**: Monitor for error messages
- **URL Parameters**: Check browser address bar for correct data