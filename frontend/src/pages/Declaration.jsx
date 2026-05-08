import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { Crown, Printer, ArrowLeft, Award } from "lucide-react";

export default function Declaration() {
  const [data, setData] = useState(null);
  const [logo, setLogo] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem("sdps_admin_token")) { navigate("/admin/login"); return; }
    api.get("/admin/stats").then(({ data }) => setData(data)).catch(() => navigate("/admin/login"));
    api.get("/settings").then(({ data }) => setLogo(data?.school_logo || "")).catch(() => {});
  }, [navigate]);

  return (
    <div className="min-h-screen bg-white print:bg-white">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .page-break { page-break-after: always; }
          @page { size: A4; margin: 14mm; }
        }
      `}</style>

      <div className="no-print sticky top-0 z-40 bg-white/90 backdrop-blur border-b">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-2 text-sm font-bold text-[color:var(--sdps-blue)]"><ArrowLeft className="w-4 h-4" /> Back to Admin</Link>
          <button onClick={() => window.print()} data-testid="print-declaration-btn"
            className="btn-primary-3d h-11 px-5 rounded-xl font-bold flex items-center gap-2">
            <Printer className="w-4 h-4" /> Print Declaration
          </button>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Cover */}
        <div className="text-center border-y-4 border-double border-[color:var(--sdps-gold)] py-10 mb-10">
          {logo && <img src={logo} alt="" className="mx-auto w-24 h-24 object-contain mb-5" />}
          <div className="text-xs tracking-[0.36em] uppercase font-bold text-[color:var(--sdps-muted)]">SDPS · Official Declaration</div>
          <h1 className="font-display text-5xl md:text-6xl font-black hero-3d mt-3">Student Council<br/><span className="gold-text">Election 2026</span></h1>
          <p className="mt-4 text-lg text-[color:var(--sdps-ink)] font-medium">Hereby announces the elected representatives of the SDPS student body, by majority vote of the eligible voters.</p>
          {data && (
            <div className="mt-6 grid grid-cols-3 gap-4 max-w-xl mx-auto text-sm">
              <Stat k="Eligible" v={data.total_users} />
              <Stat k="Voted" v={data.total_voted} />
              <Stat k="Turnout" v={`${data.turnout_pct}%`} />
            </div>
          )}
        </div>

        {/* Winners */}
        <section className="space-y-8">
          {!data ? <div className="text-center text-[color:var(--sdps-muted)] py-20">Loading…</div> :
            data.posts.map((p, i) => {
              const w = data.winners?.[p.key];
              const all = (data.by_post[p.key] || []).slice().sort((a,b) => b.votes - a.votes);
              const total = Math.max(1, all.reduce((s,x) => s+x.votes,0));
              return (
                <div key={p.key} className={`rounded-3xl border-2 border-[color:var(--sdps-gold)] p-8 ${i % 2 ? "bg-[#FFFCF1]" : "bg-white"}`}>
                  <div className="text-[11px] tracking-[0.32em] uppercase font-bold text-[color:var(--sdps-muted)]">Post {i + 1}</div>
                  <h2 className="font-display text-3xl md:text-4xl font-black hero-3d mt-1">{p.title}</h2>
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                    <div className="md:col-span-1">
                      <div className="relative w-44 h-44 mx-auto">
                        <div className="absolute inset-0 rounded-full" style={{ background: "linear-gradient(135deg,#F4D571,#D4AF37,#8a6212)", padding: 5 }}>
                          <div className="w-full h-full rounded-full overflow-hidden bg-white">
                            {w?.photo ? <img src={w.photo} alt={w.name} className="w-full h-full object-cover" /> : <div className="w-full h-full grid place-items-center text-5xl font-bold text-[color:var(--sdps-blue)]">{w?.name?.[0] || "?"}</div>}
                          </div>
                        </div>
                        <div className="absolute -top-3 -right-3 w-12 h-12 rounded-full bg-gradient-to-br from-[#F4D571] to-[#D4AF37] flex items-center justify-center shadow-lg">
                          <Crown className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <div className="text-xs tracking-[0.22em] uppercase font-bold text-[color:var(--sdps-muted)]">Winner</div>
                      <div className="font-display text-4xl md:text-5xl font-black mt-1">{w?.name || "—"}</div>
                      <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-[#F4D571] to-[#D4AF37] text-[#1a1a1a] font-bold text-sm">
                        <Award className="w-4 h-4" /> {w?.votes || 0} votes · Symbol: {w?.symbol || "—"}
                      </div>
                      {all.length > 1 && (
                        <div className="mt-5">
                          <div className="text-xs tracking-[0.22em] uppercase font-bold text-[color:var(--sdps-muted)] mb-2">All Candidates</div>
                          <div className="space-y-1.5">
                            {all.map(c => (
                              <div key={c.candidate_id} className="flex items-center justify-between text-sm">
                                <span className={c.candidate_id === w?.candidate_id ? "font-bold" : ""}>{c.name}</span>
                                <span className="tabular-nums text-[color:var(--sdps-muted)]">{c.votes} ({Math.round((c.votes/total)*100)}%)</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          }
        </section>

        <div className="mt-12 text-center text-xs tracking-[0.32em] uppercase text-[color:var(--sdps-muted)]">
          Issued on {new Date().toLocaleDateString(undefined, { year:"numeric", month:"long", day:"numeric" })} · SDPS Election Board
        </div>
      </main>
    </div>
  );
}

const Stat = ({ k, v }) => (
  <div className="rounded-xl border border-[color:var(--sdps-gold)] p-3">
    <div className="text-[10px] tracking-[0.28em] uppercase font-bold text-[color:var(--sdps-muted)]">{k}</div>
    <div className="font-display text-2xl font-black hero-3d mt-1">{v}</div>
  </div>
);
