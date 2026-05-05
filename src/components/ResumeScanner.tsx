import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, CheckCircle2, XCircle, Lightbulb, ChevronDown, ChevronUp, Search, Sparkles, Loader2, LogIn, Lock } from "lucide-react";
import ATSScoreCircle from "./ATSScoreCircle";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import mammoth from "mammoth";
import { extractPdfText } from "@/lib/resumeUpload";

// We removed the fake local parser import entirely!

const ResumeScanner = () => {
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>("pros");
  const [dragActive, setDragActive] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [scansUsed, setScansUsed] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const scanKey = `resume_scans_${new Date().getMonth()}_${user.id}`;
    setScansUsed(parseInt(localStorage.getItem(scanKey) || "0"));

    const checkPremium = async () => {
      const { data: cust } = await supabase.from('billing_customers').select('id').eq('user_id', user.id).maybeSingle();
      if (cust) {
        const { data: sub } = await supabase.from('billing_subscriptions').select('plan_name, status').eq('billing_customer_id', cust.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
        if (sub && sub.status === 'active' && (sub.plan_name === 'pro' || sub.plan_name === 'enterprise')) {
          setIsPremium(true);
        }
      }
    };
    checkPremium();
  }, [user]);

  const handleFile = useCallback(async (f: File) => {
    if (!isPremium && scansUsed >= 3) {
      toast.error("Free Limit Reached: You have used your 3 free scans for this month. Upgrade to Pro for unlimited scans.");
      document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    setFile(f); setAnalyzing(true); setResult(null);
    try {
      // Extract text based on file type
      let text = "";
      const fileName = f.name.toLowerCase();
      const fileType = f.type;

      if (fileName.endsWith('.pdf') || fileType === 'application/pdf') {
        // Handle PDF files
        text = await extractPdfText(f);
      } else if (fileName.endsWith('.docx') || fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        // Handle DOCX files
        const arrayBuffer = await f.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        text = result.value;
      } else if (fileName.endsWith('.doc') || fileType === 'application/msword') {
        // Handle old DOC format - try as text, may not work perfectly
        toast.warning("Old .doc format detected. Converting as plain text. For best results, use PDF or DOCX.");
        text = await f.text();
      } else if (fileName.endsWith('.txt') || fileType === 'text/plain') {
        // Handle plain text files
        text = await f.text();
      } else {
        // Try default text extraction
        text = await f.text();
      }

      if (!text || text.trim().length === 0) {
        throw new Error("Could not extract text from file. Please try a different format (PDF, DOCX, or TXT).");
      }
      
      // FORCE REAL AI - NO FAKE FALLBACK
      const { data, error } = await supabase.functions.invoke("analyze-resume", { 
        body: { resumeText: text } 
      });
      
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      setResult(data); 
      
      if (!isPremium) {
        const newCount = scansUsed + 1;
        setScansUsed(newCount);
        localStorage.setItem(`resume_scans_${new Date().getMonth()}_${user?.id}`, newCount.toString());
      }
    } catch (err: any) {
      console.error(err);
      toast.error("AI Analysis failed: " + (err.message || "Please try again."));
      setFile(null); // Reset file so they can try again
    } finally {
      setAnalyzing(false);
    }
  }, [isPremium, scansUsed, user]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragActive(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const toggle = (s: string) => setExpandedSection(expandedSection === s ? null : s);

  if (!user) {
    return (
      <section id="scanner" className="py-20 px-4 bg-background">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold font-display mb-8">Check Your <span className="text-primary">ATS Score</span></h2>
          <button onClick={() => navigate("/auth")} className="px-8 py-3 rounded-lg font-display font-semibold bg-primary text-primary-foreground">
            Sign In to Scan Resume
          </button>
        </div>
      </section>
    );
  }

  const PremiumLock = () => (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/60 backdrop-blur-[4px] rounded-2xl border border-border">
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3"><Lock className="w-6 h-6 text-primary" /></div>
      <h4 className="font-bold text-lg mb-1 text-foreground">Premium Feature</h4>
      <p className="text-sm text-foreground/80 mb-4 font-medium text-center px-6">Upgrade to Pro to unlock detailed AI feedback, weaknesses, and missing keywords.</p>
      <button onClick={() => document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' })} className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-lg hover:bg-primary/90 transition-all hover:scale-105">
        Upgrade to Pro
      </button>
    </div>
  );

  return (
    <section id="scanner" className="py-20 px-4 bg-background">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold font-display mb-3">AI Resume <span className="text-primary">Scanner</span></h2>
          {!isPremium && <p className="text-muted-foreground text-sm font-medium">Free Scans Remaining: <span className="text-foreground">{3 - scansUsed}/3</span></p>}
          {isPremium && <p className="text-success text-sm font-medium flex items-center justify-center gap-1"><Sparkles className="w-4 h-4"/> Unlimited Pro Scans Active</p>}
        </div>

        <AnimatePresence mode="wait">
          {!result && !analyzing && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`card-glass rounded-2xl p-12 text-center cursor-pointer ${dragActive ? 'border-primary glow-effect' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }} onDragLeave={() => setDragActive(false)} onDrop={onDrop}
              onClick={() => document.getElementById("resume-upload")?.click()}>
              <input id="resume-upload" type="file" accept=".txt,.pdf,.doc,.docx" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
              <Upload className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Drop your resume here</h3>
              {!isPremium && scansUsed >= 3 && <p className="text-destructive font-medium mt-2">Free limit reached. Please upgrade.</p>}
            </motion.div>
          )}

          {analyzing && (
            <motion.div className="card-glass rounded-2xl p-16 text-center">
              <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto mb-4" />
              <h3 className="text-xl font-semibold">AI is Analyzing...</h3>
            </motion.div>
          )}

          {result && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="card-glass rounded-2xl p-8 flex flex-col md:flex-row items-center gap-8">
                <ATSScoreCircle score={result.score} />
                <div className="flex-1 text-center md:text-left">
                  <h3 className="font-semibold text-lg">{file?.name}</h3>
                  <p className="text-muted-foreground text-sm mt-1">Score: {result.score}/100</p>
                </div>
              </div>

              <CollapsibleSection title="Basic Strengths" count={result.pros.length} icon={<CheckCircle2 className="w-4 h-4 text-success" />} iconBg="bg-success/15" expanded={expandedSection === "pros"} onToggle={() => toggle("pros")} dotColor="text-success" items={result.pros} />

              <div className="relative">
                {!isPremium && <PremiumLock />}
                <div className={!isPremium ? "opacity-30 pointer-events-none select-none space-y-6 blur-[3px]" : "space-y-6"}>
                  <CollapsibleSection title="Detailed Weaknesses" count={result.cons.length} icon={<XCircle className="w-4 h-4 text-destructive" />} iconBg="bg-destructive/15" expanded={isPremium ? expandedSection === "cons" : true} onToggle={() => toggle("cons")} dotColor="text-destructive" items={result.cons} />
                  <CollapsibleSection title="AI Recommendations" count={result.recommendations.length} icon={<Lightbulb className="w-4 h-4 text-warning" />} iconBg="bg-warning/15" expanded={isPremium ? expandedSection === "recs" : true} onToggle={() => toggle("recs")} dotColor="text-warning" items={result.recommendations} />
                  
                  <div className="card-glass rounded-2xl p-5">
                    <h4 className="font-semibold mb-4">Keyword Optimization</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div><p className="text-xs text-success mb-2 font-bold uppercase">Found Keywords</p><div className="flex flex-wrap gap-1.5">{result.keywords.found.map((k: string) => <span key={k} className="text-xs px-2 py-0.5 rounded bg-success/10 text-success border border-success/20">{k}</span>)}</div></div>
                      <div><p className="text-xs text-destructive mb-2 font-bold uppercase">Missing Keywords</p><div className="flex flex-wrap gap-1.5">{result.keywords.missing.map((k: string) => <span key={k} className="text-xs px-2 py-0.5 rounded bg-destructive/10 text-destructive border border-destructive/20">{k}</span>)}</div></div>
                    </div>
                  </div>
                </div>
              </div>

              <button onClick={() => { setResult(null); setFile(null); }} className="w-full py-3 rounded-xl border border-border font-medium hover:bg-secondary transition text-foreground">Scan Another Resume</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

const CollapsibleSection = ({ title, count, icon, iconBg, expanded, onToggle, dotColor, items }: any) => (
  <div className="card-glass rounded-2xl overflow-hidden">
    <button onClick={onToggle} className="w-full flex items-center justify-between p-5">
      <div className="flex items-center gap-3"><div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center`}>{icon}</div><span className="font-semibold text-foreground">{title} ({count})</span></div>
      {expanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
    </button>
    <AnimatePresence>
      {expanded && (
        <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
          <div className="px-5 pb-5 space-y-2">{items.map((item: string, i: number) => <div key={i} className="flex items-start gap-2 text-sm text-foreground"><span className={dotColor}>•</span> {item}</div>)}</div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

export default ResumeScanner;