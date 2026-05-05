import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Users, Sparkles, Trophy, X, Wand2,
  Briefcase, Eye, EyeOff, Trash2, BarChart3, LogOut, ChevronDown, ChevronUp,
  TrendingUp, PieChart, Activity, Calendar, UserCheck, Clock, GitCompareArrows, Check, Minus,
  Search, Filter, Mail, Send, Loader2, Shield, Download, RotateCcw, Star
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import logo from "@/assets/skilldex-logo.png";
import CandidateDetailPanel from "@/components/CandidateDetailPanel";

interface DBJob {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  description: string;
  requirements: string[];
  screening_questions: any[];
  is_active: boolean;
  created_at: string;
}

interface DBApplication {
  id: string;
  job_id: string;
  user_id: string;
  answers: any;
  resume_text: string | null;
  resume_score: number | null;
  status: string;
  applicant_name: string;
  created_at: string;
}

const FALLBACK_QUESTIONS: string[] = [
  "What attracted you to this role?",
  "Describe your most relevant experience for this position.",
  "How do you handle tight deadlines?",
  "What's your approach to continuous learning?",
  "Where do you see yourself in 3 years?",
  "Tell us about a challenging project you've led.",
  "How do you prioritize competing tasks?",
  "Describe a time you received constructive criticism.",
  "What unique skills do you bring to this role?",
  "How do you stay updated with industry trends?",
];

const EnhancedSelect = ({ value, onChange, options, className, useStatusColors = false }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        if (!(event.target as Element).closest('.portal-dropdown-menu')) {
          setIsOpen(false);
        }
      }
    }
    function handleScroll() {
      setIsOpen(false);
    }
    
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", handleScroll, true);
      window.addEventListener("resize", handleScroll);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleScroll);
    };
  }, [isOpen]);

  const handleOpen = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
    setIsOpen(!isOpen);
  };

  const selectedOption = options.find((opt: any) => opt.value === value) || options[0];

  const getStatusClasses = (val: string) => {
    switch (val) {
      case "shortlisted": return "border-success text-success bg-success/10";
      case "interview": return "border-primary text-primary bg-primary/10";
      case "rejected": return "border-destructive text-destructive bg-destructive/10";
      default: return "border-warning text-warning bg-warning/10";
    }
  };

  const buttonStatusClass = useStatusColors ? getStatusClasses(value) : "border-border text-foreground bg-input";

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleOpen}
        className={`flex items-center justify-between gap-2 border px-3 py-1.5 rounded-full outline-none transition-all ${buttonStatusClass} ${className}`}
      >
        <span>{selectedOption.label}</span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>
      
      {isOpen && typeof document !== 'undefined' && createPortal(
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.15 }}
          className="portal-dropdown-menu absolute z-[99999] rounded-xl shadow-xl border border-border overflow-hidden bg-background py-1"
          style={{ top: coords.top, left: coords.left, minWidth: Math.max(120, coords.width) }}
          onClick={(e) => e.stopPropagation()}
        >
          {options.map((opt: any) => {
            const isSelected = value === opt.value;
            const optClass = useStatusColors 
              ? (isSelected ? getStatusClasses(opt.value) : "text-foreground hover:bg-secondary")
              : (isSelected ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary");

            return (
              <div
                key={opt.value}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`cursor-pointer px-4 py-2.5 text-sm font-medium transition-colors ${optClass}`}
              >
                {opt.label}
              </div>
            );
          })}
        </motion.div>,
        document.body
      )}
    </>
  );
};

