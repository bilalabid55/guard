const sgMail = require('@sendgrid/mail');
const FROM_EMAIL = process.env.SENDER_EMAIL || process.env.EMAIL_USER;
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Send pre-registration invitation email
const sendPreRegistrationInvitation = async (visitorData, siteData, preRegistrationUrl) => {
  try {
    if (!process.env.SENDGRID_API_KEY || !FROM_EMAIL) {
      throw new Error('Missing SENDGRID_API_KEY or SENDER_EMAIL');
    }

    const msg = {
      from: { email: FROM_EMAIL, name: siteData.name },
      to: visitorData.email,
      subject: `Pre-registration Invitation - ${siteData.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #1976d2; color: white; padding: 20px; text-align: center;">
            <h1>${siteData.name}</h1>
            <h2>Visitor Pre-registration</h2>
          </div>
          
          <div style="padding: 20px; background-color: #f5f5f5;">
            <p>Dear ${visitorData.fullName},</p>
            
            <p>You have been invited to pre-register for your upcoming visit to <strong>${siteData.name}</strong>.</p>
            
            <div style="background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #1976d2;">
              <h3>Visit Details:</h3>
              <p><strong>Company:</strong> ${visitorData.company}</p>
              <p><strong>Purpose:</strong> ${visitorData.purpose}</p>
              <p><strong>Contact Person:</strong> ${visitorData.contactPerson || 'To be confirmed'}</p>
              <p><strong>Expected Duration:</strong> ${visitorData.expectedDuration || 4} hours</p>
            </div>
            
            <p>To complete your pre-registration, please click the button below:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${preRegistrationUrl}" 
                 style="background-color: #1976d2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Complete Pre-registration
              </a>
            </div>
            
            <p><strong>Important Notes:</strong></p>
            <ul>
              <li>Please bring a valid ID for verification</li>
              <li>Arrive at the designated access point</li>
              <li>Follow all safety protocols and wear appropriate PPE</li>
              <li>Contact your host if you have any questions</li>
            </ul>
            
            <p>If you have any questions or need to reschedule, please contact your host or the site administrator.</p>
            
            <p>Thank you for your cooperation.</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
              <p>This is an automated message from the ${siteData.name} visitor management system.</p>
              <p>Site Address: ${siteData.address}</p>
            </div>
          </div>
        </div>
      `,
    };

    const [result] = await sgMail.send(msg);
    console.log('Pre-registration email sent:', result?.headers?.['x-message-id'] || 'ok');
    return { success: true, messageId: result?.headers?.['x-message-id'] };
  } catch (error) {
    console.error('Error sending pre-registration email:', error);
    return { success: false, error: error.message };
  }
};

// Send pre-registration confirmation email
const sendPreRegistrationConfirmation = async (visitorData, siteData, qrCodeDataUrl) => {
  try {
    if (!process.env.SENDGRID_API_KEY || !FROM_EMAIL) {
      throw new Error('Missing SENDGRID_API_KEY or SENDER_EMAIL');
    }

    const msg = {
      from: { email: FROM_EMAIL, name: siteData.name },
      to: visitorData.email,
      subject: `Pre-registration Confirmed - ${siteData.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #4caf50; color: white; padding: 20px; text-align: center;">
            <h1>Pre-registration Confirmed</h1>
            <h2>${siteData.name}</h2>
          </div>
          
          <div style="padding: 20px; background-color: #f5f5f5;">
            <p>Dear ${visitorData.fullName},</p>
            
            <p>Your pre-registration for <strong>${siteData.name}</strong> has been successfully completed.</p>
            
            <div style="background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #4caf50;">
              <h3>Your Visit Details:</h3>
              <p><strong>Badge Number:</strong> ${visitorData.badgeNumber}</p>
              <p><strong>Company:</strong> ${visitorData.company}</p>
              <p><strong>Purpose:</strong> ${visitorData.purpose}</p>
              <p><strong>Access Point:</strong> ${visitorData.accessPointName}</p>
              <p><strong>Expected Duration:</strong> ${visitorData.expectedDuration} hours</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <h3>Your QR Code Badge:</h3>
              <img src="${qrCodeDataUrl}" alt="QR Code Badge" style="max-width: 200px; border: 2px solid #ddd; padding: 10px; background-color: white;">
              <p style="font-size: 12px; color: #666; margin-top: 10px;">Show this QR code at the access point for quick check-in</p>
            </div>
            
            <p><strong>Check-in Instructions:</strong></p>
            <ol>
              <li>Arrive at the designated access point: <strong>${visitorData.accessPointName}</strong></li>
              <li>Present your QR code to the security guard</li>
              <li>Show a valid ID for verification</li>
              <li>Follow safety protocols and wear appropriate PPE</li>
            </ol>
            
            <p>If you have any questions or need to make changes, please contact your host or the site administrator.</p>
            
            <p>We look forward to your visit!</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
              <p>This is an automated message from the ${siteData.name} visitor management system.</p>
              <p>Site Address: ${siteData.address}</p>
            </div>
          </div>
        </div>
      `,
    };

    const [result] = await sgMail.send(msg);
    console.log('Pre-registration confirmation email sent:', result?.headers?.['x-message-id'] || 'ok');
    return { success: true, messageId: result?.headers?.['x-message-id'] };
  } catch (error) {
    console.error('Error sending pre-registration confirmation email:', error);
    return { success: false, error: error.message };
  }
};

