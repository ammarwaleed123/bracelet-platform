export function StudioLoading() {
  return (
    <div className="flex size-full flex-col items-center justify-center gap-4 bg-linen">
      <div className="size-10 rounded-full border-2 border-border border-t-gold motion-safe:animate-spin" />
      <p className="font-serif text-lg text-ink-soft">Preparing your studio…</p>
    </div>
  );
}
