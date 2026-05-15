export type TopicStatus =
  | "OPEN"
  | "CLAIMED"
  | "SCHEDULED"
  | "COMPLETED"
  | "CANCELLED"

export type Profile = {
  id: string
  email: string
  display_name: string | null
}

export type Topic = {
  id: string
  title: string
  description: string
  requester_id: string
  speaker_id: string | null
  status: TopicStatus
  scheduled_at: string | null
  duration_minutes: number | null
  location: string | null
  capacity: number | null
  created_at: string
  updated_at: string
  requester?: Profile | null
  speaker?: Profile | null
  recommendation_count?: number
  enrollment_count?: number
  average_rating?: number | null
  rating_count?: number
  user_recommended?: boolean
  user_enrolled?: boolean
}

export type Rating = {
  id: string
  topic_id: string
  user_id: string
  stars: number
  comment: string | null
  created_at: string
  updated_at: string
  user?: Profile | null
}

export type Enrollment = {
  id: string
  topic_id: string
  user_id: string
  created_at: string
  user?: Profile | null
}
