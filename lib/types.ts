export interface CoachingCenter {
  id: string
  name: string
  phone: string
  email: string
  created_at: string
}

export interface UserProfile {
  id: string
  coaching_center_id: string
  name: string
  email: string
  role: string
  created_at: string
}

export interface SignupFormData {
  coachingName: string
  ownerName: string
  email: string
  phone: string
  password: string
}

export interface LoginFormData {
  email: string
  password: string
}

/**
 * Represents a single subject with its individual max marks allocation.
 * Stored as JSONB inside the `tests.subjects` column.
 */
export interface SubjectConfig {
  name: string       // e.g. "physics"
  max_marks: number  // e.g. 50
}

export interface Test {
  id: string
  coaching_center_id: string
  test_name: string
  test_type?: string
  test_date: string
  /** Stored as SubjectConfig[] in new tests; plain string[] in legacy tests. Use normaliseSubjects() from lib/subjects.ts */
  subjects: SubjectConfig[] | string[]
  target_batches: string[]
  /** Auto-computed sum of all subject max_marks */
  max_marks: number
  highest_score: number | null
  average_score: number | null
  students_appeared: number | null
  created_at: string
  updated_at: string
}

export interface Score {
  id: string
  test_id: string
  student_id: string
  subject_scores: Record<string, number>
  total: number
  percentage: number
  rank: number
  created_at: string
  updated_at: string
}

