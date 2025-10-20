# Email System Documentation

## Overview

The DCCI Composting Application uses an automated email notification system to alert staff when contamination or issues are reported at composting sites. The system uses **Resend** (powered by AWS SES) via Supabase Edge Functions to deliver professional, branded emails to configured recipients.

## How Email Works in DCCI

The email system is triggered during form submission when users report:
- **Contamination** (plastic, trash, or other non-compostable materials in bins)
- **Site Issues** (broken tools, bad odors, pests, or other problems)

When these conditions are detected, the system automatically sends alert emails to all configured staff members, enabling rapid response to site problems.

## Email Types in DCCI

### 1. Contamination Alert Emails
**Purpose**: Immediate alerts when contamination is found in compost bins
**Trigger**: When `litterData.contamination === true` in form submission
**Recipients**: All email addresses in `alert_email_recipients` table

**Actual Implementation**:
```typescript
// In components/submit-form.tsx (lines 457-479)
const hasContamination = litterData.contamination === true;

if (hasIssues || hasContamination) {
  const alertFormData = {
    siteName: siteData?.site_name || `Site ${formData.site}`,
    firstName: formData.firstName,
    lastName: formData.lastName,
    email: formData.email,
    hasContamination,
    hasIssue: hasIssues,
    contaminationDetails: hasContamination ? "Contamination was reported in the compost bins" : "",
    issueDetails: hasIssues ? "Site issues were reported" : ""
  };
  
  await sendAlertEmails(alertFormData);
}
```

**Email Content**:
- 🚨 High-priority alert styling (red theme)
- Clear contamination warning
- Site and reporter details
- Direct dashboard link for immediate action

### 2. Issue Alert Emails
**Purpose**: Alerts for site issues (broken tools, odors, pests, etc.)
**Trigger**: When issues are reported in form submission
**Recipients**: All email addresses in `alert_email_recipients` table

**Email Content**:
- ⚠️ Issue alert styling (orange theme)
- Issue type and severity
- Site and reporter information
- Dashboard link for resolution

### 3. Test Emails
**Purpose**: Verify email system functionality
**Trigger**: Manual testing via dashboard (`components/email-test.tsx`)
**Recipients**: Specified test email address

**Email Content**:
- System test confirmation
- Timestamp of test
- Status verification
- DCCI branding

## Technical Implementation

### Core Email Function (`lib/email.ts`)

The DCCI email system uses a simplified approach with two main functions:

```typescript
// Main email sending function
export async function sendEmail(emailData: EmailData) {
  const supabase = createClient();
  
  const { data, error } = await supabase.functions.invoke('send-email', {
    body: emailData
  });

  if (error) {
    console.error('Email sending error:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }

  return data;
}

// Alert email function used in form submission
export async function sendAlertEmails(formData: AlertFormData) {
  const alerts = [];
  
  // Check for contamination
  if (formData.hasContamination) {
    alerts.push({
      type: 'contamination',
      emailData: {
        subject: `🚨 CONTAMINATION ALERT - ${formData.siteName}`,
        html: createContaminationAlertEmail(formData).html
      }
    });
  }
  
  // Check for issues
  if (formData.hasIssue) {
    alerts.push({
      type: 'issue',
      emailData: {
        subject: `⚠️ ISSUE ALERT - ${formData.siteName}`,
        html: createIssueAlertEmail(formData).html
      }
    });
  }
  
  // Send to all recipients
  const recipients = await getAllEmailRecipients();
  // ... send logic with error handling and rate limiting
}
```

### Email Recipients Management

The system automatically fetches recipients from the database:

```typescript
async function getAllEmailRecipients(): Promise<string[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('alert_email_recipients')
    .select('email');

  if (error) {
    console.log('📧 No email recipients found - alerts will not be sent');
    return [];
  }

  return data?.map(recipient => recipient.email) || [];
}
```

## Configuration & Setup

### Environment Variables
```env
# Required for email functionality
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Resend API Setup
1. **Create Resend Account**: Sign up at [resend.com](https://resend.com)
2. **Get API Key**: Generate API key in Resend dashboard
3. **Add to Supabase**: Set `RESEND_API_KEY` in Supabase Edge Functions environment

### Supabase Edge Function Deployment
```bash
# Deploy the email function
supabase functions deploy send-email

# Set environment variables
supabase secrets set RESEND_API_KEY=your_api_key_here
```

## Email Recipients Management

### Database Table: `alert_email_recipients`
```sql
CREATE TABLE alert_email_recipients (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Management Interface (`components/email-recipients-manager.tsx`)
- **Add Recipients**: Add new email addresses for alerts
- **Remove Recipients**: Delete email addresses from alert list
- **Validation**: Email format validation
- **Real-time Updates**: Changes reflect immediately in dashboard

## Testing & Debugging

### Test Email Component (`components/email-test.tsx`)
- **Manual Testing**: Send test emails to verify system
- **Template Preview**: See how emails will look
- **Delivery Verification**: Confirm emails are received

### Debugging Steps
1. **Check Supabase Logs**: Edge Function execution logs
2. **Verify API Key**: Ensure Resend API key is valid
3. **Test Email Format**: Validate recipient email addresses
4. **Check Rate Limits**: Monitor Resend usage limits

### Common Debug Commands
```bash
# Check Edge Function logs
supabase functions logs send-email

# Test email function locally
supabase functions serve send-email

# Check environment variables
supabase secrets list
```

## Integration with DCCI Form System

### Form Submission Flow
1. **User Submits Form** → System checks for contamination/issues
2. **Alert Detection** → If contamination or issues found, triggers email alerts
3. **Recipient Lookup** → Gets alert email addresses from database
4. **Email Delivery** → Sends via Supabase Edge Function to all recipients
5. **Staff Notification** → Staff receive immediate alerts for site problems

### Dashboard Integration
- **Email Recipients Manager**: Manage alert recipients in Settings page
- **Test Email Function**: Verify email system functionality
- **Alert Resolution**: Mark alerts as resolved in dashboard

This email system ensures that DCCI staff are promptly notified when contamination or issues are reported at composting sites, enabling rapid response to maintain site quality and safety.
