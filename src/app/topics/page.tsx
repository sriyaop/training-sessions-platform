import { createTopic } from "@/app/actions"
import { PageShell } from "@/components/page-shell"
import { ErrorMessage, Pagination, TopicCard } from "@/components/ui"
import { Button } from "@/components/ui/button"
import { categories, listTopics, statuses } from "@/lib/data"
import { getUser } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function TopicsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; sort?: string; role?: string; category?: string; page?: string; error?: string }>
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
    category: params.category,
    page,
    userId: user.id,
  })
  const base = new URLSearchParams()
  if (params.status) base.set("status", params.status)
  if (params.sort) base.set("sort", params.sort)
  if (params.role) base.set("role", params.role)
  if (params.category) base.set("category", params.category)

  return (
    <PageShell>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="space-y-4">
          <div>
            <h1 className="text-2xl font-semibold">Topics</h1>
            <p className="text-sm text-muted-foreground">Request, recommend, claim, and schedule training sessions.</p>
          </div>
          <form className="flex flex-wrap gap-2">
            <select className="rounded-md border px-3 py-2 text-sm" name="status" defaultValue={params.status ?? ""}>
              <option value="">All statuses</option>
              {statuses.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <select className="rounded-md border px-3 py-2 text-sm" name="sort" defaultValue={params.sort ?? "createdAt"}>
              <option value="createdAt">Created date</option>
              <option value="recommendations">Recommendations</option>
              <option value="scheduledAt">Scheduled date</option>
            </select>
            <select className="rounded-md border px-3 py-2 text-sm" name="role" defaultValue={params.role ?? ""}>
              <option value="">All roles</option>
              <option value="requested">Requested by me</option>
              <option value="speaking">Speaking</option>
              <option value="enrolled">Enrolled</option>
            </select>
            <select className="rounded-md border px-3 py-2 text-sm" name="category" defaultValue={params.category ?? ""}>
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
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
            <select className="w-full rounded-md border px-3 py-2 text-sm" name="category" defaultValue="Engineering">
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <textarea className="min-h-28 w-full rounded-md border px-3 py-2 text-sm" name="description" placeholder="Description" />
            <Button className="w-full">Create topic</Button>
          </form>
        </aside>
      </div>
    </PageShell>
  )
}
