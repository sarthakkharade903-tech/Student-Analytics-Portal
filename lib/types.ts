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

export interface Test {
  id: string
  coaching_center_id: string
  test_name: string
  test_type?: string
  test_date: string
  subjects: string[]
  target_batches: string[]
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
