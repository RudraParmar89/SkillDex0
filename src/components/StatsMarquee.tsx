import { motion } from "framer-motion";
import CountUp from "./CountUp";
import LogoLoop from "./LogoLoop";
import { FileText, Target, Zap, Building2 } from "lucide-react";

const logoItems = [
  "Resume Intelligence",
  "AI Screening",
  "Smart Hiring",
  "Talent Pipeline",
  "ATS Optimization",
  "Candidate Ranking",
  "Skill Matching",
  "Job Analytics",
];

const stats = [
  { value: 9894, suffix: "+", label: "RESUMES SCANNED", icon: FileText },
  { value: 94, suffix: "%", label: "ACCURACY RATE", icon: Target },
  { value: 3, suffix: "x", label: "FASTER HIRING", icon: Zap },
  { value: 495, suffix: "+", label: "COMPANIES", icon: Building2 },
];

const StatsMarquee = () => {
  return (
    <div className="relative bg-secondary/40 border-t border-border overflow-hidden">
      {/* Logo Loop marquee */}
      <div className="py-3.5 border-b border-border/60">
        <LogoLoop speed={25} pauseOnHover>
          {logoItems.map((item, i) => (
            <span key={i} className="text-sm font-medium text-muted-foreground/70 flex items-center gap-2.5 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
              {item}
            </span>
          ))}
        </LogoLoop>
      </div>

      {/* Stats row with CountUp */}
      <div className="max-w-5xl mx-auto py-14 px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center group"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <p className="text-3xl md:text-4xl font-bold font-display gradient-text mb-1">
                  <CountUp end={stat.value} duration={2200} suffix={stat.suffix} />
                </p>
                <p className="text-[11px] text-muted-foreground font-medium tracking-[0.2em]">{stat.label}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StatsMarquee;
