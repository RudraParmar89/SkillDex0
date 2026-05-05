import { motion } from "framer-motion";

interface ATSScoreCircleProps {
  score: number;
}

const ATSScoreCircle = ({ score }: ATSScoreCircleProps) => {
  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (score / 100) * circumference;

  const getColor = () => {
    if (score >= 75) return { stroke: "hsl(150, 70%, 40%)", bg: "hsl(150 70% 40% / 0.08)", label: "Excellent" };
    if (score >= 50) return { stroke: "hsl(40, 95%, 50%)", bg: "hsl(40 95% 50% / 0.08)", label: "Good" };
    return { stroke: "hsl(0, 72%, 55%)", bg: "hsl(0 72% 55% / 0.08)", label: "Needs Work" };
  };

  const { stroke, bg, label } = getColor();

  return (
    <div className="relative w-36 h-36 mx-auto">
      {/* Glow ring */}
      <div className="absolute inset-2 rounded-full" style={{ background: bg }} />

      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        {/* Track */}
        <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="5" />
        {/* Progress */}
        <motion.circle
          cx="50" cy="50" r="42" fill="none"
          stroke={stroke}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-3xl font-bold font-display leading-none"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: "spring" }}
          style={{ color: stroke }}
        >
          {score}
        </motion.span>
        <span className="text-[10px] text-muted-foreground font-medium tracking-wider mt-0.5">{label}</span>
      </div>
    </div>
  );
};

export default ATSScoreCircle;
