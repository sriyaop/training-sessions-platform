import { PageShell } from "@/components/page-shell"
import { TopicCard } from "@/components/ui"
import { getSpeakerProfile } from "@/lib/data"
import { getUser } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function SpeakerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { user } = await getUser()
  if (!user) redirect("/login")

  const { id } = await params
  const speaker = await getSpeakerProfile(id)
  const name = speaker.profile.display_name || speaker.profile.email

  return (
    <PageShell>
      <div className="space-y-5">
        <section className="rounded-lg border bg-card p-5">
          <p className="text-sm text-muted-foreground">Speaker profile</p>
          <h1 className="text-2xl font-semibold">{name}</h1>
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
            <Stat label="Completed sessions" value={String(speaker.completedCount)} />
            <Stat label="Total attendees" value={String(speaker.attendeeCount)} />
            <Stat
              label="Average rating"
              value={speaker.averageRating ? `${speaker.averageRating.toFixed(1)} (${speaker.ratingCount})` : "No ratings"}
            />
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Sessions</h2>
          {speaker.sessions.map((topic) => (
            <TopicCard key={topic.id} topic={topic} />
          ))}
          {!speaker.sessions.length ? (
            <p className="rounded-lg border p-4 text-sm text-muted-foreground">No sessions yet.</p>
          ) : null}
        </section>
      </div>
    </PageShell>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  )
}
