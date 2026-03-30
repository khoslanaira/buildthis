import { NextRequest, NextResponse } from 'next/server'
import { saveProblem, getAllProblems } from '@/lib/notion'
import { sendDailyDigest } from '@/lib/email'
import { getSubscribers } from '@/lib/subscribers'

export const maxDuration = 300

// Each profession has its OWN subreddits — completely different problems
const PROFESSIONS = [
  {
    key: 'AI / LLM Engineer',
    subreddits: 'r/MachineLearning, r/LocalLLaMA, r/LangChain, r/artificial, r/ChatGPT',
    focus: 'LLM tooling, inference, agents, RAG pipelines, prompt engineering, model evaluation',
  },
  {
    key: 'SaaS Builder',
    subreddits: 'r/SaaS, r/indiehackers, r/startups, r/entrepreneur, r/microsaas',
    focus: 'B2B product problems, founder workflow pain, SaaS operations, growth bottlenecks',
  },
  {
    key: 'Dev Tools',
    subreddits: 'r/programming, r/webdev, r/ExperiencedDevs, r/vscode, r/neovim',
    focus: 'developer productivity, CLI tools, IDE plugins, code quality, local development',
  },
  {
    key: 'Product Manager',
    subreddits: 'r/productmanagement, r/UXResearch, r/agile, r/scrum',
    focus: 'PM workflow pain, roadmapping, stakeholder management, analytics, user research',
  },
  {
    key: 'Infra / DevOps',
    subreddits: 'r/devops, r/kubernetes, r/terraform, r/aws, r/selfhosted',
    focus: 'infrastructure automation, cloud cost, observability, IaC, deployment pain',
  },
  {
    key: 'Frontend Engineer',
    subreddits: 'r/Frontend, r/reactjs, r/css, r/javascript, r/typescript',
    focus: 'design systems, component libraries, performance, accessibility, build tooling',
  },
  {
    key: 'Data Engineer',
    subreddits: 'r/dataengineering, r/bigquery, r/dbt, r/apachespark, r/snowflake',
    focus: 'pipeline reliability, data quality, warehouse cost, orchestration, lineage',
  },
  {
    key: 'Mobile Developer',
    subreddits: 'r/iOSProgramming, r/androiddev, r/reactnative, r/FlutterDev',
    focus: 'cross-platform performance, app store friction, mobile testing, push notifications',
  },
  {
    key: 'Security / Compliance',
    subreddits: 'r/netsec, r/cybersecurity, r/sysadmin, r/AskNetsec',
    focus: 'compliance automation, vulnerability management, vendor risk, secrets management',
  },
  {
    key: 'UI/UX Designer',
    subreddits: 'r/userexperience, r/UI_Design, r/UXDesign, r/graphic_design, r/Figma',
    focus: 'UX problems in real products, design system gaps, usability issues, portfolio case study opportunities',
  },
]

async function scanProfession(prof: typeof PROFESSIONS[0]): Promise<any> {
  const today = new Date().toISOString().split('T')[0]

  const isDesigner = prof.key === 'UI/UX Designer'

  const prompt = isDesigner
    ? `You are a UX research expert. Search ${prof.subreddits} for the most complained-about UX problem in a real product today.

Find a problem that a UI/UX Designer could use as a portfolio case study. It must be:
1. A REAL UX problem with user complaints on Reddit as evidence
2. Something that does NOT have a good existing redesign or solution
3. Specific enough to be a full portfolio case study (research → design → test → measure)

Respond ONLY with valid JSON (no markdown, no backticks):
{
  "title": "UX Case Study — [what you are redesigning]",
  "professions": ["UI/UX Designer"],
  "score": 88,
  "marketSize": "Large",
  "format": "Other",
  "painSummary": "2-3 sentences describing the real UX problem with evidence",
  "evidence": "Specific Reddit post or thread paraphrase with upvote count",
  "existingSolutions": "What partial solutions exist and why they fail",
  "gap": "What a great UX redesign would solve and its business impact",
  "deepDive": "Detailed step-by-step approach: Phase 1 Research → Phase 2 Problem Definition → Phase 3 Design → Phase 4 Testing → Case Study Format. Include specific tools, methods, timelines, and portfolio tips.",
  "redditUrl": "https://reddit.com/r/userexperience",
  "isWinner": true,
  "date": "${today}"
}`
    : `You are a startup opportunity analyst specialising in ${prof.key} problems.

Search these Reddit communities: ${prof.subreddits}

Find the #1 most REAL and UNSOLVED problem that a ${prof.key} faces right now.

HARD REQUIREMENTS:
1. Must come from ${prof.focus} — NOT a generic startup problem
2. Must have ZERO existing solution that fully solves it (verify this)
3. Evidence must be from ${prof.subreddits} specifically — not other subreddits
4. Must be different from: AI API cost tracking, SOP builders, CI cost tools (already found)
5. Must be buildable by a solo founder in under 3 months

Respond ONLY with valid JSON (no markdown, no backticks):
{
  "title": "5-8 word problem title specific to ${prof.key}",
  "professions": ["${prof.key}"],
  "score": 87,
  "marketSize": "Large",
  "format": "SaaS",
  "painSummary": "2-3 sentences describing the real pain specific to ${prof.key}",
  "evidence": "Specific Reddit post paraphrase from ${prof.subreddits} with upvote count and subreddit name",
  "existingSolutions": "Exact tools that exist today and precisely why they fail for this use case",
  "gap": "Specific product description with exact feature set and price point",
  "deepDive": "Step-by-step approach to build and validate this: Step 1 Validate → Step 2 MVP scope → Step 3 Tech stack → Step 4 Pricing test → Step 5 Distribution → Step 6 Moat. Include specific subreddits to post in, APIs to use, and red flags to avoid.",
  "redditUrl": "https://reddit.com/r/${prof.subreddits.split(',')[0].trim().replace('r/', '')}",
  "isWinner": true,
  "date": "${today}"
}`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) throw new Error(`Claude API: ${response.status}`)

  const data = await response.json()
  const textBlock = data.content?.find((b: any) => b.type === 'text')
  if (!textBlock?.text) throw new Error('No text in Claude response')

  const clean = textBlock.text.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')?.replace('Bearer ', '')
  if (process.env.NODE_ENV === 'production' && auth !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results = { saved: 0, failed: 0, errors: [] as string[], emailsSent: 0 }

  // Scan each profession from its own subreddits
  for (const prof of PROFESSIONS) {
    try {
      console.log(`Scanning ${prof.key}...`)
      const problem = await scanProfession(prof)
      await saveProblem(problem)
      results.saved++
    } catch (err: any) {
      results.failed++
      results.errors.push(`${prof.key}: ${err.message}`)
      console.error(`Failed ${prof.key}:`, err)
    }
    await new Promise(r => setTimeout(r, 1500)) // rate limit between calls
  }

  // Send daily digest to subscribers
  try {
    const subscribers = getSubscribers()
    if (subscribers.length > 0) {
      const problems = await getAllProblems()
      const today = new Date().toISOString().split('T')[0]
      const todayProblems = problems.filter(p => p.date === today)
      if (todayProblems.length > 0) {
        const emailResults = await sendDailyDigest(subscribers, todayProblems)
        results.emailsSent = emailResults.filter((r: any) => r.success).length
      }
    }
  } catch (err: any) {
    results.errors.push(`Email digest: ${err.message}`)
  }

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    message: `Scanned ${PROFESSIONS.length} professions from their specific subreddits`,
    ...results,
  })
}
