import { prisma } from './prisma';
import { ghlClient } from './ghl';
import { sendSMS, notifyContractorNewLead } from './twilio';
import { emailContractorNewLead } from './sendgrid';

interface LeadData {
  id: string;
  name: string;
  companyName?: string;
  email?: string;
  phone: string;
  serviceId: string;
  serviceAreaId?: string;
  serviceType?: string;
  projectDetails?: string;
  city?: string;
}

interface DistributionResult {
  success: boolean;
  contractor?: {
    id: string;
    companyName: string;
    email: string;
    phone?: string;
  };
  reason: string;
  error?: string;
}

/**
 * Main lead distribution function
 * This is the core automation that assigns leads to contractors
 */
export async function distributeLeadToContractor(
  leadId: string
): Promise<DistributionResult> {
  try {
    // Get the lead
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        service: true,
        serviceArea: true,
      },
    });

    if (!lead) {
      return {
        success: false,
        reason: 'Lead not found',
      };
    }

    if (lead.contractorId) {
      return {
        success: false,
        reason: 'Lead already assigned',
      };
    }

    // Find available contractors
    const availableContractors = await findAvailableContractors(
      lead.serviceId,
      lead.serviceAreaId || ''
    );

    if (availableContractors.length === 0) {
      await logActivity(leadId, 'distribution_failed', 'No available contractors', {
        serviceId: lead.serviceId,
        serviceAreaId: lead.serviceAreaId,
      });

      return {
        success: false,
        reason: 'No contractors available for this service area',
      };
    }

    // Select contractor (highest priority)
    const selectedContractor = availableContractors[0];

    // Assign lead
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        contractorId: selectedContractor.id,
        assignedAt: new Date(),
        status: 'assigned',
      },
    });

    // Log activity
    await logActivity(leadId, 'lead_assigned', `Lead assigned to ${selectedContractor.companyName}`, {
      contractorId: selectedContractor.id,
      contractorName: selectedContractor.companyName,
    });

    // Send notifications (don't wait for these)
    notifyContractor(selectedContractor, lead).catch(err => {
      console.error('Error sending contractor notification:', err);
    });

    // Create opportunity in GoHighLevel (don't wait)
    if (lead.ghlContactId) {
      createGHLOpportunity(lead, selectedContractor).catch(err => {
        console.error('Error creating GHL opportunity:', err);
      });
    }

    return {
      success: true,
      contractor: {
        id: selectedContractor.id,
        companyName: selectedContractor.companyName,
        email: selectedContractor.email,
        phone: selectedContractor.phone || undefined,
      },
      reason: 'Lead successfully assigned',
    };
  } catch (error: any) {
    console.error('Lead distribution error:', error);
    return {
      success: false,
      reason: 'Distribution error',
      error: error.message,
    };
  }
}

/**
 * Find available contractors for service area
 */
async function findAvailableContractors(
  serviceId: string,
  serviceAreaId: string
) {
  // Get contractors who serve this area
  const contractors = await prisma.contractor.findMany({
    where: {
      serviceId,
      active: true,
      verified: true,
      serviceAreaIds: {
        has: serviceAreaId,
      },
    },
    include: {
      distributionRules: {
        where: {
          serviceAreaId,
          active: true,
        },
      },
    },
  });

  if (contractors.length === 0) {
    return [];
  }

  // Filter by schedule and monthly limits
  const now = new Date();
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'lowercase' });
  const currentHour = now.getHours();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const availableContractors = [];

  for (const contractor of contractors) {
    // Check monthly limit
    if (contractor.maxLeadsPerMonth) {
      const leadsThisMonth = await prisma.lead.count({
        where: {
          contractorId: contractor.id,
          createdAt: {
            gte: new Date(`${currentMonth}-01`),
          },
        },
      });

      if (leadsThisMonth >= contractor.maxLeadsPerMonth) {
        continue; // Skip this contractor
      }
    }

    // Check schedule
    const rule = contractor.distributionRules[0];
    if (rule && rule.scheduleJson) {
      const schedule = rule.scheduleJson as any;
      if (schedule[currentDay]) {
        const [start, end] = schedule[currentDay].split('-').map(Number);
        if (currentHour < start || currentHour >= end) {
          continue; // Outside schedule
        }
      }
    }

    availableContractors.push({
      ...contractor,
      priority: rule?.priority || 0,
    });
  }

  // Sort by priority (highest first)
  availableContractors.sort((a, b) => b.priority - a.priority);

  return availableContractors;
}

