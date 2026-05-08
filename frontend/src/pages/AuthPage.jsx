import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { KioskShell } from "../components/KioskShell";
import { Input } from "../components/ui/input";
import { useVote } from "../context/VoteContext";
import { api } from "../lib/api";
import { toast } from "sonner";
import { ArrowRight, KeyRound, ShieldCheck, Vote } from "lucide-react";

export default function AuthPage() {
  const [adm, setAdm] = useState("");
  const [loading, setLoading] = useState(false);
  const { setStudent, reset } = useVote();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    if (!adm.trim()) {
      toast.error("Please enter your admission number");
      return;
    }
    setLoading(true);
    try {
      reset();
      const { data } = await api.get(`/students/${adm.trim()}`);
      if (data.has_voted) {
        toast.error("This admission number has already cast their vote.");
        setLoading(false);
        return;
      }
      setStudent(data);
      navigate("/confirm");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Student not found");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KioskShell>
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div className="rise">
          <div className="step-pill mb-6"><Vote className="w-3.5 h-3.5" /> Step 1 · Identity</div>
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-black leading-[0.95] hero-3d">
            Cast your<br/>vote with<br/><span className="gold-text">pride.</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-[color:var(--sdps-muted)] max-w-md leading-relaxed">
            Welcome to the official SDPS Student Council Election. Authenticate with your admission number to begin.
          </p>
          <div className="mt-8 flex items-center gap-6 text-sm text-[color:var(--sdps-muted)]">
            <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-[color:var(--sdps-blue)]" /> Secure</div>
            <div className="flex items-center gap-2"><KeyRound className="w-4 h-4 text-[color:var(--sdps-gold)]" /> Anonymous tally</div>
          </div>
        </div>

        <form onSubmit={submit} className="glass rounded-3xl p-8 md:p-10 rise delay-2" data-testid="auth-form">
          <div className="text-xs font-bold tracking-[0.22em] uppercase text-[color:var(--sdps-blue)]">Admission Number</div>
          <h2 className="font-display text-2xl md:text-3xl font-bold mt-1 mb-6">Enter your ID to continue</h2>

          <div className="relative">
            <Input
              data-testid="auth-admission-input"
              autoFocus
              value={adm}
              onChange={(e) => setAdm(e.target.value.toUpperCase())}
              placeholder="SDPS001"
              className="h-20 text-center text-3xl tracking-[0.3em] font-bold bg-white border-2 border-[rgba(15,60,138,0.12)] focus-visible:ring-4 focus-visible:ring-[rgba(15,60,138,0.2)] rounded-2xl"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            data-testid="auth-submit-btn"
            className="btn-primary-3d w-full h-16 mt-6 rounded-2xl text-lg font-bold tracking-wide flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? "Verifying..." : (<>Continue <ArrowRight className="w-5 h-5" /></>)}
          </button>

          <div className="mt-6 text-center text-xs text-[color:var(--sdps-muted)]">
            Try sample: <span className="font-mono font-bold text-[color:var(--sdps-blue)]">SDPS001</span> – <span className="font-mono font-bold text-[color:var(--sdps-blue)]">SDPS008</span>
          </div>
        </form>
      </div>
    </KioskShell>
  );
}
