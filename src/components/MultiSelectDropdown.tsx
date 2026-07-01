import { useEffect, useRef, useState } from 'react'

export interface MultiSelectOption {
  value: string
  label: string
}

interface MultiSelectDropdownProps {
  label: string
  options: MultiSelectOption[]
  selectedValues: string[]
  onChange: (values: string[]) => void
  placeholder?: string
}

// Shared multi-select (MULTISELECT-SWEEP). Live model: every checkbox click
// calls onChange immediately with the updated selection — no draft/commit
// layer. Done, Escape, and outside-click all do the same single thing: close
// the panel (nothing destructive to protect against, unlike a confirm modal).
export default function MultiSelectDropdown({
  label, options, selectedValues, onChange, placeholder = 'Select...',
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  function close() {
    setIsOpen(false)
    // Return focus to the trigger so keyboard focus is never stranded on a
    // control inside the now-hidden panel.
    triggerRef.current?.focus()
  }

  useEffect(() => {
    if (!isOpen) return
    function onMouseDown(e: MouseEvent) {
      const t = e.target as Node
      if (!triggerRef.current?.contains(t) && !panelRef.current?.contains(t)) {
        // Outside-click: close without stealing focus back to the trigger
        // (the user is interacting elsewhere on the page).
        setIsOpen(false)
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') { e.stopPropagation(); close() }
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen])

  function toggleValue(value: string) {
    onChange(
      selectedValues.includes(value)
        ? selectedValues.filter(v => v !== value)
        : [...selectedValues, value]
    )
  }

  const count = selectedValues.length
  const summary = count === 0
    ? placeholder
    : count === 1
      ? (options.find(o => o.value === selectedValues[0])?.label ?? '1 selected')
      : `${count} selected`

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={label}
        onClick={() => setIsOpen(o => !o)}
        style={{
          width: '100%', fontSize: '13px', padding: '8px 12px', borderRadius: 'var(--k-radius-md)',
          border: `1px solid ${count > 0 ? 'var(--k-brand-primary)' : 'var(--k-border-input)'}`,
          background: count > 0 ? 'var(--k-brand-faint)' : 'var(--k-bg-input)',
          color: count > 0 ? 'var(--k-text-primary)' : 'var(--k-text-muted)',
          fontFamily: 'var(--k-font-sans)', cursor: 'pointer', display: 'flex',
          justifyContent: 'space-between', alignItems: 'center', minHeight: '38px', textAlign: 'left',
        }}
      >
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{summary}</span>
        <span aria-hidden="true" style={{ fontSize: '10px', marginLeft: '8px', flexShrink: 0 }}>{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div
          ref={panelRef}
          role="listbox"
          aria-label={label}
          aria-multiselectable="true"
          style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
            background: 'var(--k-bg-surface)', border: '1px solid var(--k-border-strong)',
            borderRadius: 'var(--k-radius-md)', boxShadow: 'var(--k-shadow-md)', marginTop: '4px',
            display: 'flex', flexDirection: 'column', maxHeight: '280px',
          }}
        >
          <div style={{ overflowY: 'auto', flex: 1, padding: '4px 0' }}>
            {options.length === 0 ? (
              <div style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--k-text-muted)' }}>No options</div>
            ) : options.map(opt => {
              const checked = selectedValues.includes(opt.value)
              const id = `msd-${label}-${opt.value}`
              return (
                <label
                  key={opt.value}
                  htmlFor={id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px',
                    fontSize: '13px', cursor: 'pointer',
                    background: checked ? 'var(--k-brand-faint)' : 'transparent',
                    color: checked ? 'var(--k-brand-primary)' : 'var(--k-text-primary)',
                  }}
                >
                  <input
                    id={id}
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleValue(opt.value)}
                    style={{ cursor: 'pointer', flexShrink: 0 }}
                  />
                  {opt.label}
                </label>
              )
            })}
          </div>
          <div style={{ borderTop: '1px solid var(--k-border-default)', padding: '8px', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" className="k-btn k-btn-primary" onClick={close} style={{ fontSize: '12px', padding: '6px 16px' }}>
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