/**
 * Send notifications to contractor
 */
async function notifyContractor(
  contractor: any,
  lead: any
) {
  const leadData = {
    id: lead.id,
    name: lead.name,
    companyName: lead.companyName,
    phone: lead.phone,
    email: lead.email,
    serviceType: lead.serviceType,
    projectDetails: lead.projectDetails,
    city: lead.city,
  };

  // Send SMS if enabled
  if (contractor.notifySms && contractor.phone) {
    await notifyContractorNewLead(
      contractor.phone,
      lead.name,
      lead.phone,
      lead.serviceType || 'Service Request'
    );
  }

  // Send email if enabled
  if (contractor.notifyEmail) {
    await emailContractorNewLead(
      contractor.email,
      contractor.contactName,
      leadData
    );
  }

  // Webhook if configured
  if (contractor.webhookUrl) {
    await sendWebhook(contractor.webhookUrl, {
      event: 'lead.assigned',
      lead: leadData,
      contractor: {
        id: contractor.id,
        companyName: contractor.companyName,
      },
    }, contractor.webhookSecret);
  }
}

/**
 * Create opportunity in GoHighLevel
 */
async function createGHLOpportunity(lead: any, contractor: any) {
  if (!lead.ghlContactId) return;

  const result = await ghlClient.createOpportunity({
    contactId: lead.ghlContactId,
    pipelineId: process.env.GHL_PIPELINE_ID || '',
    pipelineStageId: process.env.GHL_PIPELINE_STAGE_ID || '',
    name: `${lead.name} - ${lead.serviceType || 'Service'}`,
    monetaryValue: parseFloat(contractor.leadPrice.toString()),
  });

  if (result.success && result.opportunityId) {
    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        ghlOpportunityId: result.opportunityId,
      },
    });
  }
}

/**
 * Send webhook to contractor's endpoint
 */
async function sendWebhook(
  url: string,
  payload: any,
  secret?: string
) {
  try {
    const headers: any = {
      'Content-Type': 'application/json',
    };

    if (secret) {
      // Add HMAC signature
      const crypto = require('crypto');
      const signature = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(payload))
        .digest('hex');
      headers['X-Webhook-Signature'] = signature;
    }

    await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error('Webhook send error:', error);
  }
}

/**
 * Log activity
 */
async function logActivity(
  leadId: string,
  type: string,
  description: string,
  metadata?: any
) {
  await prisma.activity.create({
    data: {
      leadId,
      type,
      description,
      metadata: metadata || {},
      actorType: 'system',
    },
  });
}

/**
 * Calculate lead quality score (1-10)
 */
export function calculateQualityScore(lead: {
  name: string;
  companyName?: string;
  email?: string;
  phone: string;
  projectDetails?: string;
  estimatedBudget?: string;
}): number {
  let score = 5; // Base score

  // Has company name = commercial (not residential)
  if (lead.companyName && lead.companyName.length > 2) {
    score += 2;
  }

  // Has email
  if (lead.email && lead.email.includes('@')) {
    score += 1;
  }

  // Detailed project description
  if (lead.projectDetails && lead.projectDetails.length > 50) {
    score += 1;
  }

  // Has budget estimate
  if (lead.estimatedBudget && lead.estimatedBudget !== 'Not sure') {
    score += 1;
  }

  // Cap at 10
  return Math.min(score, 10);
}

/**
 * Batch distribute unassigned leads (cron job)
 */
export async function batchDistributeLeads() {
  const unassignedLeads = await prisma.lead.findMany({
    where: {
      contractorId: null,
      status: 'new',
    },
    take: 100, // Process 100 at a time
  });

  console.log(`Found ${unassignedLeads.length} unassigned leads`);

  for (const lead of unassignedLeads) {
    const result = await distributeLeadToContractor(lead.id);
    console.log(`Lead ${lead.id}: ${result.reason}`);
    
    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}
