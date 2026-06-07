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
