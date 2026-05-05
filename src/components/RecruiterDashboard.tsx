import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Plus, Users, Sparkles, Trophy, FileText, ChevronDown, ChevronUp, X, Wand2, Bell, Check, Briefcase, MapPin, DollarSign } from "lucide-react";
import { analyzeResume } from "@/lib/resumeParser";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface DBJob {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string | null;
  description: string | null;
  screening_questions: any;
  requirements: string[] | null;
  is_active: boolean | null;
  created_at: string | null;
}

interface DBApplication {
  id: string;
  job_id: string;
  user_id: string;
  applicant_name: string | null;
  resume_score: number | null;
  resume_text: string | null;
  status: string | null;
  answers: any;
  created_at: string | null;
}

interface DBNotification {
  id: string;
  recruiter_id: string;
  message: string;
  is_read: boolean;
  created_at: string | null;
  job_id: string | null;
  application_id: string | null;
}

const FALLBACK_QUESTIONS: Record<string, string[]> = {
  "Software Engineer": [
    "What programming languages are you most proficient in?",
    "Describe a system you designed that handled high traffic.",
    "How do you approach debugging a production issue?",
    "What's your experience with CI/CD pipelines?",
    "Have you contributed to open source projects?",
  ],
  default: [
    "What attracted you to this role?",
    "Describe your most relevant experience for this position.",
    "How do you handle tight deadlines?",
    "What's your approach to continuous learning?",
    "Where do you see yourself in 3 years?",
  ],
};

const getFallbackQuestions = (role: string): string[] => {
  const key = Object.keys(FALLBACK_QUESTIONS).find(k => role.toLowerCase().includes(k.toLowerCase()));
  return FALLBACK_QUESTIONS[key || "default"];
};

