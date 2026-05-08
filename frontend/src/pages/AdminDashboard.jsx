import { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api, API } from "../lib/api";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  BarChart3, Users, UserSquare2, Trophy, LogOut, Upload, Plus, Trash2, Pencil,
  ShieldCheck, FileSpreadsheet, Crown, Award, Sparkles, X, Save, Settings, ListOrdered,
  ImageIcon, RotateCcw, AlertTriangle, GraduationCap, BookOpen, Download
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
  { key: "categories", label: "Categories", icon: ListOrdered },
  { key: "students", label: "Students", icon: GraduationCap },
  { key: "teachers", label: "Teachers", icon: BookOpen },
  { key: "settings", label: "Settings", icon: Settings },
];

export default function AdminDashboard() {
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [posts, setPosts] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const adminUser = localStorage.getItem("sdps_admin_user") || "Admin";

  const refresh = async () => {
    setLoading(true);
    try {
      const [s, u, c, p, st] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/users"),
        api.get("/candidates"),
        api.get("/admin/posts"),
        api.get("/admin/settings"),
      ]);
      setStats(s.data);
      setUsers(u.data);
      setCandidates(c.data);
      setPosts(p.data);
      setSettings(st.data || {});
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

  const postLabels = Object.fromEntries(posts.map(p => [p.key, p.title]));

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] via-white to-[#EEF3FB]">
      <div className="flex">
        <aside className="w-64 min-h-screen border-r border-[rgba(15,60,138,0.08)] bg-white p-5 hidden md:block">
          <div className="flex items-center gap-3 mb-8">
            {settings.school_logo ? (
              <div className="w-11 h-11 rounded-2xl overflow-hidden bg-white p-1 border border-[rgba(15,60,138,0.1)]">
                <img src={settings.school_logo} alt="" className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0F3C8A, #1A55B6)" }}>
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
            )}
            <div>
              <div className="text-[10px] tracking-[0.28em] font-bold text-[color:var(--sdps-muted)]">SDPS</div>
              <div className="font-display font-bold text-base leading-tight">Admin Console</div>
            </div>
          </div>
          <nav className="space-y-1">
            {TABS.map(t => {
              const Icon = t.icon;
              return (
                <button key={t.key} data-testid={`tab-${t.key}`} onClick={() => setTab(t.key)}
                  className={`admin-link w-full text-left ${tab === t.key ? "active" : ""}`}>
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
              {tab === "overview" && <Overview stats={stats} posts={posts} postLabels={postLabels} />}
              {tab === "results" && <Results stats={stats} posts={posts} />}
              {tab === "voters" && <Voters stats={stats} users={users} posts={posts} postLabels={postLabels} />}
              {tab === "candidates" && <CandidatesTab candidates={candidates} posts={posts} postLabels={postLabels} onChange={refresh} />}
              {tab === "categories" && <CategoriesTab posts={posts} onChange={refresh} />}
              {tab === "students" && <UsersTab role="student" users={users.filter(u => u.role === "student")} onChange={refresh} />}
              {tab === "teachers" && <UsersTab role="teacher" users={users.filter(u => u.role === "teacher")} onChange={refresh} />}
              {tab === "settings" && <SettingsTab settings={settings} onChange={refresh} />}
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

const Overview = ({ stats, posts, postLabels }) => {
  if (!stats) return null;
  const turnoutData = [
    { name: "Voted", value: stats.total_voted },
    { name: "Pending", value: Math.max(0, (stats.total_users || 0) - stats.total_voted) },
  ];
  return (
    <div className="space-y-6">
      <header>
        <div className="step-pill">Overview</div>
        <h1 className="font-display text-4xl md:text-5xl font-black hero-3d mt-3">Election Control Room</h1>
        <p className="text-[color:var(--sdps-ink)] mt-2 font-medium">Live snapshot of voter turnout and contest leaders.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Eligible Voters" value={stats.total_users || 0} icon={Users} accent="bg-gradient-to-br from-[#0F3C8A] to-[#1A55B6]" />
        <Stat label="Votes Cast" value={stats.total_voted} icon={ShieldCheck} accent="bg-gradient-to-br from-[#1A55B6] to-[#4A78D6]" />
        <Stat label="Turnout" value={`${stats.turnout_pct}%`} icon={BarChart3} accent="bg-gradient-to-br from-[#D4AF37] to-[#B9892B]" />
        <Stat label="Pending" value={Math.max(0, (stats.total_users || 0) - stats.total_voted)} icon={UserSquare2} accent="bg-gradient-to-br from-[#5C6A82] to-[#0A1128]" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl bg-white border border-[rgba(15,60,138,0.08)] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-bold">Leaders by Post</h2>
            <Crown className="w-5 h-5 text-[color:var(--sdps-gold)]" />
          </div>
          {posts.length === 0 ? <div className="text-sm text-[color:var(--sdps-muted)]">No categories defined.</div> : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {posts.map(p => {
                const w = stats.winners?.[p.key];
                return (
                  <div key={p.key} className="rounded-xl border border-[rgba(15,60,138,0.08)] p-4 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-blue-100">
                      {w?.photo ? <img src={w.photo} alt="" className="w-full h-full object-cover" /> : null}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] tracking-[0.22em] uppercase font-bold text-[color:var(--sdps-muted)]">{p.title}</div>
                      <div className="font-bold truncate">{w?.name || "—"}</div>
                      <div className="text-xs text-[color:var(--sdps-blue)] font-bold">{w?.votes || 0} votes</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
          <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
            <div><div className="text-xs text-[color:var(--sdps-muted)] uppercase tracking-widest font-bold">Students</div><div className="font-bold">{stats.total_students || 0}</div></div>
            <div><div className="text-xs text-[color:var(--sdps-muted)] uppercase tracking-widest font-bold">Teachers</div><div className="font-bold">{stats.total_teachers || 0}</div></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Results = ({ stats, posts }) => {
  if (!stats) return null;
  return (
    <div className="space-y-6">
      <header>
        <div className="step-pill">Results</div>
        <h1 className="font-display text-4xl md:text-5xl font-black hero-3d mt-3">Vote Count by Category</h1>
      </header>
      {posts.length === 0 && <div className="text-[color:var(--sdps-muted)]">No categories defined.</div>}
      {posts.map(p => {
        const list = (stats.by_post[p.key] || []).slice().sort((a,b) => b.votes - a.votes);
        const max = Math.max(1, ...list.map(x => x.votes));
        return (
          <div key={p.key} className="rounded-2xl bg-white border border-[rgba(15,60,138,0.08)] p-6" data-testid={`results-${p.key}`}>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2 className="font-display text-2xl font-bold">{p.title}</h2>
              {list[0] && (
                <div className="flex items-center gap-2 text-sm">
                  <Crown className="w-4 h-4 text-[color:var(--sdps-gold)]" />
                  <span className="font-bold">{list[0].name}</span>
                  <span className="text-[color:var(--sdps-muted)]">leads with {list[0].votes}</span>
                </div>
              )}
            </div>
            {list.length === 0 ? <div className="text-sm text-[color:var(--sdps-muted)]">No candidates.</div> : (
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
            )}
          </div>
        );
      })}
    </div>
  );
};

const Voters = ({ stats, users, posts, postLabels }) => {
  const [q, setQ] = useState("");
  if (!stats) return null;
  const map = new Map(stats.votes.map(v => [v.admission_no, v]));
  const rows = users.filter(s => !q || s.admission_no.toLowerCase().includes(q.toLowerCase()) || s.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-5">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="step-pill">Voters</div>
          <h1 className="font-display text-4xl md:text-5xl font-black hero-3d mt-3">Individual Ballots</h1>
          <p className="text-[color:var(--sdps-ink)] mt-2 font-medium">Audit-grade per-voter record of choices.</p>
        </div>
        <Input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search ID or name" className="max-w-xs" data-testid="voters-search" />
      </header>
      <div className="rounded-2xl bg-white border border-[rgba(15,60,138,0.08)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#F2F5FB] text-left text-[color:var(--sdps-muted)] uppercase text-xs tracking-[0.18em]">
              <tr>
                <th className="p-3">ID</th>
                <th className="p-3">Voter</th>
                <th className="p-3">Role</th>
                <th className="p-3">Status</th>
                {posts.map(p => <th key={p.key} className="p-3">{p.title}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map(s => {
                const v = map.get(s.admission_no);
                return (
                  <tr key={s.admission_no} className="border-t border-[rgba(15,60,138,0.06)]">
                    <td className="p-3 font-mono font-bold">{s.admission_no}</td>
                    <td className="p-3 font-bold">{s.name}<div className="text-xs font-normal text-[color:var(--sdps-muted)]">{s.father_name || s.subject || ""}</div></td>
                    <td className="p-3 capitalize">{s.role}</td>
                    <td className="p-3">{v ? <span className="text-emerald-600 font-bold">Voted</span> : <span className="text-amber-600 font-bold">Pending</span>}</td>
                    {posts.map(p => (
                      <td key={p.key} className="p-3">{v?.selections?.[p.key] || <span className="text-gray-300">—</span>}</td>
                    ))}
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr><td colSpan={4 + posts.length} className="p-10 text-center text-[color:var(--sdps-muted)]">No matches.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const CandidatesTab = ({ candidates, posts, postLabels, onChange }) => {
  const [editing, setEditing] = useState(null);
  const [creatingPost, setCreatingPost] = useState(null);

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
        <p className="text-[color:var(--sdps-ink)] mt-2 font-medium">Add, edit or delete candidates per post. Photo can be a URL or uploaded file.</p>
      </header>

      {posts.length === 0 && <div className="text-[color:var(--sdps-muted)]">Add categories first in the Categories tab.</div>}

      {posts.map(p => {
        const items = candidates.filter(c => c.post === p.key);
        return (
          <div key={p.key} className="rounded-2xl bg-white border border-[rgba(15,60,138,0.08)] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-bold">{p.title}</h2>
              <button onClick={() => setCreatingPost(p.key)} data-testid={`add-candidate-${p.key}`}
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
        );
      })}

      {(editing || creatingPost) && (
        <CandidateModal
          posts={posts}
          initial={editing || { post: creatingPost, name: "", photo: "", symbol: "" }}
          isNew={!editing}
          onClose={() => { setEditing(null); setCreatingPost(null); }}
          onSaved={() => { setEditing(null); setCreatingPost(null); onChange(); }}
        />
      )}
    </div>
  );
};

const CandidateModal = ({ posts, initial, isNew, onClose, onSaved }) => {
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef();

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 1.5 * 1024 * 1024) { toast.error("Image too large (max 1.5MB)"); return; }
    const reader = new FileReader();
    reader.onload = () => setForm(s => ({ ...s, photo: reader.result }));
    reader.readAsDataURL(f);
  };

  const save = async () => {
    if (!form.name?.trim()) { toast.error("Name is required"); return; }
    setBusy(true);
    try {
      if (isNew) { await api.post("/admin/candidates", form); toast.success("Candidate added"); }
      else { await api.put(`/admin/candidates/${form.id}`, form); toast.success("Candidate updated"); }
      onSaved();
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed"); }
    finally { setBusy(false); }
  };

  const postTitle = posts.find(p => p.key === form.post)?.title || form.post;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded hover:bg-gray-100"><X className="w-5 h-5" /></button>
        <h3 className="font-display text-2xl font-bold">{isNew ? "Add Candidate" : "Edit Candidate"}</h3>
        <p className="text-sm text-[color:var(--sdps-muted)] mb-5">Category: <span className="font-bold">{postTitle}</span></p>
        <div className="space-y-4">
          <div><Label>Name</Label><Input data-testid="cand-name-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>Election Symbol (text)</Label><Input data-testid="cand-symbol-input" value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })} placeholder="e.g. Star, Sun, Book" /></div>
          <div><Label>Photo URL</Label><Input data-testid="cand-photo-url-input" value={form.photo?.startsWith("data:") ? "" : (form.photo || "")} onChange={(e) => setForm({ ...form, photo: e.target.value })} placeholder="https://…" /></div>
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
              <Label>Category</Label>
              <select value={form.post} onChange={(e) => setForm({ ...form, post: e.target.value })} className="h-10 w-full border rounded-md px-3">
                {posts.map(p => <option key={p.key} value={p.key}>{p.title}</option>)}
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

const CategoriesTab = ({ posts, onChange }) => {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [editing, setEditing] = useState(null);

  const create = async () => {
    if (!title.trim()) return;
    try {
      await api.post("/admin/posts", { title: title.trim() });
      toast.success("Category added");
      setTitle(""); setAdding(false); onChange();
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed"); }
  };
  const save = async (p) => {
    try {
      await api.put(`/admin/posts/${p.id}`, { title: editing.title, order: editing.order });
      toast.success("Updated"); setEditing(null); onChange();
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed"); }
  };
  const del = async (p) => {
    if (!window.confirm(`Delete "${p.title}"? All its candidates will be removed too.`)) return;
    try {
      await api.delete(`/admin/posts/${p.id}`);
      toast.success("Deleted"); onChange();
    } catch (e) { toast.error(e?.response?.data?.detail || "Cannot delete"); }
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="step-pill">Categories</div>
          <h1 className="font-display text-4xl md:text-5xl font-black hero-3d mt-3">Voting Categories</h1>
          <p className="text-[color:var(--sdps-ink)] mt-2 font-medium">Add, rename, reorder or delete the posts students vote for.</p>
        </div>
        <button onClick={() => setAdding(!adding)} data-testid="add-category-btn" className="btn-primary-3d h-11 px-5 rounded-xl font-bold flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </header>

      {adding && (
        <div className="rounded-2xl bg-white border border-[rgba(15,60,138,0.08)] p-6 flex items-end gap-3">
          <div className="flex-1">
            <Label>Category title</Label>
            <Input data-testid="new-category-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Vice Captain" />
          </div>
          <button onClick={create} data-testid="save-category-btn" className="btn-primary-3d h-11 px-5 rounded-xl font-bold">Save</button>
          <button onClick={() => { setAdding(false); setTitle(""); }} className="h-11 px-5 rounded-xl border font-bold">Cancel</button>
        </div>
      )}

      <div className="rounded-2xl bg-white border border-[rgba(15,60,138,0.08)] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#F2F5FB] text-left text-[color:var(--sdps-muted)] uppercase text-xs tracking-[0.18em]">
            <tr>
              <th className="p-3 w-20">Order</th>
              <th className="p-3">Title</th>
              <th className="p-3">Key</th>
              <th className="p-3">Candidates</th>
              <th className="p-3">Votes</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {posts.map(p => (
              <tr key={p.id} className="border-t border-[rgba(15,60,138,0.06)]">
                {editing?.id === p.id ? (
                  <>
                    <td className="p-3"><Input type="number" value={editing.order} onChange={e => setEditing({ ...editing, order: Number(e.target.value) })} className="h-9 w-20" /></td>
                    <td className="p-3"><Input value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })} className="h-9" /></td>
                    <td className="p-3 font-mono text-xs">{p.key}</td>
                    <td className="p-3">{p.candidate_count}</td>
                    <td className="p-3">{p.vote_count}</td>
                    <td className="p-3 text-right">
                      <button onClick={() => save(p)} className="text-emerald-600 mr-2 font-bold">Save</button>
                      <button onClick={() => setEditing(null)} className="text-gray-500">Cancel</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="p-3 font-mono">{p.order}</td>
                    <td className="p-3 font-bold">{p.title}</td>
                    <td className="p-3 font-mono text-xs text-[color:var(--sdps-muted)]">{p.key}</td>
                    <td className="p-3">{p.candidate_count}</td>
                    <td className="p-3">{p.vote_count > 0 ? <span className="text-amber-700 font-bold">{p.vote_count}</span> : 0}</td>
                    <td className="p-3 text-right">
                      <button data-testid={`edit-category-${p.id}`} onClick={() => setEditing({ id: p.id, title: p.title, order: p.order })} className="p-1.5 rounded hover:bg-blue-50 mr-1"><Pencil className="w-3.5 h-3.5" /></button>
                      <button data-testid={`del-category-${p.id}`} onClick={() => del(p)} className="p-1.5 rounded hover:bg-red-50 text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {posts.length === 0 && (
              <tr><td colSpan={6} className="p-10 text-center text-[color:var(--sdps-muted)]">No categories yet — add one to begin.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-[color:var(--sdps-muted)]"><AlertTriangle className="w-3 h-3 inline mr-1" /> Categories with existing votes cannot be deleted. Reset votes first in Settings.</p>
    </div>
  );
};

const UsersTab = ({ role, users, onChange }) => {
  const fileRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [q, setQ] = useState("");
  const isStudent = role === "student";

  const upload = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", f);
      const { data } = await api.post(`/admin/users/upload?role=${role}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success(`Imported · ${data.inserted} new, ${data.updated} updated`);
      onChange();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const downloadTemplate = async () => {
    try {
      const token = localStorage.getItem("sdps_admin_token");
      const res = await fetch(`${API}/admin/template/${role}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sdps_${role}_template.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error("Failed to download template"); }
  };

  const remove = async (adm) => {
    if (!window.confirm(`Delete ${adm}?`)) return;
    try { await api.delete(`/admin/users/${adm}`); toast.success("Deleted"); onChange(); }
    catch { toast.error("Failed"); }
  };

  const rows = users.filter(s => !q || s.admission_no.toLowerCase().includes(q.toLowerCase()) || s.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-5">
      <header>
        <div className="step-pill">{isStudent ? "Students" : "Teachers"}</div>
        <h1 className="font-display text-4xl md:text-5xl font-black hero-3d mt-3">{isStudent ? "Eligible Students" : "Eligible Teachers"}</h1>
        <p className="text-[color:var(--sdps-ink)] mt-2 font-medium">
          IDs must use the prefix <span className="font-mono font-bold text-[color:var(--sdps-blue)]">{isStudent ? "SDPSS" : "SDPSE"}</span>.
          Excel headers: <span className="font-mono font-bold">{isStudent ? "admission_no, name, father_name, class_name" : "admission_no, name, subject, designation"}</span>.
        </p>
      </header>

      <div className="rounded-2xl bg-white border border-[rgba(15,60,138,0.08)] p-6 flex flex-col md:flex-row md:items-center gap-4 justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#D4AF37] to-[#B9892B]">
            <FileSpreadsheet className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="font-bold">Bulk Excel upload</div>
            <div className="text-xs text-[color:var(--sdps-muted)]">.xlsx file with headers as shown above</div>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search…" data-testid={`${role}-search`} className="max-w-xs" />
          <button onClick={downloadTemplate} data-testid={`download-${role}-template`} className="h-11 px-4 rounded-xl border border-[rgba(15,60,138,0.18)] bg-white font-bold flex items-center gap-2 whitespace-nowrap">
            <Download className="w-4 h-4" /> Sample Excel
          </button>
          <input ref={fileRef} type="file" accept=".xlsx" onChange={upload} data-testid={`upload-${role}-input`} className="hidden" />
          <button onClick={() => fileRef.current?.click()} disabled={uploading} data-testid={`upload-${role}-btn`}
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
                <th className="p-3">ID</th>
                <th className="p-3">Name</th>
                {isStudent ? (<><th className="p-3">Father's Name</th><th className="p-3">Class</th></>) : (<><th className="p-3">Subject</th><th className="p-3">Designation</th></>)}
                <th className="p-3">Status</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(s => (
                <tr key={s.admission_no} className="border-t border-[rgba(15,60,138,0.06)]">
                  <td className="p-3 font-mono font-bold">{s.admission_no}</td>
                  <td className="p-3 font-bold">{s.name}</td>
                  {isStudent ? (<><td className="p-3">{s.father_name || "—"}</td><td className="p-3">{s.class_name || "—"}</td></>)
                             : (<><td className="p-3">{s.subject || "—"}</td><td className="p-3">{s.designation || "—"}</td></>)}
                  <td className="p-3">{s.has_voted ? <span className="text-emerald-600 font-bold">Voted</span> : <span className="text-amber-600 font-bold">Pending</span>}</td>
                  <td className="p-3 text-right">
                    <button onClick={() => remove(s.admission_no)} className="p-1.5 rounded hover:bg-red-50 text-red-500" data-testid={`del-user-${s.admission_no}`}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (<tr><td colSpan={6} className="p-10 text-center text-[color:var(--sdps-muted)]">No {role}s.</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const SettingsTab = ({ settings, onChange }) => {
  const [logo, setLogo] = useState(settings.school_logo || "");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef();

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 1 * 1024 * 1024) { toast.error("Logo too large (max 1MB)"); return; }
    const reader = new FileReader();
    reader.onload = () => setLogo(reader.result);
    reader.readAsDataURL(f);
  };

  const saveLogo = async () => {
    setBusy(true);
    try {
      await api.put("/admin/settings/school_logo", { value: logo || "" });
      toast.success("Logo updated");
      onChange();
    } catch (e) { toast.error("Failed to save"); }
    finally { setBusy(false); }
  };

  const resetVotes = async () => {
    if (!window.confirm("Delete ALL cast ballots? Students/Teachers and Candidates remain. This cannot be undone.")) return;
    try {
      const { data } = await api.post("/admin/reset/votes");
      toast.success(`Reset · ${data.deleted_votes} votes cleared`);
      onChange();
    } catch { toast.error("Failed"); }
  };

  const resetAll = async () => {
    if (!window.confirm("FULL RESET: Delete all votes, candidates, and uploaded students/teachers. Categories and admin remain. Continue?")) return;
    if (!window.confirm("Are you absolutely sure? This action is permanent.")) return;
    try {
      const { data } = await api.post("/admin/reset/all");
      toast.success(`Reset · ${data.deleted_votes} votes, ${data.deleted_candidates} candidates, ${data.deleted_users} voters cleared`);
      onChange();
    } catch { toast.error("Failed"); }
  };

  return (
    <div className="space-y-5">
      <header>
        <div className="step-pill">Settings</div>
        <h1 className="font-display text-4xl md:text-5xl font-black hero-3d mt-3">Election Settings</h1>
        <p className="text-[color:var(--sdps-ink)] mt-2 font-medium">School branding and danger-zone controls.</p>
      </header>

      <div className="rounded-2xl bg-white border border-[rgba(15,60,138,0.08)] p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0F3C8A] to-[#1A55B6] flex items-center justify-center"><ImageIcon className="w-5 h-5 text-white" /></div>
          <h2 className="font-display text-xl font-bold">School Logo</h2>
        </div>
        <p className="text-sm text-[color:var(--sdps-muted)] mb-4">Displayed on the kiosk header and admin sidebar. PNG/JPG/SVG, under 1MB. Or paste a URL.</p>
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-[rgba(15,60,138,0.2)] flex items-center justify-center bg-blue-50 overflow-hidden">
            {logo ? <img src={logo} alt="Preview" className="w-full h-full object-contain p-2" /> : <span className="text-xs text-[color:var(--sdps-muted)]">No logo</span>}
          </div>
          <div className="flex-1 space-y-3 w-full">
            <div>
              <Label>Logo URL</Label>
              <Input data-testid="logo-url-input" value={logo?.startsWith("data:") ? "" : (logo || "")} onChange={(e) => setLogo(e.target.value)} placeholder="https://…/logo.png" />
            </div>
            <div>
              <Label>Or upload</Label>
              <input ref={fileRef} type="file" accept="image/*" onChange={onFile} data-testid="logo-file-input" className="block w-full text-sm" />
            </div>
            <div className="flex gap-2">
              <button onClick={saveLogo} disabled={busy} data-testid="save-logo-btn" className="btn-primary-3d h-11 px-5 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50">
                <Save className="w-4 h-4" /> Save Logo
              </button>
              {logo && <button onClick={() => setLogo("")} className="h-11 px-5 rounded-xl border font-bold">Clear</button>}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border-2 border-red-200 bg-red-50/40 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-white" /></div>
          <h2 className="font-display text-xl font-bold text-red-700">Danger Zone</h2>
        </div>
        <p className="text-sm text-red-700/80 mb-4">These actions are immediate and permanent. Use only between elections or when re-running a mock test.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button onClick={resetVotes} data-testid="reset-votes-btn" className="h-12 px-5 rounded-xl border-2 border-red-300 bg-white font-bold flex items-center justify-center gap-2 hover:bg-red-100">
            <RotateCcw className="w-4 h-4" /> Reset Votes Only
          </button>
          <button onClick={resetAll} data-testid="reset-all-btn" className="h-12 px-5 rounded-xl bg-red-600 text-white font-bold flex items-center justify-center gap-2 hover:bg-red-700">
            <AlertTriangle className="w-4 h-4" /> Reset Everything
          </button>
        </div>
      </div>
    </div>
  );
};
