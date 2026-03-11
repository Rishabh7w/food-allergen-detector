import { motion } from "framer-motion";

interface RiskGaugeProps {
  score: number;
  level: string;
}

const getColor = (score: number) => {
  if (score <= 30) return { stroke: "hsl(var(--safe))", bg: "bg-safe/10", text: "text-safe" };
  if (score <= 60) return { stroke: "hsl(var(--warning))", bg: "bg-warning/10", text: "text-warning" };
  if (score <= 85) return { stroke: "hsl(var(--accent))", bg: "bg-accent/10", text: "text-accent-foreground" };
  return { stroke: "hsl(var(--danger))", bg: "bg-danger/10", text: "text-danger" };
};

const RiskGauge = ({ score, level }: RiskGaugeProps) => {
  const { stroke, bg, text } = getColor(score);
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className={`flex flex-col items-center justify-center p-6 rounded-2xl border border-border ${bg}`}>
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
          <motion.circle
            cx="60" cy="60" r="54" fill="none"
            stroke={stroke}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className={`text-3xl font-display font-bold ${text}`}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            {score}
          </motion.span>
          <span className="text-xs text-muted-foreground font-medium">/100</span>
        </div>
      </div>
      <motion.p
        className={`mt-3 text-sm font-display font-bold uppercase tracking-wider ${text}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        {level}
      </motion.p>
      <div className="flex gap-1 mt-2">
        {["Safe", "Caution", "High Risk", "Critical"].map((l) => (
          <div
            key={l}
            className={`h-1.5 w-6 rounded-full transition-all ${
              l === level ? "opacity-100" : "opacity-20"
            } ${
              l === "Safe" ? "bg-safe" : l === "Caution" ? "bg-warning" : l === "High Risk" ? "bg-accent" : "bg-danger"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default RiskGauge;
