import type { Grade } from '../types'

export const GRADE_COLOR: Record<Grade, { bg: string; text: string; label: string }> = {
  A: { bg: 'bg-rose-400', text: 'text-rose-700', label: 'A등급 (고회전)' },
  B: { bg: 'bg-amber-400', text: 'text-amber-700', label: 'B등급 (중회전)' },
  C: { bg: 'bg-emerald-400', text: 'text-emerald-700', label: 'C등급 (저회전)' },
}
