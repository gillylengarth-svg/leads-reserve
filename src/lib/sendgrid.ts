import sgMail from '@sendgrid/mail';

const apiKey = process.env.SENDGRID_API_KEY;
const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'leads@leadsreserve.com';
const fromName = process.env.SENDGRID_FROM_NAME || 'LeadsReserve';

if (apiKey) {
  sgMail.setApiKey(apiKey);
} else {
  console.warn('SendGrid API key not configured');
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send email
 */
export async function sendEmail(
  options: EmailOptions
): Promise<{
  success: boolean;
  error?: string;
}> {
  if (!apiKey) {
    console.error('SendGrid not configured');
    return {
      success: false,
      error: 'Email service not configured',
    };
  }

  try {
    await sgMail.send({
      from: {
        email: fromEmail,
        name: fromName,
      },
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    });

    return { success: true };
  } catch (error: any) {
    console.error('SendGrid Error:', error.response?.body || error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Send new lead notification to contractor
 */
export async function emailContractorNewLead(
  contractorEmail: string,
  contractorName: string,
  lead: {
    id: string;
    name: string;
    companyName?: string;
    phone: string;
    email?: string;
    serviceType?: string;
    projectDetails?: string;
    city?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const portalUrl = process.env.NEXT_PUBLIC_PORTAL_URL || 'https://portal.leadsreserve.com';
  const leadUrl = `${portalUrl}/portal/leads/${lead.id}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1A365D; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #fff; border: 1px solid #e0e0e0; border-top: none; padding: 30px; }
    .lead-info { background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .lead-info h3 { margin-top: 0; color: #1A365D; }
    .info-row { margin: 10px 0; }
    .label { font-weight: 600; color: #666; }
    .button { display: inline-block; background: #FF6B35; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">🔔 New Lead Alert</h1>
      <p style="margin: 5px 0;">You have a new qualified lead!</p>
    </div>
    
    <div class="content">
      <p>Hi ${contractorName},</p>
      <p>Great news! You've received a new ${lead.serviceType || 'service'} lead in your area.</p>
      
      <div class="lead-info">
        <h3>Lead Details</h3>
        <div class="info-row">
          <span class="label">Name:</span> ${lead.name}
        </div>
        ${lead.companyName ? `<div class="info-row"><span class="label">Company:</span> ${lead.companyName}</div>` : ''}
        <div class="info-row">
          <span class="label">Phone:</span> <a href="tel:${lead.phone}">${lead.phone}</a>
        </div>
        ${lead.email ? `<div class="info-row"><span class="label">Email:</span> <a href="mailto:${lead.email}">${lead.email}</a></div>` : ''}
        ${lead.serviceType ? `<div class="info-row"><span class="label">Service:</span> ${lead.serviceType}</div>` : ''}
        ${lead.city ? `<div class="info-row"><span class="label">Location:</span> ${lead.city}</div>` : ''}
        ${lead.projectDetails ? `<div class="info-row"><span class="label">Details:</span> ${lead.projectDetails}</div>` : ''}
      </div>
      
      <p><strong>Quick Action Tips:</strong></p>
      <ul>
        <li>Contact the lead within 1 hour for best results</li>
        <li>Reference their specific project needs</li>
        <li>Be professional and prompt</li>
      </ul>
      
      <center>
        <a href="${leadUrl}" class="button">View Full Details</a>
      </center>
      
      <div class="footer">
        <p>This lead was charged to your account at your agreed rate.</p>
        <p>Questions? Reply to this email or contact support.</p>
        <p>&copy; ${new Date().getFullYear()} LeadsReserve. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  return await sendEmail({
    to: contractorEmail,
    subject: `🔔 New Lead: ${lead.name} - ${lead.serviceType || 'Service Request'}`,
    html,
  });
}

/**
 * Send welcome email to new contractor
 */
export async function emailContractorWelcome(
  contractorEmail: string,
  contractorName: string,
  loginUrl: string
): Promise<{ success: boolean; error?: string }> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1A365D; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #fff; border: 1px solid #e0e0e0; border-top: none; padding: 30px; }
    .button { display: inline-block; background: #FF6B35; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .feature { margin: 15px 0; padding-left: 25px; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">Welcome to LeadsReserve!</h1>
      <p style="margin: 10px 0;">Your account is ready</p>
    </div>
    
    <div class="content">
      <p>Hi ${contractorName},</p>
      <p>Welcome to LeadsReserve! We're excited to have you on board and ready to send you high-quality commercial leads.</p>
      
      <h3>What happens next:</h3>
      <div class="feature">✅ We'll start sending leads to your portal within 24-48 hours</div>
      <div class="feature">📱 You'll receive instant notifications via SMS and email</div>
      <div class="feature">💳 Billing happens automatically each week for leads delivered</div>
      <div class="feature">📊 Track your leads and ROI in your dashboard</div>
      
      <center>
        <a href="${loginUrl}" class="button">Access Your Portal</a>
      </center>
      
      <h3>Need Help?</h3>
      <p>Reply to this email or call us anytime. We're here to make sure you get the most value from every lead.</p>
      
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} LeadsReserve. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  return await sendEmail({
    to: contractorEmail,
    subject: 'Welcome to LeadsReserve - Your Account is Ready',
    html,
  });
}

/**
 * Send weekly invoice email
 */
export async function emailInvoice(
  contractorEmail: string,
  contractorName: string,
  invoice: {
    id: string;
    totalLeads: number;
    amount: number;
    periodStart: Date;
    periodEnd: Date;
  }
): Promise<{ success: boolean; error?: string }> {
  const portalUrl = process.env.NEXT_PUBLIC_PORTAL_URL || 'https://portal.leadsreserve.com';
  const invoiceUrl = `${portalUrl}/portal/billing/invoices/${invoice.id}`;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1A365D; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #fff; border: 1px solid #e0e0e0; border-top: none; padding: 30px; }
    .invoice-box { background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .amount { font-size: 32px; font-weight: bold; color: #1A365D; }
    .button { display: inline-block; background: #FF6B35; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">Your Weekly Invoice</h1>
    </div>
    
    <div class="content">
      <p>Hi ${contractorName},</p>
      <p>Here's your invoice for leads delivered this week.</p>
      
      <div class="invoice-box">
        <h3>Invoice Summary</h3>
        <p><strong>Period:</strong> ${formatDate(invoice.periodStart)} - ${formatDate(invoice.periodEnd)}</p>
        <p><strong>Leads Delivered:</strong> ${invoice.totalLeads}</p>
        <p><strong>Amount Due:</strong></p>
        <div class="amount">$${invoice.amount.toFixed(2)}</div>
        <p style="margin-top: 20px; color: #666; font-size: 14px;">
          Payment will be automatically charged to your card on file.
        </p>
      </div>
      
      <center>
        <a href="${invoiceUrl}" class="button">View Full Invoice</a>
      </center>
      
      <p style="margin-top: 30px; color: #666; font-size: 14px;">
        Questions about this invoice? Reply to this email or contact support.
      </p>
      
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} LeadsReserve. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  return await sendEmail({
    to: contractorEmail,
    subject: `Your Weekly Invoice - $${invoice.amount.toFixed(2)} for ${invoice.totalLeads} Leads`,
    html,
  });
}

/**
 * Send password reset email
 */
export async function emailPasswordReset(
  email: string,
  resetToken: string
): Promise<{ success: boolean; error?: string }> {
  const resetUrl = `${process.env.NEXT_PUBLIC_PORTAL_URL}/portal/reset-password?token=${resetToken}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1A365D; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #fff; border: 1px solid #e0e0e0; border-top: none; padding: 30px; }
    .button { display: inline-block; background: #FF6B35; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">Reset Your Password</h1>
    </div>
    
    <div class="content">
      <p>We received a request to reset your password for your LeadsReserve account.</p>
      
      <center>
        <a href="${resetUrl}" class="button">Reset Password</a>
      </center>
      
      <div class="warning">
        <strong>⚠️ This link expires in 1 hour</strong><br>
        If you didn't request this, you can safely ignore this email.
      </div>
      
      <p style="font-size: 12px; color: #666;">
        Or copy and paste this link into your browser:<br>
        ${resetUrl}
      </p>
      
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} LeadsReserve. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  return await sendEmail({
    to: email,
    subject: 'Reset Your LeadsReserve Password',
    html,
  });
}