const RecruiterDashboard = () => {
  const { user } = useAuth();
  const [dbJobs, setDbJobs] = useState<DBJob[]>([]);
  const [applications, setApplications] = useState<Record<string, DBApplication[]>>({});
  const [notifications, setNotifications] = useState<DBNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newJobTitle, setNewJobTitle] = useState("");
  const [newJobCompany, setNewJobCompany] = useState("");
  const [newJobLocation, setNewJobLocation] = useState("Remote");
  const [newJobType, setNewJobType] = useState("Full-time");
  const [newJobSalary, setNewJobSalary] = useState("");
  const [newJobDescription, setNewJobDescription] = useState("");
  const [generatedQuestions, setGeneratedQuestions] = useState<string[]>([]);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchJobs();
    fetchNotifications();

    // Realtime notifications
    const channel = supabase
      .channel("recruiter-notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, (payload) => {
        const n = payload.new as DBNotification;
        if (n.recruiter_id === user.id) {
          setNotifications(prev => [n, ...prev]);
          toast.info(n.message, { icon: "🔔" });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const fetchJobs = async () => {
    const { data } = await supabase.from("jobs").select("*").eq("recruiter_id", user!.id).order("created_at", { ascending: false });
    const jobs = (data as DBJob[]) || [];
    setDbJobs(jobs);
    setLoadingJobs(false);

    // Fetch applications for each job
    for (const job of jobs) {
      const { data: apps } = await supabase.from("applications").select("*").eq("job_id", job.id).order("resume_score", { ascending: false });
      setApplications(prev => ({ ...prev, [job.id]: (apps as DBApplication[]) || [] }));
    }
  };

  const fetchNotifications = async () => {
    const { data } = await (supabase as any).from("notifications").select("*").eq("recruiter_id", user!.id).order("created_at", { ascending: false }).limit(20);
    setNotifications((data as DBNotification[]) || []);
  };

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unread.length === 0) return;
    for (const id of unread) {
      await (supabase as any).from("notifications").update({ is_read: true }).eq("id", id);
    }
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleGenerateQuestions = async () => {
    if (!newJobTitle.trim()) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-questions", {
        body: { role: newJobTitle.trim(), count: 5 },
      });
      if (error || data?.error) {
        setGeneratedQuestions(getFallbackQuestions(newJobTitle));
        toast.error("AI unavailable, using template questions");
      } else {
        setGeneratedQuestions(data.questions || getFallbackQuestions(newJobTitle));
        toast.success("AI generated screening questions!");
      }
    } catch {
      setGeneratedQuestions(getFallbackQuestions(newJobTitle));
    } finally {
      setGenerating(false);
    }
  };

  const createJob = async () => {
    if (!newJobTitle.trim() || generatedQuestions.length === 0 || !user) return;
    const questionsPayload = generatedQuestions.map((q, i) => ({ id: `q${i}`, question: q }));
    const { error } = await supabase.from("jobs").insert({
      title: newJobTitle,
      company: newJobCompany || "My Company",
      location: newJobLocation,
      type: newJobType,
      salary: newJobSalary || null,
      description: newJobDescription || null,
      recruiter_id: user.id,
      screening_questions: questionsPayload,
    });
    if (error) {
      toast.error("Failed to create job: " + error.message);
      return;
    }
    toast.success("Job posted successfully!");
    setNewJobTitle(""); setNewJobCompany(""); setNewJobLocation("Remote"); setNewJobType("Full-time");
    setNewJobSalary(""); setNewJobDescription(""); setGeneratedQuestions([]); setShowCreateForm(false);
    fetchJobs();
  };

  const removeQuestion = (index: number) => {
    setGeneratedQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const updateApplicationStatus = async (appId: string, jobId: string, status: string) => {
    await supabase.from("applications").update({ status }).eq("id", appId);
    setApplications(prev => ({
      ...prev,
      [jobId]: prev[jobId]?.map(a => a.id === appId ? { ...a, status } : a) || [],
    }));
    toast.success(`Application marked as ${status}`);
  };

  return (
    <section id="recruiter" className="py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4">
            <LayoutDashboard className="w-4 h-4" />
            Recruiter Dashboard
          </div>
          <h2 className="text-3xl md:text-4xl font-bold font-display mb-3">
            Hire <span className="gradient-text">Smarter</span>
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Post jobs, generate AI screening questions, and rank candidates in real-time.
          </p>
        </motion.div>

        {/* DBNotification bell + Create button row */}
        <div className="flex items-center justify-between mb-6 gap-4">
          {!showCreateForm && (
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setShowCreateForm(true)}
              className="flex-1 card-glass rounded-xl p-4 flex items-center gap-3 hover:border-primary/30 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--gradient-primary)" }}>
                <Plus className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <span className="font-display font-semibold text-foreground">Create New Job Posting</span>
                <p className="text-xs text-muted-foreground">AI will generate screening questions</p>
              </div>
            </motion.button>
          )}
          {showCreateForm && <div className="flex-1" />}

          {/* DBNotification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative w-11 h-11 rounded-xl card-glass flex items-center justify-center hover:border-primary/30 transition-colors"
            >
              <Bell className="w-5 h-5 text-foreground" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
                  {unreadCount}
                </span>
              )}
            </button>
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: -5, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -5, scale: 0.95 }}
                  className="absolute right-0 top-14 w-80 max-h-96 overflow-y-auto card-glass rounded-2xl border border-border shadow-xl z-50"
                >
                  <div className="flex items-center justify-between p-4 border-b border-border">
                    <span className="font-display font-semibold text-sm text-foreground">Notifications</span>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-xs text-primary hover:underline flex items-center gap-1">
                        <Check className="w-3 h-3" /> Mark all read
                      </button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-sm text-muted-foreground">No notifications yet</div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className={`px-4 py-3 border-b border-border/50 text-sm ${!n.is_read ? "bg-primary/5" : ""}`}>
                        <p className="text-foreground">{n.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {n.created_at ? new Date(n.created_at).toLocaleString() : ""}
                        </p>
                      </div>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Create Form */}
        <AnimatePresence>
          {showCreateForm && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-6">
              <div className="card-glass rounded-2xl p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h4 className="font-display font-semibold text-lg text-foreground">New Job Posting</h4>
                  <button onClick={() => { setShowCreateForm(false); setGeneratedQuestions([]); setNewJobTitle(""); }} className="text-muted-foreground hover:text-foreground">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block text-foreground">Job Title *</label>
                    <input type="text" value={newJobTitle} onChange={(e) => setNewJobTitle(e.target.value)}
                      placeholder="e.g. Software Engineer" className="w-full bg-input border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block text-foreground">Company</label>
                    <input type="text" value={newJobCompany} onChange={(e) => setNewJobCompany(e.target.value)}
                      placeholder="Company name" className="w-full bg-input border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block text-foreground">Location</label>
                    <input type="text" value={newJobLocation} onChange={(e) => setNewJobLocation(e.target.value)}
                      placeholder="Remote" className="w-full bg-input border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block text-foreground">Salary</label>
                    <input type="text" value={newJobSalary} onChange={(e) => setNewJobSalary(e.target.value)}
                      placeholder="e.g. $80k-$120k" className="w-full bg-input border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block text-foreground">Description</label>
                  <textarea value={newJobDescription} onChange={(e) => setNewJobDescription(e.target.value)}
                    placeholder="Job description..." className="w-full bg-input border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none h-20" />
                </div>

                <div className="flex gap-3">
                  <button onClick={handleGenerateQuestions} disabled={!newJobTitle.trim() || generating}
                    className="px-5 py-2.5 rounded-lg font-display font-semibold text-sm text-primary-foreground flex items-center gap-2 disabled:opacity-40 transition-all"
                    style={{ background: "var(--gradient-primary)" }}>
                    <Wand2 className={`w-4 h-4 ${generating ? "animate-spin" : ""}`} />
                    {generating ? "Generating..." : "Generate Questions with AI"}
                  </button>
                </div>

                {generatedQuestions.length > 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">AI-Generated Screening Questions</span>
                    </div>
                    {generatedQuestions.map((q, i) => (
                      <div key={i} className="flex items-start gap-3 bg-secondary/50 rounded-lg p-3">
                        <span className="text-xs text-muted-foreground font-mono mt-0.5">{i + 1}.</span>
                        <span className="text-sm flex-1 text-foreground">{q}</span>
                        <button onClick={() => removeQuestion(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button onClick={createJob}
                      className="w-full py-3 rounded-xl font-display font-semibold text-sm text-primary-foreground"
                      style={{ background: "var(--gradient-primary)" }}>
                      Publish Job Posting
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Row */}
        {dbJobs.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Active Jobs", value: dbJobs.filter(j => j.is_active).length, icon: Briefcase },
              { label: "Total Applicants", value: Object.values(applications).flat().length, icon: Users },
              { label: "Avg Score", value: Math.round(Object.values(applications).flat().reduce((s, a) => s + (a.resume_score || 0), 0) / (Object.values(applications).flat().length || 1)), icon: Trophy },
              { label: "Unread Alerts", value: unreadCount, icon: Bell },
            ].map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="card-glass rounded-xl p-4 text-center">
                <stat.icon className="w-5 h-5 text-primary mx-auto mb-2" />
                <p className="text-2xl font-display font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* Job Listings */}
        {loadingJobs ? (
          <div className="card-glass rounded-2xl p-12 text-center text-muted-foreground">Loading your jobs...</div>
        ) : dbJobs.length === 0 && !showCreateForm ? (
          <div className="card-glass rounded-2xl p-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No job postings yet. Create one to start ranking candidates.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {dbJobs.map((job) => {
              const jobApps = applications[job.id] || [];
              return (
                <motion.div key={job.id} layout className="card-glass rounded-2xl overflow-hidden">
                  <button
                    onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                    className="w-full flex items-center justify-between p-5 text-left"
                  >
                    <div>
                      <h4 className="font-display font-semibold text-foreground">{job.title}</h4>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>{job.company}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
                        {job.salary && <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{job.salary}</span>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {jobApps.length} applicant{jobApps.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {jobApps.length > 0 && (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">
                          Top: {jobApps[0]?.resume_score}pts
                        </span>
                      )}
                      {expandedJob === job.id ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                    </div>
                  </button>

                  <AnimatePresence>
                    {expandedJob === job.id && (
                      <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                        <div className="px-5 pb-5 space-y-4">
                          {jobApps.length > 0 ? (
                            <div>
                              <div className="flex items-center gap-2 mb-3">
                                <Trophy className="w-4 h-4 text-warning" />
                                <span className="text-sm font-display font-semibold text-foreground">Live Candidate Ranking</span>
                              </div>
                              <div className="space-y-2">
                                {jobApps.map((c, i) => {
                                  const barColor = i === 0 ? "hsl(var(--success))" : i === 1 ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))";
                                  return (
                                    <motion.div key={c.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                                      className="flex items-center gap-3 bg-secondary/30 rounded-lg p-3">
                                      <span className={`text-sm font-bold font-display w-6 text-center ${i === 0 ? "text-warning" : "text-muted-foreground"}`}>
                                        #{i + 1}
                                      </span>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate capitalize text-foreground">{c.applicant_name || "Anonymous"}</p>
                                        <div className="w-full h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
                                          <motion.div initial={{ width: 0 }} animate={{ width: `${c.resume_score || 0}%` }} transition={{ duration: 1, delay: i * 0.05 }}
                                            className="h-full rounded-full" style={{ backgroundColor: barColor }} />
                                        </div>
                                      </div>
                                      <span className="text-sm font-bold font-display" style={{ color: barColor }}>{c.resume_score || 0}</span>
                                      <div className="flex gap-1.5">
                                        {c.status !== "accepted" && (
                                          <button onClick={() => updateApplicationStatus(c.id, job.id, "accepted")}
                                            className="text-xs px-2 py-1 rounded-md bg-success/10 text-success hover:bg-success/20 transition-colors">Accept</button>
                                        )}
                                        {c.status !== "rejected" && (
                                          <button onClick={() => updateApplicationStatus(c.id, job.id, "rejected")}
                                            className="text-xs px-2 py-1 rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">Reject</button>
                                        )}
                                      </div>
                                    </motion.div>
                                  );
                                })}
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-6 text-sm text-muted-foreground">
                              No applicants yet for this position.
                            </div>
                          )}

                          <details className="group">
                            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                              View screening questions ({(job.screening_questions as any[])?.length || 0})
                            </summary>
                            <div className="mt-2 space-y-1">
                              {((job.screening_questions as any[]) || []).map((q: any, i: number) => (
                                <p key={i} className="text-xs text-secondary-foreground pl-3 border-l border-border">{i + 1}. {q.question || q}</p>
                              ))}
                            </div>
                          </details>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default RecruiterDashboard;
