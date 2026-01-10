# LeadsReserve Platform

**Production-ready B2B lead generation SaaS platform with contractor portal, automated distribution, and full integrations.**

## 🎯 What This Platform Does

- **Multi-service lead capture sites** - Scalable landing pages for each service/location
- **Contractor portal** - Dashboard for contractors to view and manage leads
- **Automated lead distribution** - Smart assignment based on availability, schedule, and capacity
- **GoHighLevel CRM integration** - Automatic contact and opportunity creation
- **Stripe billing** - Automated weekly invoicing and payment processing
- **SMS/Email notifications** - Instant alerts for new leads
- **Full automation** - Minimal manual work required

## 🏗️ Tech Stack

- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Prisma ORM
- **Database:** PostgreSQL (recommended: Supabase)
- **Integrations:** GoHighLevel, Stripe, Twilio, SendGrid
- **Hosting:** Vercel (frontend) + Supabase (database)

## 📁 Project Structure

```
leadsreserve-platform/
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── api/                   # API Routes
│   │   │   ├── public/           # Public APIs (lead capture)
│   │   │   ├── contractor/       # Contractor portal APIs
│   │   │   └── webhooks/         # Integration webhooks
│   │   ├── portal/               # Contractor portal pages
│   │   └── (landing-pages)/      # Lead capture sites
│   ├── components/               # React components
│   ├── lib/                      # Core libraries
│   │   ├── prisma.ts            # Database client
│   │   ├── ghl.ts               # GoHighLevel integration
│   │   ├── stripe.ts            # Stripe billing
│   │   ├── twilio.ts            # SMS notifications
│   │   ├── sendgrid.ts          # Email notifications
│   │   └── distribution.ts      # Lead distribution logic
│   └── types/                    # TypeScript types
├── prisma/
│   └── schema.prisma            # Database schema
├── public/                       # Static assets
└── package.json                 # Dependencies

```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
- PostgreSQL database (Supabase recommended)
- Accounts for:
  - GoHighLevel
  - Stripe
  - Twilio (optional: SMS)
  - SendGrid (optional: Email)

### 1. Clone and Install

```bash
# Clone the repository
cd leadsreserve-platform

# Install dependencies
npm install

# Generate Prisma client
npm run db:generate
```

### 2. Environment Setup

Create `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/leadsreserve"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# GoHighLevel
GHL_API_KEY="your-ghl-api-key"
GHL_LOCATION_ID="your-ghl-location-id"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Twilio (optional)
TWILIO_ACCOUNT_SID="AC..."
TWILIO_AUTH_TOKEN="..."
TWILIO_PHONE_NUMBER="+1234567890"

# SendGrid (optional)
SENDGRID_API_KEY="SG..."
SENDGRID_FROM_EMAIL="leads@leadsreserve.com"
```

### 3. Database Setup

```bash
# Push schema to database
npm run db:push

# Or run migrations (production)
npm run db:migrate

# Open Prisma Studio to view data
npm run db:studio
```

### 4. Seed Initial Data

Create initial services and service areas:

```sql
-- Run in Prisma Studio or psql

-- Create Commercial Roofing service
INSERT INTO services (id, name, slug, base_lead_price, active) 
VALUES (gen_random_uuid(), 'Commercial Roofing', 'commercial-roofing', 300.00, true);

-- Get the service ID (replace with actual UUID from above)
-- Create service areas
INSERT INTO service_areas (id, name, slug, state, service_id, active)
VALUES 
  (gen_random_uuid(), 'Dallas', 'dallas', 'TX', 'YOUR-SERVICE-ID', true),
  (gen_random_uuid(), 'Fort Worth', 'fort-worth', 'TX', 'YOUR-SERVICE-ID', true),
  (gen_random_uuid(), 'Plano', 'plano', 'TX', 'YOUR-SERVICE-ID', true);
```

### 5. Run Development Server

```bash
npm run dev
```

Visit:
- Landing page: http://localhost:3000
- Contractor portal: http://localhost:3000/portal
- API docs: http://localhost:3000/api

## 📡 API Endpoints

### Public APIs

**Create Lead**
```bash
POST /api/public/leads/create

{
  "name": "John Smith",
  "companyName": "ABC Manufacturing",
  "email": "john@example.com",
  "phone": "555-123-4567",
  "city": "Dallas",
  "serviceId": "uuid-here",
  "serviceAreaId": "uuid-here",
  "serviceType": "Roof Repair",
  "projectTimeline": "ASAP",
  "projectDetails": "Leak in northwest corner..."
}
```

### Contractor APIs

**Login**
```bash
POST /api/contractor/auth/login

{
  "email": "contractor@example.com",
  "password": "password"
}
```

**Get Leads**
```bash
GET /api/contractor/leads?status=new&limit=20
Authorization: Bearer {token}
```

**Update Lead Status**
```bash
POST /api/contractor/leads/{id}/update

{
  "status": "contacted",
  "feedback": "Called customer, project scheduled"
}
```

## 🔄 Lead Distribution Flow

```
1. Lead submits form
   ↓
2. API validates data
   ↓
3. Create in PostgreSQL
   ↓
4. Calculate quality score (1-10)
   ↓
5. Create contact in GoHighLevel
   ↓
6. Find available contractors
   - Match service area
   - Check monthly limit
   - Check schedule
   - Sort by priority
   ↓
7. Assign to contractor
   ↓
8. Send notifications
   - SMS to contractor
   - Email to contractor
   - SMS confirmation to lead
   ↓
9. Create opportunity in GHL
```

