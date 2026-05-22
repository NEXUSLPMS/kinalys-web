import { useEffect, useRef } from 'react'

interface StatRingProps {
  value: number        // 0-100
  size?: number        // diameter in px, default 52
  stroke?: number      // stroke width, default 4
  color?: string       // stroke colour, default var(--k-brand-primary)
  trackColor?: string  // background ring colour
  animate?: boolean    // animate on mount, default true
}

export default function StatRing({
  value,
  size = 52,
  stroke = 4,
  color = 'var(--k-brand-primary)',
  trackColor = 'var(--k-border-default)',
  animate = true,
}: StatRingProps) {
  const circleRef = useRef<SVGCircleElement>(null)
  const center = size / 2
  const radius = center - stroke - 2
  const circumference = 2 * Math.PI * radius
  const pct = Math.min(100, Math.max(0, value || 0))
  const offset = circumference - (pct / 100) * circumference

  useEffect(() => {
    const el = circleRef.current
    if (!el || !animate) return
    // Start from full offset (empty) then animate to target
    el.style.strokeDashoffset = String(circumference)
    el.style.transition = 'none'
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transition = 'stroke-dashoffset 900ms cubic-bezier(0.4,0,0.2,1)'
        el.style.strokeDashoffset = String(offset)
      })
    })
  }, [value, circumference, offset, animate])

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ flexShrink: 0 }}
      aria-hidden="true"
    >
      {/* Track ring */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={trackColor}
        strokeWidth={stroke}
      />
      {/* Progress ring */}
      <circle
        ref={circleRef}
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={animate ? circumference : offset}
        transform={`rotate(-90 ${center} ${center})`}
        style={{ transition: animate ? undefined : 'none' }}
      />
    </svg>
  )
}