import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { KioskShell } from "../components/KioskShell";
import { Input } from "../components/ui/input";
import { useVote } from "../context/VoteContext";
import { api } from "../lib/api";
import { toast } from "sonner";
import { ArrowRight, KeyRound, ShieldCheck, Vote, GraduationCap, BookOpen } from "lucide-react";

const PREFIXES = { student: "SDPSS", teacher: "SDPSE" };

export default function AuthPage() {
  const [role, setRole] = useState("student");
  const [adm, setAdm] = useState(PREFIXES.student);
  const [loading, setLoading] = useState(false);
  const { setStudent, reset } = useVote();
  const navigate = useNavigate();

  useEffect(() => {
    setAdm((prev) => {
      const otherPrefix = role === "student" ? PREFIXES.teacher : PREFIXES.student;
      if (prev.startsWith(otherPrefix)) return PREFIXES[role] + prev.slice(otherPrefix.length);
      if (prev === "" || prev === PREFIXES.student || prev === PREFIXES.teacher) return PREFIXES[role];
      return prev;
    });
  }, [role]);

  const onChange = (e) => {
    let v = e.target.value.toUpperCase();
    setAdm(v);
  };

  const submit = async (e) => {
    e.preventDefault();
    const trimmed = adm.trim();
    const expectedPrefix = PREFIXES[role];
    if (!trimmed || trimmed === expectedPrefix) {
      toast.error("Please enter your full ID");
      return;
    }
    setLoading(true);
    try {
      reset();
      const { data } = await api.get(`/users/${trimmed}`);
      if (data.has_voted) {
        toast.error("This ID has already cast their vote.");
        setLoading(false);
        return;
      }
      setStudent(data);
      navigate("/confirm");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "ID not found");
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
          <p className="mt-6 text-lg md:text-xl text-[color:var(--sdps-ink)] max-w-md leading-relaxed font-medium">
            Welcome to the official SDPS Student Council Election. Authenticate with your school ID to begin.
          </p>
          <div className="mt-8 flex items-center gap-6 text-sm text-[color:var(--sdps-muted)]">
            <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-[color:var(--sdps-blue)]" /> Secure</div>
            <div className="flex items-center gap-2"><KeyRound className="w-4 h-4 text-[color:var(--sdps-gold)]" /> Anonymous tally</div>
          </div>
        </div>

        <form onSubmit={submit} className="glass rounded-3xl p-8 md:p-10 rise delay-2" data-testid="auth-form">
          <div className="text-xs font-bold tracking-[0.22em] uppercase text-[color:var(--sdps-blue)]">I am a</div>
          <div className="grid grid-cols-2 gap-2 mt-2 p-1 rounded-2xl bg-[rgba(15,60,138,0.06)]">
            <button
              type="button"
              data-testid="role-student-btn"
              onClick={() => setRole("student")}
              className={`h-12 rounded-xl font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition ${role === "student" ? "bg-white shadow text-[color:var(--sdps-blue)]" : "text-[color:var(--sdps-muted)]"}`}
            >
              <GraduationCap className="w-4 h-4" /> Student
            </button>
            <button
              type="button"
              data-testid="role-teacher-btn"
              onClick={() => setRole("teacher")}
              className={`h-12 rounded-xl font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition ${role === "teacher" ? "bg-white shadow text-[color:var(--sdps-blue)]" : "text-[color:var(--sdps-muted)]"}`}
            >
              <BookOpen className="w-4 h-4" /> Teacher
            </button>
          </div>

          <div className="mt-6 text-xs font-bold tracking-[0.22em] uppercase text-[color:var(--sdps-blue)]">School ID</div>
          <h2 className="font-display text-2xl md:text-3xl font-bold mt-1 mb-5">
            {role === "student" ? "Enter your admission number" : "Enter your staff ID"}
          </h2>

          <Input
            data-testid="auth-admission-input"
            autoFocus
            value={adm}
            onChange={onChange}
            placeholder={PREFIXES[role] + (role === "student" ? "001" : "01")}
            className="h-20 text-center text-3xl tracking-[0.2em] font-bold bg-white border-2 border-[rgba(15,60,138,0.12)] focus-visible:ring-4 focus-visible:ring-[rgba(15,60,138,0.2)] rounded-2xl"
          />

          <button
            type="submit"
            disabled={loading}
            data-testid="auth-submit-btn"
            className="btn-primary-3d w-full h-16 mt-6 rounded-2xl text-lg font-bold tracking-wide flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? "Verifying..." : (<>Continue <ArrowRight className="w-5 h-5" /></>)}
          </button>
        </form>
      </div>
    </KioskShell>
  );
}
