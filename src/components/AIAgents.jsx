import React, { useState, useRef, useEffect } from 'react'

const OPENAI_KEY = import.meta.env.VITE_OPENAI_KEY
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://nurlnqzmiyryfviuujsq.supabase.co'
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || 'sb_publishable_WTdQ9aVR43R1weeWFHgTBQ_CdUkjR09'
const SB_H = { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' }
const SESSION_ID = `session_${Date.now()}_${Math.random().toString(36).slice(2)}`

// ── SUPPORT AGENT ──────────────────────────────────────────
const SUPPORT_SYSTEM = `You are Zeni, a friendly AI support assistant for Zenrixi — India's AI-powered job matching platform.

About Zenrixi:
- Website: zenrixi.com
- AI-powered job matching platform
- Features: Candidate registration, Company job posting, AI matching, Interview scheduling, Offer letters
- Consultant portal: Manage clients, vacancies, invoices, interview letters, payments
- Email: support@zenrixi.com
- Location: Dehradun, Uttarakhand, India

Your job:
- Answer questions about Zenrixi features
- Help users navigate the platform
- Guide candidates on how to register and apply
- Help companies understand how to post jobs
- Be friendly, concise, and helpful
- If you don't know something, ask them to email support@zenrixi.com

Always respond in the same language the user writes in (Hindi or English).
Keep responses short and helpful — max 3-4 sentences.`

// ── MARKETING AGENT ────────────────────────────────────────
const MARKETING_SYSTEM = `You are MarketBot, an expert AI marketing agent for Zenrixi — India's AI-powered job matching platform.

About Zenrixi:
- AI-powered job matching platform at zenrixi.com
- Features: AI candidate matching, interview scheduling, offer letters, consultant CRM
- Target audience: HR managers, companies, HR consultants, job seekers in India
- USP: Zero manual screening — AI does everything automatically

Your job:
- Generate marketing content: LinkedIn posts, WhatsApp messages, email campaigns
- Create catchy taglines and slogans
- Write cold outreach emails to companies
- Suggest marketing strategies
- Create social media content calendars
- Write job posting descriptions that attract candidates
- Generate promotional content for specific industries

Always be creative, professional, and persuasive.
Format output clearly with sections when needed.`

const ChatWindow = ({ title, emoji, systemPrompt, placeholder, color, onClose }) => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `Hi! I'm ${title}. ${placeholder}` }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    if (!input.trim() || loading) return
    const userMsg = { role: 'user', content: input }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'system', content: systemPrompt }, ...messages, userMsg],
          max_tokens: 500
        })
      })
      const data = await res.json()
      const reply = data.choices?.[0]?.message?.content || 'Sorry, something went wrong.'
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
      // Save to Supabase support_chats
      try {
        await fetch(`${SUPABASE_URL}/rest/v1/support_chats`, {
          method: 'POST', headers: { ...SB_H, 'Prefer': 'return=minimal' },
          body: JSON.stringify({
            session_id: SESSION_ID,
            message: input,
            reply: reply,
            status: 'open'
          })
        })
      } catch(e) { console.log('Save chat error:', e) }
    } catch(e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error connecting. Please try again.' }])
    }
    setLoading(false)
  }

  const quickReplies = systemPrompt === SUPPORT_SYSTEM
    ? ['How do I register?', 'How does AI matching work?', 'How to post a job?', 'What is consultant portal?']
    : ['Write a LinkedIn post', 'Cold email for companies', 'WhatsApp marketing message', 'Create a tagline']

  return (
    <div style={{
      position: 'fixed', bottom: 90, right: 20,
      width: 360, height: 520,
      background: 'white',
      borderRadius: 20,
      boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      display: 'flex', flexDirection: 'column',
      zIndex: 1000,
      border: '1px solid #e5e7eb',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        background: color,
        padding: '16px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20
          }}>{emoji}</div>
          <div>
            <div style={{color: 'white', fontWeight: 700, fontSize: 15}}>{title}</div>
            <div style={{color: 'rgba(255,255,255,0.7)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4}}>
              <div style={{width: 6, height: 6, borderRadius: 3, background: '#4ade80'}} />
              Online • AI Powered
            </div>
          </div>
        </div>
        <button onClick={onClose} style={{
          background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white',
          width: 28, height: 28, borderRadius: 8, cursor: 'pointer', fontSize: 16
        }}>×</button>
      </div>

      {/* Messages */}
      <div style={{flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12}}>
        {messages.map((msg, i) => (
          <div key={i} style={{display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'}}>
            {msg.role === 'assistant' && (
              <div style={{
                width: 28, height: 28, borderRadius: 8, background: color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, marginRight: 8, flexShrink: 0, alignSelf: 'flex-end'
              }}>{emoji}</div>
            )}
            <div style={{
              maxWidth: '75%',
              padding: '10px 14px',
              borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              background: msg.role === 'user' ? color : '#f3f4f6',
              color: msg.role === 'user' ? 'white' : '#111827',
              fontSize: 13,
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap'
            }}>{msg.content}</div>
          </div>
        ))}
        {loading && (
          <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
            <div style={{width: 28, height: 28, borderRadius: 8, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14}}>{emoji}</div>
            <div style={{background: '#f3f4f6', padding: '10px 14px', borderRadius: '16px 16px 16px 4px', display: 'flex', gap: 4}}>
              {[0,1,2].map(i => <div key={i} style={{width: 6, height: 6, borderRadius: 3, background: '#9ca3af', animation: `bounce 1s ease-in-out ${i*0.2}s infinite`}} />)}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick replies */}
      {messages.length <= 1 && (
        <div style={{padding: '0 12px 8px', display: 'flex', flexWrap: 'wrap', gap: 6}}>
          {quickReplies.map(qr => (
            <button key={qr} onClick={() => { setInput(qr); setTimeout(() => send(), 100) }}
              style={{
                background: '#f3f4f6', border: 'none', borderRadius: 999,
                padding: '5px 10px', fontSize: 11, cursor: 'pointer', color: '#374151'
              }}>{qr}</button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{padding: '12px 16px', borderTop: '1px solid #f3f4f6', display: 'flex', gap: 8}}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Type your message..."
          style={{
            flex: 1, border: '1px solid #e5e7eb', borderRadius: 12,
            padding: '10px 14px', fontSize: 13, outline: 'none',
            background: '#f9fafb'
          }}
        />
        <button onClick={send} disabled={loading || !input.trim()} style={{
          width: 40, height: 40, borderRadius: 12, border: 'none',
          background: color, color: 'white', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, opacity: loading || !input.trim() ? 0.5 : 1
        }}>➤</button>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  )
}

const AIAgents = () => {
  const [activeAgent, setActiveAgent] = useState(null)
  const [showMenu, setShowMenu] = useState(false)

  const agents = [
    {
      id: 'support',
      title: 'Zeni Support',
      emoji: '🤖',
      system: SUPPORT_SYSTEM,
      placeholder: 'How can I help you with Zenrixi today?',
      color: 'linear-gradient(135deg, #2563eb, #4f46e5)',
      colorSolid: '#2563eb',
      desc: 'Platform Support'
    }
  ]

  const active = agents.find(a => a.id === activeAgent)

  return (
    <>
      {/* Active chat window */}
      {active && (
        <ChatWindow
          title={active.title}
          emoji={active.emoji}
          systemPrompt={active.system}
          placeholder={active.placeholder}
          color={active.colorSolid}
          onClose={() => setActiveAgent(null)}
        />
      )}

      {/* Agent selector menu */}
      {showMenu && !activeAgent && (
        <div style={{
          position: 'fixed', bottom: 90, right: 20,
          background: 'white', borderRadius: 20,
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          padding: 16, zIndex: 999,
          border: '1px solid #e5e7eb',
          width: 240
        }}>
          <p style={{fontSize: 12, color: '#6b7280', marginBottom: 12, fontWeight: 600}}>CHOOSE AN AGENT</p>
          {agents.map(agent => (
            <button key={agent.id} onClick={() => { setActiveAgent(agent.id); setShowMenu(false) }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px', borderRadius: 12, border: 'none',
                background: 'transparent', cursor: 'pointer', marginBottom: 8,
                textAlign: 'left'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: agent.colorSolid,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20
              }}>{agent.emoji}</div>
              <div>
                <div style={{fontWeight: 700, fontSize: 14, color: '#111827'}}>{agent.title}</div>
                <div style={{fontSize: 11, color: '#6b7280'}}>{agent.desc}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* FAB Button */}
      <button
        onClick={() => { setActiveAgent(activeAgent ? null : 'support'); setShowMenu(false) }}
        style={{
          position: 'fixed', bottom: 24, right: 20,
          width: 60, height: 60, borderRadius: 20,
          background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
          border: 'none', color: 'white', cursor: 'pointer',
          boxShadow: '0 8px 30px rgba(37,99,235,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26, zIndex: 998,
          transition: 'transform 0.2s'
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        {showMenu ? '✕' : '🤖'}
      </button>
    </>
  )
}

export default AIAgents
