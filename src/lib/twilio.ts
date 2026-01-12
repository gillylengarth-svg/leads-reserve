import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

if (!accountSid || !authToken || !fromNumber) {
  console.warn('Twilio credentials not configured');
}

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

/**
 * Send SMS notification
 */
export async function sendSMS(
  to: string,
  message: string
): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  if (!client) {
    console.error('Twilio client not initialized');
    return {
      success: false,
      error: 'SMS service not configured',
    };
  }

  try {
    // Format phone number
    const formattedPhone = formatPhoneNumber(to);

    const result = await client.messages.create({
      body: message,
      from: fromNumber,
      to: formattedPhone,
    });

    return {
      success: true,
      messageId: result.sid,
    };
  } catch (error: any) {
    console.error('Twilio SMS Error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Send new lead notification to contractor
 */
export async function notifyContractorNewLead(
  contractorPhone: string,
  leadName: string,
  leadPhone: string,
  serviceType: string
): Promise<{ success: boolean; error?: string }> {
  const message = `🔔 New Lead Alert!

Name: ${leadName}
Service: ${serviceType}
Phone: ${leadPhone}

View details at: ${process.env.NEXT_PUBLIC_PORTAL_URL}/portal/leads

- LeadsReserve`;

  return await sendSMS(contractorPhone, message);
}

/**
 * Send lead confirmation to lead
 */
export async function notifyLeadReceived(
  leadPhone: string,
  leadName: string,
  serviceType: string
): Promise<{ success: boolean; error?: string }> {
  const message = `Hi ${leadName}! We received your ${serviceType} request. A qualified contractor will contact you within 24 hours. Thank you!`;

  return await sendSMS(leadPhone, message);
}

/**
 * Validate phone number
 */
export async function validatePhoneNumber(
  phoneNumber: string
): Promise<{
  valid: boolean;
  formatted?: string;
  type?: string;
  carrier?: string;
  error?: string;
}> {
  if (!client) {
    return {
      valid: false,
      error: 'Phone validation service not configured',
    };
  }

  try {
    const lookup = await client.lookups.v1
      .phoneNumbers(phoneNumber)
      .fetch({ type: ['carrier'] });

    return {
      valid: true,
      formatted: lookup.phoneNumber,
      type: lookup.carrier?.type,
      carrier: lookup.carrier?.name,
    };
  } catch (error: any) {
    console.error('Phone Validation Error:', error);
    return {
      valid: false,
      error: error.message,
    };
  }
}

/**
 * Format phone number to E.164 format
 */
function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // If it doesn't start with country code, assume US (+1)
  if (digits.length === 10) {
    return `+1${digits}`;
  }

  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }

  // Already has country code
  if (digits.startsWith('1')) {
    return `+${digits}`;
  }

  return `+${digits}`;
}

/**
 * Send bulk SMS (for announcements)
 */
export async function sendBulkSMS(
  recipients: string[],
  message: string
): Promise<{
  success: boolean;
  sent: number;
  failed: number;
  errors: string[];
}> {
  if (!client) {
    return {
      success: false,
      sent: 0,
      failed: recipients.length,
      errors: ['SMS service not configured'],
    };
  }

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const recipient of recipients) {
    const result = await sendSMS(recipient, message);
    if (result.success) {
      sent++;
    } else {
      failed++;
      errors.push(`${recipient}: ${result.error}`);
    }

    // Rate limiting: Wait 100ms between messages
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return {
    success: sent > 0,
    sent,
    failed,
    errors,
  };
}
