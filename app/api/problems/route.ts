import { NextResponse } from 'next/server'
import { getAllProblems } from '@/lib/notion'

export const revalidate = 3600

export async function GET() {
  try {
    const problems = await getAllProblems()
    return NextResponse.json({ problems, updatedAt: new Date().toISOString() })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}
