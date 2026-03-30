import { Client } from '@notionhq/client'

const notion = new Client({ auth: process.env.NOTION_TOKEN })
const DATABASE_ID = process.env.NOTION_DATABASE_ID!

export type Problem = {
  id: string
  title: string
  professions: string[]
  score: number
  marketSize: string
  format: string
  painSummary: string
  evidence: string
  existingSolutions: string
  gap: string
  deepDive: string
  redditUrl: string
  isWinner: boolean
  date: string
}

export async function getAllProblems(): Promise<Problem[]> {
  try {
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
      sorts: [
        { property: 'Date', direction: 'descending' },
        { property: 'Opportunity Score', direction: 'descending' },
      ],
    })
    return response.results.map((page: any) => {
      const p = page.properties
      return {
        id:                page.id,
        title:             p['Problem Title']?.title?.[0]?.plain_text ?? 'Untitled',
        professions:       (p['Profession']?.multi_select ?? []).map((s: any) => s.name),
        score:             p['Opportunity Score']?.number ?? 0,
        marketSize:        p['Market Size']?.select?.name ?? 'Unknown',
        format:            p['Suggested Format']?.select?.name ?? 'SaaS',
        painSummary:       p['Pain Summary']?.rich_text?.[0]?.plain_text ?? '',
        evidence:          p['Reddit Evidence']?.rich_text?.[0]?.plain_text ?? '',
        existingSolutions: p['Existing Solutions']?.rich_text?.[0]?.plain_text ?? '',
        gap:               p['The Gap — Build This']?.rich_text?.[0]?.plain_text ?? '',
        deepDive:          p['Deep Dive']?.rich_text?.[0]?.plain_text ?? '',
        redditUrl:         p['Reddit URL']?.rich_text?.[0]?.plain_text ?? '',
        isWinner:          p['Daily Winner']?.checkbox ?? false,
        date:              p['Date']?.date?.start ?? '',
      }
    })
  } catch (err) {
    console.error('Notion fetch error:', err)
    return []
  }
}

export async function saveProblem(problem: Omit<Problem, 'id'>) {
  return notion.pages.create({
    parent: { database_id: DATABASE_ID },
    properties: {
      'Problem Title':      { title: [{ text: { content: problem.title } }] },
      'Profession':         { multi_select: problem.professions.map(name => ({ name })) },
      'Opportunity Score':  { number: problem.score },
      'Market Size':        { select: { name: problem.marketSize } },
      'Suggested Format':   { select: { name: problem.format } },
      'Pain Summary':       { rich_text: [{ text: { content: problem.painSummary } }] },
      'Reddit Evidence':    { rich_text: [{ text: { content: problem.evidence } }] },
      'Existing Solutions': { rich_text: [{ text: { content: problem.existingSolutions } }] },
      'The Gap — Build This': { rich_text: [{ text: { content: problem.gap } }] },
      'Deep Dive':          { rich_text: [{ text: { content: problem.deepDive } }] },
      'Reddit URL':         { rich_text: [{ text: { content: problem.redditUrl } }] },
      'Daily Winner':       { checkbox: problem.isWinner },
      'Date':               { date: { start: problem.date } },
      'Category':           { select: { name: 'SaaS / Tech' } },
      'Status':             { select: { name: 'New' } },
    },
  })
}
