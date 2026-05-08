import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api";
import { Input } from "../components/ui/input";
import { Lock, ShieldCheck, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function AdminLogin() {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/admin/login", { username: u, password: p });
      localStorage.setItem("sdps_admin_token", data.token);
      localStorage.setItem("sdps_admin_user", data.username);
      toast.success("Welcome, " + data.username);
      navigate("/admin");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Invalid credentials");
    } finally { setLoading(false); }
  };

  return (
    <div className="kiosk-bg min-h-screen flex items-center justify-center p-6">
      <div className="orb b w-[420px] h-[420px] -top-20 -left-20" />
      <div className="orb g w-[360px] h-[360px] bottom-0 right-0" />

      <form onSubmit={submit} className="glass rounded-3xl p-10 w-full max-w-md relative z-10 rise" data-testid="admin-login-form">
        <Link to="/" className="text-xs tracking-[0.22em] uppercase font-bold text-[color:var(--sdps-blue)]">← Back to kiosk</Link>
        <div className="mt-6 w-14 h-14 rounded-2xl flex items-center justify-center"
             style={{ background: "linear-gradient(135deg, #0F3C8A, #1A55B6)" }}>
          <ShieldCheck className="w-7 h-7 text-white" />
        </div>
        <h1 className="font-display text-4xl font-black hero-3d mt-6">Admin Portal</h1>
        <p className="text-[color:var(--sdps-muted)] mt-2">Restricted access · authorized staff only.</p>

        <div className="mt-8 space-y-4">
          <div>
            <label className="text-xs tracking-[0.22em] uppercase font-bold text-[color:var(--sdps-muted)]">Username</label>
            <Input data-testid="admin-username-input" value={u} onChange={(e) => setU(e.target.value)} className="h-14 mt-1 rounded-xl text-base" />
          </div>
          <div>
            <label className="text-xs tracking-[0.22em] uppercase font-bold text-[color:var(--sdps-muted)]">Password</label>
            <Input data-testid="admin-password-input" type="password" value={p} onChange={(e) => setP(e.target.value)} className="h-14 mt-1 rounded-xl text-base" />
          </div>
        </div>

        <button data-testid="admin-login-btn" disabled={loading} className="btn-primary-3d w-full h-14 rounded-2xl font-bold mt-8 flex items-center justify-center gap-2 disabled:opacity-60">
          {loading ? "Signing in..." : (<><Lock className="w-4 h-4" /> Sign in <ArrowRight className="w-4 h-4" /></>)}
        </button>
      </form>
    </div>
  );
}
