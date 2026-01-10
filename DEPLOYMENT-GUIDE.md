# LEADSRESERVE - PRODUCTION DEPLOYMENT GUIDE

## 🎯 Overview

This guide walks you through deploying the LeadsReserve platform to production.

**Estimated Time:** 2-3 hours  
**Cost:** $0-50/month (depending on scale)  
**Difficulty:** Intermediate

---

## PHASE 1: PREREQUISITES (30 minutes)

### 1.1 Create Accounts

**Required:**
- ✅ [Vercel](https://vercel.com) - Frontend hosting (FREE)
- ✅ [Supabase](https://supabase.com) - PostgreSQL database (FREE tier: 500MB)
- ✅ [Stripe](https://stripe.com) - Payment processing (FREE, pay-per-transaction)
- ✅ [GoHighLevel](https://gohighlevel.com) - CRM integration (starts $97/month)

**Optional (Highly Recommended):**
- 📧 [SendGrid](https://sendgrid.com) - Email (FREE: 100/day)
- 📱 [Twilio](https://twilio.com) - SMS ($10/month for phone number)
- 🔍 [Sentry](https://sentry.io) - Error tracking (FREE: 5K errors/month)

### 1.2 Domain Setup

**Purchase Domains:**
```
Primary: commercialroofingdfw.com ($12/year)
Portal: portal.leadsreserve.com (subdomain, FREE)
```

**Where to Buy:**
- Namecheap (recommended)
- GoDaddy
- Google Domains

---

## PHASE 2: DATABASE SETUP (20 minutes)

### 2.1 Create Supabase Project

1. Go to https://supabase.com
2. Click "New Project"
3. Settings:
   ```
   Name: leadsreserve-production
   Database Password: [Generate strong password]
   Region: US East (closest to customers)
   Plan: Free (upgrade later)
   ```

### 2.2 Get Connection String

1. Go to Project Settings → Database
2. Copy "Connection String" (URI format)
3. Replace `[YOUR-PASSWORD]` with your actual password

Example:
```
postgresql://postgres:[YOUR-PASSWORD]@db.abcdefghijklmn.supabase.co:5432/postgres
```

### 2.3 Configure Database

**Enable Extensions:**

Go to Database → Extensions, enable:
- `uuid-ossp` (for UUIDs)
- `pg_trgm` (for text search)

---

## PHASE 3: CODE DEPLOYMENT (30 minutes)

### 3.1 Prepare Code

```bash
# Navigate to project
cd leadsreserve-platform

# Install dependencies
npm install

# Verify everything works locally
npm run dev
```

### 3.2 Push to GitHub (or GitLab)

```bash
# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - LeadsReserve platform"

# Create GitHub repo, then:
git remote add origin https://github.com/yourusername/leadsreserve.git
git branch -M main
git push -u origin main
```

### 3.3 Deploy to Vercel

**Option A: Vercel Dashboard (Easiest)**

1. Go to https://vercel.com/dashboard
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure:
   ```
   Framework Preset: Next.js
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm install
   ```
5. Click "Deploy"

**Option B: Vercel CLI**

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Follow prompts
```

### 3.4 Add Environment Variables in Vercel

Go to Project Settings → Environment Variables, add:

```env
# Database
DATABASE_URL = postgresql://postgres:[password]@db.xyz.supabase.co:5432/postgres

# App
NEXT_PUBLIC_APP_URL = https://your-app.vercel.app
NEXTAUTH_URL = https://your-app.vercel.app
NEXTAUTH_SECRET = [generate with: openssl rand -base64 32]

# JWT
JWT_SECRET = [generate with: openssl rand -base64 32]
```

Save and redeploy.

---

## PHASE 4: DATABASE SCHEMA (15 minutes)

### 4.1 Push Database Schema

**Option A: From Local Machine**

```bash
# Set DATABASE_URL in .env
DATABASE_URL="postgresql://postgres:[password]@db.xyz.supabase.co:5432/postgres"

# Push schema
npm run db:push

# Or run migrations
npm run db:migrate
```

**Option B: From Vercel Terminal**

```bash
# Go to Vercel Dashboard → Deployments → [Latest] → View Function Logs
# Or use Vercel CLI:
vercel env pull .env.local
npm run db:push
```

### 4.2 Seed Initial Data

Open Supabase SQL Editor and run:

```sql
-- Create Commercial Roofing service
INSERT INTO services (id, name, slug, base_lead_price, active, meta_title, hero_title) 
VALUES (
  gen_random_uuid(), 
  'Commercial Roofing', 
  'commercial-roofing', 
  300.00, 
  true,
  'Commercial Roofing DFW - Get Free Quotes',
  'Get Qualified Commercial Roofing Quotes in DFW'
);

-- Get the service ID from above query result
-- Replace 'SERVICE-ID-HERE' below with actual UUID

-- Create service areas
INSERT INTO service_areas (id, name, slug, state, service_id, active)
VALUES 
  (gen_random_uuid(), 'Dallas', 'dallas', 'TX', 'SERVICE-ID-HERE', true),
  (gen_random_uuid(), 'Fort Worth', 'fort-worth', 'TX', 'SERVICE-ID-HERE', true),
  (gen_random_uuid(), 'Plano', 'plano', 'TX', 'SERVICE-ID-HERE', true),
  (gen_random_uuid(), 'Arlington', 'arlington', 'TX', 'SERVICE-ID-HERE', true),
  (gen_random_uuid(), 'Irving', 'irving', 'TX', 'SERVICE-ID-HERE', true);
```

---

## PHASE 5: INTEGRATIONS (45 minutes)

### 5.1 GoHighLevel Setup

**Get API Key:**

1. Login to GoHighLevel
2. Settings → Integrations → API Key
3. Click "Create API Key"
4. Copy the key

**Get Location ID:**

1. Settings → Company
2. Copy "Location ID"

**Configure Pipeline:**

1. Opportunities → Pipelines
2. Create pipeline: "Commercial Roofing Leads"
3. Copy Pipeline ID and Stage ID

**Add to Vercel Environment Variables:**

```env
GHL_API_KEY = eyJhbGciOiJIUz...
GHL_LOCATION_ID = abc123xyz
GHL_PIPELINE_ID = pipeline_id_here
GHL_PIPELINE_STAGE_ID = stage_id_here
GHL_API_URL = https://rest.gohighlevel.com/v1
ENABLE_GHL_SYNC = true
```

### 5.2 Stripe Setup

**Get API Keys:**

1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy "Secret key" (starts with `sk_test_`)
3. Copy "Publishable key" (starts with `pk_test_`)

**Setup Webhook:**

1. Developers → Webhooks → Add endpoint
2. Endpoint URL: `https://your-app.vercel.app/api/webhooks/stripe`
3. Events to listen: 
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `invoice.paid`
   - `invoice.payment_failed`
4. Copy "Signing secret" (starts with `whsec_`)

**Add to Vercel Environment Variables:**

```env
STRIPE_SECRET_KEY = sk_test_...
STRIPE_PUBLISHABLE_KEY = pk_test_...
STRIPE_WEBHOOK_SECRET = whsec_...
```

**Switch to Live Mode (when ready):**

1. Get LIVE API keys (same process, use "Live" not "Test")
2. Replace environment variables
3. Redeploy

### 5.3 Twilio Setup (SMS)

**Get Credentials:**

1. Go to https://console.twilio.com
2. Get Account SID and Auth Token
3. Buy a phone number ($1/month + usage)

**Add to Vercel Environment Variables:**

```env
TWILIO_ACCOUNT_SID = AC...
TWILIO_AUTH_TOKEN = your_auth_token
TWILIO_PHONE_NUMBER = +12145551234
ENABLE_SMS_NOTIFICATIONS = true
```

### 5.4 SendGrid Setup (Email)

**Get API Key:**

1. Go to https://app.sendgrid.com/settings/api_keys
2. Create API Key → Full Access
3. Copy key (starts with `SG.`)

**Verify Sender:**

1. Settings → Sender Authentication
2. Verify your domain OR single sender email
3. Follow DNS verification steps

**Add to Vercel Environment Variables:**

```env
SENDGRID_API_KEY = SG.abc...
SENDGRID_FROM_EMAIL = leads@leadsreserve.com
SENDGRID_FROM_NAME = LeadsReserve
ENABLE_EMAIL_NOTIFICATIONS = true
```

---

## PHASE 6: DOMAIN CONFIGURATION (20 minutes)

### 6.1 Add Domain to Vercel

1. Vercel Dashboard → Project → Settings → Domains
2. Add domain: `commercialroofingdfw.com`
3. Add domain: `portal.leadsreserve.com` (if different)

### 6.2 Configure DNS

**At your domain registrar (Namecheap, GoDaddy, etc.):**

For `commercialroofingdfw.com`:
```
Type: CNAME
Name: @
Value: cname.vercel-dns.com
```

For `www.commercialroofingdfw.com`:
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

**Wait for DNS propagation (5-30 minutes)**

Check status: https://dnschecker.org

### 6.3 Force HTTPS

Vercel automatically enables HTTPS. Verify:
1. Visit your domain
2. Check for 🔒 in browser
3. Confirm redirects from HTTP → HTTPS

---

## PHASE 7: TESTING (30 minutes)

### 7.1 Test Lead Submission

```bash
curl -X POST https://commercialroofingdfw.com/api/public/leads/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Lead",
    "phone": "555-123-4567",
    "email": "test@example.com",
    "serviceId": "YOUR-SERVICE-ID",
    "serviceType": "Roof Repair",
    "projectDetails": "Test submission"
  }'
```

**Verify:**
- ✅ Lead appears in Supabase database
- ✅ Contact created in GoHighLevel
- ✅ Email sent (if enabled)
- ✅ SMS sent (if enabled)

### 7.2 Create Test Contractor

**In Supabase SQL Editor:**

```sql
-- Create test contractor (password: "password123")
INSERT INTO contractors (
  id,
  company_name,
  contact_name,
  email,
  phone,
  service_id,
  service_area_ids,
  lead_price,
  password_hash,
  active,
  verified
) VALUES (
  gen_random_uuid(),
  'Test Roofing Co',
  'John Doe',
  'contractor@test.com',
  '555-987-6543',
  'YOUR-SERVICE-ID',
  ARRAY['DALLAS-AREA-ID', 'FORTWORTH-AREA-ID'],
  300.00,
  '$2a$10$YourHashedPasswordHere', -- Use bcrypt to hash "password123"
  true,
  true
);

-- Create distribution rule
INSERT INTO distribution_rules (
  id,
  contractor_id,
  service_area_id,
  priority,
  active
) VALUES (
  gen_random_uuid(),
  'CONTRACTOR-ID-FROM-ABOVE',
  'DALLAS-AREA-ID',
  10,
  true
);
```

**Test contractor login:**

1. Go to https://portal.leadsreserve.com/portal/login
2. Email: contractor@test.com
3. Password: password123
4. Verify dashboard loads

### 7.3 Test Lead Distribution

1. Submit another test lead (see 7.1)
2. Check contractor portal - lead should appear
3. Check contractor email/SMS for notification
4. Verify in Supabase that lead.contractor_id is set

---

## PHASE 8: MONITORING (20 minutes)

### 8.1 Setup Error Tracking (Sentry)

```bash
npm install @sentry/nextjs

# Initialize
npx @sentry/wizard -i nextjs

# Add DSN to Vercel env vars
SENTRY_DSN = https://abc123@sentry.io/123456
```

### 8.2 Enable Vercel Analytics

1. Project → Analytics → Enable
2. View real-time traffic data

### 8.3 Database Monitoring

**Supabase Dashboard:**
- Database → Logs (view queries)
- Database → Performance (slow queries)

**Setup Alerts:**
```sql
-- Create weekly stats view
CREATE OR REPLACE VIEW weekly_stats AS
SELECT 
  COUNT(*) as total_leads,
  COUNT(contractor_id) as assigned_leads,
  AVG(quality_score) as avg_quality
FROM leads
WHERE created_at >= NOW() - INTERVAL '7 days';
```

---

## PHASE 9: AUTOMATION (30 minutes)

### 9.1 Setup Cron Jobs (Vercel)

Create `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/weekly-billing",
      "schedule": "0 0 * * 0"
    },
    {
      "path": "/api/cron/distribute-leads",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

Deploy:
```bash
git add vercel.json
git commit -m "Add cron jobs"
git push
```

### 9.2 Test Cron Jobs

**Manually trigger:**

```bash
curl https://your-app.vercel.app/api/cron/weekly-billing
curl https://your-app.vercel.app/api/cron/distribute-leads
```

**Monitor in Vercel:**

Dashboard → Cron Jobs → View Logs

---

## PHASE 10: GOOGLE ADS INTEGRATION (30 minutes)

### 10.1 Setup Conversion Tracking

**In Google Ads:**

1. Tools → Conversions → New Conversion Action
2. Website → Manual code installation
3. Copy Conversion ID and Label

**Add to landing page:**

```html
<!-- Google Ads Conversion Tracking -->
<script async src="https://www.googletagmanager.com/gtag/js?id=AW-XXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'AW-XXXXXXXXX');
</script>
```

**Track form submissions:**

```javascript
// On successful lead submission
gtag('event', 'conversion', {
  'send_to': 'AW-XXXXXXXXX/CONVERSION-LABEL',
  'value': 300.00,
  'currency': 'USD'
});
```

### 10.2 Launch Google Ads

Use campaign structure from previous guide:
- Budget: $33/day ($1,000/month)
- 5 ad groups
- ~50 keywords
- Set up call tracking

---

## POST-LAUNCH CHECKLIST

### Immediate (First 24 Hours)

- [ ] Submit test lead and verify end-to-end flow
- [ ] Verify contractor receives notifications
- [ ] Check GHL contact creation
- [ ] Monitor error logs (Sentry)
- [ ] Test all API endpoints
- [ ] Verify SSL certificate active

### First Week

- [ ] Sign up first 2-3 contractors
- [ ] Generate first real leads
- [ ] Monitor lead distribution
- [ ] Check billing calculations
- [ ] Review conversion rates
- [ ] Optimize ad copy

### First Month

- [ ] Process first weekly billing
- [ ] Verify Stripe payments
- [ ] Review contractor feedback
- [ ] Analyze lead quality scores
- [ ] Scale Google Ads budget
- [ ] Add more contractors

---

## TROUBLESHOOTING

### "Database connection failed"

```bash
# Check DATABASE_URL is correct
echo $DATABASE_URL

# Test connection
npm run db:studio

# Verify IP allowlist (Supabase)
# Settings → Database → Connection pooling
```

### "Lead not distributing"

```sql
-- Check for contractors
SELECT * FROM contractors WHERE active = true;

-- Check distribution rules
SELECT * FROM distribution_rules WHERE active = true;

-- Check lead status
SELECT id, status, contractor_id FROM leads ORDER BY created_at DESC LIMIT 10;
```

### "Webhook not working"

```bash
# Test Stripe webhook
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Check webhook secret matches
echo $STRIPE_WEBHOOK_SECRET

# View webhook logs in Stripe dashboard
```

### "Emails not sending"

```bash
# Verify SendGrid API key
curl -X GET "https://api.sendgrid.com/v3/scopes" \
  -H "Authorization: Bearer $SENDGRID_API_KEY"

# Check sender verification
# Settings → Sender Authentication
```

---

## MAINTENANCE

### Daily

- Check error logs (Sentry)
- Monitor lead volume
- Review contractor responses

### Weekly

- Verify billing ran successfully
- Review lead quality scores
- Check payment success rate
- Analyze Google Ads performance

### Monthly

- Review contractor churn
- Optimize distribution rules
- Update pricing if needed
- Plan feature additions

---

## SCALING CHECKLIST

### Add New Service (HVAC, Landscaping)

1. Create service in database
2. Create service areas
3. Clone landing page template
4. Setup new domain
5. Add to Google Ads
6. Recruit contractors

### Add New Market (Houston, Austin)

1. Create service areas for new city
2. Update distribution rules
3. Create location-specific ad groups
4. Recruit local contractors

### Upgrade Infrastructure

**At 500 leads/month:**
- Upgrade Supabase to Pro ($25/mo)
- Add Redis caching
- Enable database read replicas

**At 2000 leads/month:**
- Move to dedicated database
- Add load balancer
- Scale to multiple regions

---

## 🎉 YOU'RE LIVE!

Your LeadsReserve platform is now running in production!

**Next Steps:**
1. Launch Google Ads campaign
2. Sign up first contractors
3. Generate leads
4. Scale!

**Need Help?**
- Documentation: README.md
- Support: support@leadsreserve.com

---

**Congratulations on your launch! 🚀**
