import type { SubjectConfig } from '@/lib/types'

/**
 * Normalise the `subjects` field from Supabase.
 *
 * Old tests store subjects as plain strings: ["physics","chemistry"]
 * New tests store subjects as objects: [{name:"physics",max_marks:50},…]
 *
 * This adapter always returns SubjectConfig[] regardless of the input shape.
 * When a legacy string entry is encountered, max_marks defaults to 0 (unknown).
 */
export function normaliseSubjects(raw: unknown): SubjectConfig[] {
  if (!Array.isArray(raw)) return []

  return raw.map((item) => {
    if (typeof item === 'string') {
      // Legacy format — name only, max_marks unknown
      return { name: item, max_marks: 0 }
    }
    if (
      item &&
      typeof item === 'object' &&
      typeof (item as SubjectConfig).name === 'string' &&
      typeof (item as SubjectConfig).max_marks === 'number'
    ) {
      return item as SubjectConfig
    }
    // Fallback
    return { name: String(item ?? ''), max_marks: 0 }
  })
}

/** Extract just the names array from a normalised subject list */
export function subjectNames(subjects: SubjectConfig[]): string[] {
  return subjects.map((s) => s.name)
}

/** Sum of all subject max_marks — equals the test's total max_marks */
export function totalMaxMarks(subjects: SubjectConfig[]): number {
  return subjects.reduce((sum, s) => sum + (s.max_marks || 0), 0)
}

/**
 * Default preset configs (MHT-CET style for PCM/PCB).
 * Keys match the preset button labels in the Create Test form.
 */
export const SUBJECT_PRESETS: Record<string, SubjectConfig[]> = {
  PCM: [
    { name: 'physics',   max_marks: 50  },
    { name: 'chemistry', max_marks: 50  },
    { name: 'maths',     max_marks: 100 },
  ],
  PCB: [
    { name: 'physics',   max_marks: 50  },
    { name: 'chemistry', max_marks: 50  },
    { name: 'biology',   max_marks: 100 },
  ],
  Physics:   [{ name: 'physics',   max_marks: 100 }],
  Chemistry: [{ name: 'chemistry', max_marks: 100 }],
  Maths:     [{ name: 'maths',     max_marks: 100 }],
}
