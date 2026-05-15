import { PageShell } from "@/components/page-shell"
import { Pagination, TopicCard } from "@/components/ui"
import { listTopics } from "@/lib/data"
import { getUser } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function MostWantedPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams
  const page = Math.max(1, Number(params.page ?? 1))
  const { user } = await getUser()
  if (!user) redirect("/login")
  const { topics, count, pageSize } = await listTopics({ mode: "most-wanted", page, userId: user.id })

  return (
    <PageShell>
      <h1 className="text-2xl font-semibold">Most Wanted</h1>
      <p className="text-sm text-muted-foreground">Open and claimed topics sorted by recommendations.</p>
      <div className="mt-4 space-y-3">
        {topics.map((topic) => <TopicCard key={topic.id} topic={topic} />)}
        {!topics.length ? (
          <p className="rounded-lg border p-4 text-sm text-muted-foreground">
            No open or claimed topics yet. Scheduled sessions move to Upcoming.
          </p>
        ) : null}
      </div>
      <div className="mt-4"><Pagination page={page} pageSize={pageSize} count={count} base={new URLSearchParams()} /></div>
    </PageShell>
  )
}
