import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { Crown, Sparkles, Users, ShieldCheck, RefreshCw } from "lucide-react";

export default function LiveResults() {

  const navigate = useNavigate();

useEffect(() => {

  const token = localStorage.getItem("admin_token");

  if (!token) {

    navigate("/admin?redirect=results");

  }

}, [navigate]);
  
  const [data, setData] = useState(null);
  const [tick, setTick] = useState(0);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const { data: d } = await api.get("/results");
        if (!active) return;
        setData(d);
        setPulse(true);
        setTimeout(() => setPulse(false), 700);
      } catch {}
    };
    load();
    const id = setInterval(() => { setTick(t => t + 1); load(); }, 5000);
    return () => { active = false; clearInterval(id); };
    // eslint-disable-next-line
  }, []);

  return (
    <div className="kiosk-bg min-h-screen relative overflow-hidden">
      <div className="orb b w-[640px] h-[640px] -top-48 -left-40" />
      <div className="orb g w-[520px] h-[520px] top-1/2 -right-32" style={{ animationDelay: "2s" }} />
      <div className="orb s w-[400px] h-[400px] -bottom-40 left-1/3" style={{ animationDelay: "5s" }} />

      <header className="relative z-10 max-w-7xl mx-auto px-8 pt-10 flex items-center justify-between">
        <div>
          <div className="text-xs tracking-[0.32em] uppercase font-bold text-[color:var(--sdps-blue)]">SDPS · Live Results</div>
          <h1 className="font-display text-5xl md:text-7xl font-black hero-3d mt-2 leading-none">
            Live <span className="gold-text">Tally</span>
          </h1>
        </div>
        <div className="text-right">
          <div className="text-xs tracking-[0.22em] uppercase font-bold text-[color:var(--sdps-muted)]">Auto-refresh</div>
          <div className={`mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 backdrop-blur border border-white/80 ${pulse ? "ring-2 ring-[color:var(--sdps-gold)]" : ""}`}>
            <RefreshCw className={`w-3.5 h-3.5 text-[color:var(--sdps-blue)] ${pulse ? "animate-spin" : ""}`} />
            <span className="text-xs font-bold tracking-widest">{data?.updated_at ? new Date(data.updated_at).toLocaleTimeString() : "…"}</span>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-8 py-10">
        {!data ? (
          <div className="text-center text-[color:var(--sdps-muted)] py-20">Loading…</div>
        ) : (
          <>
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              <KPI icon={Users} label="Eligible" value={data.total_users} />
              <KPI icon={ShieldCheck} label="Voted" value={data.total_voted} accent="gold" />
              <KPI icon={Sparkles} label="Turnout" value={`${data.turnout_pct}%`} />
              <KPI icon={Crown} label="Categories" value={data.posts.length} />
            </section>

            <section className="space-y-8">
              {data.posts.map(p => (
                <PostBlock key={p.key} post={p} list={data.by_post[p.key] || []} />
              ))}
            </section>
          </>
        )}
      </main>

      <footer className="relative z-10 text-center pb-8 text-xs tracking-[0.32em] uppercase text-[color:var(--sdps-muted)]">
        SDPS Student Council Election · One Person · One Vote · One Future
      </footer>
    </div>
  );
}

const KPI = ({ icon: Icon, label, value, accent }) => (
  <div className="glass rounded-2xl p-5">
    <div className="flex items-center justify-between">
      <div className="text-[10px] tracking-[0.28em] uppercase font-bold text-[color:var(--sdps-muted)]">{label}</div>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent === "gold" ? "bg-gradient-to-br from-[#F4D571] to-[#B9892B]" : "bg-gradient-to-br from-[#0F3C8A] to-[#1A55B6]"}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>
    <div className="font-display text-4xl md:text-5xl font-black mt-3 hero-3d">{value}</div>
  </div>
);

const PostBlock = ({ post, list }) => {
  const total = Math.max(1, list.reduce((s, x) => s + x.votes, 0));
  const sorted = [...list].sort((a, b) => b.votes - a.votes);
  return (
    <div className="glass rounded-3xl p-7">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-3xl md:text-4xl font-black hero-3d">{post.title}</h2>
        {sorted[0] && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#F4D571] to-[#D4AF37] text-[#1a1a1a] text-sm font-bold shadow">
            <Crown className="w-4 h-4" /> Leading: {sorted[0].name}
          </div>
        )}
      </div>
      {sorted.length === 0 ? (
        <div className="text-[color:var(--sdps-muted)]">No candidates</div>
      ) : (
        <div className="space-y-3">
          {sorted.map((c, i) => {
            const pct = Math.round((c.votes / total) * 100);
            const isLeader = i === 0 && c.votes > 0;
            return (
              <div key={c.candidate_id} className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-blue-100">
                  {c.photo ? <img src={c.photo} alt={c.name} className="w-full h-full object-cover" /> : <div className="w-full h-full grid place-items-center font-bold text-[color:var(--sdps-blue)]">{c.name?.[0]}</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="font-bold truncate flex items-center gap-2">{c.name}{isLeader && <Crown className="w-4 h-4 text-[color:var(--sdps-gold)]" />}</div>
                    <div className="text-sm font-bold tabular-nums">{c.votes} <span className="text-[color:var(--sdps-muted)] font-medium">· {pct}%</span></div>
                  </div>
                  <div className="h-3 rounded-full bg-blue-100 overflow-hidden">
                    <div className="h-full transition-all duration-700"
                         style={{ width: `${pct}%`, background: isLeader ? "linear-gradient(90deg,#F4D571,#D4AF37)" : "linear-gradient(90deg,#0F3C8A,#4A78D6)" }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
