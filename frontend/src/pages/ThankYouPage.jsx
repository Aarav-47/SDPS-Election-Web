import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { KioskShell } from "../components/KioskShell";
import { useVote } from "../context/VoteContext";
import { Award, ArrowRight, Sparkles } from "lucide-react";

export default function ThankYouPage() {
  const { reset } = useVote();
  const navigate = useNavigate();

  const pieces = useMemo(() => {
    const colors = ["#0F3C8A", "#1A55B6", "#D4AF37", "#F4D571", "#FFFFFF", "#4A78D6"];
    return Array.from({ length: 80 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 1.2,
      duration: 2.5 + Math.random() * 2.5,
      color: colors[i % colors.length],
      x: (Math.random() - 0.5) * 80,
      rotate: Math.random() * 360,
    }));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {}, 0);
    return () => clearTimeout(t);
  }, []);

  return (
    <KioskShell>
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
        {pieces.map(p => (
          <span
            key={p.id}
            className="confetti-piece"
            style={{
              left: `${p.left}%`,
              background: p.color,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              transform: `rotate(${p.rotate}deg)`,
              "--x": `${p.x}px`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-2xl mx-auto text-center rise" data-testid="thankyou-screen">
        <div className="mx-auto w-24 h-24 rounded-3xl flex items-center justify-center"
             style={{ background: "linear-gradient(135deg, #F4D571, #D4AF37)", boxShadow: "0 18px 40px rgba(212,175,55,0.45)" }}>
          <Award className="w-12 h-12 text-white" />
        </div>
        <div className="step-pill mt-6"><Sparkles className="w-3.5 h-3.5" /> Ballot Submitted</div>
        <h1 className="font-display text-5xl md:text-7xl font-black hero-3d mt-4 leading-[1]">
          Thank you<span className="gold-text">.</span>
        </h1>
        <p className="mt-5 text-lg md:text-xl text-[color:var(--sdps-muted)]">
          Your vote has been recorded confidentially. Together we shape SDPS.
        </p>

        <button
          onClick={() => { reset(); navigate("/"); }}
          data-testid="next-student-btn"
          className="btn-gold-3d h-16 px-10 rounded-2xl font-bold text-lg mt-10 inline-flex items-center gap-3"
        >
          Next Student to Vote <ArrowRight className="w-5 h-5" />
        </button>

        <div className="mt-10 text-xs tracking-[0.22em] uppercase text-[color:var(--sdps-muted)]">
          One person · One vote · One future
        </div>
      </div>
    </KioskShell>
  );
}
