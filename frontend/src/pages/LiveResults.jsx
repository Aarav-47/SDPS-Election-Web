import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { Crown, Sparkles, Users, ShieldCheck, RefreshCw } from "lucide-react";

export default function LiveResults() {

  const navigate = useNavigate();

  useEffect(() => {

    const token = localStorage.getItem("sdps_admin_token");

    if (!token) {
      navigate("/admin?redirect=results");
    }

  }, [navigate]);

  const [data, setData] = useState(null);
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

      } catch (err) {
        console.log(err);
      }

    };

    load();

    const id = setInterval(load, 5000);

    return () => {
      active = false;
      clearInterval(id);
    };

  }, []);

  return (
    <div className="kiosk-bg min-h-screen relative overflow-hidden">

      <header className="relative z-10 max-w-7xl mx-auto px-8 pt-10 flex items-center justify-between">
        <div>
          <div className="text-xs tracking-[0.32em] uppercase font-bold text-[color:var(--sdps-blue)]">
            SDPS · Live Results
          </div>

          <h1 className="font-display text-5xl md:text-7xl font-black hero-3d mt-2 leading-none">
            Live <span className="gold-text">Tally</span>
          </h1>
        </div>

        <div className="text-right">
          <div className="text-xs tracking-[0.22em] uppercase font-bold text-[color:var(--sdps-muted)]">
            Auto-refresh
          </div>

          <div className={`mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 backdrop-blur border border-white/80 ${pulse ? "ring-2 ring-[color:var(--sdps-gold)]" : ""}`}>
            <RefreshCw className={`w-3.5 h-3.5 text-[color:var(--sdps-blue)] ${pulse ? "animate-spin" : ""}`} />

            <span className="text-xs font-bold tracking-widest">
              {data?.updated_at
                ? new Date(data.updated_at).toLocaleTimeString()
                : "…"}
            </span>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-8 py-10">

        {!data ? (
          <div className="text-center py-20">
            Loading...
          </div>
        ) : (
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">

            <KPI icon={Users} label="Eligible" value={data.total_users} />

            <KPI
              icon={ShieldCheck}
              label="Voted"
              value={data.total_voted}
            />

            <KPI
              icon={Sparkles}
              label="Turnout"
              value={`${data.turnout_pct}%`}
            />

            <KPI
              icon={Crown}
              label="Categories"
              value={data.posts.length}
            />

          </section>
        )}

      </main>

    </div>
  );
}

const KPI = ({ icon: Icon, label, value }) => (

  <div className="glass rounded-2xl p-5">

    <div className="flex items-center justify-between">

      <div className="text-[10px] tracking-[0.28em] uppercase font-bold">
        {label}
      </div>

      <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-blue-700">
        <Icon className="w-5 h-5 text-white" />
      </div>

    </div>

    <div className="font-display text-4xl md:text-5xl font-black mt-3">
      {value}
    </div>

  </div>
);
