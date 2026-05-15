import { login } from "@/app/actions"
import { PageShell } from "@/components/page-shell"
import { ErrorMessage } from "@/components/ui"
import { Button } from "@/components/ui/button"
import { getUser } from "@/lib/supabase/server"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  const { user } = await getUser()
  if (user) redirect("/topics")

  return (
    <PageShell>
      <div className="mx-auto max-w-md rounded-lg border bg-card p-5">
        <h1 className="text-xl font-semibold">Login</h1>
        <form action={login} className="mt-4 space-y-3">
          <ErrorMessage message={error} />
          <label className="block text-sm font-medium">
            Email
            <input className="mt-1 w-full rounded-md border px-3 py-2" name="email" type="email" required />
          </label>
          <label className="block text-sm font-medium">
            Password
            <input className="mt-1 w-full rounded-md border px-3 py-2" name="password" type="password" required />
          </label>
          <Button className="w-full">Login</Button>
        </form>
        <p className="mt-3 text-sm text-muted-foreground">
          Need an account? <Link className="font-medium underline" href="/register">Register</Link>
        </p>
      </div>
    </PageShell>
  )
}
