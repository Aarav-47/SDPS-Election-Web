import { useNavigate, Navigate } from "react-router-dom";
import { KioskShell } from "../components/KioskShell";
import { useVote } from "../context/VoteContext";
import { Check, X, UserCircle2 } from "lucide-react";

export default function ConfirmPage() {
  const { student, reset } = useVote();
  const navigate = useNavigate();

  if (!student) return <Navigate to="/" replace />;

  const isTeacher = student.role === "teacher";

  return (
    <KioskShell>
      <div className="max-w-2xl mx-auto rise">
        <div className="step-pill mb-6">Step 2 · Confirm Identity</div>
        <h1 className="font-display text-4xl md:text-5xl font-black hero-3d">Is this you?</h1>
        <p className="mt-3 text-lg text-[color:var(--sdps-ink)] font-medium">Please verify your details before voting begins.</p>

        <div className="glass rounded-3xl p-8 md:p-10 mt-8" data-testid="confirm-card">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[#0F3C8A] to-[#1A55B6] text-white">
              <UserCircle2 className="w-12 h-12" />
            </div>
            <div className="flex-1">
              <div className="text-xs tracking-[0.22em] uppercase font-bold text-[color:var(--sdps-muted)]">
                {isTeacher ? "Staff ID" : "Admission No."}
              </div>
              <div className="font-mono text-xl font-bold text-[color:var(--sdps-blue)]">{student.admission_no}</div>
              <div className="mt-1 text-[10px] tracking-[0.22em] uppercase font-bold inline-block px-2 py-0.5 rounded"
                   style={{ background: isTeacher ? "rgba(212,175,55,0.18)" : "rgba(15,60,138,0.12)", color: isTeacher ? "#8a6e1f" : "#0F3C8A" }}>
                {isTeacher ? "Teacher" : "Student"}
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <div className="text-xs tracking-[0.22em] uppercase font-bold text-[color:var(--sdps-muted)]">Name</div>
              <div className="font-display text-2xl font-bold mt-1" data-testid="confirm-student-name">{student.name}</div>
            </div>
            {isTeacher ? (
              <>
                {student.subject && (
                  <div>
                    <div className="text-xs tracking-[0.22em] uppercase font-bold text-[color:var(--sdps-muted)]">Subject</div>
                    <div className="font-display text-2xl font-bold mt-1">{student.subject}</div>
                  </div>
                )}
                {student.designation && (
                  <div>
                    <div className="text-xs tracking-[0.22em] uppercase font-bold text-[color:var(--sdps-muted)]">Designation</div>
                    <div className="font-display text-xl font-bold mt-1">{student.designation}</div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div>
                  <div className="text-xs tracking-[0.22em] uppercase font-bold text-[color:var(--sdps-muted)]">Father's Name</div>
                  <div className="font-display text-2xl font-bold mt-1" data-testid="confirm-father-name">{student.father_name || "—"}</div>
                </div>
                {student.class_name && (
                  <div>
                    <div className="text-xs tracking-[0.22em] uppercase font-bold text-[color:var(--sdps-muted)]">Class</div>
                    <div className="font-display text-xl font-bold mt-1">{student.class_name}</div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 mt-10">
            <button
              onClick={() => { reset(); navigate("/"); }}
              data-testid="confirm-no-btn"
              className="h-14 rounded-2xl border-2 border-[rgba(15,60,138,0.15)] bg-white font-bold flex items-center justify-center gap-2 hover:bg-red-50 hover:border-red-200 transition"
            >
              <X className="w-5 h-5" /> Not Me
            </button>
            <button
              onClick={() => navigate("/vote")}
              data-testid="confirm-identity-btn"
              className="btn-primary-3d h-14 rounded-2xl font-bold flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" /> Yes, that's me
            </button>
          </div>
        </div>
      </div>
    </KioskShell>
  );
}