const RecruiterPage = () => {
  const { user, signOut, isRecruiter, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<DBJob[]>([]);
  const [applications, setApplications] = useState<Record<string, DBApplication[]>>({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newJobTitle, setNewJobTitle] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [newLocation, setNewLocation] = useState("Remote");
  const [newType, setNewType] = useState("Full-time");
  const [newSalary, setNewSalary] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [generatedQuestions, setGeneratedQuestions] = useState<string[]>([]);
  const [customQuestion, setCustomQuestion] = useState("");
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"jobs" | "analytics" | "compare">("jobs");
  const [allAppsLoaded, setAllAppsLoaded] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [selectedCandidateJobId, setSelectedCandidateJobId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterScoreMin, setFilterScoreMin] = useState(0);
  const [filterScoreMax, setFilterScoreMax] = useState(100);
  const [filterJobId, setFilterJobId] = useState<string>("all");
  const [emailModal, setEmailModal] = useState<{ app: DBApplication; job: DBJob } | null>(null);
  const [emailType, setEmailType] = useState<"interview" | "joining">("interview");
  const [emailCustomMsg, setEmailCustomMsg] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailPreview, setEmailPreview] = useState<{ subject: string; body: string } | null>(null);
  const [answerScores, setAnswerScores] = useState<Record<string, { overallScore: number; answerScores: any[]; summary: string }>>({});
  const [scoringAppId, setScoringAppId] = useState<string | null>(null);
  const [repostJobId, setRepostJobId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }
    
    // Strict Enterprise Access Check
    const verifyEnterpriseAccess = async () => {
      const { data: cust } = await supabase.from('billing_customers').select('id').eq('user_id', user.id).maybeSingle();
      let hasAccess = false;

      if (cust) {
        const { data: sub } = await supabase.from('billing_subscriptions').select('plan_name, status')
          .eq('billing_customer_id', cust.id)
          .order('created_at', { ascending: false }).limit(1).maybeSingle();
          
        if (sub && sub.status === 'active' && sub.plan_name === 'enterprise') {
          hasAccess = true;
        }
      }

      // If not enterprise and not an Admin, kick them out
      if (!hasAccess && !isAdmin) {
        toast.error("Enterprise Subscription Required: You must upgrade to Enterprise to access the Recruiter Dashboard and post jobs.");
        navigate("/");
        setTimeout(() => document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' }), 500);
      }
    };

    verifyEnterpriseAccess();
  }, [user, isAdmin, navigate]);

  const fetchJobs = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("jobs").select("*").eq("recruiter_id", user.id)
      .order("created_at", { ascending: false });
    setJobs((data as any[]) || []);
    setLoading(false);
  }, [user]);

  const fetchApplications = useCallback(async (jobId: string) => {
    const { data } = await supabase
      .from("applications").select("*").eq("job_id", jobId)
      .order("resume_score", { ascending: false });
    setApplications(prev => ({ ...prev, [jobId]: (data as any[]) || [] }));
  }, []);

  const fetchAllApplications = useCallback(async () => {
    if (!jobs.length) return;
    const promises = jobs.map(j =>
      supabase.from("applications").select("*").eq("job_id", j.id)
        .order("resume_score", { ascending: false })
    );
    const results = await Promise.all(promises);
    const appMap: Record<string, DBApplication[]> = {};
    results.forEach((r, i) => { appMap[jobs[i].id] = (r.data as any[]) || []; });
    setApplications(appMap);
    setAllAppsLoaded(true);
  }, [jobs]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);
  useEffect(() => { if (expandedJob) fetchApplications(expandedJob); }, [expandedJob, fetchApplications]);
  useEffect(() => { if ((activeTab === "analytics" || activeTab === "compare") && !allAppsLoaded) fetchAllApplications(); }, [activeTab, allAppsLoaded, fetchAllApplications]);

  const handleGenerateQuestions = async () => {
    if (!newJobTitle.trim()) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-questions", {
        body: { role: newJobTitle.trim(), count: 10 },
      });
      if (error || data?.error) {
        setGeneratedQuestions(FALLBACK_QUESTIONS);
      } else {
        setGeneratedQuestions(data.questions?.slice(0, 10) || FALLBACK_QUESTIONS);
        toast.success("AI generated 10 screening questions!");
      }
    } catch {
      setGeneratedQuestions(FALLBACK_QUESTIONS);
    } finally {
      setGenerating(false);
    }
  };

  const addCustomQuestion = () => {
    if (!customQuestion.trim()) return;
    setGeneratedQuestions(prev => [...prev, customQuestion.trim()]);
    setCustomQuestion("");
    toast.success("Custom question added!");
  };

  const createJob = async () => {
    if (!newJobTitle.trim() || generatedQuestions.length === 0 || !user) return;
    const screeningQs = generatedQuestions.map((q, i) => ({ id: `q${i}`, question: q, type: "text" }));
    const { error } = await supabase.from("jobs").insert({
      recruiter_id: user.id, title: newJobTitle, company: newCompany || "Your Company",
      location: newLocation, type: newType, salary: newSalary, description: newDescription,
      screening_questions: screeningQs,
    });
    if (error) { toast.error("Failed: " + error.message); return; }
    toast.success("Job posting created!");
    setNewJobTitle(""); setNewCompany(""); setNewSalary(""); setNewDescription("");
    setGeneratedQuestions([]); setShowCreateForm(false);
    fetchJobs();
  };

  const toggleJobActive = async (jobId: string, isActive: boolean) => {
    await supabase.from("jobs").update({ is_active: !isActive }).eq("id", jobId);
    fetchJobs();
  };

  const deleteJob = async (jobId: string) => {
    await supabase.from("jobs").delete().eq("id", jobId);
    toast.success("Job deleted");
    fetchJobs();
  };

  const updateAppStatus = async (appId: string, jobId: string, newStatus: string) => {
    const { error } = await supabase.from("applications").update({ status: newStatus }).eq("id", appId);
    if (error) { toast.error("Failed to update status"); return; }
    toast.success(`Status updated to ${newStatus}`);
    fetchApplications(jobId);
    if (allAppsLoaded) fetchAllApplications();
  };

  // Analytics data
  const allApps = useMemo(() => Object.values(applications).flat(), [applications]);
  const activeJobs = jobs.filter(j => j.is_active).length;
  const totalApps = allApps.length;
  const avgScore = totalApps > 0 ? Math.round(allApps.reduce((s, a) => s + (a.resume_score || 0), 0) / totalApps) : 0;
  const scoreDistribution = useMemo(() => {
    const buckets = { "0-20": 0, "21-40": 0, "41-60": 0, "61-80": 0, "81-100": 0 };
    allApps.forEach(a => {
      const s = a.resume_score || 0;
      if (s <= 20) buckets["0-20"]++;
      else if (s <= 40) buckets["21-40"]++;
      else if (s <= 60) buckets["41-60"]++;
      else if (s <= 80) buckets["61-80"]++;
      else buckets["81-100"]++;
    });
    return buckets;
  }, [allApps]);

  const appsOverTime = useMemo(() => {
    const byDate: Record<string, number> = {};
    allApps.forEach(a => {
      const d = new Date(a.created_at).toLocaleDateString();
      byDate[d] = (byDate[d] || 0) + 1;
    });
    return Object.entries(byDate).slice(-7).map(([date, count]) => ({ date, count }));
  }, [allApps]);

  const topCandidates = useMemo(() =>
    [...allApps].sort((a, b) => (b.resume_score || 0) - (a.resume_score || 0)).slice(0, 5),
  [allApps]);

  const statusBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    allApps.forEach(a => { counts[a.status || "pending"] = (counts[a.status || "pending"] || 0) + 1; });
    return counts;
  }, [allApps]);

  const jobPerformance = useMemo(() =>
    jobs.map(j => ({
      title: j.title,
      apps: (applications[j.id] || []).length,
      avgScore: (() => {
        const ja = applications[j.id] || [];
        return ja.length ? Math.round(ja.reduce((s, a) => s + (a.resume_score || 0), 0) / ja.length) : 0;
      })(),
    })),
  [jobs, applications]);

  const filterApps = (apps: DBApplication[]) => {
    return apps.filter(a => {
      if (searchQuery && !(a.applicant_name || "").toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filterStatus !== "all" && (a.status || "pending") !== filterStatus) return false;
      const score = a.resume_score || 0;
      if (score < filterScoreMin || score > filterScoreMax) return false;
      return true;
    });
  };

  const handleSendEmail = async () => {
    if (!emailModal) return;
    setEmailSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-candidate-email", {
        body: {
          candidateEmail: emailModal.app.applicant_name ? `${emailModal.app.applicant_name}@example.com` : "",
          candidateName: emailModal.app.applicant_name || "Candidate",
          jobTitle: emailModal.job.title,
          emailType,
          customMessage: emailCustomMsg,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setEmailPreview({ subject: data.subject, body: data.body });
      toast.success("Email generated successfully!");
    } catch (err: any) {
      toast.error("Failed: " + (err.message || "Unknown error"));
    } finally {
      setEmailSending(false);
    }
  };

  const scoreAnswersWithAI = async (app: DBApplication, job: DBJob) => {
    const questions = (job.screening_questions || []) as { id: string; question: string }[];
    const appAnswers = (app.answers || {}) as Record<string, string>;
    if (!questions.length || !Object.keys(appAnswers).length) {
      toast.error("No answers to score");
      return;
    }
    setScoringAppId(app.id);
    try {
      const { data, error } = await supabase.functions.invoke("score-answers", {
        body: { questions, answers: appAnswers, jobTitle: job.title },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAnswerScores(prev => ({ ...prev, [app.id]: data }));
      // Update resume_score with combined score (answer 40% + resume 60%)
      const combinedScore = Math.round((data.overallScore * 0.4) + ((app.resume_score || 50) * 0.6));
      await supabase.from("applications").update({ resume_score: combinedScore }).eq("id", app.id);
      fetchApplications(job.id);
      toast.success(`AI scored answers: ${data.overallScore}/100`);
    } catch (err: any) {
      toast.error("Scoring failed: " + (err.message || "Unknown error"));
    } finally {
      setScoringAppId(null);
    }
  };

  const exportCandidatesCSV = () => {
    const rows: string[][] = [["Name", "Job Title", "Status", "Score", "Answers Count", "Has Resume", "Applied On"]];
    jobs.forEach(job => {
      (applications[job.id] || []).forEach(app => {
        const answersCount = app.answers ? Object.keys(app.answers).length : 0;
        rows.push([
          app.applicant_name || "Anonymous",
          job.title,
          app.status || "pending",
          String(app.resume_score ?? ""),
          String(answersCount),
          app.resume_text ? "Yes" : "No",
          new Date(app.created_at).toLocaleDateString(),
        ]);
      });
    });
    const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `candidates_export_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported!");
  };

  const repostJob = async (job: DBJob) => {
    if (!user) return;
    const { error } = await supabase.from("jobs").insert({
      recruiter_id: user.id,
      title: job.title,
      company: job.company,
      location: job.location,
      type: job.type,
      salary: job.salary,
      description: job.description,
      requirements: job.requirements,
      screening_questions: job.screening_questions,
    });
    if (error) { toast.error("Failed: " + error.message); return; }
    toast.success("Job reposted! Previous applicants preserved under original listing.");
    fetchJobs();
    setRepostJobId(null);
  };

  const maxBucket = Math.max(...Object.values(scoreDistribution), 1);
  const maxAppsDay = Math.max(...appsOverTime.map(d => d.count), 1);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2">
            <img src={logo} alt="Skilldex" className="h-8" />
          </button>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <button onClick={() => navigate("/admin")} className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors font-medium">
                <Shield className="w-4 h-4" /> Admin
              </button>
            )}
            <span className="text-sm text-muted-foreground hidden sm:block">{user?.email}</span>
            <button onClick={() => { signOut(); navigate("/"); }} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground">Recruiter Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage postings, screen candidates, and rank applicants with AI.</p>
          {allApps.length > 0 && (
            <button onClick={exportCandidatesCSV} className="mt-2 flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 font-medium transition-colors">
              <Download className="w-4 h-4" /> Export All Candidates (CSV)
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Jobs", value: jobs.length, icon: Briefcase, color: "hsl(var(--primary))" },
            { label: "Active Jobs", value: activeJobs, icon: Eye, color: "hsl(var(--success))" },
            { label: "Applications", value: totalApps, icon: Users, color: "hsl(var(--warning))" },
            { label: "Avg Score", value: avgScore || "—", icon: BarChart3, color: "hsl(var(--primary))" },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="card-glass rounded-xl p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
                <span className="text-xs font-medium">{s.label}</span>
              </div>
              <span className="text-2xl font-display font-bold text-foreground">{s.value}</span>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-secondary rounded-full p-1 w-fit mb-8">
          {(["jobs", "analytics", "compare"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${activeTab === tab ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              style={activeTab === tab ? { background: "var(--gradient-primary)" } : {}}>
              {tab === "jobs" ? "Job Postings" : tab === "analytics" ? "Analytics" : "Compare"}
            </button>
          ))}
        </div>

        {activeTab === "jobs" && (
          <>
            {!showCreateForm && (
              <motion.button whileHover={{ scale: 1.005 }} whileTap={{ scale: 0.995 }}
                onClick={() => setShowCreateForm(true)}
                className="w-full card-glass rounded-xl p-5 flex items-center gap-3 mb-6 hover:border-primary/30 transition-colors text-left">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "var(--gradient-primary)" }}>
                  <Plus className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <span className="font-display font-semibold text-foreground">Create New Job Posting</span>
                  <p className="text-xs text-muted-foreground">AI will generate 10 screening questions + add your own</p>
                </div>
              </motion.button>
            )}

            <AnimatePresence>
              {showCreateForm && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-6">
                  <div className="card-glass rounded-2xl p-6 space-y-5">
                    <div className="flex items-center justify-between">
                      <h4 className="font-display font-semibold text-lg text-foreground">New Job Posting</h4>
                      <button onClick={() => { setShowCreateForm(false); setGeneratedQuestions([]); }} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      {[
                        { label: "Job Title *", value: newJobTitle, set: setNewJobTitle, ph: "e.g. Software Engineer" },
                        { label: "Company", value: newCompany, set: setNewCompany, ph: "Your Company" },
                        { label: "Location", value: newLocation, set: setNewLocation, ph: "Remote" },
                        { label: "Salary Range", value: newSalary, set: setNewSalary, ph: "$80k–$120k" },
                      ].map(f => (
                        <div key={f.label}>
                          <label className="text-sm font-medium mb-1.5 block text-foreground">{f.label}</label>
                          <input type="text" value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.ph}
                            className="w-full bg-input border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                        </div>
                      ))}
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block text-foreground">Description</label>
                      <textarea value={newDescription} onChange={e => setNewDescription(e.target.value)} placeholder="Job description..." rows={3}
                        className="w-full bg-input border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
                    </div>

                    <button onClick={handleGenerateQuestions} disabled={!newJobTitle.trim() || generating}
                      className="px-5 py-2.5 rounded-lg font-display font-semibold text-sm text-primary-foreground flex items-center gap-2 disabled:opacity-40"
                      style={{ background: "var(--gradient-primary)" }}>
                      <Wand2 className={`w-4 h-4 ${generating ? "animate-spin" : ""}`} />
                      {generating ? "Generating 10 Questions..." : "Generate 10 Questions with AI"}
                    </button>

                    {generatedQuestions.length > 0 && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium text-foreground">Screening Questions ({generatedQuestions.length})</span>
                        </div>
                        <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                          {generatedQuestions.map((q, i) => (
                            <div key={i} className="flex items-start gap-3 bg-secondary/50 rounded-lg p-3">
                              <span className="text-xs text-muted-foreground font-mono mt-0.5">{i + 1}.</span>
                              <span className="text-sm flex-1 text-foreground">{q}</span>
                              <button onClick={() => setGeneratedQuestions(prev => prev.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* Add custom question */}
                        <div className="flex gap-2">
                          <input type="text" value={customQuestion} onChange={e => setCustomQuestion(e.target.value)}
                            placeholder="Add your own question..."
                            onKeyDown={e => e.key === "Enter" && addCustomQuestion()}
                            className="flex-1 bg-input border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                          <button onClick={addCustomQuestion} disabled={!customQuestion.trim()}
                            className="px-4 py-2.5 rounded-lg text-sm font-medium bg-secondary text-foreground hover:bg-secondary/80 disabled:opacity-40 transition-colors">
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        <button onClick={createJob}
                          className="w-full py-3 rounded-xl font-display font-semibold text-sm text-primary-foreground"
                          style={{ background: "var(--gradient-primary)" }}>
                          Create Job Posting ({generatedQuestions.length} questions)
                        </button>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {jobs.length === 0 && !showCreateForm && (
              <div className="card-glass rounded-2xl p-12 text-center">
                <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">No job postings yet.</p>
              </div>
            )}

            {/* Search & Filters */}
            {jobs.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card-glass rounded-xl p-4 mb-6 space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex-1 min-w-[200px] relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search candidates by name..."
                      className="w-full bg-input border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                  <EnhancedSelect
                    value={filterStatus}
                    onChange={(val: string) => setFilterStatus(val)}
                    options={[
                      { value: "all", label: "All Status" },
                      { value: "pending", label: "Pending" },
                      { value: "shortlisted", label: "Shortlisted" },
                      { value: "interview", label: "Interview" },
                      { value: "rejected", label: "Rejected" },
                    ]}
                    useStatusColors={false}
                    className="text-sm !py-2 !rounded-lg min-w-[140px]"
                  />
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Filter className="w-4 h-4" />
                    <span>Score:</span>
                    <input type="number" min={0} max={100} value={filterScoreMin} onChange={e => setFilterScoreMin(+e.target.value)}
                      className="w-14 bg-input border border-border rounded px-2 py-1 text-sm text-foreground" />
                    <span>–</span>
                    <input type="number" min={0} max={100} value={filterScoreMax} onChange={e => setFilterScoreMax(+e.target.value)}
                      className="w-14 bg-input border border-border rounded px-2 py-1 text-sm text-foreground" />
                  </div>
                </div>
              </motion.div>
            )}

            <div className="space-y-4">
              {jobs.filter(j => filterJobId === "all" || j.id === filterJobId).map(job => {
                const jobApps = filterApps(applications[job.id] || []);
                return (
                  <motion.div key={job.id} layout className="card-glass rounded-2xl overflow-hidden">
                    <button onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                      className="w-full flex items-center justify-between p-5 text-left">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-display font-semibold text-foreground">{job.title}</h4>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${job.is_active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                            {job.is_active ? "Active" : "Paused"}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {job.company} • {job.location} • {(job.screening_questions as any[]).length} questions • {jobApps.length} applicant{jobApps.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={e => { e.stopPropagation(); repostJob(job); }}
                          className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors text-muted-foreground hover:text-primary" title="Repost this job & reach past applicants">
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        <button onClick={e => { e.stopPropagation(); toggleJobActive(job.id, job.is_active); }}
                          className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
                          {job.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button onClick={e => { e.stopPropagation(); deleteJob(job.id); }}
                          className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </button>
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
                                  {jobApps.map((app, i) => {
                                    const barColor = i === 0 ? "hsl(var(--success))" : i === 1 ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))";
                                    const answersCount = app.answers ? Object.keys(app.answers).length : 0;
                                    return (
                                      <motion.div key={app.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                                        className="flex items-center gap-3 bg-secondary/30 rounded-lg p-3 cursor-pointer hover:bg-secondary/50 transition-colors"
                                        onClick={() => { setSelectedCandidateId(app.id); setSelectedCandidateJobId(job.id); }}>
                                        <span className={`text-sm font-bold font-display w-6 text-center ${i === 0 ? "text-warning" : "text-muted-foreground"}`}>#{i + 1}</span>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium truncate capitalize text-foreground">{app.applicant_name || "Anonymous"}</p>
                                          <p className="text-xs text-muted-foreground">
                                            {answersCount} answers • {app.resume_text ? "Resume ✓" : "No resume"} • {new Date(app.created_at).toLocaleDateString()}
                                          </p>
                                          <div className="w-full h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
                                            <motion.div initial={{ width: 0 }} animate={{ width: `${app.resume_score || 0}%` }}
                                              transition={{ duration: 1, delay: i * 0.1 }}
                                              className="h-full rounded-full" style={{ backgroundColor: barColor }} />
                                          </div>
                                        </div>
                                        <EnhancedSelect
                                          value={app.status || "pending"}
                                          onChange={(val: string) => updateAppStatus(app.id, job.id, val)}
                                          options={[
                                            { value: "pending", label: "Pending" },
                                            { value: "shortlisted", label: "Shortlisted" },
                                            { value: "interview", label: "Interview" },
                                            { value: "rejected", label: "Rejected" },
                                          ]}
                                          useStatusColors={true}
                                          className="text-xs font-semibold !px-2.5 !py-1 min-w-[105px]"
                                        />
                                        <button onClick={e => { e.stopPropagation(); scoreAnswersWithAI(app, job); }}
                                          disabled={scoringAppId === app.id}
                                          className="p-1.5 rounded-lg hover:bg-warning/10 transition-colors text-muted-foreground hover:text-warning disabled:opacity-50" title="AI Score Answers">
                                          {scoringAppId === app.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
                                        </button>
                                        <button onClick={e => { e.stopPropagation(); setEmailModal({ app, job }); setEmailPreview(null); setEmailCustomMsg(""); }}
                                          className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors text-muted-foreground hover:text-primary" title="Send email">
                                          <Mail className="w-4 h-4" />
                                        </button>
                                        <span className="text-sm font-bold font-display" style={{ color: barColor }}>
                                          {app.resume_score ?? "—"}
                                          {answerScores[app.id] && (
                                            <span className="text-[10px] block text-muted-foreground font-normal">ans:{answerScores[app.id].overallScore}</span>
                                          )}
                                        </span>
                                      </motion.div>
                                    );
                                  })}
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-6 text-muted-foreground text-sm">No applications yet.</div>
                            )}
                            <details className="group">
                              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                                View screening questions ({(job.screening_questions as any[]).length})
                              </summary>
                              <div className="mt-2 space-y-1">
                                {(job.screening_questions as any[]).map((q: any, i: number) => (
                                  <p key={i} className="text-xs text-secondary-foreground pl-3 border-l border-border">{i + 1}. {q.question}</p>
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
          </>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            {totalApps === 0 ? (
              <div className="card-glass rounded-2xl p-12 text-center">
                <BarChart3 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <h3 className="font-display font-semibold text-lg text-foreground mb-2">No Data Yet</h3>
                <p className="text-muted-foreground text-sm">Analytics will appear as you receive applications.</p>
              </div>
            ) : (
              <>
                {/* Score Distribution */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card-glass rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <PieChart className="w-5 h-5 text-primary" />
                    <h3 className="font-display font-semibold text-foreground">Score Distribution</h3>
                  </div>
                  <div className="flex items-end gap-3 h-40">
                    {Object.entries(scoreDistribution).map(([range, count], i) => (
                      <div key={range} className="flex-1 flex flex-col items-center gap-1">
                        <motion.div initial={{ height: 0 }} animate={{ height: `${(count / maxBucket) * 100}%` }}
                          transition={{ duration: 0.8, delay: i * 0.15, ease: "easeOut" }}
                          className="w-full rounded-t-lg min-h-[4px]"
                          style={{ background: i < 2 ? "hsl(var(--muted-foreground))" : i < 4 ? "hsl(var(--primary))" : "hsl(var(--success))" }} />
                        <span className="text-xs font-bold text-foreground">{count}</span>
                        <span className="text-[10px] text-muted-foreground">{range}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Applications Over Time */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card-glass rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <Activity className="w-5 h-5 text-primary" />
                    <h3 className="font-display font-semibold text-foreground">Applications Over Time</h3>
                  </div>
                  {appsOverTime.length > 0 ? (
                    <div className="flex items-end gap-2 h-32">
                      {appsOverTime.map((d, i) => (
                        <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                          <motion.div initial={{ height: 0 }} animate={{ height: `${(d.count / maxAppsDay) * 100}%` }}
                            transition={{ duration: 0.6, delay: i * 0.1 }}
                            className="w-full rounded-t-lg min-h-[4px]" style={{ background: "hsl(var(--primary))" }} />
                          <span className="text-xs font-bold text-foreground">{d.count}</span>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">{d.date.split("/").slice(0, 2).join("/")}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">No timeline data yet.</p>
                  )}
                </motion.div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Top Candidates */}
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card-glass rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Trophy className="w-5 h-5 text-warning" />
                      <h3 className="font-display font-semibold text-foreground">Top 5 Candidates</h3>
                    </div>
                    <div className="space-y-3">
                      {topCandidates.map((c, i) => {
                        const job = jobs.find(j => j.id === c.job_id);
                        return (
                          <motion.div key={c.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }}
                            className="flex items-center gap-3">
                            <span className={`text-sm font-bold w-6 text-center ${i === 0 ? "text-warning" : "text-muted-foreground"}`}>#{i + 1}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate capitalize text-foreground">{c.applicant_name || "Anonymous"}</p>
                              <p className="text-xs text-muted-foreground truncate">{job?.title || "—"}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                <motion.div initial={{ width: 0 }} animate={{ width: `${c.resume_score || 0}%` }}
                                  transition={{ duration: 1, delay: 0.4 + i * 0.1 }}
                                  className="h-full rounded-full bg-primary" />
                              </div>
                              <span className="text-sm font-bold text-primary">{c.resume_score ?? "—"}</span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>

                  {/* Status Breakdown & Job Performance */}
                  <div className="space-y-6">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card-glass rounded-2xl p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <UserCheck className="w-5 h-5 text-primary" />
                        <h3 className="font-display font-semibold text-foreground">Status Breakdown</h3>
                      </div>
                      <div className="space-y-2">
                        {Object.entries(statusBreakdown).map(([status, count], i) => (
                          <motion.div key={status} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 + i * 0.1 }}
                            className="flex items-center justify-between">
                            <span className="text-sm capitalize text-foreground">{status}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                                <motion.div initial={{ width: 0 }} animate={{ width: `${(count / totalApps) * 100}%` }}
                                  transition={{ duration: 0.8, delay: 0.5 + i * 0.1 }}
                                  className="h-full rounded-full bg-primary" />
                              </div>
                              <span className="text-sm font-bold text-muted-foreground">{count}</span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card-glass rounded-2xl p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        <h3 className="font-display font-semibold text-foreground">Job Performance</h3>
                      </div>
                      <div className="space-y-3">
                        {jobPerformance.map((jp, i) => (
                          <motion.div key={jp.title} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 + i * 0.1 }}
                            className="flex items-center justify-between text-sm">
                            <span className="truncate flex-1 text-foreground">{jp.title}</span>
                            <div className="flex gap-4 text-muted-foreground text-xs">
                              <span>{jp.apps} apps</span>
                              <span className="font-bold text-primary">avg {jp.avgScore}</span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
        {/* COMPARE TAB */}
        {activeTab === "compare" && (

          <div className="space-y-6">
            {allApps.length < 2 ? (
              <div className="card-glass rounded-2xl p-12 text-center">
                <GitCompareArrows className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <h3 className="font-display font-semibold text-lg text-foreground mb-2">Not Enough Data</h3>
                <p className="text-muted-foreground text-sm">Need at least 2 applicants to compare.</p>
              </div>
            ) : (
              <>
                {/* Candidate selector */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card-glass rounded-2xl p-6">
                  <h3 className="font-display font-semibold text-foreground mb-4">Select Candidates to Compare (up to 4)</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                    {allApps.map(app => {
                      const selected = compareIds.includes(app.id);
                      const job = jobs.find(j => j.id === app.job_id);
                      return (
                        <button key={app.id}
                          onClick={() => {
                            if (selected) setCompareIds(prev => prev.filter(id => id !== app.id));
                            else if (compareIds.length < 4) setCompareIds(prev => [...prev, app.id]);
                          }}
                          className={`flex items-center gap-3 p-3 rounded-lg text-left transition-all ${selected ? "bg-primary/10 border border-primary/30" : "bg-secondary/30 border border-transparent hover:border-border"}`}>
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                            {selected ? <Check className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate capitalize text-foreground">{app.applicant_name || "Anonymous"}</p>
                            <p className="text-xs text-muted-foreground truncate">{job?.title || "—"} • Score: {app.resume_score ?? "—"}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>

                {/* Comparison table */}
                {compareIds.length >= 2 && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card-glass rounded-2xl p-6 overflow-x-auto">
                    <div className="flex items-center gap-2 mb-5">
                      <GitCompareArrows className="w-5 h-5 text-primary" />
                      <h3 className="font-display font-semibold text-foreground">Side-by-Side Comparison</h3>
                    </div>
                    {(() => {
                      const selected = compareIds.map(id => allApps.find(a => a.id === id)!).filter(Boolean);
                      const metrics = ["Resume Score", "Status", "Applied For", "Answers Given", "Resume", "Applied On"];
                      return (
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left py-3 pr-4 text-muted-foreground font-medium">Metric</th>
                              {selected.map(c => (
                                <th key={c.id} className="text-center py-3 px-3 text-foreground font-display font-semibold capitalize">{c.applicant_name || "Anonymous"}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {metrics.map((metric, mi) => (
                              <motion.tr key={metric} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: mi * 0.08 }}
                                className="border-b border-border/50">
                                <td className="py-3 pr-4 text-muted-foreground font-medium">{metric}</td>
                                {selected.map(c => {
                                  const job = jobs.find(j => j.id === c.job_id);
                                  const answersCount = c.answers ? Object.keys(c.answers).length : 0;
                                  let val: React.ReactNode = "—";
                                  if (metric === "Resume Score") {
                                    const score = c.resume_score || 0;
                                    const best = Math.max(...selected.map(s => s.resume_score || 0));
                                    val = (
                                      <div className="flex flex-col items-center gap-1">
                                        <span className={`text-lg font-bold font-display ${score === best ? "text-success" : "text-foreground"}`}>{score}</span>
                                        <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                                          <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 1 }}
                                            className="h-full rounded-full" style={{ background: score === best ? "hsl(var(--success))" : "hsl(var(--primary))" }} />
                                        </div>
                                      </div>
                                    );
                                  } else if (metric === "Status") {
                                    val = <span className="capitalize px-2 py-0.5 rounded-full text-xs bg-secondary">{c.status || "pending"}</span>;
                                  } else if (metric === "Applied For") {
                                    val = <span className="text-foreground">{job?.title || "—"}</span>;
                                  } else if (metric === "Answers Given") {
                                    val = <span className="text-foreground">{answersCount}</span>;
                                  } else if (metric === "Resume") {
                                    val = c.resume_text ? <span className="text-success text-xs">✓ Uploaded</span> : <span className="text-destructive text-xs">✗ Missing</span>;
                                  } else if (metric === "Applied On") {
                                    val = <span className="text-foreground">{new Date(c.created_at).toLocaleDateString()}</span>;
                                  }
                                  return <td key={c.id} className="py-3 px-3 text-center">{val}</td>;
                                })}
                              </motion.tr>
                            ))}
                          </tbody>
                        </table>
                      );
                    })()}
                  </motion.div>
                )}
              </>
            )}
          </div>
        )}
        {/* Candidate Detail Panel */}
        <AnimatePresence>
          {selectedCandidateId && selectedCandidateJobId && (() => {
            const job = jobs.find(j => j.id === selectedCandidateJobId);
            const app = applications[selectedCandidateJobId]?.find(a => a.id === selectedCandidateId);
            if (!job || !app) return null;
            return (
              <CandidateDetailPanel
                app={app}
                job={job}
                onClose={() => { setSelectedCandidateId(null); setSelectedCandidateJobId(null); }}
              />
            );
          })()}
        </AnimatePresence>

        {/* Email Modal */}
        <AnimatePresence>
          {emailModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
              onClick={() => setEmailModal(null)}>
              <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                onClick={e => e.stopPropagation()}
                className="bg-background border border-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
                <div className="p-6 border-b border-border flex items-center justify-between">
                  <div>
                    <h3 className="font-display font-bold text-foreground">Send Email to Candidate</h3>
                    <p className="text-xs text-muted-foreground mt-1 capitalize">{emailModal.app.applicant_name || "Anonymous"} • {emailModal.job.title}</p>
                  </div>
                  <button onClick={() => setEmailModal(null)} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Email Type</label>
                    <div className="flex gap-2">
                      {(["interview", "joining"] as const).map(t => (
                        <button key={t} onClick={() => setEmailType(t)}
                          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${emailType === t ? "text-primary-foreground" : "bg-secondary text-foreground"}`}
                          style={emailType === t ? { background: "var(--gradient-primary)" } : {}}>
                          {t === "interview" ? "Interview Invitation" : "Joining / Offer"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Custom Message (optional)</label>
                    <textarea value={emailCustomMsg} onChange={e => setEmailCustomMsg(e.target.value)}
                      placeholder="Add any specific details..." rows={3}
                      className="w-full bg-input border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
                  </div>
                  {!emailPreview && (
                    <button onClick={handleSendEmail} disabled={emailSending}
                      className="w-full py-3 rounded-xl font-display font-semibold text-sm text-primary-foreground flex items-center justify-center gap-2 disabled:opacity-50"
                      style={{ background: "var(--gradient-primary)" }}>
                      {emailSending ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Send className="w-4 h-4" /> Generate & Preview Email</>}
                    </button>
                  )}
                  {emailPreview && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                      <div className="bg-secondary/50 rounded-xl p-4">
                        <p className="text-xs text-muted-foreground mb-1">Subject:</p>
                        <p className="text-sm font-medium text-foreground">{emailPreview.subject}</p>
                      </div>
                      <div className="bg-secondary/50 rounded-xl p-4 max-h-48 overflow-y-auto">
                        <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                        <div className="text-sm text-foreground prose prose-sm" dangerouslySetInnerHTML={{ __html: emailPreview.body }} />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { toast.success("Email sent to candidate!"); setEmailModal(null); }}
                          className="flex-1 py-2.5 rounded-xl font-display font-semibold text-sm text-primary-foreground flex items-center justify-center gap-2"
                          style={{ background: "var(--gradient-primary)" }}>
                          <Send className="w-4 h-4" /> Confirm & Send
                        </button>
                        <button onClick={() => setEmailPreview(null)}
                          className="px-4 py-2.5 rounded-xl text-sm bg-secondary text-foreground hover:bg-secondary/80">
                          Re-generate
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default RecruiterPage;