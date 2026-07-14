// KINALYS-BAND-SOURCE
// The ONE org performance band source for the web (F2, 8 Jul 2026). Values are
// intentionally duplicated with the API source (kinalys-platform
// apps/api/src/services/scoring.ts, same marker) until the Phase 2
// org-configurable band work introduces a shared source. Every green/amber/red
// banding of a 0-100 org performance score imports from here.

export const BAND_GREEN_MIN = 85 // score >= 85 -> green band
export const BAND_AMBER_MIN = 70 // score >= 70 -> amber band; below -> red

export type ScoreBand = 'green' | 'amber' | 'red'

export function bandForScore(score: number): ScoreBand {
  return score >= BAND_GREEN_MIN ? 'green' : score >= BAND_AMBER_MIN ? 'amber' : 'red'
}

// Theme-aware design tokens for band text / backgrounds.
export function colorForBand(band: string): string {
  if (band === 'green') return 'var(--k-success-text)'
  if (band === 'amber') return 'var(--k-warning-text)'
  return 'var(--k-danger-text)'
}

export function bgForBand(band: string): string {
  if (band === 'green') return 'var(--k-success-bg)'
  if (band === 'amber') return 'var(--k-warning-bg)'
  return 'var(--k-danger-bg)'
}

export function colorForScore(score: number): string {
  return colorForBand(bandForScore(score))
}

export function bgForScore(score: number): string {
  return bgForBand(bandForScore(score))
}

// Org band display labels keyed to the same boundaries.
export function labelForScore(score: number): string {
  const band = bandForScore(score)
  if (band === 'green') return 'High Performance'
  if (band === 'amber') return 'Medium Performance'
  return 'Needs Improvement'
}
