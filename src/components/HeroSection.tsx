import { motion } from "framer-motion";
import { Sparkles, ArrowDown, Zap, Shield } from "lucide-react";


const HeroSection = () => {
  return (
    <section className="relative min-h-[92vh] flex flex-col items-center justify-center px-4 overflow-hidden mesh-bg">
      {/* Dot pattern overlay */}
      <div className="absolute inset-0 dot-pattern pointer-events-none" />

      {/* Animated gradient blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ y: [0, -30, 0], x: [0, 15, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[10%] right-[10%] w-80 h-80 rounded-full opacity-[0.07]"
          style={{ background: "radial-gradient(circle, hsl(var(--primary)), transparent 65%)" }}
        />
        <motion.div
          animate={{ y: [0, 20, 0], x: [0, -12, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[15%] left-[5%] w-72 h-72 rounded-full opacity-[0.06]"
          style={{ background: "radial-gradient(circle, hsl(180 70% 42%), transparent 65%)" }}
        />
        <motion.div
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[45%] left-[45%] -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full opacity-[0.03]"
          style={{ background: "radial-gradient(circle, hsl(var(--primary)), transparent 55%)" }}
        />
        <motion.div
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear", repeatDelay: 4 }}
          className="absolute top-[30%] w-[200px] h-[1px] opacity-20"
          style={{ background: "linear-gradient(90deg, transparent, hsl(var(--primary)), transparent)" }}
        />
      </div>

      {/* Gradient line at bottom */}
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 text-center max-w-3xl mx-auto pt-16"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: "spring", bounce: 0.4 }}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary/8 border border-primary/15 text-primary text-sm font-medium mb-8 backdrop-blur-sm"
        >
          <Sparkles className="w-4 h-4" />
          AI-Powered Resume Intelligence
        </motion.div>

        <h1 className="text-5xl md:text-6xl lg:text-[4.5rem] font-bold font-display mb-6 leading-[1.1] text-foreground tracking-tight">
<span className="block">Hire Smarter.</span>
          <span className="gradient-text">
<span>Apply Better.</span>
          </span>
        </h1>

        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="w-20 h-1 mx-auto mb-6 rounded-full origin-left"
          style={{ background: "var(--gradient-primary)" }}
        />

        <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mb-12 leading-relaxed">
          Our AI scans resumes in seconds, highlighting strengths & weaknesses.
          Recruiters rank candidates automatically. Candidates get actionable feedback.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <motion.button
            whileHover={{ scale: 1.04, boxShadow: "0 8px 30px -8px hsl(165 80% 38% / 0.4)" }}
            whileTap={{ scale: 0.97 }}
            onClick={() => document.getElementById("scanner")?.scrollIntoView({ behavior: "smooth" })}
            className="px-10 py-4 rounded-xl font-display font-semibold text-primary-foreground shadow-lg text-base"
            style={{ background: "var(--gradient-primary)" }}
          >
            Scan Your Resume
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.04, backgroundColor: "hsl(var(--secondary))" }}
            whileTap={{ scale: 0.97 }}
            onClick={() => document.getElementById("jobs")?.scrollIntoView({ behavior: "smooth" })}
            className="px-10 py-4 rounded-xl font-display font-semibold border border-border text-foreground transition-colors text-base"
          >
            Browse Jobs
          </motion.button>
        </div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground"
        >
          <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-primary" /> Real-time AI Analysis</span>
          <span className="w-1 h-1 rounded-full bg-border hidden sm:block" />
          <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-primary" /> Privacy-first scanning</span>
          <span className="w-1 h-1 rounded-full bg-border hidden sm:block" />
          <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-primary" /> Free to use</span>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center gap-1.5 text-muted-foreground/50"
        >
          <span className="text-[10px] uppercase tracking-widest font-medium">Scroll</span>
          <ArrowDown className="w-4 h-4" />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
