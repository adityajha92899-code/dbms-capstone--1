import { useEffect, useState, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { server, errMsg } from "../utils/server";

const tip = { background: "#18181b", border: "1px solid #3f3f46", color: "#f4f4f5", borderRadius: 8 };
const Card = ({ title, sub, children }) => (
  <div className="glass rounded-2xl p-5"><h2 className="font-semibold text-white">{title}</h2>{sub && <p className="text-xs text-zinc-500 mb-3">{sub}</p>}{children}</div>
);

export default function Admin() {
  const [d, setD] = useState(null);
  const [err, setErr] = useState("");
  const [etl, setEtl] = useState("");

  const load = useCallback(async () => {
    try {
      const g = (u) => server.get(`/admin/${u}`).then((r) => r.data);
      const [overview, top, revenue, segments, audit, decades] = await Promise.all(
        ["overview", "top-movies", "revenue", "segments", "audit", "warehouse/decades"].map(g));
      setD({ overview, top, revenue, segments, audit, decades });
    } catch (e) { setErr(errMsg(e)); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const runEtl = async () => {
    try { const { data } = await server.post("/admin/etl"); setEtl(`ETL complete: ${data.review_facts} review facts, ${data.revenue_facts} revenue facts`); load(); }
    catch (e) { setEtl(errMsg(e)); }
  };

  if (err) return <main className="min-h-screen pt-28 text-center text-zinc-400">{err}</main>;
  if (!d) return <main className="min-h-screen pt-28 text-center text-zinc-500">Loading analytics…</main>;
  const { overview: o } = d;

  return (
    <main className="min-h-screen bg-zinc-950 pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        <h1 className="font-display text-5xl sm:text-6xl text-gradient">ADMIN ANALYTICS</h1>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[["Users", o.users], ["Reviews", o.reviews], ["Movies", o.movies], ["Revenue", o.revenue], ["Active subs", o.activeSubs]].map(([k, v]) => (
            <div key={k} className="glass rounded-2xl p-4 text-center"><p className="font-display text-4xl text-white">{v}</p><p className="text-xs text-zinc-500">{k}</p></div>))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card title="Monthly revenue" sub="SQL: SUM() OVER (running total) + LAG() month-over-month">
            <ResponsiveContainer width="100%" height={220}><LineChart data={d.revenue}>
              <CartesianGrid stroke="#27272a" strokeDasharray="3 3" /><XAxis dataKey="month" tick={{ fill: "#71717a", fontSize: 11 }} /><YAxis tick={{ fill: "#71717a", fontSize: 11 }} />
              <Tooltip contentStyle={tip} /><Line dataKey="revenue" stroke="#e50000" strokeWidth={3} /><Line dataKey="runningTotal" stroke="#ffaa00" strokeDasharray="4 4" />
            </LineChart></ResponsiveContainer>
          </Card>
          <Card title="Top movies" sub="SQL: RANK() OVER (ORDER BY avg_rating DESC) on view v_movie_stats">
            <ol className="space-y-1.5 text-sm">{d.top.slice(0, 7).map((m) => (
              <li key={m.title} className="flex justify-between gap-3"><span className="truncate"><span className="text-brand-500 font-display mr-2">#{m.ranking}</span>{m.title}</span><span className="text-yellow-400 shrink-0">⭐ {m.avgRating} <span className="text-zinc-600">({m.reviews})</span></span></li>))}</ol>
          </Card>
          <Card title="Customer segments" sub="SQL: CTE + NTILE(4) over lifetime spend">
            <ul className="text-sm divide-y divide-zinc-800">{d.segments.map((s) => (
              <li key={s.name} className="flex justify-between py-1.5"><span>{s.name}</span><span className="text-zinc-400">{s.spent} <span className="badge bg-brand-500/15 text-brand-400 ml-1">Q{s.quartile}</span></span></li>))}</ul>
          </Card>
          <Card title="Warehouse: rating by decade" sub="Star schema: fact_review ⨝ dim_movie ⨝ dim_decade (snowflake)">
            <ResponsiveContainer width="100%" height={180}><BarChart data={d.decades}>
              <CartesianGrid stroke="#27272a" strokeDasharray="3 3" /><XAxis dataKey="decade" tick={{ fill: "#71717a", fontSize: 11 }} /><YAxis domain={[0, 10]} tick={{ fill: "#71717a", fontSize: 11 }} />
              <Tooltip contentStyle={tip} /><Bar dataKey="avgRating" fill="#ff4444" radius={[6, 6, 0, 0]} />
            </BarChart></ResponsiveContainer>
            <div className="flex items-center gap-3 mt-2"><button onClick={runEtl} className="btn-ghost !py-1.5 text-xs">▶ Run ETL</button><span className="text-xs text-zinc-500">{etl}</span></div>
          </Card>
        </div>

        <Card title="Audit log" sub="Populated automatically by database triggers">
          <ul className="text-xs font-mono divide-y divide-zinc-800">{d.audit.map((a) => (
            <li key={a.id} className="flex gap-3 py-1.5 text-zinc-400"><span className="text-zinc-600 w-12">#{a.id}</span><span className="w-24 text-brand-400">{a.tbl}.{a.action}</span><span className="flex-1 truncate">{a.details}</span><span className="text-zinc-600">{new Date(a.at).toLocaleTimeString()}</span></li>))}</ul>
        </Card>
      </div>
    </main>
  );
}
