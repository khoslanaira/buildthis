import { Resend } from 'resend'
import type { Problem } from './notion'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.DIGEST_FROM_EMAIL ?? 'digest@buildthis.dev'

// Welcome email when someone subscribes
export async function sendWelcomeEmail(email: string, stacks: string[]) {
  return resend.emails.send({
    from: `BuildThis <${FROM}>`,
    to: email,
    subject: '🔍 Welcome to BuildThis — your daily problem digest',
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#08080a;color:#f0ede8">
        <div style="font-family:monospace;font-size:13px;color:#c9a84c;margin-bottom:24px">BuildThis 🔍</div>
        <h1 style="font-size:28px;font-weight:400;margin-bottom:12px;font-family:Georgia,serif">You're subscribed!</h1>
        <p style="color:#7a7a80;line-height:1.7;margin-bottom:20px">
          Every morning at 7am UTC, you'll receive the top validated startup problem 
          sourced from Reddit — filtered for your stack: <strong style="color:#e2c97e">${stacks.join(', ')}</strong>.
        </p>
        <p style="color:#7a7a80;line-height:1.7">
          Each problem includes: the pain, Reddit evidence, why existing solutions fail, 
          and the exact gap to build.
        </p>
        <div style="margin-top:32px;padding-top:24px;border-top:1px solid rgba(255,255,255,.07);font-family:monospace;font-size:11px;color:#7a7a80">
          No spam. Unsubscribe anytime by replying STOP.
        </div>
      </div>
    `,
  })
}

// Daily digest email sent to all subscribers
export async function sendDailyDigest(
  subscribers: { email: string; stacks: string[] }[],
  problems: Problem[]
) {
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  
  const results = []
  for (const sub of subscribers) {
    // Filter problems relevant to this subscriber's stacks
    const relevant = problems.filter(p =>
      sub.stacks.length === 0 ||
      p.professions.some(prof =>
        sub.stacks.some(stack => stack.toLowerCase().includes(prof.toLowerCase().split(' ')[0]))
      )
    ).slice(0, 3)

    if (relevant.length === 0) continue

    const winner = relevant.find(p => p.isWinner) ?? relevant[0]

    const problemsHtml = relevant.map((p, i) => `
      <div style="margin-bottom:28px;padding-bottom:28px;border-bottom:1px solid rgba(255,255,255,.07)">
        <div style="font-family:monospace;font-size:10px;color:#c9a84c;letter-spacing:.08em;margin-bottom:6px">
          ${i === 0 ? '★ TOP PICK · ' : ''}SCORE ${p.score}/100 · ${p.marketSize.toUpperCase()} MARKET · ${p.format.toUpperCase()}
        </div>
        <h2 style="font-family:Georgia,serif;font-size:20px;font-weight:400;margin:0 0 10px;color:#e2c97e">${p.title}</h2>
        <p style="color:#7a7a80;line-height:1.7;font-size:14px;margin-bottom:12px">${p.painSummary}</p>
        <div style="font-family:monospace;font-size:11px;color:rgba(255,255,255,.35);border-left:2px solid #c9a84c;padding:8px 12px;background:rgba(201,168,76,.04);font-style:italic;margin-bottom:12px">
          ${p.evidence}
        </div>
        <div style="background:rgba(90,191,138,.05);border:1px solid rgba(90,191,138,.15);border-radius:6px;padding:12px 14px">
          <div style="font-family:monospace;font-size:10px;color:#5abf8a;letter-spacing:.1em;margin-bottom:6px">THE GAP — BUILD THIS</div>
          <p style="color:#f0ede8;font-size:13px;line-height:1.7;margin:0;font-weight:500">${p.gap}</p>
        </div>
      </div>
    `).join('')

    try {
      const result = await resend.emails.send({
        from: `BuildThis <${FROM}>`,
        to: sub.email,
        subject: `🔍 Today's top problem: ${winner.title}`,
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#08080a;color:#f0ede8">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:32px;padding-bottom:20px;border-bottom:1px solid rgba(255,255,255,.07)">
              <span style="font-family:monospace;font-size:13px;color:#c9a84c">BuildThis 🔍</span>
              <span style="font-family:monospace;font-size:11px;color:#7a7a80">${today}</span>
            </div>
            <h1 style="font-family:Georgia,serif;font-size:26px;font-weight:400;margin:0 0 8px">Today's top problems</h1>
            <p style="color:#7a7a80;font-size:13px;margin:0 0 32px">Sourced from Reddit · Verified no existing solution · Filtered for you</p>
            ${problemsHtml}
            <div style="margin-top:32px;padding-top:20px;border-top:1px solid rgba(255,255,255,.07);font-family:monospace;font-size:11px;color:#7a7a80">
              You're receiving this because you subscribed at buildthis.dev<br>
              Reply STOP to unsubscribe.
            </div>
          </div>
        `,
      })
      results.push({ email: sub.email, success: true })
    } catch (err) {
      results.push({ email: sub.email, success: false, error: err })
    }
  }
  return results
}
