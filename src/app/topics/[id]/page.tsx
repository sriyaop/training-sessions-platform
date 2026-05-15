import {
  cancelTopic,
  claimTopic,
  editTopic,
  enroll,
  rateTopic,
  scheduleTopic,
  toggleRecommendation,
  unclaimTopic,
  unenroll,
} from "@/app/actions"
import { PageShell } from "@/components/page-shell"
import { ErrorMessage, StatusBadge } from "@/components/ui"
import { Button } from "@/components/ui/button"
import { categories, getTopic } from "@/lib/data"
import { getUser } from "@/lib/supabase/server"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function TopicDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const { error } = await searchParams
  const { user } = await getUser()
  if (!user) redirect("/login")
  const { topic, ratings, enrollees } = await getTopic(id, user.id)
  const isRequester = user?.id === topic.requester_id
  const isSpeaker = user?.id === topic.speaker_id
  const isTerminal = topic.status === "COMPLETED" || topic.status === "CANCELLED"
  const canEdit = isRequester && topic.status === "OPEN"
  const canRecommend = !isRequester && ["OPEN", "CLAIMED"].includes(topic.status)
  const canClaim = user && topic.status === "OPEN"
  const canUnclaim = isSpeaker && topic.status === "CLAIMED"
  const canSchedule = isSpeaker && (topic.status === "CLAIMED" || topic.status === "SCHEDULED")
  const canEnroll = user && topic.status === "SCHEDULED" && !isSpeaker && !topic.user_enrolled
  const canUnenroll =
    user &&
    topic.user_enrolled &&
    topic.status === "SCHEDULED" &&
    Boolean(topic.scheduled_at)
  const canRate = user && topic.user_enrolled && topic.status === "COMPLETED" && !isSpeaker
  const canCancel =
    !isTerminal &&
    ((isRequester && ["OPEN", "CLAIMED", "SCHEDULED"].includes(topic.status)) ||
      (isSpeaker && topic.status === "SCHEDULED"))

  return (
    <PageShell>
      <div className="space-y-5">
        <ErrorMessage message={error} />
        <section className="rounded-lg border bg-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold">{topic.title}</h1>
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{topic.description || "No description"}</p>
            </div>
            <StatusBadge status={topic.status} />
          </div>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <Info label="Requester" value={topic.requester?.display_name || topic.requester?.email || "Unknown"} />
            <div className="rounded-md border p-3">
              <dt className="text-xs uppercase text-muted-foreground">Speaker</dt>
              <dd className="mt-1 font-medium">
                {topic.speaker ? (
                  <Link className="underline-offset-4 hover:underline" href={`/speakers/${topic.speaker.id}`}>
                    {topic.speaker.display_name || topic.speaker.email}
                  </Link>
                ) : (
                  "Not claimed"
                )}
              </dd>
            </div>
            <Info label="Category" value={topic.category} />
            <Info label="Recommendations" value={String(topic.recommendation_count ?? 0)} />
            <Info label="Enrollment" value={`${topic.enrollment_count ?? 0}${topic.capacity ? ` / ${topic.capacity}` : ""}`} />
            <Info label="Scheduled" value={topic.scheduled_at ? new Date(topic.scheduled_at).toLocaleString() : "Not scheduled"} />
            <Info label="Duration" value={topic.duration_minutes ? `${topic.duration_minutes} minutes` : "Not set"} />
            <Info label="Location" value={topic.location || "Not set"} />
            <Info label="Rating" value={topic.rating_count ? `${topic.average_rating?.toFixed(1)} from ${topic.rating_count}` : "No ratings"} />
          </dl>
        </section>

        <section className="rounded-lg border bg-card p-5">
          <h2 className="font-semibold">Actions</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {canRecommend ? (
              <form action={toggleRecommendation}>
                <input type="hidden" name="topicId" value={topic.id} />
                <Button variant="outline">{topic.user_recommended ? "Remove recommendation" : "Recommend"}</Button>
              </form>
            ) : null}
            {canClaim ? (
              <form action={claimTopic}>
                <input type="hidden" name="topicId" value={topic.id} />
                <Button>Volunteer to teach</Button>
              </form>
            ) : null}
            {canUnclaim ? (
              <form action={unclaimTopic}>
                <input type="hidden" name="topicId" value={topic.id} />
                <Button variant="outline">Unclaim</Button>
              </form>
            ) : null}
            {canEnroll ? (
              <form action={enroll}>
                <input type="hidden" name="topicId" value={topic.id} />
                <Button>Enroll</Button>
              </form>
            ) : null}
            {canUnenroll ? (
              <form action={unenroll}>
                <input type="hidden" name="topicId" value={topic.id} />
                <Button variant="outline">Unenroll</Button>
              </form>
            ) : null}
            {canCancel ? (
              <form action={cancelTopic}>
                <input type="hidden" name="topicId" value={topic.id} />
                <Button variant="destructive">Cancel</Button>
              </form>
            ) : null}
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-2">
          {canEdit ? (
            <section className="rounded-lg border bg-card p-5">
              <h2 className="font-semibold">Edit Topic</h2>
              <form action={editTopic} className="mt-3 space-y-3">
                <input type="hidden" name="topicId" value={topic.id} />
                <input className="w-full rounded-md border px-3 py-2 text-sm" name="title" defaultValue={topic.title} required />
                <select className="w-full rounded-md border px-3 py-2 text-sm" name="category" defaultValue={topic.category}>
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <textarea className="min-h-28 w-full rounded-md border px-3 py-2 text-sm" name="description" defaultValue={topic.description} />
                <Button>Save changes</Button>
              </form>
            </section>
          ) : null}

          {canSchedule ? (
            <section className="rounded-lg border bg-card p-5">
              <h2 className="font-semibold">Schedule Session</h2>
              <form action={scheduleTopic} className="mt-3 space-y-3">
                <input type="hidden" name="topicId" value={topic.id} />
                <label className="block text-sm font-medium">
                  Date and time
                  <input className="mt-1 w-full rounded-md border px-3 py-2" name="scheduledAt" type="datetime-local" required />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input className="rounded-md border px-3 py-2 text-sm" name="durationMinutes" type="number" min="1" placeholder="Duration minutes" defaultValue={topic.duration_minutes ?? ""} />
                  <input className="rounded-md border px-3 py-2 text-sm" name="capacity" type="number" min="1" placeholder="Capacity" defaultValue={topic.capacity ?? ""} />
                </div>
                <input className="w-full rounded-md border px-3 py-2 text-sm" name="location" placeholder="Location" defaultValue={topic.location ?? ""} />
                <Button>Schedule</Button>
              </form>
            </section>
          ) : null}

          {canRate ? (
            <section className="rounded-lg border bg-card p-5">
              <h2 className="font-semibold">Rate Session</h2>
              <form action={rateTopic} className="mt-3 space-y-3">
                <input type="hidden" name="topicId" value={topic.id} />
                <select className="w-full rounded-md border px-3 py-2 text-sm" name="stars" required>
                  {[5, 4, 3, 2, 1].map((star) => <option key={star} value={star}>{star} stars</option>)}
                </select>
                <textarea className="min-h-24 w-full rounded-md border px-3 py-2 text-sm" name="comment" placeholder="Optional comment" />
                <Button>Submit rating</Button>
              </form>
            </section>
          ) : null}
        </div>

        <section className="rounded-lg border bg-card p-5">
          <h2 className="font-semibold">Enrollees</h2>
          <div className="mt-3 space-y-2 text-sm">
            {enrollees.map((enrollment) => (
              <div key={enrollment.id} className="rounded-md border p-3">
                {enrollment.user?.display_name || enrollment.user?.email || "Participant"}
              </div>
            ))}
            {!enrollees.length ? <p className="text-muted-foreground">No enrollees yet.</p> : null}
          </div>
        </section>

        <section className="rounded-lg border bg-card p-5">
          <h2 className="font-semibold">Ratings and Comments</h2>
          <div className="mt-3 space-y-3">
            {ratings.map((rating) => (
              <div key={rating.id} className="rounded-md border p-3 text-sm">
                <div className="font-medium">{rating.stars} stars by {rating.user?.display_name || rating.user?.email || "Attendee"}</div>
                {rating.comment ? <p className="mt-1 text-muted-foreground">{rating.comment}</p> : null}
              </div>
            ))}
            {!ratings.length ? <p className="text-sm text-muted-foreground">No ratings yet.</p> : null}
          </div>
        </section>
      </div>
    </PageShell>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-3">
      <dt className="text-xs uppercase text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  )
}
