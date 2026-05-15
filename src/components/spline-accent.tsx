const splineSceneUrl = process.env.NEXT_PUBLIC_SPLINE_SCENE_URL

export function SplineAccent({
  title = "Interactive training session visual",
  compact = false,
}: {
  title?: string
  compact?: boolean
}) {
  const hasScene = Boolean(splineSceneUrl?.startsWith("https://"))

  return (
    <div
      className={`relative overflow-hidden rounded-lg border bg-zinc-950 text-white ${
        compact ? "min-h-36" : "min-h-80"
      }`}
    >
      {hasScene ? (
        <iframe
          title={title}
          src={splineSceneUrl}
          className="absolute inset-0 size-full"
          loading="lazy"
          allow="autoplay; fullscreen"
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center p-6">
          <div className="grid w-full max-w-xs gap-3">
            <div className="h-2 w-24 rounded-full bg-white/75" />
            <div className="grid grid-cols-3 gap-2">
              <div className="h-20 rounded-md border border-white/15 bg-white/10" />
              <div className="h-20 rounded-md border border-white/15 bg-white/20" />
              <div className="h-20 rounded-md border border-white/15 bg-white/10" />
            </div>
            <div className="flex gap-2">
              <div className="h-2 flex-1 rounded-full bg-white/30" />
              <div className="h-2 flex-1 rounded-full bg-white/50" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
