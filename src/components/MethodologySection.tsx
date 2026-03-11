import { motion } from "framer-motion";
import { Camera, ScanLine, Brain, Shield, ArrowRight, Zap, Activity } from "lucide-react";

const pipeline = [
  {
    icon: Camera,
    title: "Computer Vision",
    subtitle: "CNN / Vision Transformer",
    desc: "Food images analyzed using deep learning models to identify food items, visual allergen cues, and packaging.",
    tech: ["Image preprocessing (224×224)", "Feature extraction", "Food classification"],
    color: "bg-primary/10 text-primary border-primary/20",
  },
  {
    icon: ScanLine,
    title: "OCR Engine",
    subtitle: "Text Extraction",
    desc: "Ingredient labels processed with OCR to extract raw text — handles curved text, poor lighting, and multiple languages.",
    tech: ["Grayscale conversion", "Text detection", "Character recognition"],
    color: "bg-accent/10 text-accent-foreground border-accent/20",
  },
  {
    icon: Brain,
    title: "NLP Pipeline",
    subtitle: "Allergen Detection",
    desc: "Extracted text tokenized and compared against 14+ allergen categories including hidden allergens and derivatives.",
    tech: ["Tokenization", "Keyword matching", "Semantic analysis"],
    color: "bg-warning/10 text-warning border-warning/20",
  },
  {
    icon: Shield,
    title: "Risk Engine",
    subtitle: "Personalized Scoring",
    desc: "Detected allergens cross-referenced with user profile. Numeric 0–100 risk score computed using severity and cross-contamination.",
    tech: ["Profile matching", "Severity weighting", "Score mapping"],
    color: "bg-danger/10 text-danger border-danger/20",
  },
];

const riskScale = [
  { range: "0–30", level: "Safe", color: "bg-safe text-safe-foreground" },
  { range: "31–60", level: "Caution", color: "bg-warning text-warning-foreground" },
  { range: "61–85", level: "High Risk", color: "bg-accent text-accent-foreground" },
  { range: "86–100", level: "Critical", color: "bg-danger text-danger-foreground" },
];

const MethodologySection = () => {
  return (
    <section className="py-24 bg-foreground text-primary-foreground">
      <div className="container mx-auto px-6">
        <motion.div className="text-center mb-16" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-foreground/10 text-primary-foreground text-sm font-medium mb-4">
            <Zap className="w-4 h-4" />
            System Architecture
          </div>
          <h2 className="text-4xl font-display font-bold mb-4">Multi-Modal Pipeline</h2>
          <p className="text-lg text-primary-foreground/70 max-w-2xl mx-auto">
            Industry-grade architecture: Image → CNN → OCR → NLP → Risk Engine → Personalized Response
          </p>
        </motion.div>

        {/* Pipeline Flow */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative mb-16">
          {pipeline.map((step, i) => (
            <motion.div
              key={step.title}
              className="relative"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
            >
              <div className="h-full p-6 rounded-2xl bg-primary-foreground/5 border border-primary-foreground/10 hover:bg-primary-foreground/10 transition-all">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-foreground/10 flex items-center justify-center">
                    <step.icon className="w-5 h-5 text-accent" />
                  </div>
                  <span className="text-xs font-mono text-accent">0{i + 1}</span>
                </div>
                <h3 className="font-display font-bold text-lg mb-1">{step.title}</h3>
                <p className="text-xs text-primary-foreground/50 font-mono mb-3">{step.subtitle}</p>
                <p className="text-sm text-primary-foreground/70 leading-relaxed mb-4">{step.desc}</p>
                <div className="space-y-1">
                  {step.tech.map((t) => (
                    <div key={t} className="flex items-center gap-1.5 text-xs text-primary-foreground/40">
                      <div className="w-1 h-1 rounded-full bg-accent" />
                      {t}
                    </div>
                  ))}
                </div>
              </div>
              {i < pipeline.length - 1 && (
                <div className="hidden md:flex absolute top-1/2 -right-2.5 z-10">
                  <ArrowRight className="w-5 h-5 text-accent/50" />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Risk Score Scale */}
        <motion.div
          className="max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center gap-2 mb-4 justify-center">
            <Activity className="w-5 h-5 text-accent" />
            <h3 className="font-display font-bold text-lg">Risk Score Mapping</h3>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {riskScale.map((r) => (
              <div key={r.level} className="text-center p-3 rounded-xl bg-primary-foreground/5 border border-primary-foreground/10">
                <p className="text-xl font-display font-bold text-primary-foreground">{r.range}</p>
                <div className={`mt-2 px-3 py-1 rounded-full text-xs font-bold inline-block ${r.color}`}>
                  {r.level}
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-primary-foreground/40 mt-4">
            Score = base allergen risk + severity multiplier + cross-contamination modifier
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default MethodologySection;
