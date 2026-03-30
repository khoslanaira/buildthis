// Simple in-memory subscriber store for MVP
// In production: replace with Supabase/PlanetScale DB

import fs from 'fs'
import path from 'path'

export type Subscriber = {
  email: string
  stacks: string[]
  subscribedAt: string
}

const FILE = path.join(process.cwd(), 'data', 'subscribers.json')

function ensureFile() {
  const dir = path.dirname(FILE)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, '[]')
}

export function getSubscribers(): Subscriber[] {
  try {
    ensureFile()
    return JSON.parse(fs.readFileSync(FILE, 'utf-8'))
  } catch {
    return []
  }
}

export function addSubscriber(email: string, stacks: string[]): boolean {
  try {
    ensureFile()
    const subs = getSubscribers()
    if (subs.find(s => s.email === email)) return false // already exists
    subs.push({ email, stacks, subscribedAt: new Date().toISOString() })
    fs.writeFileSync(FILE, JSON.stringify(subs, null, 2))
    return true
  } catch {
    return false
  }
}
