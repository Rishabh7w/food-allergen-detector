import { motion } from "framer-motion";
import { Camera, ScanLine, Brain, Shield, ArrowRight, CheckCircle } from "lucide-react";

interface PipelineStep {
  icon: typeof Camera;
  label: string;
  detail: string;
  tech: string;
}

const steps: PipelineStep[] = [
  { icon: Camera, label: "Image Input", detail: "CNN / Vision Transformer identifies food items from photos", tech: "Computer Vision" },
  { icon: ScanLine, label: "OCR Extraction", detail: "Tesseract-grade OCR extracts ingredient text from labels", tech: "OCR Engine" },
  { icon: Brain, label: "NLP Analysis", detail: "Tokenization & keyword matching detects allergen mentions", tech: "NLP Pipeline" },
  { icon: Shield, label: "Risk Engine", detail: "Personalized scoring with severity & cross-contamination", tech: "Risk Assessment" },
];

interface Props {
  activeSteps?: string[];
}

const PipelineVisualization = ({ activeSteps }: Props) => {
  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="flex items-stretch gap-1 min-w-[600px]">
        {steps.map((step, i) => {
          const Icon = step.icon;
          const isActive = !activeSteps || activeSteps.some((s) =>
            s.toLowerCase().includes(step.label.toLowerCase().split(" ")[0])
          );

          return (
            <div key={step.label} className="flex items-stretch flex-1">
              <motion.div
                className={`flex-1 p-4 rounded-xl border transition-all ${
                  isActive
                    ? "bg-primary/5 border-primary/30"
                    : "bg-secondary/30 border-border opacity-40"
                }`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: isActive ? 1 : 0.4, y: 0 }}
                transition={{ delay: i * 0.12 }}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${
                  isActive ? "bg-primary/10" : "bg-secondary"
                }`}>
                  <Icon className={`w-5 h-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-[10px] font-mono text-muted-foreground">0{i + 1}</span>
                  <p className="text-xs font-display font-bold text-foreground">{step.label}</p>
                </div>
                <p className="text-[10px] text-muted-foreground leading-snug">{step.detail}</p>
                {isActive && (
                  <motion.div
                    className="mt-2 flex items-center gap-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.12 + 0.3 }}
                  >
                    <CheckCircle className="w-3 h-3 text-safe" />
                    <span className="text-[9px] font-medium text-safe">{step.tech}</span>
                  </motion.div>
                )}
              </motion.div>
              {i < steps.length - 1 && (
                <div className="flex items-center px-1">
                  <ArrowRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PipelineVisualization;
