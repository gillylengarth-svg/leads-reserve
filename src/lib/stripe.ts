import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  typescript: true,
});

/**
 * Create or retrieve Stripe customer
 */
export async function getOrCreateStripeCustomer(
  email: string,
  name: string,
  metadata?: Record<string, string>
): Promise<Stripe.Customer> {
  // Check if customer already exists
  const existing = await stripe.customers.list({
    email,
    limit: 1,
  });

  if (existing.data.length > 0) {
    return existing.data[0];
  }

  // Create new customer
  return await stripe.customers.create({
    email,
    name,
    metadata: metadata || {},
  });
}

/**
 * Attach payment method to customer
 */
export async function attachPaymentMethod(
  customerId: string,
  paymentMethodId: string
): Promise<Stripe.PaymentMethod> {
  const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
    customer: customerId,
  });

  // Set as default payment method
  await stripe.customers.update(customerId, {
    invoice_settings: {
      default_payment_method: paymentMethodId,
    },
  });

  return paymentMethod;
}

/**
 * Create invoice for leads
 */
export async function createInvoice(
  customerId: string,
  items: Array<{ description: string; amount: number }>,
  metadata?: Record<string, string>
): Promise<Stripe.Invoice> {
  // Add line items
  for (const item of items) {
    await stripe.invoiceItems.create({
      customer: customerId,
      amount: Math.round(item.amount * 100), // Convert to cents
      currency: 'usd',
      description: item.description,
    });
  }

  // Create and finalize invoice
  const invoice = await stripe.invoices.create({
    customer: customerId,
    auto_advance: true, // Auto-finalize
    collection_method: 'charge_automatically',
    metadata: metadata || {},
  });

  return await stripe.invoices.finalizeInvoice(invoice.id);
}

/**
 * Charge customer immediately
 */
export async function chargeCustomer(
  customerId: string,
  amount: number,
  description: string,
  metadata?: Record<string, string>
): Promise<Stripe.PaymentIntent> {
  return await stripe.paymentIntents.create({
    customer: customerId,
    amount: Math.round(amount * 100), // Convert to cents
    currency: 'usd',
    description,
    metadata: metadata || {},
    confirm: true,
    automatic_payment_methods: {
      enabled: true,
      allow_redirects: 'never',
    },
  });
}

/**
 * Get customer's payment methods
 */
export async function getPaymentMethods(
  customerId: string
): Promise<Stripe.PaymentMethod[]> {
  const paymentMethods = await stripe.paymentMethods.list({
    customer: customerId,
    type: 'card',
  });

  return paymentMethods.data;
}

/**
 * Process weekly billing for all leads
 */
export async function processWeeklyBilling(
  contractorId: string,
  leads: Array<{ id: string; description: string; amount: number }>,
  stripeCustomerId: string
): Promise<{
  success: boolean;
  invoiceId?: string;
  error?: string;
}> {
  try {
    const invoice = await createInvoice(
      stripeCustomerId,
      leads.map(lead => ({
        description: lead.description,
        amount: lead.amount,
      })),
      {
        contractorId,
        leadCount: leads.length.toString(),
        billingPeriod: 'weekly',
      }
    );

    return {
      success: true,
      invoiceId: invoice.id,
    };
  } catch (error: any) {
    console.error('Weekly Billing Error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Refund a charge
 */
export async function refundCharge(
  chargeId: string,
  amount?: number,
  reason?: string
): Promise<Stripe.Refund> {
  return await stripe.refunds.create({
    charge: chargeId,
    amount: amount ? Math.round(amount * 100) : undefined,
    reason: reason as any || 'requested_by_customer',
  });
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(payload, signature, secret);
}
