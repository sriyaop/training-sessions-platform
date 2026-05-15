import { PageShell } from "@/components/page-shell"
import { SplineAccent } from "@/components/spline-accent"
import { TopicCard } from "@/components/ui"
import { getDashboard } from "@/lib/data"
import { getUser } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const { user } = await getUser()
  if (!user) redirect("/login")
  const dashboard = await getDashboard(user.id)
  const displayName =
    typeof user.user_metadata?.display_name === "string" && user.user_metadata.display_name.trim()
      ? user.user_metadata.display_name
      : user.email

  return (
    <PageShell>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <p className="text-sm text-muted-foreground">Hi {displayName},</p>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
        </div>
        <div className="hidden lg:block">
          <SplineAccent title="Training dashboard visual" compact />
        </div>
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Section title="Requested Topics">
          {dashboard.requested.map((topic) => <TopicCard key={topic.id} topic={topic} />)}
          {!dashboard.requested.length ? <Empty /> : null}
        </Section>
        <Section title="Speaking Sessions">
          {dashboard.speaking.map((topic) => <TopicCard key={topic.id} topic={topic} />)}
          {!dashboard.speaking.length ? <Empty /> : null}
        </Section>
        <Section title="Enrolled Sessions">
          {dashboard.enrolled.map((topic) => <TopicCard key={topic.id} topic={topic} />)}
          {!dashboard.enrolled.length ? <Empty /> : null}
        </Section>
        <Section title="Rated Sessions">
          {dashboard.rated.map((rating) => (
            <div key={rating.id} className="rounded-lg border bg-card p-4 text-sm">
              <div className="font-semibold">{rating.topic?.title ?? "Session"}</div>
              <p className="text-muted-foreground">{rating.stars} stars{rating.comment ? ` - ${rating.comment}` : ""}</p>
            </div>
          ))}
          {!dashboard.rated.length ? <Empty /> : null}
        </Section>
      </div>
    </PageShell>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-lg border bg-card p-4">
      <h2 className="font-semibold">{title}</h2>
      {children}
    </section>
  )
}

function Empty() {
  return <p className="text-sm text-muted-foreground">Nothing here yet.</p>
}
