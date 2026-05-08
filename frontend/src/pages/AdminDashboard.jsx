import { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api, POST_LABELS, POST_ORDER } from "../lib/api";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  BarChart3, Users, UserSquare2, Trophy, LogOut, Upload, Plus, Trash2, Pencil,
  ShieldCheck, FileSpreadsheet, Crown, Award, Sparkles, X, Save
} from "lucide-react";
import { toast } from "sonner";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, PieChart, Pie, Legend
} from "recharts";

const TABS = [
  { key: "overview", label: "Overview", icon: BarChart3 },
  { key: "results", label: "Results", icon: Trophy },
  { key: "voters", label: "Voters", icon: UserSquare2 },
  { key: "candidates", label: "Candidates", icon: Award },
  { key: "students", label: "Students", icon: Users },
];

const COLORS = ["#0F3C8A", "#D4AF37", "#1A55B6", "#F4D571", "#4A78D6", "#B9892B"];

export default function AdminDashboard() {
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const adminUser = localStorage.getItem("sdps_admin_user") || "Admin";

  const refresh = async () => {
    setLoading(true);
    try {
      const [s, st, c] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/students"),
        api.get("/candidates"),
      ]);
      setStats(s.data);
      setStudents(st.data);
      setCandidates(c.data);
    } catch (err) {
      if (err?.response?.status === 401) {
        localStorage.removeItem("sdps_admin_token");
        navigate("/admin/login");
      } else {
        toast.error("Failed to load admin data");
      }
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (!localStorage.getItem("sdps_admin_token")) {
      navigate("/admin/login");
      return;
    }
    refresh();
    // eslint-disable-next-line
  }, []);

  const logout = () => {
    localStorage.removeItem("sdps_admin_token");
    localStorage.removeItem("sdps_admin_user");
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] via-white to-[#EEF3FB]">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-screen border-r border-[rgba(15,60,138,0.08)] bg-white p-5 hidden md:block">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0F3C8A, #1A55B6)" }}>
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-[10px] tracking-[0.28em] font-bold text-[color:var(--sdps-muted)]">SDPS</div>
              <div className="font-display font-bold text-base leading-tight">Admin Console</div>
            </div>
          </div>
          <nav className="space-y-1">
            {TABS.map(t => {
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  data-testid={`tab-${t.key}`}
                  onClick={() => setTab(t.key)}
                  className={`admin-link w-full text-left ${tab === t.key ? "active" : ""}`}
                >
                  <Icon className="w-4 h-4" /> {t.label}
                </button>
              );
            })}
          </nav>
          <div className="mt-10 pt-6 border-t border-[rgba(15,60,138,0.08)]">
            <div className="text-xs text-[color:var(--sdps-muted)]">Signed in as</div>
            <div className="font-bold text-[color:var(--sdps-blue)]">{adminUser}</div>
            <button onClick={logout} data-testid="admin-logout-btn" className="mt-3 admin-link w-full text-left text-red-600 hover:bg-red-50">
              <LogOut className="w-4 h-4" /> Sign out
            </button>
            <Link to="/" className="admin-link w-full mt-1 text-left">
              <Sparkles className="w-4 h-4" /> Back to Kiosk
            </Link>
          </div>
        </aside>

        <main className="flex-1 p-6 md:p-10">
          {/* Mobile tabs */}
          <div className="md:hidden flex gap-2 overflow-x-auto pb-3 mb-3">
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} data-testid={`mtab-${t.key}`}
                className={`px-3 py-2 rounded-xl text-sm font-bold whitespace-nowrap ${tab===t.key?"bg-[color:var(--sdps-blue)] text-white":"bg-white border"}`}>
                {t.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-4">
              <div className="h-32 rounded-2xl bg-white animate-pulse" />
              <div className="h-64 rounded-2xl bg-white animate-pulse" />
            </div>
          ) : (
            <>
              {tab === "overview" && <Overview stats={stats} />}
              {tab === "results" && <Results stats={stats} />}
              {tab === "voters" && <Voters stats={stats} students={students} />}
              {tab === "candidates" && <CandidatesTab candidates={candidates} onChange={refresh} />}
              {tab === "students" && <StudentsTab students={students} onChange={refresh} />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

const Stat = ({ label, value, icon: Icon, accent }) => (
  <div className="rounded-2xl bg-white border border-[rgba(15,60,138,0.08)] p-5 shadow-[0_8px_24px_-12px_rgba(15,60,138,0.15)]" data-testid="dashboard-stats-card">
    <div className="flex items-center justify-between">
      <div className="text-xs tracking-[0.22em] uppercase font-bold text-[color:var(--sdps-muted)]">{label}</div>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent}`}><Icon className="w-5 h-5 text-white" /></div>
    </div>
    <div className="font-display text-4xl font-black mt-3 hero-3d">{value}</div>
  </div>
);

const Overview = ({ stats }) => {
  if (!stats) return null;
  const turnoutData = [
    { name: "Voted", value: stats.total_voted },
    { name: "Pending", value: Math.max(0, stats.total_students - stats.total_voted) },
  ];
  return (
    <div className="space-y-6">
      <header>
        <div className="step-pill">Overview</div>
        <h1 className="font-display text-4xl md:text-5xl font-black hero-3d mt-3">Election Control Room</h1>
        <p className="text-[color:var(--sdps-muted)] mt-2">Live snapshot of voter turnout and contest leaders.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Total Students" value={stats.total_students} icon={Users} accent="bg-gradient-to-br from-[#0F3C8A] to-[#1A55B6]" />
        <Stat label="Votes Cast" value={stats.total_voted} icon={ShieldCheck} accent="bg-gradient-to-br from-[#1A55B6] to-[#4A78D6]" />
        <Stat label="Turnout" value={`${stats.turnout_pct}%`} icon={BarChart3} accent="bg-gradient-to-br from-[#D4AF37] to-[#B9892B]" />
        <Stat label="Pending" value={Math.max(0, stats.total_students - stats.total_voted)} icon={UserSquare2} accent="bg-gradient-to-br from-[#5C6A82] to-[#0A1128]" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl bg-white border border-[rgba(15,60,138,0.08)] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-bold">Leaders by Post</h2>
            <Crown className="w-5 h-5 text-[color:var(--sdps-gold)]" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {POST_ORDER.map(p => {
              const w = stats.winners?.[p];
              return (
                <div key={p} className="rounded-xl border border-[rgba(15,60,138,0.08)] p-4 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-blue-100">
                    {w?.photo ? <img src={w.photo} alt={w.name} className="w-full h-full object-cover" /> : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] tracking-[0.22em] uppercase font-bold text-[color:var(--sdps-muted)]">{POST_LABELS[p]}</div>
                    <div className="font-bold truncate">{w?.name || "—"}</div>
                    <div className="text-xs text-[color:var(--sdps-blue)] font-bold">{w?.votes || 0} votes</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="rounded-2xl bg-white border border-[rgba(15,60,138,0.08)] p-6">
          <h2 className="font-display text-xl font-bold mb-4">Turnout</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={turnoutData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90}>
                <Cell fill="#0F3C8A" />
                <Cell fill="#E5E7EB" />
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const Results = ({ stats }) => {
  if (!stats) return null;
  return (
    <div className="space-y-6">
      <header>
        <div className="step-pill">Results</div>
        <h1 className="font-display text-4xl md:text-5xl font-black hero-3d mt-3">Vote Count by Category</h1>
      </header>
      {POST_ORDER.map(p => {
        const list = (stats.by_post[p] || []).slice().sort((a,b) => b.votes - a.votes);
        const max = Math.max(1, ...list.map(x => x.votes));
        return (
          <div key={p} className="rounded-2xl bg-white border border-[rgba(15,60,138,0.08)] p-6" data-testid={`results-${p}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-2xl font-bold">{POST_LABELS[p]}</h2>
              {list[0] && (
                <div className="flex items-center gap-2 text-sm">
                  <Crown className="w-4 h-4 text-[color:var(--sdps-gold)]" />
                  <span className="font-bold">{list[0].name}</span>
                  <span className="text-[color:var(--sdps-muted)]">leads with {list[0].votes}</span>
                </div>
              )}
            </div>
            <ResponsiveContainer width="100%" height={Math.max(180, list.length * 56)}>
              <BarChart data={list} layout="vertical" margin={{ left: 16, right: 24 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eef2f8" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis dataKey="name" type="category" width={140} tick={{ fontWeight: 700, fill: "#0A1128" }} />
                <Tooltip />
                <Bar dataKey="votes" radius={[0, 8, 8, 0]}>
                  {list.map((entry, i) => (
                    <Cell key={i} fill={entry.votes === max ? "#D4AF37" : "#0F3C8A"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
      })}
    </div>
  );
};

const Voters = ({ stats, students }) => {
  const [q, setQ] = useState("");
  if (!stats) return null;
  const map = new Map(stats.votes.map(v => [v.admission_no, v]));
  const rows = students.filter(s => {
    if (!q) return true;
    const k = q.toLowerCase();
    return s.admission_no.toLowerCase().includes(k) || s.name.toLowerCase().includes(k);
  });
  return (
    <div className="space-y-5">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="step-pill">Voters</div>
          <h1 className="font-display text-4xl md:text-5xl font-black hero-3d mt-3">Individual Ballots</h1>
          <p className="text-[color:var(--sdps-muted)] mt-2">Audit-grade per-student record of choices.</p>
        </div>
        <Input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search admission no. or name" className="max-w-xs" data-testid="voters-search" />
      </header>
      <div className="rounded-2xl bg-white border border-[rgba(15,60,138,0.08)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#F2F5FB] text-left text-[color:var(--sdps-muted)] uppercase text-xs tracking-[0.18em]">
              <tr>
                <th className="p-3">Admission</th>
                <th className="p-3">Student</th>
                <th className="p-3">Status</th>
                {POST_ORDER.map(p => <th key={p} className="p-3">{POST_LABELS[p]}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map(s => {
                const v = map.get(s.admission_no);
                return (
                  <tr key={s.admission_no} className="border-t border-[rgba(15,60,138,0.06)]">
                    <td className="p-3 font-mono font-bold">{s.admission_no}</td>
                    <td className="p-3 font-bold">{s.name}<div className="text-xs font-normal text-[color:var(--sdps-muted)]">{s.father_name}</div></td>
                    <td className="p-3">
                      {v ? <span className="text-emerald-600 font-bold">Voted</span> : <span className="text-amber-600 font-bold">Pending</span>}
                    </td>
                    {POST_ORDER.map(p => (
                      <td key={p} className="p-3">{v?.selections?.[p] || <span className="text-gray-300">—</span>}</td>
                    ))}
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr><td colSpan={3 + POST_ORDER.length} className="p-10 text-center text-[color:var(--sdps-muted)]">No matches.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const CandidatesTab = ({ candidates, onChange }) => {
  const [editing, setEditing] = useState(null);
  const [creatingPost, setCreatingPost] = useState(null);

  const grouped = POST_ORDER.map(p => ({ post: p, items: candidates.filter(c => c.post === p) }));

  const remove = async (id) => {
    if (!window.confirm("Delete this candidate?")) return;
    try {
      await api.delete(`/admin/candidates/${id}`);
      toast.success("Candidate deleted");
      onChange();
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed"); }
  };

  return (
    <div className="space-y-5">
      <header>
        <div className="step-pill">Candidates</div>
        <h1 className="font-display text-4xl md:text-5xl font-black hero-3d mt-3">Manage Candidates</h1>
        <p className="text-[color:var(--sdps-muted)] mt-2">Add, edit or delete candidates per post. Photo can be a URL or uploaded file.</p>
      </header>

      {grouped.map(({ post, items }) => (
        <div key={post} className="rounded-2xl bg-white border border-[rgba(15,60,138,0.08)] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-bold">{POST_LABELS[post]}</h2>
            <button onClick={() => setCreatingPost(post)} data-testid={`add-candidate-${post}`}
              className="btn-primary-3d h-10 px-4 rounded-xl text-sm font-bold flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
          {items.length === 0 ? (
            <div className="text-sm text-[color:var(--sdps-muted)]">No candidates yet.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {items.map(c => (
                <div key={c.id} className="rounded-xl border border-[rgba(15,60,138,0.1)] p-3 flex gap-3">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-blue-100 flex-shrink-0">
                    {c.photo ? <img src={c.photo} alt={c.name} className="w-full h-full object-cover" /> : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold truncate">{c.name}</div>
                    <div className="text-xs text-[color:var(--sdps-muted)]">Symbol: {c.symbol || "—"}</div>
                    <div className="mt-2 flex gap-1">
                      <button onClick={() => setEditing(c)} className="p-1.5 rounded hover:bg-blue-50" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => remove(c.id)} data-testid={`del-candidate-${c.id}`} className="p-1.5 rounded hover:bg-red-50 text-red-500" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {(editing || creatingPost) && (
        <CandidateModal
          initial={editing || { post: creatingPost, name: "", photo: "", symbol: "" }}
          isNew={!editing}
          onClose={() => { setEditing(null); setCreatingPost(null); }}
          onSaved={() => { setEditing(null); setCreatingPost(null); onChange(); }}
        />
      )}
    </div>
  );
};

const CandidateModal = ({ initial, isNew, onClose, onSaved }) => {
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef();

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 1.5 * 1024 * 1024) {
      toast.error("Image too large. Use a smaller image (under 1.5MB) or a URL.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setForm(s => ({ ...s, photo: reader.result }));
    reader.readAsDataURL(f);
  };

  const save = async () => {
    if (!form.name?.trim()) { toast.error("Name is required"); return; }
    setBusy(true);
    try {
      if (isNew) {
        await api.post("/admin/candidates", form);
        toast.success("Candidate added");
      } else {
        await api.put(`/admin/candidates/${form.id}`, form);
        toast.success("Candidate updated");
      }
      onSaved();
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed"); }
    finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded hover:bg-gray-100"><X className="w-5 h-5" /></button>
        <h3 className="font-display text-2xl font-bold">{isNew ? "Add Candidate" : "Edit Candidate"}</h3>
        <p className="text-sm text-[color:var(--sdps-muted)] mb-5">Post: <span className="font-bold">{POST_LABELS[form.post]}</span></p>
        <div className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input data-testid="cand-name-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label>Election Symbol (text)</Label>
            <Input data-testid="cand-symbol-input" value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })} placeholder="e.g. Star, Sun, Book" />
          </div>
          <div>
            <Label>Photo URL</Label>
            <Input data-testid="cand-photo-url-input" value={form.photo?.startsWith("data:") ? "" : (form.photo || "")} onChange={(e) => setForm({ ...form, photo: e.target.value })} placeholder="https://…" />
          </div>
          <div>
            <Label>Or upload from device</Label>
            <input ref={fileRef} type="file" accept="image/*" onChange={onFile} data-testid="cand-photo-file-input" className="block w-full text-sm" />
            {form.photo && (
              <div className="mt-3 flex items-center gap-3">
                <img src={form.photo} alt="" className="w-16 h-16 rounded-lg object-cover" />
                <button onClick={() => setForm({ ...form, photo: "" })} className="text-xs text-red-500">Remove photo</button>
              </div>
            )}
          </div>
          {!isNew && (
            <div>
              <Label>Post</Label>
              <select value={form.post} onChange={(e) => setForm({ ...form, post: e.target.value })} className="h-10 w-full border rounded-md px-3">
                {POST_ORDER.map(p => <option key={p} value={p}>{POST_LABELS[p]}</option>)}
              </select>
            </div>
          )}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="h-11 px-5 rounded-xl border font-bold">Cancel</button>
          <button onClick={save} disabled={busy} data-testid="cand-save-btn" className="btn-primary-3d h-11 px-5 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50">
            <Save className="w-4 h-4" /> {busy ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

const StudentsTab = ({ students, onChange }) => {
  const fileRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [q, setQ] = useState("");

  const upload = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", f);
      const { data } = await api.post("/admin/students/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success(`Imported · ${data.inserted} new, ${data.updated} updated`);
      onChange();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const remove = async (adm) => {
    if (!window.confirm(`Delete ${adm}?`)) return;
    try {
      await api.delete(`/admin/students/${adm}`);
      toast.success("Deleted");
      onChange();
    } catch (e) { toast.error("Failed"); }
  };

  const rows = students.filter(s => !q || s.admission_no.toLowerCase().includes(q.toLowerCase()) || s.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-5">
      <header>
        <div className="step-pill">Students</div>
        <h1 className="font-display text-4xl md:text-5xl font-black hero-3d mt-3">Eligible Voters</h1>
        <p className="text-[color:var(--sdps-muted)] mt-2">Upload an Excel file with columns: <span className="font-mono font-bold">admission_no, name, father_name, class_name</span> (last is optional).</p>
      </header>

      <div className="rounded-2xl bg-white border border-[rgba(15,60,138,0.08)] p-6 flex flex-col md:flex-row md:items-center gap-4 justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#D4AF37] to-[#B9892B]">
            <FileSpreadsheet className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="font-bold">Bulk Excel upload</div>
            <div className="text-xs text-[color:var(--sdps-muted)]">.xlsx file · headers match expected names</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search students" data-testid="students-search" />
          <input ref={fileRef} type="file" accept=".xlsx" onChange={upload} data-testid="upload-excel-input" className="hidden" />
          <button onClick={() => fileRef.current?.click()} disabled={uploading} data-testid="upload-excel-btn"
            className="btn-gold-3d h-11 px-5 rounded-xl font-bold flex items-center gap-2 disabled:opacity-60 whitespace-nowrap">
            <Upload className="w-4 h-4" /> {uploading ? "Uploading..." : "Upload Excel"}
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-[rgba(15,60,138,0.08)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#F2F5FB] text-left text-[color:var(--sdps-muted)] uppercase text-xs tracking-[0.18em]">
              <tr>
                <th className="p-3">Admission</th>
                <th className="p-3">Name</th>
                <th className="p-3">Father's Name</th>
                <th className="p-3">Class</th>
                <th className="p-3">Status</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(s => (
                <tr key={s.admission_no} className="border-t border-[rgba(15,60,138,0.06)]">
                  <td className="p-3 font-mono font-bold">{s.admission_no}</td>
                  <td className="p-3 font-bold">{s.name}</td>
                  <td className="p-3">{s.father_name}</td>
                  <td className="p-3">{s.class_name || "—"}</td>
                  <td className="p-3">{s.has_voted ? <span className="text-emerald-600 font-bold">Voted</span> : <span className="text-amber-600 font-bold">Pending</span>}</td>
                  <td className="p-3 text-right">
                    <button onClick={() => remove(s.admission_no)} className="p-1.5 rounded hover:bg-red-50 text-red-500" data-testid={`del-student-${s.admission_no}`}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={6} className="p-10 text-center text-[color:var(--sdps-muted)]">No students.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
