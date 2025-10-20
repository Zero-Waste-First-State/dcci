import { createClient } from '@/lib/supabase/client'
import { createContaminationAlertEmail, createIssueAlertEmail } from './email-templates'

export interface EmailData {
  to: string
  subject: string
  html: string
  from?: string
}

export async function sendEmail(emailData: EmailData) {
  const supabase = createClient()
  
  const { data, error } = await supabase.functions.invoke('send-email', {
    body: emailData
  })

  if (error) {
    console.error('Email sending error:', error)
    throw new Error(`Failed to send email: ${error.message}`)
  }

  return data
}

interface AlertFormData {
  siteName: string
  firstName: string
  lastName: string
  email: string
  hasContamination?: boolean
  hasIssue?: boolean
  contaminationDetails?: string
  issueDetails?: string
}

// Simple function to get all email recipients
async function getAllEmailRecipients(): Promise<string[]> {
  console.log('📧 Fetching email recipients from database...')
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('alert_email_recipients')
    .select('email')

  if (error) {
    console.error('❌ Error fetching email recipients:', error)
    console.log('📧 No email recipients found - alerts will not be sent')
    return []
  }

  const emails = data?.map(recipient => recipient.email) || []
  console.log('📧 Retrieved email recipients:', emails)
  return emails
}

export async function sendAlertEmails(formData: AlertFormData) {
  console.log('🚨 sendAlertEmails called with:', formData)
  
  const alerts = []
  
  // Check for contamination
  if (formData.hasContamination) {
    console.log('📧 Adding contamination alert')
    alerts.push({
      type: 'contamination',
      emailData: {
        subject: `🚨 CONTAMINATION ALERT - ${formData.siteName}`,
        html: createContaminationAlertEmail(formData).html
      }
    })
  }
  
  // Check for issues
  if (formData.hasIssue) {
    console.log('📧 Adding issue alert')
    try {
      const issueEmail = createIssueAlertEmail(formData)
      console.log('📧 Issue email template created successfully, HTML length:', issueEmail.html.length)
      
      
      alerts.push({
        type: 'issue',
        emailData: {
          subject: `⚠️ ISSUE ALERT - ${formData.siteName}`,
          html: issueEmail.html
        }
      })
    } catch (error) {
      console.error('❌ Error creating issue email template:', error)
      // Fallback to simple HTML
      alerts.push({
        type: 'issue',
        emailData: {
          subject: `⚠️ ISSUE ALERT - ${formData.siteName}`,
          html: `<h1>Issue Alert</h1><p>An issue was reported at ${formData.siteName} by ${formData.firstName} ${formData.lastName}</p>`
        }
      })
    }
  }
  
  console.log('📧 Total alerts to send:', alerts.length)
  
  // Get all recipients
  const recipients = await getAllEmailRecipients()
  console.log('📧 Email recipients:', recipients)
  
  // Send all alerts to all recipients
  const results = []
  for (const alert of alerts) {
    for (const recipient of recipients) {
      try {
        console.log(`📧 Sending ${alert.type} alert to ${recipient}`)
        console.log(`📧 Email data:`, {
          to: recipient,
          from: 'alerts@plasticfreedelaware.org',
          subject: alert.emailData.subject
        })
        
        const result = await sendEmail({
          to: recipient,
          from: 'alerts@plasticfreedelaware.org',
          ...alert.emailData
        })
        
        console.log(`✅ Successfully sent ${alert.type} alert to ${recipient}`, result)
        results.push({ 
          type: alert.type, 
          recipient, 
          success: true, 
          result 
        })
        
        // Add a small delay between emails to avoid rate limiting
        if (recipients.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        const errorStack = error instanceof Error ? error.stack : undefined
        
        console.error(`❌ Failed to send ${alert.type} alert to ${recipient}:`, error)
        console.error(`❌ Error details:`, {
          message: errorMessage,
          stack: errorStack,
          recipient,
          alertType: alert.type
        })
        results.push({ 
          type: alert.type, 
          recipient, 
          success: false, 
          error: errorMessage 
        })
      }
    }
  }
  
  console.log('📧 Final results:', results)
  return results
}

