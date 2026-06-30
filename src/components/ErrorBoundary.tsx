import { Component, ErrorInfo, ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  /** Optional label shown in the fallback (e.g. the page name) so a per-page
   *  boundary reads "This page ran into a problem" without taking down the shell. */
  label?: string
  /** When this value changes the boundary resets itself (used to clear the
   *  error when the user navigates to a different page). */
  resetKey?: string | number
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

const IS_DEV = process.env.NODE_ENV !== 'production'

/**
 * Catches render-time crashes in its subtree and shows a recoverable fallback
 * instead of a blank white screen. Used both at the top level (App) and around
 * each page-level route so one broken page does not take down the whole shell.
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Surface to the console for diagnostics; no remote logger wired in this repo.
    console.error('[ErrorBoundary]', this.props.label || 'app', error, info.componentStack)
  }

  componentDidUpdate(prev: ErrorBoundaryProps) {
    // Reset on navigation: when the resetKey changes, clear the error so the
    // newly-selected page gets a fresh attempt to render.
    if (this.state.hasError && prev.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, error: null })
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div role="alert" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '320px', padding: '48px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>{'⚠️'}</div>
        <div style={{ fontFamily: 'var(--k-font-display)', fontSize: '20px', fontWeight: 700, color: 'var(--k-text-primary)', marginBottom: '8px' }}>
          Something went wrong
        </div>
        <div style={{ fontSize: '14px', color: 'var(--k-text-muted)', maxWidth: '440px', marginBottom: '20px', lineHeight: 1.6 }}>
          {this.props.label
            ? `The ${this.props.label} page ran into an unexpected problem. The rest of the app is still available from the menu.`
            : 'An unexpected problem occurred. You can try reloading the page.'}
        </div>
        {IS_DEV && this.state.error && (
          <pre style={{ fontSize: '11px', fontFamily: 'var(--k-font-mono)', color: 'var(--k-danger-text)', background: 'var(--k-danger-bg)', border: '1px solid var(--k-danger-border)', borderRadius: 'var(--k-radius-md)', padding: '10px 14px', maxWidth: '560px', overflowX: 'auto', textAlign: 'left', marginBottom: '20px' }}>
            {this.state.error.message}
          </pre>
        )}
        <button className="k-btn k-btn-primary" onClick={() => window.location.reload()} style={{ padding: '10px 22px', fontSize: '14px' }}>
          Reload
        </button>
      </div>
    )
  }
}
