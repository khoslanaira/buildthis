'use client'
import type { Problem } from '@/lib/notion'
import { useState } from 'react'

const PROFESSIONS = [
  { key:'ai',       icon:'🤖', name:'AI / LLM Engineer',    notion:'AI / LLM Engineer',    sub:'r/LocalLLaMA · r/LangChain · r/MachineLearning' },
  { key:'saas',     icon:'🚀', name:'SaaS Builder',          notion:'SaaS Builder',          sub:'r/SaaS · r/indiehackers · r/microsaas' },
  { key:'devtools', icon:'🛠️', name:'Dev Tools',             notion:'Dev Tools',             sub:'r/ExperiencedDevs · r/programming · r/webdev' },
  { key:'pm',       icon:'📋', name:'Product Manager',       notion:'Product Manager',       sub:'r/productmanagement · r/UXResearch · r/agile' },
  { key:'infra',    icon:'⚙️', name:'Infra / DevOps',        notion:'Infra / DevOps',        sub:'r/devops · r/kubernetes · r/terraform' },
  { key:'frontend', icon:'🎨', name:'Frontend Engineer',     notion:'Frontend Engineer',     sub:'r/reactjs · r/Frontend · r/css' },
  { key:'data',     icon:'📊', name:'Data Engineer',         notion:'Data Engineer',         sub:'r/dataengineering · r/dbt · r/bigquery' },
  { key:'mobile',   icon:'📱', name:'Mobile Developer',      notion:'Mobile Developer',      sub:'r/reactnative · r/iOSProgramming · r/androiddev' },
  { key:'security', icon:'🔐', name:'Security / Compliance', notion:'Security / Compliance', sub:'r/netsec · r/cybersecurity · r/sysadmin' },
  { key:'ux',       icon:'✏️', name:'UI/UX Designer',        notion:'UI/UX Designer',        sub:'r/userexperience · r/UI_Design · r/Figma' },
]

const NL_STACKS = ['🤖 AI/LLM','🚀 SaaS','🛠️ Dev Tools','📋 Product','⚙️ Infra','🎨 Frontend','📊 Data','📱 Mobile','🔐 Security','✏️ UI/UX']

const scoreColor = (s:number) => s>=90?'#5abf8a':s>=85?'#e2c97e':'#e0844a'

const tag = (bg:string,color:string):React.CSSProperties=>({fontFamily:'DM Mono',fontSize:10,padding:'2px 7px',borderRadius:3,fontWeight:500,background:bg,color,border:`1px solid ${color}33`})
const OL:React.CSSProperties={position:'fixed',inset:0,background:'rgba(0,0,0,.82)',backdropFilter:'blur(10px)',zIndex:300,display:'flex',alignItems:'center',justifyContent:'center',padding:20}
const MD:React.CSSProperties={background:'var(--bg2)',border:'1px solid var(--border2)',borderRadius:14,maxWidth:680,width:'100%',maxHeight:'90vh',overflowY:'auto',padding:32,position:'relative'}
const XB:React.CSSProperties={position:'absolute',top:14,right:14,width:26,height:26,background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:5,color:'var(--muted)',fontSize:13,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}
const BP:React.CSSProperties={background:'var(--accent)',color:'#08080a',border:'none',borderRadius:6,fontFamily:'DM Mono',fontSize:12,fontWeight:500,cursor:'pointer'}
const BG:React.CSSProperties={background:'transparent',color:'var(--muted)',border:'1px solid var(--border2)',borderRadius:6,fontFamily:'DM Mono',fontSize:12,cursor:'pointer'}
const ML:React.CSSProperties={fontFamily:'DM Mono',fontSize:10,letterSpacing:'.1em',color:'var(--muted)',marginBottom:7}

// Format deep dive steps into readable sections
function DeepDiveSection({ text }: { text: string }) {
  if (!text) return null
  const steps = text.split(/(?=STEP \d|PHASE \d|SECTION \d)/g).filter(Boolean)
  return (
    <div style={{display:'flex',flexDirection:'column',gap:12}}>
      {steps.map((step, i) => {
        const colonIdx = step.indexOf(':')
        const hasTitle = colonIdx > 0 && colonIdx < 40
        const title = hasTitle ? step.slice(0, colonIdx) : null
        const body = hasTitle ? step.slice(colonIdx + 1).trim() : step.trim()
        return (
          <div key={i} style={{background:'var(--bg3)',borderRadius:8,padding:'12px 14px',borderLeft:'2px solid var(--accent2)'}}>
            {title && <div style={{fontFamily:'DM Mono',fontSize:10,color:'var(--accent2)',letterSpacing:'.08em',marginBottom:6}}>{title}</div>}
            <div style={{fontSize:13,color:'rgba(240,237,232,.8)',lineHeight:1.7}}>{body}</div>
          </div>
        )
      })}
    </div>
  )
}

