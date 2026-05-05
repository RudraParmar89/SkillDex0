import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Sparkles, CheckCircle, XCircle, AlertTriangle, Loader2, X, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CandidateDetailPanelProps {
  app: {
    id: string;
    applicant_name: string;
    answers: any;
    resume_text: string | null;
    resume_score: number | null;
    status: string;
    created_at: string;
  };
  job: {
    id: string;
    title: string;
    description: string;
    requirements: string[];
    screening_questions: any[];
  };
  onClose: () => void;
}

interface AnswerScoreResult {
  overallScore: number;
  answerScores: { questionId: string; score: number; feedback: string }[];
  summary: string;
}

interface JobFitResult {
  fitScore: number;
  fitLevel: string;
  summary: string;
  matchedSkills: string[];
  missingSkills: string[];
  strengths: string[];
  concerns: string[];
}

const CandidateDetailPanel = ({ app, job, onClose }: CandidateDetailPanelProps) => {
  const [fitResult, setFitResult] = useState<JobFitResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [answerScore, setAnswerScore] = useState<AnswerScoreResult | null>(null);
  const [scoringAnswers, setScoringAnswers] = useState(false);

  const questions = (job.screening_questions || []) as { id: string; question: string }[];
  const answers = (app.answers || {}) as Record<string, string>;

  const scoreAnswers = async () => {
    if (!questions.length || !Object.keys(answers).length) {
      toast.error("No answers to score");
      return;
    }
    setScoringAnswers(true);
    try {
      const { data, error } = await supabase.functions.invoke("score-answers", {
        body: { questions, answers, jobTitle: job.title },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAnswerScore(data);
      toast.success("Answers scored!");
    } catch (err: any) {
      toast.error("Scoring failed: " + (err.message || "Unknown error"));
    } finally {
      setScoringAnswers(false);
    }
  };

  const analyzeJobFit = async () => {
    if (!app.resume_text) {
      toast.error("No resume text available for this candidate");
      return;
    }
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-job-fit", {
        body: {
          resumeText: app.resume_text,
          jobTitle: job.title,
          jobDescription: job.description || "",
          jobRequirements: job.requirements || [],
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setFitResult(data);
      toast.success("Job fit analysis complete!");
    } catch (err: any) {
      toast.error("Analysis failed: " + (err.message || "Unknown error"));
    } finally {
      setAnalyzing(false);
    }
  };

  const fitColor = (score: number) =>
    score >= 80 ? "text-success" : score >= 60 ? "text-primary" : score >= 40 ? "text-warning" : "text-destructive";

  const fitBg = (score: number) =>
    score >= 80 ? "bg-success/15" : score >= 60 ? "bg-primary/15" : score >= 40 ? "bg-warning/15" : "bg-destructive/15";

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 30 }}
      className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-background border-l border-border z-50 overflow-y-auto shadow-2xl"
    >
      <div className="sticky top-0 bg-background/95 backdrop-blur-xl border-b border-border px-6 py-4 flex items-center justify-between z-10">
        <div>
          <h3 className="font-display font-bold text-foreground capitalize">{app.applicant_name || "Anonymous"}</h3>
          <p className="text-xs text-muted-foreground">{job.title} • Score: {app.resume_score ?? "—"}/100</p>
        </div>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Pre-screening Answers */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              <h4 className="font-display font-semibold text-foreground">Pre-Screening Answers</h4>
            </div>
            {questions.length > 0 && !answerScore && !scoringAnswers && (
              <button onClick={scoreAnswers}
                className="text-xs px-3 py-1.5 rounded-lg font-semibold text-primary-foreground flex items-center gap-1.5"
                style={{ background: "var(--gradient-primary)" }}>
                <Sparkles className="w-3 h-3" /> AI Score
              </button>
            )}
            {scoringAnswers && (
              <div className="flex items-center gap-1.5 text-primary text-xs">
                <Loader2 className="w-3 h-3 animate-spin" /> Scoring...
              </div>
            )}
          </div>

          {answerScore && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="mb-4 rounded-xl p-4 bg-primary/10 text-center">
              <p className="text-2xl font-bold font-display text-primary">{answerScore.overallScore}/100</p>
              <p className="text-xs text-muted-foreground mt-1">{answerScore.summary}</p>
            </motion.div>
          )}

          {questions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No screening questions for this job.</p>
          ) : (
            <div className="space-y-4">
              {questions.map((q, i) => {
                const answer = answers[q.id];
                const aScore = answerScore?.answerScores.find(s => s.questionId === q.id);
                return (
                  <motion.div
                    key={q.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-secondary/30 rounded-xl p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm font-medium text-foreground">
                        <span className="text-muted-foreground font-mono mr-2">{i + 1}.</span>
                        {q.question}
                      </p>
                      {aScore && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ml-2 shrink-0 ${
                          aScore.score >= 7 ? "bg-success/15 text-success" :
                          aScore.score >= 5 ? "bg-warning/15 text-warning" :
                          "bg-destructive/15 text-destructive"
                        }`}>{aScore.score}/10</span>
                      )}
                    </div>
                    {answer ? (
                      <p className="text-sm text-secondary-foreground pl-5 border-l-2 border-primary/30">{answer}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic pl-5">No answer provided</p>
                    )}
                    {aScore && (
                      <p className="text-xs text-muted-foreground mt-2 pl-5 italic">{aScore.feedback}</p>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Job Fit Analysis */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-primary" />
            <h4 className="font-display font-semibold text-foreground">Job Fit Analysis</h4>
          </div>

          {!fitResult && !analyzing && (
            <button
              onClick={analyzeJobFit}
              disabled={!app.resume_text}
              className="w-full py-3 rounded-xl font-display font-semibold text-sm text-primary-foreground flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Sparkles className="w-4 h-4" />
              {app.resume_text ? "Analyze Resume-Job Fit with AI" : "No resume available"}
            </button>
          )}

          {analyzing && (
            <div className="flex items-center justify-center gap-3 py-8 text-primary">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm font-medium">Analyzing job fit...</span>
            </div>
          )}

          {fitResult && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {/* Score + Level */}
              <div className={`rounded-xl p-5 text-center ${fitBg(fitResult.fitScore)}`}>
                <p className={`text-4xl font-display font-bold ${fitColor(fitResult.fitScore)}`}>{fitResult.fitScore}</p>
                <p className={`text-sm font-semibold mt-1 ${fitColor(fitResult.fitScore)}`}>{fitResult.fitLevel}</p>
                <p className="text-xs text-muted-foreground mt-2">{fitResult.summary}</p>
              </div>

              {/* Matched Skills */}
              {fitResult.matchedSkills.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-success" /> Matched Skills
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {fitResult.matchedSkills.map((s, i) => (
                      <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-success/10 text-success font-medium">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing Skills */}
              {fitResult.missingSkills.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-1.5">
                    <XCircle className="w-4 h-4 text-destructive" /> Missing Skills
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {fitResult.missingSkills.map((s, i) => (
                      <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-destructive/10 text-destructive font-medium">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Strengths */}
              {fitResult.strengths.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">💪 Strengths</p>
                  <ul className="space-y-1">
                    {fitResult.strengths.map((s, i) => (
                      <li key={i} className="text-sm text-secondary-foreground pl-3 border-l-2 border-success/40">{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Concerns */}
              {fitResult.concerns.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-warning" /> Concerns
                  </p>
                  <ul className="space-y-1">
                    {fitResult.concerns.map((s, i) => (
                      <li key={i} className="text-sm text-secondary-foreground pl-3 border-l-2 border-warning/40">{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              <button onClick={() => setFitResult(null)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Re-analyze
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default CandidateDetailPanel;