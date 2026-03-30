import { NextRequest, NextResponse } from 'next/server'
import { addSubscriber } from '@/lib/subscribers'
import { sendWelcomeEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const { email, stacks } = await req.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    const added = addSubscriber(email, stacks ?? [])

    // Send welcome email regardless (even if already subscribed)
    try {
      await sendWelcomeEmail(email, stacks ?? ['All stacks'])
    } catch (emailErr) {
      console.error('Welcome email failed:', emailErr)
      // Don't fail the request if email fails
    }

    return NextResponse.json({ success: true, alreadySubscribed: !added })
  } catch (err) {
    console.error('Subscribe error:', err)
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 })
  }
}
