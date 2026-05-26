import { useState, type ReactNode } from 'react'
import { acknowledgePrivacy } from '../api/client'

interface Props {
  organizationName: string
  acknowledgementText: string
  currentVersion: string
  onAcknowledged: () => void
}

// ──────────────────────────────────────────────────────────────────────
// Privacy Acknowledgement Modal
//
// BLOCKING: no close button, no backdrop click, no escape key.
// Renders OUTSIDE all routing — rendered conditionally from App.tsx
// when /privacy/status returns needs_acknowledgement === true.
//
// User MUST click "I Acknowledge & Continue" to proceed.
// ──────────────────────────────────────────────────────────────────────

export function PrivacyAcknowledgementModal({
  acknowledgementText,
  currentVersion,
  onAcknowledged,
}: Props) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAcknowledge() {
    setSubmitting(true)
    setError(null)
    try {
      await acknowledgePrivacy(currentVersion)
      onAcknowledged()
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to record acknowledgement. Please try again.')
      setSubmitting(false)
    }
  }

  // Render the text with paragraphs and bullet list
  function renderText() {
    const lines = acknowledgementText.split('\n')
    const blocks: ReactNode[] = []
    let currentBullets: string[] = []
    let key = 0

    function flushBullets() {
      if (currentBullets.length > 0) {
        blocks.push(
          <ul key={`ul-${key++}`} className="k-privacy-bullets">
            {currentBullets.map((b, i) => <li key={i}>{b}</li>)}
          </ul>
        )
        currentBullets = []
      }
    }

    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.startsWith('- ')) {
        currentBullets.push(trimmed.slice(2))
      } else if (trimmed.length === 0) {
        flushBullets()
      } else {
        flushBullets()
        const isHeading = trimmed === lines[0].trim()
        blocks.push(
          isHeading
            ? <h2 key={`h-${key++}`} className="k-privacy-heading">{trimmed}</h2>
            : <p key={`p-${key++}`} className="k-privacy-para">{trimmed}</p>
        )
      }
    }
    flushBullets()
    return blocks
  }

  return (
    <div className="k-privacy-overlay" role="dialog" aria-modal="true" aria-labelledby="privacy-title">
      <div className="k-privacy-modal">
        <div className="k-privacy-content">
          {renderText()}
        </div>

        {error && (
          <div className="k-privacy-error" role="alert">
            {error}
          </div>
        )}

        <div className="k-privacy-actions">
          <button
            className="k-btn k-btn-primary k-privacy-btn"
            onClick={handleAcknowledge}
            disabled={submitting}
            autoFocus
          >
            {submitting ? 'Recording…' : 'I Acknowledge & Continue'}
          </button>
        </div>
      </div>
    </div>
  )
}
