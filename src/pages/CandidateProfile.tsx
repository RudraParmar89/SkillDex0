import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, FileText, Trophy, Clock, Briefcase, BarChart3, CheckCircle, Loader2, LogOut, Settings, Mail, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import ATSScoreCircle from "@/components/ATSScoreCircle";
import Navbar from "@/components/Navbar";

interface Application {
  id: string;
  job_id: string;
  resume_score: number | null;
  resume_text: string | null;
  status: string | null;
  created_at: string | null;
  applicant_name: string | null;
  answers: any;
  job?: {
    title: string;
    company: string;
    location: string;
    type: string;
  };
}

const CandidateProfile = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (user) fetchApplications();
  }, [user, authLoading]);

  const fetchApplications = async () => {
    const { data } = await supabase
      .from("applications")
      .select("*, job:jobs(title, company, location, type)")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });
    setApplications((data as any[]) || []);
    setLoading(false);
  };

  const avgScore = applications.length > 0
    ? Math.round(applications.reduce((s, a) => s + (a.resume_score || 0), 0) / applications.length)
    : 0;

  const statusColor = (status: string | null) => {
    switch (status) {
      case "accepted": return "bg-success/15 text-success";
      case "rejected": return "bg-destructive/15 text-destructive";
      case "reviewed": return "bg-primary/15 text-primary";
      default: return "bg-warning/15 text-warning";
    }
  };

  const joinDate = user?.created_at ? new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "N/A";

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="min-h-screen">
      <Navbar activeSection="profile" onNavigate={(s) => { if (s === "home") navigate("/"); else if (s === "scanner" || s === "jobs") navigate("/"); }} />
      <div className="pt-24 pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          <button onClick={() => navigate("/")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </button>

          {/* Profile Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card-glass rounded-2xl p-8 mb-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-primary-foreground font-display" style={{ background: "var(--gradient-primary)" }}>
                {(user?.user_metadata?.full_name || user?.email || "U")[0].toUpperCase()}
              </div>
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-2xl font-display font-bold text-foreground">
                  {user?.user_metadata?.full_name || "Candidate"}
                </h1>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {user?.email}</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Joined {joinDate}</span>
                </div>
              </div>
              <div className="flex gap-6 text-center">
                <div>
                  <p className="text-2xl font-display font-bold text-foreground">{applications.length}</p>
                  <p className="text-xs text-muted-foreground">Applications</p>
                </div>
                <div>
                  <p className="text-2xl font-display font-bold text-primary">{avgScore}</p>
                  <p className="text-xs text-muted-foreground">Avg Score</p>
                </div>
                <div>
                  <p className="text-2xl font-display font-bold text-success">
                    {applications.filter(a => (a.resume_score || 0) >= 70).length}
                  </p>
                  <p className="text-xs text-muted-foreground">High Scores</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            <button onClick={() => navigate("/")} className="card-glass rounded-xl p-4 text-center hover:border-primary/30 transition-all group">
              <FileText className="w-5 h-5 text-primary mx-auto mb-1.5 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-medium text-foreground">Scan Resume</span>
            </button>
            <button onClick={() => navigate("/")} className="card-glass rounded-xl p-4 text-center hover:border-primary/30 transition-all group">
              <Briefcase className="w-5 h-5 text-primary mx-auto mb-1.5 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-medium text-foreground">Browse Jobs</span>
            </button>
            <button onClick={() => navigate("/")} className="card-glass rounded-xl p-4 text-center hover:border-primary/30 transition-all group">
              <Trophy className="w-5 h-5 text-primary mx-auto mb-1.5 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-medium text-foreground">Best Score</span>
            </button>
            <button onClick={signOut} className="card-glass rounded-xl p-4 text-center hover:border-destructive/30 transition-all group">
              <LogOut className="w-5 h-5 text-destructive mx-auto mb-1.5 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-medium text-foreground">Sign Out</span>
            </button>
          </motion.div>

          {/* Application History */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-display font-bold text-foreground">Application History</h2>
            </div>

            {loading ? (
              <div className="card-glass rounded-2xl p-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
              </div>
            ) : applications.length === 0 ? (
              <div className="card-glass rounded-2xl p-12 text-center">
                <Briefcase className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">No applications yet. Start by applying to jobs!</p>
                <button onClick={() => navigate("/")} className="mt-4 px-6 py-2.5 rounded-xl text-sm font-display font-semibold text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
                  Browse Jobs
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((app, i) => (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="card-glass rounded-xl p-5 hover:border-primary/20 transition-all cursor-pointer"
                    onClick={() => setSelectedApp(selectedApp?.id === app.id ? null : app)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="shrink-0">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold font-display ${
                          (app.resume_score || 0) >= 70 ? "bg-success/15 text-success" :
                          (app.resume_score || 0) >= 50 ? "bg-warning/15 text-warning" : "bg-destructive/15 text-destructive"
                        }`}>
                          {app.resume_score || 0}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display font-semibold text-foreground truncate">{app.job?.title || "Unknown Position"}</h3>
                        <p className="text-sm text-muted-foreground">{app.job?.company} • {app.job?.location}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${statusColor(app.status)}`}>
                          {app.status || "pending"}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {app.created_at ? new Date(app.created_at).toLocaleDateString() : "N/A"}
                        </span>
                      </div>
                    </div>

                    {selectedApp?.id === app.id && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-4 pt-4 border-t border-border space-y-4">
                        <div className="flex flex-col md:flex-row gap-6">
                          <div className="flex-shrink-0">
                            <ATSScoreCircle score={app.resume_score || 0} />
                          </div>
                          <div className="flex-1 space-y-3">
                            <div>
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Job Details</p>
                              <p className="text-sm text-foreground">{app.job?.title} at {app.job?.company}</p>
                              <p className="text-xs text-muted-foreground">{app.job?.location} • {app.job?.type}</p>
                            </div>
                            {app.resume_text && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Resume Preview</p>
                                <p className="text-xs text-secondary-foreground bg-secondary/50 rounded-lg p-3 line-clamp-4">{app.resume_text.slice(0, 300)}...</p>
                              </div>
                            )}
                            {app.answers && Object.keys(app.answers).length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                                  Screening Answers ({Object.keys(app.answers).length})
                                </p>
                                <div className="flex items-center gap-1.5">
                                  <CheckCircle className="w-3.5 h-3.5 text-success" />
                                  <span className="text-xs text-muted-foreground">All questions answered</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CandidateProfile;
