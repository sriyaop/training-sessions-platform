import { createClient } from "@/lib/supabase/server"
import type { Enrollment, Profile, Rating, Topic, TopicCategory, TopicStatus } from "@/lib/types"

const topicSelect =
  "*, requester:profiles!topics_requester_id_fkey(id,email,display_name), speaker:profiles!topics_speaker_id_fkey(id,email,display_name)"

export const statuses: TopicStatus[] = [
  "OPEN",
  "CLAIMED",
  "SCHEDULED",
  "COMPLETED",
  "CANCELLED",
]

export const categories: TopicCategory[] = [
  "Engineering",
  "Product",
  "Design",
  "Data",
  "Leadership",
  "Process",
]

export async function completePastSessions() {
  const supabase = await createClient()
  await supabase
    .from("topics")
    .update({ status: "COMPLETED" })
    .eq("status", "SCHEDULED")
    .lt("scheduled_at", new Date().toISOString())
}

export async function listTopics({
  status,
  sort = "createdAt",
  page = 1,
  pageSize = 10,
  mode,
  role,
  category,
  userId,
}: {
  status?: string
  sort?: string
  page?: number
  pageSize?: number
  mode?: "most-wanted" | "upcoming" | "past"
  role?: "requested" | "speaking" | "enrolled"
  category?: string
  userId?: string
}) {
  await completePastSessions()
  const supabase = await createClient()
  let query = supabase.from("topics").select(topicSelect, { count: "exact" })
  const needsComputedSort = sort === "recommendations" || mode === "most-wanted"

  if (mode === "most-wanted") query = query.in("status", ["OPEN", "CLAIMED"])
  else if (mode === "upcoming") query = query.eq("status", "SCHEDULED")
  else if (mode === "past") query = query.eq("status", "COMPLETED")
  else if (status && statuses.includes(status as TopicStatus)) query = query.eq("status", status)

  if (category && categories.includes(category as TopicCategory)) query = query.eq("category", category)

  if (role === "requested" && userId) query = query.eq("requester_id", userId)
  if (role === "speaking" && userId) query = query.eq("speaker_id", userId)
  if (role === "enrolled" && userId) {
    const { data: enrolledRows, error: enrolledError } = await supabase
      .from("enrollments")
      .select("topic_id")
      .eq("user_id", userId)

    if (enrolledError) throw new Error(enrolledError.message)

    const enrolledTopicIds = enrolledRows?.map((row) => row.topic_id) ?? []
    if (!enrolledTopicIds.length) {
      return { topics: [], count: 0, page, pageSize }
    }
    query = query.in("id", enrolledTopicIds)
  }

  if (mode === "past") {
    query = query.order("scheduled_at", { ascending: false, nullsFirst: false })
  } else if (sort === "scheduledAt" || mode === "upcoming") {
    query = query.order("scheduled_at", { ascending: true, nullsFirst: false })
  } else {
    query = query.order("created_at", { ascending: false })
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  const { data, count, error } = await (needsComputedSort ? query : query.range(from, to))

  if (error) throw new Error(error.message)

  let topics = (data ?? []) as Topic[]
  topics = await enrichTopics(topics, userId)

  if (needsComputedSort) {
    topics.sort((a, b) => (b.recommendation_count ?? 0) - (a.recommendation_count ?? 0))
    topics = topics.slice(from, to + 1)
  }

  if (mode === "past") {
    topics.sort(
      (a, b) =>
        new Date(b.scheduled_at ?? b.updated_at).getTime() -
        new Date(a.scheduled_at ?? a.updated_at).getTime()
    )
  }

  return { topics, count: count ?? 0, page, pageSize }
}

export async function getSpeakerProfile(id: string) {
  await completePastSessions()
  const supabase = await createClient()
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id,email,display_name")
    .eq("id", id)
    .single()

  if (profileError) throw new Error("Speaker not found.")

  const { data: sessions, error: sessionsError } = await supabase
    .from("topics")
    .select(topicSelect)
    .eq("speaker_id", id)
    .order("scheduled_at", { ascending: false, nullsFirst: false })

  if (sessionsError) throw new Error(sessionsError.message)

  const enrichedSessions = await enrichTopics((sessions ?? []) as Topic[], id)
  const completed = enrichedSessions.filter((topic) => topic.status === "COMPLETED")
  const totalRatingCount = completed.reduce((sum, topic) => sum + (topic.rating_count ?? 0), 0)
  const weightedStars = completed.reduce(
    (sum, topic) => sum + (topic.average_rating ?? 0) * (topic.rating_count ?? 0),
    0
  )
  const attendeeCount = completed.reduce((sum, topic) => sum + (topic.enrollment_count ?? 0), 0)

  return {
    profile: profile as Profile,
    sessions: enrichedSessions,
    completedCount: completed.length,
    attendeeCount,
    ratingCount: totalRatingCount,
    averageRating: totalRatingCount ? weightedStars / totalRatingCount : null,
  }
}

export async function getTopic(id: string, userId?: string) {
  await completePastSessions()
  const supabase = await createClient()
  const { data, error } = await supabase.from("topics").select(topicSelect).eq("id", id).single()

  if (error) throw new Error("Topic not found.")

  const [topic] = await enrichTopics([data as Topic], userId)
  const { data: ratings, error: ratingsError } = await supabase
    .from("ratings")
    .select("*, user:profiles!ratings_user_id_fkey(id,email,display_name)")
    .eq("topic_id", id)
    .order("updated_at", { ascending: false })
  const { data: enrollees, error: enrolleesError } = await supabase
    .from("enrollments")
    .select("*, user:profiles!enrollments_user_id_fkey(id,email,display_name)")
    .eq("topic_id", id)
    .order("created_at", { ascending: true })

  if (ratingsError) throw new Error(ratingsError.message)
  if (enrolleesError) throw new Error(enrolleesError.message)

  return {
    topic,
    ratings: (ratings ?? []) as Rating[],
    enrollees: (enrollees ?? []) as Enrollment[],
  }
}

export async function getDashboard(userId: string) {
  await completePastSessions()
  const supabase = await createClient()
  const { data: requested } = await supabase
    .from("topics")
    .select(topicSelect)
    .eq("requester_id", userId)
    .order("created_at", { ascending: false })
  const { data: speaking } = await supabase
    .from("topics")
    .select(topicSelect)
    .eq("speaker_id", userId)
    .order("scheduled_at", { ascending: true, nullsFirst: false })
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select(`topic:topics(${topicSelect})`)
    .eq("user_id", userId)
  const { data: ratings } = await supabase
    .from("ratings")
    .select(`*, topic:topics(${topicSelect})`)
    .eq("user_id", userId)

  return {
    requested: await enrichTopics((requested ?? []) as Topic[], userId),
    speaking: await enrichTopics((speaking ?? []) as Topic[], userId),
    enrolled: await enrichTopics(
      (enrollments ?? []).map((row) => row.topic).filter(Boolean) as unknown as Topic[],
      userId
    ),
    rated: ratings ?? [],
  }
}

async function enrichTopics(topics: Topic[], userId?: string) {
  if (!topics.length) return topics
  const supabase = await createClient()
  const ids = topics.map((topic) => topic.id)

  const [recommendations, enrollments, ratings] = await Promise.all([
    supabase.from("recommendations").select("topic_id,user_id").in("topic_id", ids),
    supabase.from("enrollments").select("topic_id,user_id").in("topic_id", ids),
    supabase.from("ratings").select("topic_id,stars").in("topic_id", ids),
  ])

  return topics.map((topic) => {
    const recs = recommendations.data?.filter((row) => row.topic_id === topic.id) ?? []
    const enrolled = enrollments.data?.filter((row) => row.topic_id === topic.id) ?? []
    const topicRatings = ratings.data?.filter((row) => row.topic_id === topic.id) ?? []
    const totalStars = topicRatings.reduce((sum, row) => sum + Number(row.stars), 0)

    return {
      ...topic,
      recommendation_count: recs.length,
      enrollment_count: enrolled.length,
      average_rating: topicRatings.length ? totalStars / topicRatings.length : null,
      rating_count: topicRatings.length,
      user_recommended: userId ? recs.some((row) => row.user_id === userId) : false,
      user_enrolled: userId ? enrolled.some((row) => row.user_id === userId) : false,
    }
  })
}
