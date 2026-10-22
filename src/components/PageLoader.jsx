export default function PageLoader() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center" role="status">
      <div className="text-center">
        <div className="text-5xl mb-4 animate-pulse drop-shadow-[0_0_20px_rgba(229,0,0,.8)]">🎬</div>
        <p className="text-zinc-500 text-xs font-medium tracking-[.4em] uppercase">Loading</p>
      </div>
    </div>
  );
}
