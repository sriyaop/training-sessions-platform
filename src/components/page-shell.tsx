import { Nav } from "@/components/nav"

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
    </>
  )
}
