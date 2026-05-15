import type { Topic, TopicStatus } from "@/lib/types"
import Link from "next/link"

export function ErrorMessage({ message }: { message?: string }) {
  if (!message) return null
  return <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{message}</p>
}

export function Badge({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "green" | "red" }) {
  const colors =
    tone === "green"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tone === "red"
        ? "border-red-200 bg-red-50 text-red-700"
        : "border-zinc-200 bg-zinc-50 text-zinc-700"

  return <span className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium ${colors}`}>{children}</span>
}

export function StatusBadge({ status }: { status: TopicStatus }) {
  return <Badge tone={status === "COMPLETED" ? "green" : status === "CANCELLED" ? "red" : "default"}>{status}</Badge>
}

export function TopicCard({ topic }: { topic: Topic }) {
  return (
    <article className="rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <Link href={`/topics/${topic.id}`} className="text-base font-semibold hover:underline">
            {topic.title}
          </Link>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{topic.description || "No description"}</p>
        </div>
        <StatusBadge status={topic.status} />
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span>{topic.category}</span>
        <span>{topic.recommendation_count ?? 0} recommendations</span>
        <span>{topic.enrollment_count ?? 0} enrolled</span>
        {topic.scheduled_at ? <span>{new Date(topic.scheduled_at).toLocaleString()}</span> : null}
        {topic.average_rating ? <span>{topic.average_rating.toFixed(1)} stars</span> : null}
      </div>
    </article>
  )
}

export function Pagination({
  page,
  pageSize,
  count,
  base,
}: {
  page: number
  pageSize: number
  count: number
  base: URLSearchParams
}) {
  const pages = Math.max(1, Math.ceil(count / pageSize))
  const prev = new URLSearchParams(base)
  const next = new URLSearchParams(base)
  prev.set("page", String(Math.max(1, page - 1)))
  next.set("page", String(Math.min(pages, page + 1)))

  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">
        Page {page} of {pages}
      </span>
      <div className="flex gap-2">
        <Link className="rounded-md border px-3 py-1 aria-disabled:pointer-events-none aria-disabled:opacity-50" aria-disabled={page <= 1} href={`?${prev}`}>
          Previous
        </Link>
        <Link className="rounded-md border px-3 py-1 aria-disabled:pointer-events-none aria-disabled:opacity-50" aria-disabled={page >= pages} href={`?${next}`}>
          Next
        </Link>
      </div>
    </div>
  )
}
