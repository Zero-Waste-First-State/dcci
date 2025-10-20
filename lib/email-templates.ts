export function createCompostFormSubmissionEmail(userName: string, siteName: string, taskType: string) {
  return {
    subject: 'Compost Form Submission Confirmation - DCCI',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2c5530; margin: 0; font-size: 24px;">DCCI Compost Records</h1>
          </div>
          
          <h2 style="color: #2c5530; margin-bottom: 20px;">Thank you for your submission!</h2>
          
          <p style="color: #333; line-height: 1.6; margin-bottom: 15px;">Hello ${userName},</p>
          
          <p style="color: #333; line-height: 1.6; margin-bottom: 15px;">
            We've successfully received your compost form submission for <strong>${siteName}</strong>.
          </p>
          
          <div style="background-color: #f0f8f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #2c5530;"><strong>Submission Details:</strong></p>
            <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #333;">
              <li><strong>Site:</strong> ${siteName}</li>
              <li><strong>Task Type:</strong> ${taskType}</li>
              <li><strong>Date:</strong> ${new Date().toLocaleDateString()}</li>
            </ul>
          </div>
          
          <p style="color: #333; line-height: 1.6; margin-bottom: 15px;">
            Your data has been recorded in our system and will be reviewed by our staff. 
            This information helps us track and improve our composting operations.
          </p>
          
          <p style="color: #333; line-height: 1.6; margin-bottom: 20px;">
            If you have any questions about your submission or need to make any corrections, 
            please don't hesitate to contact us.
          </p>
          
          <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
            <p style="color: #666; margin: 0; font-size: 14px;">Best regards,</p>
            <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">The DCCI Team</p>
          </div>
        </div>
      </div>
    `
  }
}

export function createStaffNotificationEmail(formData: any) {
  const taskTypeMap: { [key: string]: string } = {
    'add_material': 'Add Material to Bin',
    'measure_bin': 'Measure Bin',
    'move_bins': 'Move Bins',
    'finished_compost': 'Finished Compost'
  }

  return {
    subject: `New Compost Form Submission - ${formData.siteName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2c5530; margin: 0; font-size: 24px;">DCCI Staff Notification</h1>
          </div>
          
          <h2 style="color: #2c5530; margin-bottom: 20px;">New Compost Form Submission</h2>
          
          <p style="color: #333; line-height: 1.6; margin-bottom: 20px;">
            A new compost form has been submitted and requires your review.
          </p>
          
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <p style="margin: 0; color: #856404;"><strong>Submission Details:</strong></p>
            <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #333;">
              <li><strong>Site:</strong> ${formData.siteName}</li>
              <li><strong>User:</strong> ${formData.firstName} ${formData.lastName}</li>
              <li><strong>Email:</strong> ${formData.email}</li>
              <li><strong>Task Type:</strong> ${taskTypeMap[formData.selectedTask] || formData.selectedTask}</li>
              <li><strong>Submission Date:</strong> ${new Date().toLocaleDateString()}</li>
              <li><strong>Submission Time:</strong> ${new Date().toLocaleTimeString()}</li>
            </ul>
          </div>
          
          <p style="color: #333; line-height: 1.6; margin-bottom: 20px;">
            Please review this submission in the staff dashboard and take any necessary actions.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://h4i.plasticfreedelaware.org/dashboard" 
               style="background-color: #2c5530; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View in Dashboard
            </a>
          </div>
          
          <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
            <p style="color: #666; margin: 0; font-size: 14px;">This is an automated notification from the DCCI Compost Records System.</p>
          </div>
        </div>
      </div>
    `
  }
}

export function createContaminationAlertEmail(formData: any) {
  return {
    subject: `🚨 CONTAMINATION ALERT - ${formData.siteName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #dc3545; margin: 0; font-size: 24px;">🚨 CONTAMINATION ALERT</h1>
          </div>
          
          <div style="background-color: #f8d7da; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545;">
            <h2 style="color: #721c24; margin: 0 0 15px 0;">Contamination Reported</h2>
            <p style="color: #721c24; margin: 0; font-weight: bold;">Immediate attention required</p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #2c5530; margin: 0 0 15px 0;">Report Details:</h3>
            <ul style="margin: 0; padding-left: 20px; color: #333;">
              <li><strong>Site:</strong> ${formData.siteName}</li>
              <li><strong>Reported By:</strong> ${formData.firstName} ${formData.lastName}</li>
              <li><strong>Email:</strong> ${formData.email}</li>
              <li><strong>Date:</strong> ${new Date().toLocaleDateString()}</li>
              <li><strong>Time:</strong> ${new Date().toLocaleTimeString()}</li>
            </ul>
          </div>
          
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <h3 style="color: #856404; margin: 0 0 10px 0;">Contamination Details:</h3>
            <p style="color: #333; margin: 0; line-height: 1.6;">${formData.contaminationDetails || 'No additional details provided'}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://h4i.plasticfreedelaware.org/dashboard" 
               style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View in Dashboard
            </a>
          </div>
          
          <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
            <p style="color: #666; margin: 0; font-size: 14px;">This is an automated alert from the DCCI Compost Records System.</p>
          </div>
        </div>
      </div>
    `
  }
}

export function createIssueAlertEmail(formData: any) {
  return {
    subject: `⚠️ ISSUE ALERT - ${formData.siteName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #fd7e14; margin: 0; font-size: 24px;">⚠️ ISSUE ALERT</h1>
          </div>
          
          <div style="background-color: #fff3cd; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #fd7e14;">
            <h2 style="color: #856404; margin: 0 0 15px 0;">Issue Reported</h2>
            <p style="color: #856404; margin: 0; font-weight: bold;">Staff attention required</p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #2c5530; margin: 0 0 15px 0;">Report Details:</h3>
            <ul style="margin: 0; padding-left: 20px; color: #333;">
              <li><strong>Site:</strong> ${formData.siteName}</li>
              <li><strong>Reported By:</strong> ${formData.firstName} ${formData.lastName}</li>
              <li><strong>Email:</strong> ${formData.email}</li>
              <li><strong>Date:</strong> ${new Date().toLocaleDateString()}</li>
              <li><strong>Time:</strong> ${new Date().toLocaleTimeString()}</li>
            </ul>
          </div>
          
          <div style="background-color: #e2e3e5; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #6c757d;">
            <h3 style="color: #495057; margin: 0 0 10px 0;">Issue Details:</h3>
            <p style="color: #333; margin: 0; line-height: 1.6;">${formData.issueDetails || 'No additional details provided'}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://h4i.plasticfreedelaware.org/dashboard" 
               style="background-color: #fd7e14; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View in Dashboard
            </a>
          </div>
          
          <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
            <p style="color: #666; margin: 0; font-size: 14px;">This is an automated alert from the DCCI Compost Records System.</p>
          </div>
        </div>
      </div>
    `
  }
}

export function createTestEmail() {
  return {
    subject: 'Test Email - DCCI Compost Records System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #2c5530; margin-bottom: 20px;">Email System Test</h2>
          
          <p style="color: #333; line-height: 1.6; margin-bottom: 15px;">
            This is a test email to verify that the DCCI Compost Records email system is working correctly.
          </p>
          
          <div style="background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
            <p style="margin: 0; color: #155724;"><strong>✅ Email System Status: Working</strong></p>
            <p style="margin: 5px 0 0 0; color: #155724;">Test completed at: ${new Date().toLocaleString()}</p>
          </div>
          
          <p style="color: #333; line-height: 1.6; margin-bottom: 20px;">
            If you received this email, the Resend API integration is functioning properly.
          </p>
          
          <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
            <p style="color: #666; margin: 0; font-size: 14px;">DCCI Compost Records System</p>
          </div>
        </div>
      </div>
    `
  }
}
