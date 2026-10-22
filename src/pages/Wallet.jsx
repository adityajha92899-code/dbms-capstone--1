import { useEffect, useState, useCallback } from "react";
import { server, errMsg } from "../utils/server";
import { useAuth } from "../context/AuthContext";

const TYPE_STYLE = { TOPUP: "text-green-400", TRANSFER_IN: "text-green-400", REFUND: "text-green-400", PURCHASE: "text-red-400", TRANSFER_OUT: "text-red-400" };
const SIGN = (t) => (["TOPUP", "TRANSFER_IN", "REFUND"].includes(t) ? "+" : "−");

export default function Wallet() {
  const { refresh } = useAuth();
  const [w, setW] = useState(null);
  const [plans, setPlans] = useState([]);
  const [amount, setAmount] = useState(500);
  const [to, setTo] = useState("");
  const [xfer, setXfer] = useState(50);
  const [msg, setMsg] = useState(null);                 // {ok, text}

  const load = useCallback(async () => {
    try {
      const [a, b] = await Promise.all([server.get("/billing/wallet"), server.get("/billing/plans")]);
      setW(a.data); setPlans(b.data);
    } catch (e) { setMsg({ ok: false, text: errMsg(e) }); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const act = async (fn, okText) => {
    setMsg(null);
    try { await fn(); setMsg({ ok: true, text: okText }); await load(); refresh(); }
    catch (e) { setMsg({ ok: false, text: errMsg(e) }); }
  };

  return (
    <main className="min-h-screen bg-zinc-950 pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <h1 className="font-display text-5xl sm:text-6xl text-gradient mb-8">WALLET & PREMIUM</h1>
        {msg && <p role="status" className={`mb-6 text-sm rounded-lg px-4 py-3 border ${msg.ok ? "text-green-300 border-green-500/30 bg-green-500/10" : "text-red-300 border-red-500/30 bg-red-500/10"}`}>{msg.text}</p>}

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-6">
            <div className="rounded-2xl p-6 bg-gradient-to-br from-brand-700 to-zinc-900 border border-white/10">
              <p className="text-xs uppercase tracking-widest text-zinc-300">Balance</p>
              <p className="font-display text-6xl text-white">{w ? w.balance.toFixed(2) : "—"}</p>
              <p className="text-xs mt-2 text-zinc-300">{w?.isPremium ? `✨ Premium until ${new Date(w.subscription.endsOn).toLocaleDateString()}` : "Free plan"}</p>
            </div>

            <div className="glass rounded-2xl p-5 space-y-3">
              <h2 className="font-semibold">Add credits</h2>
              <input type="number" min="1" max="10000" value={amount} onChange={(e) => setAmount(e.target.value)} className="input" aria-label="Top-up amount" />
              <button className="btn-primary w-full" onClick={() => act(() => server.post("/billing/topup", { amount: +amount }), `Added ${amount} credits.`)}>Top up</button>
            </div>

            <div className="glass rounded-2xl p-5 space-y-3">
              <h2 className="font-semibold">Send credits</h2>
              <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="friend@email.com" className="input" aria-label="Recipient email" />
              <input type="number" min="1" value={xfer} onChange={(e) => setXfer(e.target.value)} className="input" aria-label="Transfer amount" />
              <button className="btn-ghost w-full" onClick={() => act(() => server.post("/billing/transfer", { toEmail: to, amount: +xfer }), `Sent ${xfer} credits.`)}>Send</button>
            </div>
          </div>

          <div className="md:col-span-2 space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              {plans.map((p) => (
                <div key={p.id} className="glass rounded-2xl p-5 hover:border-brand-500/60 transition-colors">
                  <h3 className="font-display text-3xl text-white">{p.name}</h3>
                  <p className="text-zinc-400 text-sm mb-3">{p.days} days · ✨ Premium badge on your reviews</p>
                  <p className="font-display text-4xl text-gradient mb-4">{p.price} <span className="text-base text-zinc-500">credits</span></p>
                  <button className="btn-primary w-full" onClick={() => act(() => server.post("/billing/subscribe", { planId: p.id }), `Subscribed to ${p.name}!`)}>Subscribe</button>
                </div>
              ))}
            </div>

            <div className="glass rounded-2xl p-5">
              <h2 className="font-semibold mb-3">Transaction history</h2>
              {w?.transactions?.length ? (
                <ul className="divide-y divide-zinc-800">
                  {w.transactions.map((t) => (
                    <li key={t.id} className="flex items-center justify-between py-2.5 text-sm">
                      <span><span className="text-zinc-200">{t.type.replace("_", " ")}</span><span className="block text-xs text-zinc-600">{new Date(t.createdAt).toLocaleString()}</span></span>
                      <span className="text-right"><span className={`font-semibold ${TYPE_STYLE[t.type]}`}>{SIGN(t.type)}{t.amount}</span><span className="block text-xs text-zinc-600">bal {t.balanceAfter}</span></span>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-zinc-600">No transactions yet.</p>}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