## 💰 Billing Automation

**Weekly Billing Cron Job (runs every Sunday):**

```
1. Query all leads delivered this week
2. Group by contractor
3. Calculate total: leads × lead_price
4. Create invoice record
5. Charge via Stripe
6. Send invoice email
7. If payment fails → Retry 3x → Pause lead delivery
```

**Set up cron job:**

```bash
# Using Vercel Cron (vercel.json)
{
  "crons": [{
    "path": "/api/cron/weekly-billing",
    "schedule": "0 0 * * 0"
  }]
}

# Or external cron service (cron-job.org, EasyCron)
# Call: https://yourdomain.com/api/cron/weekly-billing
```

## 🔧 Configuration

### Multi-Domain Setup

To serve different landing pages per service:

**1. Add domain mapping:**

Edit `src/lib/domains.ts`:

```typescript
export const domainMap = {
  'commercialroofingdfw.com': {
    service: 'commercial-roofing',
    area: 'dfw'
  },
  'dallashvacleads.com': {
    service: 'hvac',
    area: 'dallas'
  },
  // Add more as you scale
};
```

**2. Configure DNS:**

Point each domain to your Vercel deployment:
- CNAME: yourapp.vercel.app

**3. Add domains in Vercel:**

```bash
vercel domains add commercialroofingdfw.com
vercel domains add dallashvacleads.com
```

### Contractor Distribution Rules

**Priority-based routing:**

```sql
-- Contractor A gets leads first (priority 10)
INSERT INTO distribution_rules (contractor_id, service_area_id, priority)
VALUES ('contractor-a-id', 'dallas-id', 10);

-- Contractor B gets leads if A is unavailable (priority 5)
INSERT INTO distribution_rules (contractor_id, service_area_id, priority)
VALUES ('contractor-b-id', 'dallas-id', 5);
```

**Schedule-based routing:**

```sql
-- Contractor only wants leads Mon-Fri 9am-5pm
UPDATE distribution_rules 
SET schedule_json = '{
  "monday": "9-17",
  "tuesday": "9-17",
  "wednesday": "9-17",
  "thursday": "9-17",
  "friday": "9-17"
}'
WHERE contractor_id = 'contractor-id';
```

## 🧪 Testing

### Test Lead Submission

```bash
curl -X POST http://localhost:3000/api/public/leads/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Lead",
    "phone": "555-123-4567",
    "serviceId": "your-service-id",
    "serviceType": "Roof Repair"
  }'
```

### Test Distribution

```bash
# Check distribution logs
tail -f logs/distribution.log

# Manually trigger distribution
npm run distribute-leads
```

## 📊 Monitoring

### Database Queries

```sql
-- Daily lead stats
SELECT 
  DATE(created_at) as date,
  COUNT(*) as leads,
  COUNT(contractor_id) as assigned,
  AVG(quality_score) as avg_quality
FROM leads
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Contractor performance
SELECT 
  c.company_name,
  COUNT(l.id) as total_leads,
  COUNT(CASE WHEN l.status = 'won' THEN 1 END) as won,
  ROUND(COUNT(CASE WHEN l.status = 'won' THEN 1 END)::numeric / COUNT(l.id) * 100, 2) as win_rate
FROM contractors c
LEFT JOIN leads l ON l.contractor_id = c.id
WHERE l.created_at >= NOW() - INTERVAL '30 days'
GROUP BY c.id, c.company_name
ORDER BY total_leads DESC;
```

### Error Tracking

**Recommended: Sentry.io**

```bash
npm install @sentry/nextjs

# Add to next.config.js
const { withSentryConfig } = require('@sentry/nextjs');
```

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Set environment variables
vercel env add DATABASE_URL
vercel env add GHL_API_KEY
# ... etc
```

### Docker (Alternative)

```bash
# Build image
docker build -t leadsreserve .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL="..." \
  -e GHL_API_KEY="..." \
  leadsreserve
```

## 📈 Scaling Strategy

### Phase 1: MVP (0-100 leads/month)
- Single service (Commercial Roofing)
- Single market (DFW)
- 3-5 contractors
- **Cost:** ~$50/month

### Phase 2: Growth (100-500 leads/month)
- 2-3 services (add HVAC, Landscaping)
- Single market (DFW)
- 10-15 contractors
- **Cost:** ~$200/month

### Phase 3: Scale (500-2000 leads/month)
- 3+ services
- 2-3 markets (DFW, Houston, Austin)
- 30-50 contractors
- **Cost:** ~$500/month

### Phase 4: Enterprise (2000+ leads/month)
- All services
- National coverage
- 100+ contractors
- **Cost:** ~$1500/month

## 🔐 Security Checklist

- [ ] Environment variables secured
- [ ] Database backups enabled
- [ ] API rate limiting configured
- [ ] CORS properly configured
- [ ] Webhook signature verification
- [ ] SQL injection protection (Prisma)
- [ ] Input validation (Zod)
- [ ] HTTPS enforced
- [ ] Password hashing (bcrypt)
- [ ] JWT token expiration

## 📝 License

Proprietary - All rights reserved

## 🤝 Support

For issues or questions:
- Email: support@leadsreserve.com
- Docs: https://docs.leadsreserve.com

---

Built with ❤️ for B2B lead generation
