import { ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

export const KioskShell = ({ children }) => {
  return (
    <div className="kiosk-bg min-h-screen relative">
      <div className="orb b w-[520px] h-[520px] -top-40 -left-32" />
      <div className="orb g w-[420px] h-[420px] top-1/2 -right-24" style={{ animationDelay: "2s" }} />
      <div className="orb s w-[360px] h-[360px] -bottom-32 left-1/3" style={{ animationDelay: "5s" }} />

      <header className="relative z-10 max-w-6xl mx-auto px-6 pt-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
               style={{ background: "linear-gradient(135deg, #0F3C8A, #1A55B6)" }}>
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="text-xs tracking-[0.28em] text-[color:var(--sdps-muted)] font-bold">SDPS</div>
            <div className="font-display font-bold text-lg leading-none text-[color:var(--sdps-ink)]">
              Student Council <span className="gold-text">Election 2026</span>
            </div>
          </div>
        </div>
        <Link
          to="/admin/login"
          data-testid="admin-portal-link"
          className="text-xs tracking-[0.2em] uppercase font-bold text-[color:var(--sdps-blue)] hover:underline"
        >
          Admin Portal
        </Link>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-6 py-10 md:py-14">{children}</main>

      <footer className="relative z-10 text-center pb-8 text-xs tracking-[0.2em] uppercase text-[color:var(--sdps-muted)]">
        Powered by SDPS · Every Vote Shapes Tomorrow
      </footer>
    </div>
  );
};
