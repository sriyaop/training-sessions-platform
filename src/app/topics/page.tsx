import { createTopic } from "@/app/actions"
import { PageShell } from "@/components/page-shell"
import { ErrorMessage, Pagination, TopicCard } from "@/components/ui"
import { Button } from "@/components/ui/button"
import { listTopics, statuses } from "@/lib/data"
import { getUser } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function TopicsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; sort?: string; role?: string; page?: string; error?: string }>
}) {
  const params = await searchParams
  const page = Math.max(1, Number(params.page ?? 1))
  const { user } = await getUser()
  if (!user) redirect("/login")
  const { topics, count, pageSize } = await listTopics({
    status: params.status,
    sort: params.sort,
    role: ["requested", "speaking", "enrolled"].includes(params.role ?? "")
      ? (params.role as "requested" | "speaking" | "enrolled")
      : undefined,
    page,
    userId: user.id,
  })
  const base = new URLSearchParams()
  if (params.status) base.set("status", params.status)
  if (params.sort) base.set("sort", params.sort)
  if (params.role) base.set("role", params.role)
  const filterSelectClass =
    "rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground [color-scheme:light] dark:[color-scheme:dark]"

  return (
    <PageShell>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="space-y-4">
          <div>
            <h1 className="text-2xl font-semibold">Topics</h1>
            <p className="text-sm text-muted-foreground">Request, recommend, claim, and schedule training sessions.</p>
          </div>
          <form className="flex flex-wrap items-end gap-2 rounded-lg border bg-card p-3">
            <label className="grid gap-1 text-xs font-medium text-muted-foreground">
              Status filter
              <select className={filterSelectClass} name="status" defaultValue={params.status ?? ""}>
                <option value="">All statuses</option>
                {statuses.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-xs font-medium text-muted-foreground">
              Role filter
              <select className={filterSelectClass} name="role" defaultValue={params.role ?? ""}>
                <option value="">All roles</option>
                <option value="requested">Requested by me</option>
                <option value="speaking">Speaking</option>
                <option value="enrolled">Enrolled</option>
              </select>
            </label>
            <label className="grid gap-1 text-xs font-medium text-muted-foreground">
              Sort by
              <select className={filterSelectClass} name="sort" defaultValue={params.sort ?? "createdAt"}>
                <option value="createdAt">Newest created</option>
                <option value="recommendations">Most recommendations</option>
                <option value="scheduledAt">Soonest scheduled</option>
              </select>
            </label>
            <Button variant="outline">Apply</Button>
          </form>
          <div className="space-y-3">
            {topics.map((topic) => <TopicCard key={topic.id} topic={topic} />)}
            {!topics.length ? <p className="rounded-lg border p-4 text-sm text-muted-foreground">No topics found.</p> : null}
          </div>
          <Pagination page={page} pageSize={pageSize} count={count} base={base} />
        </section>

        <aside className="rounded-lg border bg-card p-4">
          <h2 className="font-semibold">Request a topic</h2>
          <form action={createTopic} className="mt-3 space-y-3">
            <ErrorMessage message={params.error} />
            <input className="w-full rounded-md border px-3 py-2 text-sm" name="title" placeholder="Title" required />
            <textarea className="min-h-28 w-full rounded-md border px-3 py-2 text-sm" name="description" placeholder="Description" />
            <Button className="w-full">Create topic</Button>
          </form>
        </aside>
      </div>
    </PageShell>
  )
}
