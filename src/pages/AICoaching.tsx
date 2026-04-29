import { useState, useEffect, useRef } from 'react'
import { getMyScorecard, getReviewCycles, apiClient } from '../api/client'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface KpiSummary {
  name: string
  weight_pct: number
  target_value: number | null
  actual_value: number | null
  score: number | null
  rag_status: string | null
  status: string
}

export default function AICoaching() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [scorecardLoading, setScorecardLoading] = useState(true)
  const [scorecard, setScorecard] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [sessionStarted, setSessionStarted] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { loadScorecard() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function loadScorecard() {
    setScorecardLoading(true)
    try {
      const data = await getMyScorecard()
      setScorecard(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setScorecardLoading(false)
    }
  }

  function buildSystemPrompt(): string {
    const liveKpis: KpiSummary[] = scorecard?.kpis?.filter((k: any) => k.status === 'live') || []
    const cycle = scorecard?.cycle

    const kpiSummary = liveKpis.map((k: KpiSummary) => {
      const progress = k.target_value && k.actual_value !== null
        ? ((k.actual_value / k.target_value) * 100).toFixed(1)
        : null
      return `- ${k.name}: Target ${k.target_value ?? 'not set'}, Actual ${k.actual_value ?? 'not yet entered'}, Score ${k.score !== null ? Number(k.score).toFixed(1) + '%' : 'pending'}, RAG ${k.rag_status?.toUpperCase() ?? 'unknown'}${progress ? `, Progress ${progress}%` : ''}`
    }).join('\n')

    const overallScore = scorecard?.calculated_score ?? null
    const performanceBand = overallScore !== null
      ? overallScore >= 90 ? 'High Performance'
        : overallScore >= 80 ? 'Medium Performance'
        : 'Needs Improvement'
      : 'Not yet scored'

    return `You are Kinalys AI Coach — a warm, direct, and highly knowledgeable performance coach embedded in the Kinalys platform. You have access to this employee's live scorecard data and your job is to help them understand their performance, identify areas for improvement, and give specific actionable coaching.

CURRENT SCORECARD DATA:
Review Cycle: ${cycle?.name ?? 'Unknown'} (${cycle?.status ?? 'Unknown'})
Overall Score: ${overallScore !== null ? overallScore + '%' : 'Not yet calculated'}
Performance Band: ${performanceBand}

LIVE KPIs:
${kpiSummary || 'No live KPIs found for this cycle.'}

YOUR COACHING APPROACH:
- Be specific — reference the employee's actual KPI names, scores, and targets
- Be direct but warm — do not hedge or give generic advice
- Give concrete next steps — not abstract recommendations
- When an employee asks about a KPI, explain what it means and how to improve it specifically
- Flag RED KPIs immediately and give a clear recovery plan
- Celebrate GREEN KPIs genuinely but briefly — focus on what is next
- Never make up data — only reference what is in the scorecard above
- Keep responses concise — 3-5 sentences unless the employee asks for more detail
- If asked something outside your scope (HR policy, salary, etc.), politely redirect to their HR team

START: When the conversation begins, give a brief, personalised scorecard summary and identify the single most important thing the employee should focus on today.`
  }

  async function startSession() {
    setSessionStarted(true)
    setLoading(true)
    try {
      const systemPrompt = buildSystemPrompt()
      const response = await apiClient.post('/ai/coach', {
        system: systemPrompt,
        messages: [{ role: 'user', content: 'Hello, I would like to review my performance.' }],
      })
      const assistantMessage = response.data.content || 'Hello! I am your Kinalys AI Coach. How can I help you today?'
      setMessages([
        { role: 'user', content: 'Hello, I would like to review my performance.' },
        { role: 'assistant', content: assistantMessage },
      ])
   } catch (err: any) {
      console.error('AI Coach error:', err)
      console.error('Response:', err.response?.data)
      setError(`Could not connect: ${err.response?.data?.message || err.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function sendMessage() {
    if (!input.trim() || loading) return
    const userMessage = input.trim()
    setInput('')
    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }]
    setMessages(newMessages)
    setLoading(true)
    try {
      const systemPrompt = buildSystemPrompt()
      const response = await apiClient.post('/ai/coach', {
        system: systemPrompt,
        messages: newMessages,
      })
      const assistantMessage = response.data.content || 'I am having trouble responding right now. Please try again.'
      setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }])
    } catch (err: any) {
      setError('Message failed. Please try again.')
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const liveKpis = scorecard?.kpis?.filter((k: any) => k.status === 'live') || []
  const overallScore = scorecard?.calculated_score ?? null
  const redKpis = liveKpis.filter((k: any) => k.rag_status === 'red')
  const greenKpis = liveKpis.filter((k: any) => k.rag_status === 'green')

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--k-border-default)', background: 'var(--k-bg-surface)', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="k-page-title" style={{ marginBottom: '2px' }}>🤖 AI Coaching</div>
            <div className="k-page-sub">Powered by Claude · Reads your live scorecard · Personalised coaching</div>
          </div>
          {sessionStarted && (
            <button
              onClick={() => { setMessages([]); setSessionStarted(false) }}
              style={{ fontSize: '12px', padding: '6px 14px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-default)', background: 'var(--k-bg-surface)', color: 'var(--k-text-muted)', cursor: 'pointer', fontFamily: 'var(--k-font-sans)' }}
            >
              ↺ New Session
            </button>
          )}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Scorecard sidebar */}
        <div style={{ width: '260px', flexShrink: 0, borderRight: '1px solid var(--k-border-default)', overflowY: 'auto', background: 'var(--k-bg-surface)', padding: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Your Scorecard</div>

          {scorecardLoading ? (
            <div style={{ fontSize: '12px', color: 'var(--k-text-muted)' }}>Loading...</div>
          ) : (
            <>
              {/* Overall score */}
              <div style={{ background: 'var(--k-bg-page)', borderRadius: 'var(--k-radius-md)', padding: '14px', marginBottom: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', fontWeight: 800, color: overallScore !== null && overallScore >= 90 ? 'var(--k-success-text)' : overallScore !== null && overallScore >= 80 ? 'var(--k-warning-text)' : overallScore !== null ? 'var(--k-danger-text)' : 'var(--k-text-muted)' }}>
                  {overallScore !== null ? `${overallScore}%` : '—'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--k-text-muted)', marginTop: '4px' }}>
                  {scorecard?.cycle?.name || 'No active cycle'}
                </div>
              </div>

              {/* RAG summary */}
              {liveKpis.length > 0 && (
                <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                  {greenKpis.length > 0 && <div style={{ flex: 1, textAlign: 'center', background: 'var(--k-success-bg)', borderRadius: 'var(--k-radius-sm)', padding: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--k-success-text)' }}>🟢 {greenKpis.length}</div>}
                  {liveKpis.filter((k: any) => k.rag_status === 'amber').length > 0 && <div style={{ flex: 1, textAlign: 'center', background: 'var(--k-warning-bg)', borderRadius: 'var(--k-radius-sm)', padding: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--k-warning-text)' }}>🟡 {liveKpis.filter((k: any) => k.rag_status === 'amber').length}</div>}
                  {redKpis.length > 0 && <div style={{ flex: 1, textAlign: 'center', background: 'var(--k-danger-bg)', borderRadius: 'var(--k-radius-sm)', padding: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--k-danger-text)' }}>🔴 {redKpis.length}</div>}
                </div>
              )}

              {/* KPI list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {liveKpis.map((kpi: any) => (
                  <div key={kpi.id} style={{ padding: '10px', background: 'var(--k-bg-page)', borderRadius: 'var(--k-radius-sm)', border: `1px solid ${kpi.rag_status === 'red' ? 'var(--k-danger-border)' : kpi.rag_status === 'amber' ? 'var(--k-warning-border)' : kpi.rag_status === 'green' ? 'var(--k-success-border)' : 'var(--k-border-default)'}` }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--k-text-primary)', marginBottom: '3px', lineHeight: 1.3 }}>{kpi.name}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--k-text-muted)' }}>
                      <span>{kpi.actual_value ?? '—'} / {kpi.target_value ?? '—'}</span>
                      <span style={{ fontWeight: 700, color: kpi.rag_status === 'red' ? 'var(--k-danger-text)' : kpi.rag_status === 'amber' ? 'var(--k-warning-text)' : kpi.rag_status === 'green' ? 'var(--k-success-text)' : 'var(--k-text-muted)' }}>
                        {kpi.score !== null ? `${Number(kpi.score).toFixed(0)}%` : '—'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {liveKpis.length === 0 && (
                <div style={{ fontSize: '12px', color: 'var(--k-text-muted)', textAlign: 'center', marginTop: '24px', lineHeight: 1.6 }}>
                  No live KPIs for this cycle yet. Ask your HR Admin to apply templates.
                </div>
              )}
            </>
          )}
        </div>

        {/* Chat area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {error && (
            <div style={{ background: 'var(--k-danger-bg)', border: '1px solid var(--k-danger-border)', padding: '12px 20px', fontSize: '13px', color: 'var(--k-danger-text)', display: 'flex', justifyContent: 'space-between' }}>
              <span>⚠ {error}</span>
              <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--k-danger-text)', fontWeight: 700 }}>✕</button>
            </div>
          )}

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
            {!sessionStarted ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤖</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--k-text-primary)', marginBottom: '8px' }}>Your AI Performance Coach</div>
                <div style={{ fontSize: '14px', color: 'var(--k-text-muted)', maxWidth: '420px', lineHeight: 1.7, marginBottom: '28px' }}>
                  I have read your live scorecard. I know your KPI scores, targets, and RAG status. Start a session and I will give you personalised, specific coaching — not generic advice.
                </div>
                {redKpis.length > 0 && (
                  <div style={{ background: 'var(--k-danger-bg)', border: '1px solid var(--k-danger-border)', borderRadius: 'var(--k-radius-md)', padding: '12px 18px', marginBottom: '20px', fontSize: '13px', color: 'var(--k-danger-text)', fontWeight: 600 }}>
                    ⚠ {redKpis.length} KPI{redKpis.length !== 1 ? 's' : ''} in RED — I will address these first.
                  </div>
                )}
                <button
                  className="k-btn k-btn-primary"
                  onClick={startSession}
                  disabled={scorecardLoading}
                  style={{ fontSize: '14px', padding: '12px 28px' }}
                >
                  {scorecardLoading ? '⏳ Loading scorecard...' : '▶ Start Coaching Session'}
                </button>
                <div style={{ marginTop: '16px', fontSize: '11px', color: 'var(--k-text-muted)' }}>
                  Powered by Claude · Your data stays within Kinalys
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {messages.map((msg, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: msg.role === 'user' ? 'var(--k-brand-primary)' : 'var(--k-bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0, border: '1px solid var(--k-border-default)' }}>
                      {msg.role === 'user' ? '👤' : '🤖'}
                    </div>
                    <div style={{
                      maxWidth: '72%',
                      padding: '12px 16px',
                      borderRadius: msg.role === 'user' ? 'var(--k-radius-lg) var(--k-radius-lg) var(--k-radius-sm) var(--k-radius-lg)' : 'var(--k-radius-lg) var(--k-radius-lg) var(--k-radius-lg) var(--k-radius-sm)',
                      background: msg.role === 'user' ? 'var(--k-brand-primary)' : 'var(--k-bg-surface)',
                      border: msg.role === 'user' ? 'none' : '1px solid var(--k-border-default)',
                      fontSize: '13px',
                      lineHeight: 1.7,
                      color: msg.role === 'user' ? 'white' : 'var(--k-text-primary)',
                      whiteSpace: 'pre-wrap',
                    }}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--k-bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0, border: '1px solid var(--k-border-default)' }}>🤖</div>
                    <div style={{ padding: '12px 16px', borderRadius: 'var(--k-radius-lg)', background: 'var(--k-bg-surface)', border: '1px solid var(--k-border-default)', fontSize: '13px', color: 'var(--k-text-muted)' }}>
                      <span style={{ animation: 'pulse 1.5s infinite' }}>Thinking...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input area */}
          {sessionStarted && (
            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--k-border-default)', background: 'var(--k-bg-surface)', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                  placeholder="Ask your coach anything about your performance... (Enter to send, Shift+Enter for new line)"
                  rows={2}
                  style={{ flex: 1, fontSize: '13px', padding: '10px 14px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-input)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)', resize: 'none', lineHeight: 1.5 }}
                />
                <button
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  style={{ padding: '10px 18px', borderRadius: 'var(--k-radius-md)', background: loading || !input.trim() ? 'var(--k-border-default)' : 'var(--k-brand-primary)', border: 'none', color: 'white', cursor: loading || !input.trim() ? 'default' : 'pointer', fontSize: '16px', flexShrink: 0, height: '44px' }}
                >
                  ➤
                </button>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--k-text-muted)', marginTop: '6px' }}>
                Suggested: "What should I focus on today?" · "Why is my [KPI] red?" · "How do I improve my score?"
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