// Send banned visitor alert email
const sendBannedVisitorAlert = async (visitorData, siteData, bannedVisitorData, alertRecipients) => {
  try {
    if (!process.env.SENDGRID_API_KEY || !FROM_EMAIL) {
      throw new Error('Missing SENDGRID_API_KEY or SENDER_EMAIL');
    }

    const msg = {
      from: { email: FROM_EMAIL, name: `${siteData.name} Security` },
      to: alertRecipients,
      subject: `🚨 BANNED VISITOR ATTEMPT - ${siteData.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f44336; color: white; padding: 20px; text-align: center;">
            <h1>🚨 SECURITY ALERT</h1>
            <h2>Banned Visitor Attempt</h2>
          </div>
          
          <div style="padding: 20px; background-color: #ffebee;">
            <div style="background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #f44336;">
              <h3>⚠️ ATTEMPTED CHECK-IN BY BANNED VISITOR</h3>
              <p><strong>Visitor Name:</strong> ${visitorData.fullName}</p>
              <p><strong>Email:</strong> ${visitorData.email}</p>
              <p><strong>Company:</strong> ${visitorData.company}</p>
              <p><strong>Phone:</strong> ${visitorData.phone}</p>
              <p><strong>Purpose:</strong> ${visitorData.purpose}</p>
            </div>
            
            <div style="background-color: #fff3e0; padding: 15px; margin: 15px 0; border-left: 4px solid #ff9800;">
              <h3>Ban Details:</h3>
              <p><strong>Reason:</strong> ${bannedVisitorData.reason}</p>
              <p><strong>Description:</strong> ${bannedVisitorData.description || 'No additional details'}</p>
              <p><strong>Banned Date:</strong> ${new Date(bannedVisitorData.bannedDate).toLocaleDateString()}</p>
              <p><strong>Banned By:</strong> ${bannedVisitorData.bannedBy}</p>
              <p><strong>Site:</strong> ${siteData.name}</p>
            </div>
            
            <div style="background-color: #e3f2fd; padding: 15px; margin: 15px 0; border-left: 4px solid #2196f3;">
              <h3>Immediate Actions Required:</h3>
              <ul>
                <li>Deny access to the visitor</li>
                <li>Document the attempt</li>
                <li>Notify security personnel</li>
                <li>Review security protocols if necessary</li>
              </ul>
            </div>
            
            <p><strong>Time of Attempt:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Site:</strong> ${siteData.name}</p>
            <p><strong>Address:</strong> ${siteData.address}</p>
          </div>
        </div>
      `,
    };

    const [result] = await sgMail.send(msg);
    console.log('Banned visitor alert email sent:', result?.headers?.['x-message-id'] || 'ok');
    return { success: true, messageId: result?.headers?.['x-message-id'] };
  } catch (error) {
    console.error('Error sending banned visitor alert email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendPreRegistrationInvitation,
  sendPreRegistrationConfirmation,
  sendBannedVisitorAlert
};

