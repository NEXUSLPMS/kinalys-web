import { useState, useEffect, useRef } from 'react'
import { startPktTest, submitPktTest, getPktHistory } from '../api/client'

interface Question {
  id: string
  question: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  topic: string
  difficulty: string
}

interface Answer {
  question_id: string
  selected_option: string
}

interface TestResult {
  test_id: string
  score_pct: number
  correct: number
  total: number
  time_taken_seconds: number
  pass: boolean
  answers: any[]
}

interface HistoryItem {
  id: string
  total_questions: number
  correct_answers: number
  score_pct: number
  time_taken_seconds: number
  completed_at: string
}

type Phase = 'home' | 'test' | 'result'

export default function PKTEngine() {
  const [phase, setPhase] = useState<Phase>('home')
  const [questions, setQuestions] = useState<Question[]>([])
  const [testId, setTestId] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [selectedOption, setSelectedOption] = useState<string>('')
  const [result, setResult] = useState<TestResult | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [questionCount, setQuestionCount] = useState(10)
  const [topic, setTopic] = useState('')
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [showExplanations, setShowExplanations] = useState(false)
  const timerRef = useRef<any>(null)
  const startTimeRef = useRef<number>(0)

  useEffect(() => {
    loadHistory()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  async function loadHistory() {
    try {
      const data = await getPktHistory()
      setHistory(data.tests || [])
    } catch {}
  }

  async function handleStart() {
    setLoading(true)
    setError('')
    try {
      const data = await startPktTest(questionCount, topic || undefined)
      setTestId(data.test_id)
      setQuestions(data.questions)
      setAnswers([])
      setCurrentIndex(0)
      setSelectedOption('')
      setElapsedSeconds(0)
      startTimeRef.current = Date.now()
      timerRef.current = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000))
      }, 1000)
      setPhase('test')
    } catch (err: any) {
      setError(err.response?.data?.error === 'no_questions_available'
        ? 'No questions available for this topic. Try a different topic or all topics.'
        : 'Failed to start test. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleSelectOption(opt: string) {
    setSelectedOption(opt)
  }

  function handleNext() {
    if (!selectedOption) return
    const newAnswers = [...answers, { question_id: questions[currentIndex].id, selected_option: selectedOption }]
    setAnswers(newAnswers)
    setSelectedOption('')
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(currentIndex + 1)
    } else {
      handleSubmit(newAnswers)
    }
  }

  async function handleSubmit(finalAnswers: Answer[]) {
    if (timerRef.current) clearInterval(timerRef.current)
    setLoading(true)
    try {
      const data = await submitPktTest({
        test_id: testId,
        answers: finalAnswers,
        time_taken_seconds: elapsedSeconds
      })
      setResult(data)
      setPhase('result')
      loadHistory()
    } catch (err: any) {
      setError('Failed to submit test. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  function getScoreColor(score: number) {
    if (score >= 90) return 'var(--k-success-text)'
    if (score >= 70) return 'var(--k-warning-text)'
    return 'var(--k-danger-text)'
  }

  function getScoreBg(score: number) {
    if (score >= 90) return 'var(--k-success-bg)'
    if (score >= 70) return 'var(--k-warning-bg)'
    return 'var(--k-danger-bg)'
  }

  const topics = ['COPC', 'Six Sigma', 'Operations', 'Management', 'Talent', 'Performance', 'Strategy']
  const q = questions[currentIndex]
  const progress = questions.length > 0 ? ((currentIndex) / questions.length) * 100 : 0

  // ── HOME ──────────────────────────────────────────────────────
  if (phase === 'home') return (
    <div className="k-page">
      <div className="k-page-title">PKT Engine</div>
      <div className="k-page-sub">Periodic Knowledge Test — test your knowledge, track your progress</div>

      {error && <div style={{ background: 'var(--k-danger-bg)', border: '1px solid var(--k-danger-border)', borderRadius: 'var(--k-radius-md)', padding: '12px 16px', marginBottom: '16px', fontSize: '13px', color: 'var(--k-danger-text)' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>

        {/* Start Test Card */}
        <div className="k-card">
          <div className="k-card-header">
            <div className="k-card-title">🧠 Start a New Test</div>
          </div>
          <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--k-text-secondary)', display: 'block', marginBottom: '6px' }}>NUMBER OF QUESTIONS</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[5, 10, 15, 20].map(n => (
                  <button key={n} onClick={() => setQuestionCount(n)}
                    style={{ padding: '6px 14px', borderRadius: 'var(--k-radius-md)', border: '1px solid', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--k-font-sans)',
                      background: questionCount === n ? 'var(--k-brand-primary)' : 'var(--k-bg-page)',
                      color: questionCount === n ? 'white' : 'var(--k-text-secondary)',
                      borderColor: questionCount === n ? 'var(--k-brand-primary)' : 'var(--k-border-default)' }}>
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--k-text-secondary)', display: 'block', marginBottom: '6px' }}>TOPIC (OPTIONAL)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                <button onClick={() => setTopic('')}
                  style={{ padding: '4px 12px', borderRadius: '20px', border: '1px solid', fontSize: '12px', cursor: 'pointer', fontFamily: 'var(--k-font-sans)',
                    background: topic === '' ? 'var(--k-brand-primary)' : 'var(--k-bg-page)',
                    color: topic === '' ? 'white' : 'var(--k-text-secondary)',
                    borderColor: topic === '' ? 'var(--k-brand-primary)' : 'var(--k-border-default)' }}>
                  All Topics
                </button>
                {topics.map(t => (
                  <button key={t} onClick={() => setTopic(t)}
                    style={{ padding: '4px 12px', borderRadius: '20px', border: '1px solid', fontSize: '12px', cursor: 'pointer', fontFamily: 'var(--k-font-sans)',
                      background: topic === t ? 'var(--k-brand-primary)' : 'var(--k-bg-page)',
                      color: topic === t ? 'white' : 'var(--k-text-secondary)',
                      borderColor: topic === t ? 'var(--k-brand-primary)' : 'var(--k-border-default)' }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handleStart} disabled={loading}
              style={{ width: '100%', padding: '12px', background: 'var(--k-brand-primary)', color: 'white', border: 'none', borderRadius: 'var(--k-radius-md)', fontSize: '14px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'var(--k-font-sans)', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Loading questions...' : `Start ${questionCount}-Question Test`}
            </button>
          </div>
        </div>

        {/* History Card */}
        <div className="k-card">
          <div className="k-card-header">
            <div className="k-card-title">📊 Your Test History</div>
          </div>
          <div style={{ padding: '0' }}>
            {history.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--k-text-muted)', fontSize: '13px' }}>No tests taken yet. Start your first test!</div>
            ) : (
              <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                {history.map((h, i) => (
                  <div key={h.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--k-border-default)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--k-text-primary)' }}>
                        {h.correct_answers}/{h.total_questions} correct
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--k-text-muted)', marginTop: '2px' }}>
                        {new Date(h.completed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        {h.time_taken_seconds > 0 && ` · ${formatTime(h.time_taken_seconds)}`}
                      </div>
                    </div>
                    <div style={{ background: getScoreBg(h.score_pct), color: getScoreColor(h.score_pct), padding: '4px 10px', borderRadius: '20px', fontSize: '13px', fontWeight: 700 }}>
                      {Number(h.score_pct).toFixed(0)}%
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  // ── TEST ──────────────────────────────────────────────────────
  if (phase === 'test' && q) return (
    <div className="k-page">
      {/* Progress bar */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--k-text-secondary)' }}>
            Question {currentIndex + 1} of {questions.length}
          </div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--k-text-muted)' }}>
            ⏱ {formatTime(elapsedSeconds)}
          </div>
        </div>
        <div style={{ height: '6px', background: 'var(--k-border-default)', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'var(--k-brand-primary)', borderRadius: '3px', transition: 'width 0.3s ease' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
          <span style={{ fontSize: '11px', color: 'var(--k-text-muted)' }}>{q.topic}</span>
          <span style={{ fontSize: '11px', color: 'var(--k-text-muted)', textTransform: 'capitalize' }}>{q.difficulty}</span>
        </div>
      </div>

      {/* Question */}
      <div className="k-card" style={{ marginBottom: '16px' }}>
        <div style={{ padding: '24px' }}>
          <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--k-text-primary)', lineHeight: 1.5, marginBottom: '24px' }}>
            {q.question}
          </div>

          {/* Options */}
          {(['a', 'b', 'c', 'd'] as const).map(opt => (
            <button key={opt} onClick={() => handleSelectOption(opt)}
              style={{ width: '100%', textAlign: 'left', padding: '14px 16px', marginBottom: '8px', borderRadius: 'var(--k-radius-md)', border: '2px solid', cursor: 'pointer', fontFamily: 'var(--k-font-sans)', fontSize: '14px', transition: 'all 0.15s',
                background: selectedOption === opt ? 'var(--k-brand-faint)' : 'var(--k-bg-page)',
                borderColor: selectedOption === opt ? 'var(--k-brand-primary)' : 'var(--k-border-default)',
                color: selectedOption === opt ? 'var(--k-brand-dark)' : 'var(--k-text-primary)',
                fontWeight: selectedOption === opt ? 600 : 400 }}>
              <span style={{ fontWeight: 700, marginRight: '10px', color: selectedOption === opt ? 'var(--k-brand-primary)' : 'var(--k-text-muted)' }}>
                {opt.toUpperCase()}.
              </span>
              {q[`option_${opt}` as keyof Question] as string}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={handleNext} disabled={!selectedOption || loading}
          style={{ padding: '12px 28px', background: selectedOption ? 'var(--k-brand-primary)' : 'var(--k-border-default)', color: 'white', border: 'none', borderRadius: 'var(--k-radius-md)', fontSize: '14px', fontWeight: 700, cursor: selectedOption ? 'pointer' : 'not-allowed', fontFamily: 'var(--k-font-sans)' }}>
          {loading ? 'Submitting...' : currentIndex + 1 === questions.length ? 'Submit Test' : 'Next Question →'}
        </button>
      </div>
    </div>
  )

  // ── RESULT ────────────────────────────────────────────────────
  if (phase === 'result' && result) return (
    <div className="k-page">
      <div className="k-page-title">Test Complete</div>

      {/* Score card */}
      <div className="k-card" style={{ marginBottom: '24px', textAlign: 'center' }}>
        <div style={{ padding: '40px 24px' }}>
          <div style={{ fontSize: '64px', fontWeight: 800, color: getScoreColor(result.score_pct), fontFamily: 'var(--k-font-display)', lineHeight: 1 }}>
            {result.score_pct}%
          </div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: result.pass ? 'var(--k-success-text)' : 'var(--k-danger-text)', margin: '8px 0 4px' }}>
            {result.pass ? '✅ Passed' : '❌ Not Passed'}
          </div>
          <div style={{ fontSize: '14px', color: 'var(--k-text-muted)' }}>
            {result.correct} of {result.total} correct · {formatTime(result.time_taken_seconds)}
          </div>
          {result.pass && (
            <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--k-success-text)', background: 'var(--k-success-bg)', padding: '8px 16px', borderRadius: '20px', display: 'inline-block' }}>
              Your PKT Knowledge Score KPI has been updated
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <button onClick={() => setPhase('home')}
          style={{ padding: '10px 20px', background: 'var(--k-bg-page)', color: 'var(--k-text-primary)', border: '1px solid var(--k-border-default)', borderRadius: 'var(--k-radius-md)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--k-font-sans)' }}>
          ← Back to Home
        </button>
        <button onClick={() => setShowExplanations(!showExplanations)}
          style={{ padding: '10px 20px', background: 'var(--k-ai-bg)', color: 'var(--k-ai-text)', border: '1px solid var(--k-ai-border)', borderRadius: 'var(--k-radius-md)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--k-font-sans)' }}>
          {showExplanations ? 'Hide' : 'Show'} Explanations
        </button>
        <button onClick={handleStart}
          style={{ padding: '10px 20px', background: 'var(--k-brand-primary)', color: 'white', border: 'none', borderRadius: 'var(--k-radius-md)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--k-font-sans)' }}>
          Take Another Test
        </button>
      </div>

      {/* Answer review */}
      {showExplanations && (
        <div className="k-card">
          <div className="k-card-header">
            <div className="k-card-title">Answer Review</div>
          </div>
          <div>
            {result.answers.map((a, i) => (
              <div key={a.question_id} style={{ padding: '16px', borderBottom: '1px solid var(--k-border-default)', background: a.is_correct ? 'var(--k-success-bg)' : 'var(--k-danger-bg)' }}>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '16px' }}>{a.is_correct ? '✅' : '❌'}</span>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--k-text-primary)' }}>{a.question}</div>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--k-text-secondary)', marginLeft: '26px' }}>
                  Your answer: <strong>{a.selected_option?.toUpperCase()}. {a[`option_${a.selected_option}`]}</strong>
                  {!a.is_correct && (
                    <span> · Correct: <strong style={{ color: 'var(--k-success-text)' }}>{a.correct_option.toUpperCase()}. {a[`option_${a.correct_option}`]}</strong></span>
                  )}
                </div>
                {a.explanation && (
                  <div style={{ fontSize: '12px', color: 'var(--k-ai-text)', background: 'var(--k-ai-bg)', padding: '8px 12px', borderRadius: 'var(--k-radius-sm)', marginTop: '8px', marginLeft: '26px' }}>
                    💡 {a.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  return null
}