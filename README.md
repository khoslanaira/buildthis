# BuildThis 🔍
> Real unsolved startup problems from Reddit, filtered by your tech role. Auto-updated every morning via Vercel Cron.

## Architecture
```
Vercel Cron (7am UTC daily)
  → /api/cron
    → Claude API scans 9 profession-specific subreddits
    → Verifies no existing solution exists
    → Saves to Notion DB
    → Sends daily digest email via Resend to all subscribers
  
User visits buildthis.dev
  → Next.js fetches all problems from Notion
  → Filters by selected profession
  → Shows problems specific to that role
```

## Quick Start (5 min)

```bash
npm install
cp .env.local.example .env.local
# Fill in the 5 env vars below
npm run dev   # → http://localhost:3000
```

## Environment Variables

| Variable | Where to get it | Required |
|---|---|---|
| `NOTION_TOKEN` | notion.so/my-integrations → New integration | ✅ |
| `NOTION_DATABASE_ID` | Already set: `fcdb38712dfd4fb6a0b95e64c66c224b` | ✅ |
| `RESEND_API_KEY` | resend.com → Free account → API Keys | ✅ |
| `DIGEST_FROM_EMAIL` | A verified email/domain on Resend | ✅ |
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys | ✅ (for cron) |
| `CRON_SECRET` | Any random string e.g. `openssl rand -hex 32` | ✅ (for cron) |

### Setting up Resend (free - 3000 emails/mo)
1. Go to resend.com → Sign up free
2. Go to API Keys → Create API key → copy it
3. Go to Domains → Add your domain (or use Resend's test domain for dev)
4. Set `DIGEST_FROM_EMAIL=noreply@yourdomain.com`

### Connecting Notion
1. notion.so/my-integrations → New integration → name it `BuildThis`
2. Copy the Internal Integration Token → set as `NOTION_TOKEN`
3. Open your Reddit Problem Tracker DB in Notion
4. Click `...` → Connections → Add `BuildThis`

## Deploy to Vercel

```bash
# Option 1: Vercel CLI
npm i -g vercel
vercel

# Option 2: GitHub → vercel.com → Import repo
# Then add all env vars in Settings → Environment Variables
```

The `vercel.json` already configures the cron to run at 7am UTC daily.
Vercel will automatically call `/api/cron` every morning — no action needed.

## How the Daily Scan Works

Each profession scans its own subreddits:
- 🤖 AI/LLM → r/MachineLearning, r/LocalLLaMA, r/LangChain
- 🚀 SaaS → r/SaaS, r/indiehackers, r/startups
- 🛠️ Dev Tools → r/programming, r/webdev, r/ExperiencedDevs
- 📋 PM → r/productmanagement, r/UXResearch, r/agile
- ⚙️ Infra → r/devops, r/kubernetes, r/terraform
- 🎨 Frontend → r/Frontend, r/reactjs, r/css
- 📊 Data → r/dataengineering, r/bigquery, r/dbt
- 📱 Mobile → r/iOSProgramming, r/androiddev, r/reactnative
- 🔐 Security → r/netsec, r/cybersecurity, r/sysadmin

Claude verifies each problem: **no existing solution found** before saving.

## Testing the Cron Locally

```bash
# Trigger the cron manually
curl -H "Authorization: Bearer your_cron_secret" \
  http://localhost:3000/api/cron
```

## CV / LinkedIn Description

**BuildThis — AI-Powered Startup Problem Discovery Platform**
- Built a full-stack Next.js platform with Vercel Cron that automatically scans 9 tech-specific Reddit communities every morning using the Claude API
- Implemented per-profession problem filtering across 9 tech roles, each sourced from role-specific subreddits with AI verification of no existing solution
- Integrated Notion API as a live backend, Resend for transactional email, and Next.js ISR for performance
- Built complete newsletter system: subscriber management, welcome emails, and daily digest with per-stack filtering

## File Structure

```
buildthis/
├── app/
│   ├── api/
│   │   ├── cron/route.ts        ← Vercel cron: scans Reddit + sends emails
│   │   ├── problems/route.ts    ← Fetches all problems from Notion
│   │   └── subscribe/route.ts   ← Saves subscriber + sends welcome email
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                 ← Server renders with Notion data
├── components/
│   └── BuildThisApp.tsx         ← Full UI (landing, problems, modals)
├── lib/
│   ├── notion.ts                ← Notion client + fetch/save
│   ├── email.ts                 ← Resend: welcome + daily digest
│   └── subscribers.ts          ← Subscriber store (JSON file MVP)
├── vercel.json                  ← Cron schedule (7am UTC daily)
└── .env.local.example           ← All required env vars
```
