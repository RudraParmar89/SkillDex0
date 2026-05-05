import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Users, FileText, Activity, BarChart3, Clock, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/skilldex-logo.png";

interface ProfileRow { id: string; email: string | null; full_name: string | null; created_at: string | null; }
interface AppRow { id: string; resume_score: number | null; created_at: string | null; user_id: string; status: string | null; }

const AdminDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [apps, setApps] = useState<AppRow[]>([]);

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle()
      .then(({ data }) => {
        if (!data) { navigate("/"); return; }
        setIsAdmin(true);
        loadData();
      });
  }, [user]);

  const loadData = async () => {
    const [pRes, aRes] = await Promise.all([
      supabase.from("profiles").select("*"),
      supabase.from("applications").select("id, resume_score, created_at, user_id, status"),
    ]);
    setProfiles((pRes.data as ProfileRow[]) || []);
    setApps((aRes.data as AppRow[]) || []);
    setLoading(false);
  };

  const totalUsers = profiles.length;
  const totalResumes = apps.length;
  const activeUsers = useMemo(() => {
    const recent = new Date(); recent.setDate(recent.getDate() - 7);
    return new Set(apps.filter(a => new Date(a.created_at || 0) > recent).map(a => a.user_id)).size;
  }, [apps]);
  const avgScore = useMemo(() => {
    const scored = apps.filter(a => a.resume_score != null);
    return scored.length ? +(scored.reduce((s, a) => s + (a.resume_score || 0), 0) / scored.length).toFixed(1) : 0;
  }, [apps]);

  const weeklyActivity = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const counts = new Array(7).fill(0);
    const now = new Date();
    apps.forEach(a => {
      const d = new Date(a.created_at || 0);
      const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
      if (diff < 7) counts[d.getDay() === 0 ? 6 : d.getDay() - 1]++;
    });
    return days.map((d, i) => ({ day: d, count: counts[i] }));
  }, [apps]);

  const scoreDistribution = useMemo(() => {
    const buckets = [{ range: "0-20", count: 0 }, { range: "21-40", count: 0 }, { range: "41-60", count: 0 }, { range: "61-80", count: 0 }, { range: "81-100", count: 0 }];
    apps.forEach(a => {
      const s = a.resume_score || 0;
      if (s <= 20) buckets[0].count++;
      else if (s <= 40) buckets[1].count++;
      else if (s <= 60) buckets[2].count++;
      else if (s <= 80) buckets[3].count++;
      else buckets[4].count++;
    });
    return buckets;
  }, [apps]);

  const statusCounts = useMemo(() => {
    const c: Record<string, number> = { pending: 0, shortlisted: 0, interview: 0, rejected: 0 };
    apps.forEach(a => { c[a.status || "pending"] = (c[a.status || "pending"] || 0) + 1; });
    return c;
  }, [apps]);

  const recentUsers = useMemo(() => {
    return profiles.slice().sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()).slice(0, 5).map(p => {
      const userApps = apps.filter(a => a.user_id === p.id);
      const bestScore = userApps.length ? Math.max(...userApps.map(a => a.resume_score || 0)) : 0;
      const lastActive = userApps.length ? new Date(Math.max(...userApps.map(a => new Date(a.created_at || 0).getTime()))) : new Date(p.created_at || 0);
      return { ...p, bestScore, lastActive };
    });
  }, [profiles, apps]);

  const maxWeekly = Math.max(...weeklyActivity.map(d => d.count), 1);
  const maxBucket = Math.max(...scoreDistribution.map(d => d.count), 1);
  const totalStatusApps = Object.values(statusCounts).reduce((a, b) => a + b, 0) || 1;

  const timeAgo = (d: Date) => {
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  };

  if (loading || !isAdmin) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
    </div>
  );

  const stats = [
    { label: "Total Users", value: totalUsers, icon: Users, change: "+12.5%" },
    { label: "Resumes Scanned", value: totalResumes, icon: FileText, change: "+8.3%" },
    { label: "Active Users", value: activeUsers, icon: Activity, change: "+24.1%" },
    { label: "Avg. Score", value: avgScore, icon: BarChart3, change: "+2.1%" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2">
            <img src={logo} alt="Skilldex" className="h-8" />
          </button>
          <div className="flex items-center gap-3">
            <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">Admin</span>
            <button onClick={() => { signOut(); navigate("/"); }} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Logout</button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, Admin</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="card-glass rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">{s.label}</span>
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <s.icon className="w-4 h-4 text-primary" />
                </div>
              </div>
              <p className="text-3xl font-display font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-primary mt-1">{s.change}</p>
            </motion.div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Weekly Activity */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card-glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display font-semibold text-foreground">Weekly Activity</h3>
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <div className="relative h-48">
              <svg viewBox="0 0 700 200" className="w-full h-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="areaGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {(() => {
                  const pts = weeklyActivity.map((d, i) => ({ x: i * 100 + 50, y: 180 - (d.count / maxWeekly) * 160 }));
                  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
                  const area = `${line} L ${pts[pts.length - 1].x} 180 L ${pts[0].x} 180 Z`;
                  return (
                    <>
                      <path d={area} fill="url(#areaGrad)" />
                      <path d={line} fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" />
                      {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="4" fill="hsl(var(--primary))" />)}
                    </>
                  );
                })()}
              </svg>
              <div className="flex justify-between px-2 mt-1">
                {weeklyActivity.map(d => <span key={d.day} className="text-xs text-muted-foreground">{d.day}</span>)}
              </div>
            </div>
          </motion.div>

          {/* Score Distribution */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="card-glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display font-semibold text-foreground">Score Distribution</h3>
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <div className="flex items-end gap-4 h-48">
              {scoreDistribution.map((b, i) => (
                <div key={b.range} className="flex-1 flex flex-col items-center gap-2">
                  <motion.div initial={{ height: 0 }} animate={{ height: `${(b.count / maxBucket) * 100}%` }}
                    transition={{ duration: 0.8, delay: 0.6 + i * 0.1 }}
                    className="w-full rounded-t-lg min-h-[4px] bg-primary" />
                  <span className="text-xs text-muted-foreground">{b.range}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Bottom Row */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* User Status - Donut */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="card-glass rounded-2xl p-6">
            <h3 className="font-display font-semibold text-foreground mb-6">Application Status</h3>
            <div className="flex items-center gap-8">
              <div className="relative w-40 h-40">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  {(() => {
                    const entries = Object.entries(statusCounts).filter(([, c]) => c > 0);
                    const colors = { pending: "hsl(var(--warning))", shortlisted: "hsl(var(--success))", interview: "hsl(var(--primary))", rejected: "hsl(var(--muted-foreground))" };
                    let offset = 0;
                    return entries.map(([status, count]) => {
                      const pct = (count / totalStatusApps) * 100;
                      const circ = 2 * Math.PI * 35;
                      const dash = (pct / 100) * circ;
                      const el = (
                        <circle key={status} cx="50" cy="50" r="35" fill="none"
                          stroke={(colors as any)[status] || "hsl(var(--muted))"}
                          strokeWidth="12" strokeDasharray={`${dash} ${circ - dash}`}
                          strokeDashoffset={-offset * (circ / 100)} strokeLinecap="round" />
                      );
                      offset += pct;
                      return el;
                    });
                  })()}
                </svg>
              </div>
              <div className="space-y-2">
                {Object.entries(statusCounts).filter(([, c]) => c > 0).map(([status, count]) => (
                  <div key={status} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{
                      backgroundColor: status === "pending" ? "hsl(var(--warning))" : status === "shortlisted" ? "hsl(var(--success))" : status === "interview" ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"
                    }} />
                    <span className="text-sm capitalize text-foreground">{status}: {count}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Recent Users */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="card-glass rounded-2xl p-6">
            <h3 className="font-display font-semibold text-foreground mb-4">Recent Users</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-muted-foreground font-medium">User</th>
                  <th className="text-center py-2 text-muted-foreground font-medium">Score</th>
                  <th className="text-right py-2 text-muted-foreground font-medium">Last Active</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map(u => (
                  <tr key={u.id} className="border-b border-border/50">
                    <td className="py-3">
                      <p className="font-medium text-foreground">{u.full_name || "Anonymous"}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </td>
                    <td className="text-center">
                      <span className="text-primary font-bold">{u.bestScore}</span>
                    </td>
                    <td className="text-right">
                      <span className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                        <Clock className="w-3 h-3" /> {timeAgo(u.lastActive)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
