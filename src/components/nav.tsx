import { logout } from "@/app/actions"
import { getUser } from "@/lib/supabase/server"
import Link from "next/link"
import { ThemeToggle } from "./theme-toggle"
import { Button } from "./ui/button"

export async function Nav() {
  const { user } = await getUser()
  const displayName =
    typeof user?.user_metadata?.display_name === "string" && user.user_metadata.display_name.trim()
      ? user.user_metadata.display_name
      : user?.email

  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex flex-wrap items-baseline gap-2">
          <Link href="/topics" className="text-lg font-semibold">
            Training Sessions
          </Link>
          {displayName ? (
            <span className="text-sm text-muted-foreground">Hi {displayName}</span>
          ) : null}
        </div>
        <nav className="flex flex-wrap items-center gap-2 text-sm">
          <Link className="rounded-md px-2 py-1 hover:bg-muted" href="/topics">
            Topics
          </Link>
          <Link className="rounded-md px-2 py-1 hover:bg-muted" href="/most-wanted">
            Most Wanted
          </Link>
          <Link className="rounded-md px-2 py-1 hover:bg-muted" href="/upcoming">
            Upcoming
          </Link>
          <Link className="rounded-md px-2 py-1 hover:bg-muted" href="/past">
            Past
          </Link>
          {user ? (
            <>
              <Link className="rounded-md px-2 py-1 hover:bg-muted" href="/dashboard">
                Dashboard
              </Link>
              <form action={logout}>
                <Button variant="outline" size="sm">
                  Log out
                </Button>
              </form>
            </>
          ) : (
            <>
              <Link className="rounded-md px-2 py-1 hover:bg-muted" href="/login">
                Login
              </Link>
              <Button asChild size="sm">
                <Link href="/register">Register</Link>
              </Button>
            </>
          )}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  )
}