export default function BuildThisApp({ problems }:{ problems:Problem[] }) {
  const [page, setPage]           = useState<'landing'|'problems'>('landing')
  const [profKey, setProfKey]     = useState<string|null>(null)
  const [openP, setOpenP]         = useState<Problem|null>(null)
  const [showNL, setShowNL]       = useState(false)
  const [nlEmail, setNlEmail]     = useState('')
  const [nlStacks, setNlStacks]   = useState<string[]>(['🤖 AI/LLM'])
  const [nlDone, setNlDone]       = useState(false)
  const [nlLoading, setNlLoading] = useState(false)
  const [nlError, setNlError]     = useState('')

  const profDef  = PROFESSIONS.find(p=>p.key===profKey)
  const filtered = profKey ? problems.filter(p=>p.professions.includes(profDef!.notion)) : problems
  const winner   = filtered.find(p=>p.isWinner) ?? filtered[0] ?? null
  const isUX     = profKey === 'ux'

  function countFor(notionName:string){ return problems.filter(p=>p.professions.includes(notionName)).length }

  async function submitNL() {
    if(!nlEmail||!nlEmail.includes('@')){ setNlError('Enter a valid email'); return }
    setNlLoading(true); setNlError('')
    try {
      const res = await fetch('/api/subscribe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:nlEmail,stacks:nlStacks})})
      if(!res.ok) throw new Error()
      setNlDone(true)
    } catch { setNlError('Something went wrong. Try again.') }
    finally { setNlLoading(false) }
  }

  function openNL(){ setNlDone(false);setNlError('');setShowNL(true) }
  function toggleStack(s:string){ setNlStacks(p=>p.includes(s)?p.filter(x=>x!==s):[...p,s]) }

  const today = new Date().toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})

  return (
    <>
      {/* NAV */}
      <nav style={{position:'sticky',top:0,zIndex:100,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 2rem',height:54,borderBottom:'1px solid var(--border)',background:'rgba(8,8,10,.92)',backdropFilter:'blur(18px)'}}>
        <div onClick={()=>setPage('landing')} style={{fontFamily:'DM Mono',fontSize:14,fontWeight:500,color:'var(--accent)',display:'flex',alignItems:'center',gap:7,cursor:'pointer'}}>
          <span className="ablink" style={{width:7,height:7,borderRadius:'50%',background:'var(--accent2)',display:'inline-block'}}/>
          BuildThis
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontFamily:'DM Mono',fontSize:11,color:'var(--muted)',padding:'3px 9px',border:'1px solid var(--border)',borderRadius:20}}>
            {problems.length} problems · Auto-scanned daily
          </span>
          <button onClick={openNL} style={{...BG,padding:'7px 16px'}}>Subscribe</button>
          {page==='problems'&&<button onClick={()=>setPage('landing')} style={{...BP,padding:'7px 16px'}}>← Change role</button>}
        </div>
      </nav>

      {/* LANDING */}
      {page==='landing'&&(
        <div style={{position:'relative',zIndex:1,minHeight:'calc(100vh - 54px)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'60px 2rem',textAlign:'center'}}>
          <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-60%)',width:600,height:400,background:'radial-gradient(ellipse,rgba(201,168,76,.08) 0%,transparent 70%)',pointerEvents:'none'}}/>
          <div className="afu" style={{display:'inline-flex',alignItems:'center',gap:6,fontFamily:'DM Mono',fontSize:11,color:'var(--accent2)',border:'1px solid rgba(201,168,76,.22)',borderRadius:20,padding:'4px 12px',marginBottom:28,letterSpacing:'.04em'}}>
            <span style={{width:5,height:5,background:'var(--accent2)',borderRadius:'50%',display:'inline-block'}}/>
            Each role scans different subreddits · No existing solution verified · Deep dive included
          </div>
          <h1 className="font-display afu" style={{fontSize:'clamp(44px,8vw,80px)',lineHeight:1.04,letterSpacing:'-.025em',marginBottom:18,animationDelay:'.07s'}}>
            Stop guessing<br/><em style={{color:'var(--accent)'}}>what to build.</em>
          </h1>
          <p className="afu" style={{fontSize:17,color:'var(--muted)',maxWidth:540,lineHeight:1.75,margin:'0 auto 48px',animationDelay:'.14s'}}>
            Real problems discovered daily — each profession has its <strong style={{color:'var(--text)'}}>own Reddit sources</strong>. Every idea verified unsolved. Every card includes a <strong style={{color:'var(--text)'}}>step-by-step deep dive</strong> on how to build it.
          </p>
          <p className="afu font-mono" style={{fontSize:11,color:'var(--muted)',letterSpacing:'.09em',marginBottom:16,animationDelay:'.2s'}}>PICK YOUR ROLE — YOU WILL SEE DIFFERENT PROBLEMS FROM OTHERS</p>

          <div className="afu" style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10,maxWidth:920,width:'100%',marginBottom:40,animationDelay:'.25s'}}>
            {PROFESSIONS.map(p=>{
              const cnt=countFor(p.notion)
              return(
                <div key={p.key} onClick={()=>setProfKey(p.key)}
                  style={{background:profKey===p.key?'rgba(201,168,76,.06)':'var(--bg2)',border:`1px solid ${profKey===p.key?'var(--accent2)':'rgba(255,255,255,.07)'}`,borderRadius:10,padding:'16px 12px',cursor:'pointer',textAlign:'left',transition:'all .2s',display:'flex',flexDirection:'column',gap:6}}>
                  <div style={{fontSize:22}}>{p.icon}</div>
                  <div style={{fontSize:13,fontWeight:500}}>{p.name}</div>
                  <div style={{fontSize:11,color:'var(--muted)',lineHeight:1.4}}>{p.sub}</div>
                  <div style={{fontFamily:'DM Mono',fontSize:10,color:cnt>0?'var(--accent2)':'var(--muted)',background:cnt>0?'rgba(201,168,76,.1)':'rgba(255,255,255,.04)',borderRadius:4,padding:'2px 6px',alignSelf:'flex-start',marginTop:4}}>
                    {cnt>0?`${cnt} problems`:'Pending'}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="afu" style={{display:'flex',flexDirection:'column',alignItems:'center',gap:12,animationDelay:'.32s'}}>
            <button onClick={()=>{if(profKey)setPage('problems')}} disabled={!profKey}
              style={{fontFamily:'DM Mono',fontSize:13,fontWeight:500,padding:'13px 32px',borderRadius:7,border:'none',background:profKey?'var(--accent)':'rgba(226,201,126,.3)',color:'#08080a',cursor:profKey?'pointer':'not-allowed'}}>
              Show me today's problems →
            </button>
            <p style={{fontSize:12,color:'var(--muted)'}}>or <span onClick={openNL} style={{color:'var(--accent2)',cursor:'pointer'}}>get the daily email digest</span></p>
          </div>

          <div className="afu" style={{display:'flex',gap:40,justifyContent:'center',marginTop:56,paddingTop:32,borderTop:'1px solid var(--border)',flexWrap:'wrap',animationDelay:'.38s'}}>
            {[{n:problems.length,l:'Problems tracked'},{n:10,l:'Roles, own subreddits'},{n:'Daily 7am',l:'Auto-scan time'},{n:'Deep dive',l:'Included on every card'}].map(s=>(
              <div key={s.l} style={{textAlign:'center'}}>
                <div style={{fontFamily:'DM Mono',fontSize:22,fontWeight:500,color:'var(--accent)'}}>{s.n}</div>
                <div style={{fontSize:12,color:'var(--muted)',marginTop:2}}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PROBLEMS PAGE */}
      {page==='problems'&&(
        <div style={{position:'relative',zIndex:1}}>
          <div style={{borderBottom:'1px solid var(--border)',padding:'18px 2rem',display:'flex',alignItems:'center',gap:16,background:'rgba(8,8,10,.6)',backdropFilter:'blur(12px)',flexWrap:'wrap'}}>
            <button onClick={()=>setPage('landing')} style={{fontFamily:'DM Mono',fontSize:12,color:'var(--muted)',background:'none',border:'1px solid var(--border)',borderRadius:5,padding:'5px 10px',cursor:'pointer'}}>← Back</button>
            <div style={{fontFamily:'DM Mono',fontSize:12,color:'var(--accent)',background:'rgba(201,168,76,.08)',border:'1px solid rgba(201,168,76,.2)',borderRadius:20,padding:'4px 12px'}}>
              {profDef?.icon} {profDef?.name}
            </div>
            <div style={{fontFamily:'DM Mono',fontSize:11,color:'var(--muted)',padding:'3px 8px',border:'1px solid var(--border)',borderRadius:12}}>
              Scanned from: {profDef?.sub}
            </div>
            <div style={{fontFamily:'DM Mono',fontSize:11,color:'var(--muted)',marginLeft:'auto'}}>{today}</div>
          </div>

          {winner&&(
            <div style={{maxWidth:1160,margin:'24px auto 0',padding:'0 2rem'}}>
              <div onClick={()=>setOpenP(winner)} style={{background:'linear-gradient(135deg,rgba(201,168,76,.07),rgba(201,168,76,.02))',border:'1px solid rgba(201,168,76,.22)',borderRadius:10,padding:'18px 22px',cursor:'pointer',display:'flex',alignItems:'center',gap:18}}>
                <div style={{fontSize:28,flexShrink:0}}>{isUX?'📚':'🏆'}</div>
                <div>
                  <div style={{fontFamily:'DM Mono',fontSize:10,color:'var(--accent2)',letterSpacing:'.08em',marginBottom:3}}>
                    {isUX?'TODAY\'S PORTFOLIO CASE STUDY OPPORTUNITY':'TOP PICK'} · VERIFIED NO EXISTING SOLUTION · DEEP DIVE INCLUDED
                  </div>
                  <div className="font-display" style={{fontSize:19,color:'var(--accent)',letterSpacing:'-.01em'}}>{winner.title}</div>
                  <div style={{fontSize:12,color:'var(--muted)',marginTop:3}}>Score {winner.score}/100 · {winner.marketSize} market · {winner.format}</div>
                </div>
                <div style={{marginLeft:'auto',flexShrink:0,textAlign:'right'}}>
                  <div style={{fontFamily:'DM Mono',fontSize:26,fontWeight:500,color:'var(--accent)'}}>{winner.score}</div>
                  <div style={{fontFamily:'DM Mono',fontSize:10,color:'var(--muted)'}}>/ 100</div>
                </div>
              </div>
            </div>
          )}

          <div style={{maxWidth:1160,margin:'24px auto 80px',padding:'0 2rem'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',paddingBottom:12,borderBottom:'1px solid var(--border)',marginBottom:20}}>
              <span style={{fontFamily:'DM Mono',fontSize:11,color:'var(--muted)',letterSpacing:'.07em'}}>
                {isUX?'PORTFOLIO CASE STUDIES':'ALL PROBLEMS'} — {profDef?.name.toUpperCase()} · {filtered.length} total
              </span>
              <span style={{fontFamily:'DM Mono',fontSize:11,color:'var(--green)'}}>✓ Each verified: no existing solution</span>
            </div>

            {filtered.length===0?(
              <div style={{textAlign:'center',padding:'60px 0',color:'var(--muted)'}}>
                <div style={{fontSize:40,marginBottom:16}}>🔍</div>
                <div style={{fontFamily:'DM Mono',fontSize:14,marginBottom:8}}>No problems yet for this role</div>
                <div style={{fontSize:13}}>The daily scan at 7am UTC will populate {profDef?.name} problems from {profDef?.sub}</div>
              </div>
            ):(
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(330px,1fr))',gap:14}}>
                {filtered.map((p,i)=>(
                  <div key={p.id} onClick={()=>setOpenP(p)}
                    style={{background:p.isWinner?'linear-gradient(135deg,rgba(201,168,76,.04),var(--bg2) 60%)':'var(--bg2)',border:`1px solid ${p.isWinner?'rgba(201,168,76,.2)':'rgba(255,255,255,.07)'}`,borderRadius:10,padding:20,cursor:'pointer',transition:'all .18s',display:'flex',flexDirection:'column',gap:12,animation:`fadeUp .35s ${i*.06}s ease both`}}>
                    <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:8}}>
                      <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                        {p.isWinner&&<span style={tag('rgba(201,168,76,.12)','#c9a84c')}>{isUX?'📚 Case Study':'★ Top Pick'}</span>}
                        <span style={tag('rgba(106,171,223,.12)','#6aabdf')}>{p.marketSize}</span>
                        <span style={tag('rgba(90,191,138,.1)','#5abf8a')}>✓ Unsolved</span>
                        {p.deepDive&&<span style={tag('rgba(167,139,218,.12)','#a78bda')}>🔍 Deep dive</span>}
                      </div>
                      <span style={{fontFamily:'DM Mono',fontSize:13,fontWeight:500,color:scoreColor(p.score),flexShrink:0}}>{p.score}</span>
                    </div>
                    <div className="font-display" style={{fontSize:18,lineHeight:1.3,letterSpacing:'-.01em'}}>{p.title}</div>
                    <div style={{fontSize:13,color:'var(--muted)',lineHeight:1.6,display:'-webkit-box',WebkitLineClamp:3,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{p.painSummary}</div>
                    <div style={{fontFamily:'DM Mono',fontSize:11,color:'rgba(255,255,255,.3)',borderLeft:'2px solid rgba(255,255,255,.13)',paddingLeft:10,fontStyle:'italic',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{p.evidence}</div>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',paddingTop:10,borderTop:'1px solid rgba(255,255,255,.07)',marginTop:'auto'}}>
                      <span style={{fontFamily:'DM Mono',fontSize:10,color:'var(--muted)'}}>{p.date}</span>
                      <span style={{fontFamily:'DM Mono',fontSize:11,color:'var(--accent2)'}}>Full deep dive →</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* PROBLEM MODAL */}
      {openP&&(
        <div onClick={()=>setOpenP(null)} style={OL}>
          <div onClick={e=>e.stopPropagation()} className="ami" style={MD}>
            <button onClick={()=>setOpenP(null)} style={XB}>✕</button>
            <div style={{display:'flex',flexWrap:'wrap',gap:5,marginBottom:12}}>
              {openP.isWinner&&<span style={tag('rgba(201,168,76,.12)','#c9a84c')}>★ Top Pick</span>}
              <span style={tag('rgba(106,171,223,.12)','#6aabdf')}>{openP.marketSize} market</span>
              <span style={tag('rgba(90,191,138,.1)','#5abf8a')}>✓ No existing solution</span>
              <span style={tag('rgba(167,139,218,.12)','#a78bda')}>{openP.format}</span>
              {openP.redditUrl&&<a href={openP.redditUrl} target="_blank" rel="noopener noreferrer" style={{...tag('rgba(255,69,0,.1)','#ff6314'),textDecoration:'none'}}>View on Reddit ↗</a>}
            </div>
            <div className="font-display" style={{fontSize:26,lineHeight:1.2,letterSpacing:'-.02em',marginBottom:22}}>{openP.title}</div>

            <div style={{marginBottom:18}}><div style={ML}>THE PAIN</div><div style={{fontSize:14,color:'rgba(240,237,232,.8)',lineHeight:1.75}}>{openP.painSummary}</div></div>
            <div style={{marginBottom:18}}>
              <div style={ML}>REDDIT EVIDENCE</div>
              <div style={{fontFamily:'DM Mono',fontSize:12,color:'rgba(255,255,255,.38)',borderLeft:'2px solid var(--accent2)',padding:'10px 14px',background:'rgba(201,168,76,.04)',borderRadius:'0 6px 6px 0',lineHeight:1.6,fontStyle:'italic'}}>{openP.evidence}</div>
            </div>
            <div style={{marginBottom:18}}><div style={ML}>EXISTING SOLUTIONS (& WHY THEY FAIL)</div><div style={{fontSize:14,color:'rgba(240,237,232,.8)',lineHeight:1.75}}>{openP.existingSolutions}</div></div>
            <div style={{background:'rgba(90,191,138,.05)',border:'1px solid rgba(90,191,138,.14)',borderRadius:8,padding:'14px 16px',marginBottom:18}}>
              <div style={{...ML,color:'var(--green)'}}>THE GAP — BUILD THIS</div>
              <div style={{fontSize:14,color:'var(--text)',lineHeight:1.75,fontWeight:500}}>{openP.gap}</div>
            </div>

            {openP.deepDive&&(
              <div style={{marginBottom:18}}>
                <div style={{...ML,color:'#a78bda',marginBottom:12}}>🔍 DEEP DIVE — HOW TO APPROACH THIS</div>
                <DeepDiveSection text={openP.deepDive}/>
              </div>
            )}

            <div style={{display:'flex',gap:8,paddingTop:18,borderTop:'1px solid var(--border)'}}>
              <button onClick={()=>{setOpenP(null);openNL()}} style={{...BP,flex:1,padding:10}}>Get daily problems like this ↗</button>
              <button onClick={()=>setOpenP(null)} style={{...BG,padding:'10px 14px'}}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* NEWSLETTER MODAL */}
      {showNL&&(
        <div onClick={()=>setShowNL(false)} style={OL}>
          <div onClick={e=>e.stopPropagation()} className="ami" style={{...MD,maxWidth:460}}>
            <button onClick={()=>setShowNL(false)} style={XB}>✕</button>
            {!nlDone?(
              <>
                <div style={{fontFamily:'DM Mono',fontSize:10,color:'var(--accent2)',letterSpacing:'.1em',marginBottom:10}}>DAILY DIGEST</div>
                <div className="font-display" style={{fontSize:26,lineHeight:1.2,marginBottom:10}}>Get today's top problem in your inbox</div>
                <p style={{fontSize:14,color:'var(--muted)',lineHeight:1.7,marginBottom:24}}>
                  Every morning at <strong style={{color:'var(--text)'}}>7am UTC</strong> — problems from your profession's own subreddits, verified unsolved, with full deep dive. Sent automatically.
                </p>
                <input type="email" value={nlEmail} onChange={e=>{setNlEmail(e.target.value);setNlError('')}} placeholder="your@email.com"
                  style={{width:'100%',padding:'10px 14px',marginBottom:10,background:'var(--bg3)',border:`1px solid ${nlError?'rgba(224,96,96,.5)':'var(--border2)'}`,borderRadius:6,color:'var(--text)',fontFamily:'DM Mono',fontSize:13,outline:'none'}}/>
                {nlError&&<p style={{fontFamily:'DM Mono',fontSize:11,color:'var(--red)',marginBottom:8}}>{nlError}</p>}
                <div style={{fontFamily:'DM Mono',fontSize:11,color:'var(--muted)',marginBottom:10}}>FILTER BY STACK</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:18}}>
                  {NL_STACKS.map(s=>(
                    <div key={s} onClick={()=>toggleStack(s)}
                      style={{fontFamily:'DM Mono',fontSize:11,padding:'4px 10px',border:`1px solid ${nlStacks.includes(s)?'rgba(201,168,76,.3)':'var(--border)'}`,borderRadius:20,cursor:'pointer',color:nlStacks.includes(s)?'var(--accent)':'var(--muted)',background:nlStacks.includes(s)?'rgba(201,168,76,.07)':'transparent',transition:'all .15s'}}>
                      {s}
                    </div>
                  ))}
                </div>
                <button onClick={submitNL} disabled={nlLoading} style={{...BP,width:'100%',padding:12,fontSize:13,opacity:nlLoading?.7:1}}>
                  {nlLoading?'Subscribing...':'Subscribe free →'}
                </button>
                <p style={{fontSize:11,color:'var(--muted)',textAlign:'center',marginTop:10}}>No spam. Unsubscribe by replying STOP.</p>
              </>
            ):(
              <div style={{textAlign:'center',padding:'30px 0'}}>
                <div style={{fontSize:40,marginBottom:12}}>✅</div>
                <div className="font-display" style={{fontSize:24,marginBottom:8,color:'var(--accent)'}}>You're subscribed!</div>
                <div style={{fontSize:14,color:'var(--muted)',lineHeight:1.7}}>
                  Problems for <strong style={{color:'var(--text)'}}>{nlStacks.join(', ')}</strong> land in <strong style={{color:'var(--text)'}}>{nlEmail}</strong> every morning at 7am UTC.
                </div>
                <div style={{fontFamily:'DM Mono',fontSize:11,color:'var(--muted)',marginTop:12,padding:'10px 14px',background:'rgba(90,191,138,.05)',border:'1px solid rgba(90,191,138,.14)',borderRadius:6}}>
                  Welcome email sent — check your inbox ✓
                </div>
                <button onClick={()=>setShowNL(false)} style={{...BP,marginTop:20,padding:'10px 24px'}}>Done ✓</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
