import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Users, GraduationCap, BookOpen, Clock, ShieldCheck, RefreshCw, Lock } from "lucide-react";

export default function NoticeBoard() {
  const [data, setData] = useState(null);
  const [pulse, setPulse] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const { data: d } = await api.get("/board");
        if (!active) return;
        setData(d);
        setPulse(true);
        setTimeout(() => setPulse(false), 700);
      } catch {}
    };
    load();
    const id = setInterval(load, 5000);
    const tickId = setInterval(() => setNow(new Date()), 1000);
    return () => { active = false; clearInterval(id); clearInterval(tickId); };
  }, []);

  return (
    <div className="kiosk-bg min-h-screen relative overflow-hidden">
      <div className="orb b w-[640px] h-[640px] -top-48 -left-40" />
      <div className="orb g w-[560px] h-[560px] top-1/3 -right-32" style={{ animationDelay: "2s" }} />
      <div className="orb s w-[440px] h-[440px] -bottom-40 left-1/4" style={{ animationDelay: "5s" }} />

      <header className="relative z-10 max-w-[1400px] mx-auto px-10 pt-10 flex items-start justify-between">
        <div>
          <div className="text-xs tracking-[0.36em] uppercase font-bold text-[color:var(--sdps-blue)]">SDPS · Smart Notice Board</div>
          <h1 className="font-display text-6xl md:text-7xl lg:text-8xl font-black hero-3d mt-3 leading-[0.92]">
            Election <span className="gold-text">Live</span>
          </h1>
          <p className="mt-4 text-lg md:text-xl text-[color:var(--sdps-ink)] font-medium max-w-2xl">
            Turnout updates every few seconds. Results remain sealed until the official declaration.
          </p>
        </div>
        <div className="text-right space-y-3">
          <div className="font-display text-3xl md:text-5xl font-black tabular-nums text-[color:var(--sdps-ink)]">
            {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </div>
          <div className="text-xs tracking-[0.32em] uppercase font-bold text-[color:var(--sdps-muted)]">
            {now.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </div>
          {data && (
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 backdrop-blur border border-white/80 ${pulse ? "ring-2 ring-[color:var(--sdps-gold)]" : ""}`}>
              <RefreshCw className={`w-3.5 h-3.5 text-[color:var(--sdps-blue)] ${pulse ? "animate-spin" : ""}`} />
              <span className="text-xs font-bold tracking-widest">LIVE</span>
            </div>
          )}
        </div>
      </header>

      <main className="relative z-10 max-w-[1400px] mx-auto px-10 py-10">
        {!data ? (
          <div className="text-center text-[color:var(--sdps-muted)] py-32 text-2xl">Loading…</div>
        ) : (
          <>
            {!data.election_open && (
              <div className="glass rounded-3xl p-6 mb-8 flex items-center gap-5 border-l-8 border-red-500" data-testid="board-closed-banner">
                <div className="w-14 h-14 rounded-2xl bg-red-500 flex items-center justify-center"><Lock className="w-7 h-7 text-white" /></div>
                <div>
                  <div className="font-display text-2xl font-bold text-red-700">Voting is currently CLOSED</div>
                  <div className="text-sm text-[color:var(--sdps-muted)]">No new ballots are being accepted at this moment.</div>
                </div>
              </div>
            )}

            <section className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-10">
              <BigKPI icon={Users} label="Eligible Voters" value={data.total_users} sub={`${data.total_students} students · ${data.total_teachers} teachers`} />
              <BigKPI icon={ShieldCheck} label="Votes Cast" value={data.total_voted} accent="gold" sub={`${data.voted_students} students · ${data.voted_teachers} teachers`} />
              <BigKPI icon={Clock} label="Pending" value={data.pending} sub="Yet to vote" />
              <BigKPI icon={RefreshCw} label="Turnout" value={`${data.turnout_pct}%`} accent="gold" sub="Of all eligible" />
            </section>

            <section className="glass rounded-3xl p-8">
              <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div>
                  <h2 className="font-display text-3xl md:text-4xl font-black hero-3d">Class-wise Turnout</h2>
                  <p className="text-sm text-[color:var(--sdps-muted)] mt-1">Number of students who have cast their vote, by class.</p>
                </div>
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.28em] font-bold text-[color:var(--sdps-muted)]">
                  <GraduationCap className="w-4 h-4" /> Students only
                </div>
              </div>

              {(data.class_breakdown || []).length === 0 ? (
                <div className="text-[color:var(--sdps-muted)]">No class data yet.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4">
                  {data.class_breakdown.map((c) => {
                    const pct = c.total > 0 ? Math.round((c.voted / c.total) * 100) : 0;
                    const done = pct === 100;
                    return (
                      <div key={c.class_name} className="">
                        <div className="flex items-baseline justify-between mb-1.5">
                          <div className="font-display text-2xl font-bold flex items-center gap-2">
                            {c.class_name}
                            {done && <span className="text-[10px] tracking-widest uppercase font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">100%</span>}
                          </div>
                          <div className="text-base font-bold tabular-nums">
                            <span className="text-[color:var(--sdps-blue)]">{c.voted}</span>
                            <span className="text-[color:var(--sdps-muted)]"> / {c.total}</span>
                            <span className="text-[color:var(--sdps-muted)] text-sm font-medium ml-2">({pct}%)</span>
                          </div>
                        </div>
                        <div className="h-4 rounded-full bg-blue-100 overflow-hidden">
                          <div
                            className="h-full transition-all duration-700"
                            style={{
                              width: `${pct}%`,
                              background: done
                                ? "linear-gradient(90deg, #10b981, #059669)"
                                : "linear-gradient(90deg, #0F3C8A, #4A78D6, #D4AF37)",
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <footer className="relative z-10 text-center pb-10 px-10 max-w-[1400px] mx-auto">
        <div className="text-xs tracking-[0.32em] uppercase font-bold text-[color:var(--sdps-muted)]">
          SDPS Student Council Election · Results sealed · Declaration after polling closes
        </div>
      </footer>
    </div>
  );
}

const BigKPI = ({ icon: Icon, label, value, accent, sub }) => (
  <div className="glass rounded-3xl p-6">
    <div className="flex items-center justify-between mb-3">
      <div className="text-[10px] tracking-[0.32em] uppercase font-bold text-[color:var(--sdps-muted)]">{label}</div>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent === "gold" ? "bg-gradient-to-br from-[#F4D571] to-[#B9892B]" : "bg-gradient-to-br from-[#0F3C8A] to-[#1A55B6]"}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>
    <div className="font-display text-5xl md:text-6xl font-black hero-3d tabular-nums">{value}</div>
    {sub && <div className="text-xs text-[color:var(--sdps-muted)] mt-2 font-medium">{sub}</div>}
  </div>
);
