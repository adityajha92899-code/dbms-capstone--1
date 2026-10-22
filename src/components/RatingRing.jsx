// Circular score gauge, colour-coded by rating
export default function RatingRing({ value = 0, size = 44, stroke = 4 }) {
  const pct = Math.max(0, Math.min(10, value)) * 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const color = pct >= 70 ? "#22c55e" : pct >= 50 ? "#eab308" : pct > 0 ? "#ef4444" : "#52525b";
  return (
    <div className="relative shrink-0 rounded-full bg-black/80 backdrop-blur" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#3f3f46" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (c * pct) / 100} style={{ transition: "stroke-dashoffset .8s ease" }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-white" style={{ fontSize: size * 0.27 }}>
        {pct > 0 ? (pct / 10).toFixed(1) : "NR"}
      </span>
    </div>
  );
}
