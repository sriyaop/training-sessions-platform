"use server"

import { completePastSessions } from "@/lib/data"
import { createClient, requireUser } from "@/lib/supabase/server"
import type { TopicStatus } from "@/lib/types"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

function text(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim()
}

function numberOrNull(formData: FormData, name: string) {
  const value = text(formData, name)
  if (!value) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : NaN
}

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`)
}

async function getOwnedTopic(id: string) {
  const { supabase, user } = await requireUser()
  await completePastSessions()
  const { data: topic, error } = await supabase.from("topics").select("*").eq("id", id).single()

  if (error || !topic) throw new Error("Topic not found.")
  return { supabase, user, topic: topic as { id: string; requester_id: string; speaker_id: string | null; status: TopicStatus; scheduled_at: string | null; capacity: number | null } }
}

export async function register(formData: FormData) {
  const supabase = await createClient()
  const email = text(formData, "email")
  const password = text(formData, "password")
  const displayName = text(formData, "displayName")

  if (!email || !password) fail("/register", "Email and password are required.")

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName || email } },
  })

  if (error) fail("/register", error.message.includes("already") ? "Email is already registered." : error.message)

  if (data.user) {
    await supabase.from("profiles").upsert({
      id: data.user.id,
      email,
      display_name: displayName || email,
    })
  }

  redirect("/topics")
}

export async function login(formData: FormData) {
  const supabase = await createClient()
  const email = text(formData, "email")
  const password = text(formData, "password")

  if (!email || !password) fail("/login", "Email and password are required.")

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) fail("/login", "Invalid email or password.")

  redirect("/topics")
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}

export async function createTopic(formData: FormData) {
  const { supabase, user } = await requireUser()
  const title = text(formData, "title")
  const description = text(formData, "description")

  if (!title) fail("/topics", "Title is required.")

  const { data, error } = await supabase
    .from("topics")
    .insert({ title, description, requester_id: user.id, status: "OPEN" })
    .select("id")
    .single()

  if (error) fail("/topics", error.message)

  revalidatePath("/topics")
  redirect(`/topics/${data.id}`)
}

export async function editTopic(formData: FormData) {
  const id = text(formData, "topicId")
  const path = `/topics/${id}`
  const { supabase, user, topic } = await getOwnedTopic(id)
  const title = text(formData, "title")
  const description = text(formData, "description")

  if (topic.requester_id !== user.id) fail(path, "Only the requester can edit this topic.")
  if (topic.status !== "OPEN") fail(path, "Topics can only be edited while open.")
  if (!title) fail(path, "Title is required.")

  const { error } = await supabase.from("topics").update({ title, description }).eq("id", id)
  if (error) fail(path, error.message)

  revalidatePath(path)
  redirect(path)
}

export async function toggleRecommendation(formData: FormData) {
  const id = text(formData, "topicId")
  const path = `/topics/${id}`
  const { supabase, user, topic } = await getOwnedTopic(id)

  if (topic.requester_id === user.id) fail(path, "You cannot recommend your own topic.")

  const { data: existing } = await supabase
    .from("recommendations")
    .select("id")
    .eq("topic_id", id)
    .eq("user_id", user.id)
    .maybeSingle()

  const { error } = existing
    ? await supabase.from("recommendations").delete().eq("id", existing.id)
    : await supabase.from("recommendations").insert({ topic_id: id, user_id: user.id })

  if (error) fail(path, error.message)

  revalidatePath(path)
  revalidatePath("/topics")
  redirect(path)
}

export async function claimTopic(formData: FormData) {
  const id = text(formData, "topicId")
  const path = `/topics/${id}`
  const { supabase, user, topic } = await getOwnedTopic(id)

  if (topic.status !== "OPEN") fail(path, "Only open topics can be claimed.")

  const { error } = await supabase
    .from("topics")
    .update({ speaker_id: user.id, status: "CLAIMED" })
    .eq("id", id)

  if (error) fail(path, error.message)

  revalidatePath(path)
  redirect(path)
}

export async function unclaimTopic(formData: FormData) {
  const id = text(formData, "topicId")
  const path = `/topics/${id}`
  const { supabase, user, topic } = await getOwnedTopic(id)

  if (topic.speaker_id !== user.id) fail(path, "Only the speaker can unclaim this topic.")
  if (topic.status !== "CLAIMED") fail(path, "A topic can only be unclaimed before scheduling.")

  const { error } = await supabase
    .from("topics")
    .update({ speaker_id: null, status: "OPEN" })
    .eq("id", id)

  if (error) fail(path, error.message)

  revalidatePath(path)
  redirect(path)
}

export async function scheduleTopic(formData: FormData) {
  const id = text(formData, "topicId")
  const path = `/topics/${id}`
  const { supabase, user, topic } = await getOwnedTopic(id)
  const scheduledAt = text(formData, "scheduledAt")
  const durationMinutes = numberOrNull(formData, "durationMinutes")
  const capacity = numberOrNull(formData, "capacity")
  const location = text(formData, "location")

  if (topic.speaker_id !== user.id) fail(path, "Only the speaker can schedule this topic.")
  if (!["CLAIMED", "SCHEDULED"].includes(topic.status)) fail(path, "Claim the topic before scheduling.")
  if (!scheduledAt || new Date(scheduledAt).getTime() <= Date.now()) fail(path, "Scheduled time must be in the future.")
  if (durationMinutes !== null && (!Number.isInteger(durationMinutes) || durationMinutes <= 0)) fail(path, "Duration must be positive.")
  if (capacity !== null && (!Number.isInteger(capacity) || capacity <= 0)) fail(path, "Capacity must be positive.")

  const { error } = await supabase
    .from("topics")
    .update({
      scheduled_at: new Date(scheduledAt).toISOString(),
      duration_minutes: durationMinutes,
      location: location || null,
      capacity,
      status: "SCHEDULED",
    })
    .eq("id", id)

  if (error) fail(path, error.message)

  revalidatePath(path)
  redirect(path)
}

export async function enroll(formData: FormData) {
  const id = text(formData, "topicId")
  const path = `/topics/${id}`
  const { supabase, user, topic } = await getOwnedTopic(id)

  if (topic.status !== "SCHEDULED") fail(path, "Enrollment is only open for scheduled sessions.")
  if (topic.speaker_id === user.id) fail(path, "Speakers cannot enroll in their own sessions.")

  const { count } = await supabase
    .from("enrollments")
    .select("id", { count: "exact", head: true })
    .eq("topic_id", id)

  if (topic.capacity && (count ?? 0) >= topic.capacity) fail(path, "This session is at capacity.")

  const { error } = await supabase.from("enrollments").insert({ topic_id: id, user_id: user.id })
  if (error) fail(path, error.code === "23505" ? "You are already enrolled." : error.message)

  revalidatePath(path)
  redirect(path)
}

export async function unenroll(formData: FormData) {
  const id = text(formData, "topicId")
  const path = `/topics/${id}`
  const { supabase, user, topic } = await getOwnedTopic(id)

  if (!topic.scheduled_at || new Date(topic.scheduled_at).getTime() <= Date.now()) {
    fail(path, "You can only unenroll before the session starts.")
  }

  const { error } = await supabase.from("enrollments").delete().eq("topic_id", id).eq("user_id", user.id)
  if (error) fail(path, error.message)

  revalidatePath(path)
  redirect(path)
}

export async function rateTopic(formData: FormData) {
  const id = text(formData, "topicId")
  const path = `/topics/${id}`
  const { supabase, user, topic } = await getOwnedTopic(id)
  const stars = Number(text(formData, "stars"))
  const comment = text(formData, "comment")

  if (topic.status !== "COMPLETED") fail(path, "Ratings are allowed only after completion.")
  if (topic.speaker_id === user.id) fail(path, "Speakers cannot rate their own sessions.")
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) fail(path, "Stars must be an integer from 1 to 5.")

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id")
    .eq("topic_id", id)
    .eq("user_id", user.id)
    .maybeSingle()

  if (!enrollment) fail(path, "Only enrolled attendees can rate.")

  const { error } = await supabase.from("ratings").upsert({
    topic_id: id,
    user_id: user.id,
    stars,
    comment: comment || null,
  })

  if (error) fail(path, error.message)

  revalidatePath(path)
  redirect(path)
}

export async function cancelTopic(formData: FormData) {
  const id = text(formData, "topicId")
  const path = `/topics/${id}`
  const { supabase, user, topic } = await getOwnedTopic(id)

  const requesterCanCancel = topic.requester_id === user.id && ["OPEN", "CLAIMED"].includes(topic.status)
  const speakerCanCancel = topic.speaker_id === user.id && topic.status === "SCHEDULED"

  if (!requesterCanCancel && !speakerCanCancel) fail(path, "You do not have permission to cancel this topic.")

  const { error } = await supabase.from("topics").update({ status: "CANCELLED" }).eq("id", id)
  if (error) fail(path, error.message)

  revalidatePath(path)
  redirect(path)
}
