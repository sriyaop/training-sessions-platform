import { register } from "@/app/actions"
import { PageShell } from "@/components/page-shell"
import { SplineAccent } from "@/components/spline-accent"
import { ErrorMessage } from "@/components/ui"
import { Button } from "@/components/ui/button"
import { getUser } from "@/lib/supabase/server"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  const { user } = await getUser()
  if (user) redirect("/topics")

  return (
    <PageShell>
      <div className="mx-auto grid w-full max-w-4xl gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-lg border bg-card p-5">
          <h1 className="text-xl font-semibold">Register</h1>
          <form action={register} className="mt-4 space-y-3">
            <ErrorMessage message={error} />
            <label className="block text-sm font-medium">
              Display name
              <input className="mt-1 w-full rounded-md border px-3 py-2" name="displayName" />
            </label>
            <label className="block text-sm font-medium">
              Email
              <input className="mt-1 w-full rounded-md border px-3 py-2" name="email" type="email" required />
            </label>
            <label className="block text-sm font-medium">
              Password
              <input className="mt-1 w-full rounded-md border px-3 py-2" name="password" type="password" minLength={6} required />
            </label>
            <Button className="w-full">Create account</Button>
          </form>
          <p className="mt-3 text-sm text-muted-foreground">
            Already registered? <Link className="font-medium underline" href="/login">Login</Link>
          </p>
        </div>
        <div className="hidden lg:block">
          <SplineAccent title="Training sessions registration visual" />
        </div>
      </div>
    </PageShell>
  )
}
