import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Loader2, AlertTriangle, CheckCircle, XCircle, Info,
  Camera, FileText, Upload, Eye, Brain, ScanLine, Shield,
  Cpu, Layers
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { saveToHistory } from "@/components/HistorySection";
import { getActiveProfile } from "@/lib/profileStore";
import RiskGauge from "@/components/RiskGauge";
import GradCAMHeatmap from "@/components/GradCAMHeatmap";
import PipelineVisualization from "@/components/PipelineVisualization";
import ActiveProfileSelector from "@/components/ActiveProfileSelector";

type Mode = "text" | "image" | "label";

interface Allergen {
  name: string;
  risk: "high" | "medium" | "low";
  triggeredBy: string;
  explanation: string;
  isPersonalRisk: boolean;
  detectionMethod: "vision" | "ocr" | "nlp" | "cross-reference";
}

interface RiskAssessment {
  riskScore: number;
  riskLevel: string;
  recommendation: string;
}

interface AttentionRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  intensity: number;
  allergenRisk: "high" | "medium" | "low" | "none";
}

interface MultiModalResult {
  detectedFood: string[];
  extractedIngredients: string;
  allergens: Allergen[];
  overallSafety: "safe" | "caution" | "danger";
  personalSafety: "safe" | "caution" | "danger";
  summary: string;
  personalizedWarning: string;
  recommendations: string[];
  analysisMethodsUsed: string[];
  confidenceScore: number;
  riskAssessment: RiskAssessment;
  foodPrediction: { name: string; confidence: number };
  attentionRegions?: AttentionRegion[];
  explainability?: { heatmapImageUrl: string | null };
}

const modeConfig = {
  text: { icon: FileText, label: "Ingredient Text", desc: "NLP analysis of ingredient lists" },
  image: { icon: Camera, label: "Food Photo", desc: "CNN visual food identification" },
  label: { icon: ScanLine, label: "Label OCR", desc: "OCR text extraction from packaging" },
};

const riskConfig = {
  high: { icon: XCircle, label: "High Risk", className: "bg-danger/10 text-danger border-danger/30" },
  medium: { icon: AlertTriangle, label: "Medium Risk", className: "bg-warning/10 text-warning border-warning/30" },
  low: { icon: Info, label: "Low Risk", className: "bg-primary/10 text-primary border-primary/30" },
};

const methodIcons: Record<string, typeof Brain> = {
  "Computer Vision (CNN)": Eye,
  "OCR Text Extraction": ScanLine,
  "NLP Ingredient Analysis": Brain,
  "Personalized Risk Engine": Shield,
};

const sampleIngredients = [
  "Wheat flour, sugar, butter, eggs, milk, vanilla extract, baking powder",
  "Rice, soy sauce, sesame oil, chicken, garlic, ginger, green onions",
  "Peanut butter, bread, strawberry jam, honey",
];

const MultiModalDetection = () => {
  const [mode, setMode] = useState<Mode>("text");
  const [ingredients, setIngredients] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<MultiModalResult | null>(null);
  const [activeStep, setActiveStep] = useState<number>(-1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please use images under 5MB.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setImagePreview(dataUrl);
      setImageBase64(dataUrl.split(",")[1]);
    };
    reader.readAsDataURL(file);
  };

  const canAnalyze = mode === "text" ? ingredients.trim() : imageBase64;

  const handleAnalyze = async () => {
    if (!canAnalyze) {
      toast({ title: "Missing input", description: mode === "text" ? "Enter ingredients to analyze." : "Upload an image first.", variant: "destructive" });
      return;
    }

    setIsAnalyzing(true);
    setResult(null);

    // Animate pipeline steps
    const stepTimers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 0; i < 4; i++) {
      stepTimers.push(setTimeout(() => setActiveStep(i), i * 800));
    }

    try {
      const activeProfile = getActiveProfile();
      const { data, error } = await supabase.functions.invoke("analyze-food-image", {
        body: {
          imageBase64: mode !== "text" ? imageBase64 : null,
          ingredients: ingredients.trim() || null,
          userAllergens: activeProfile?.allergies || [],
          userProfile: activeProfile && activeProfile.allergies.length > 0 ? activeProfile : null,
          mode,
        },
      });

      if (error) throw error;
      setResult(data);
      setActiveStep(4);

      saveToHistory({
        ingredients: mode === "text" ? ingredients.trim() : `[${modeConfig[mode].label}] ${data.extractedIngredients || "Image analysis"}`,
        result: {
          allergens: data.allergens.map((a: Allergen) => ({
            name: a.name, risk: a.risk, triggeredBy: a.triggeredBy, explanation: a.explanation,
          })),
          overallSafety: data.overallSafety,
          summary: data.summary,
          recommendations: data.recommendations,
        },
      });
      window.dispatchEvent(new Event("allergen-history-updated"));
    } catch (err: any) {
      console.error("Multi-modal analysis error:", err);
      toast({ title: "Analysis Failed", description: err?.message || "Could not analyze. Please try again.", variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
      stepTimers.forEach(clearTimeout);
      if (!result) setActiveStep(-1);
    }
  };

  return (
    <section id="detect" className="py-24">
      <div className="container mx-auto px-6">
        <motion.div className="text-center mb-12" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Layers className="w-4 h-4" />
            Multi-Modal AI Pipeline
          </div>
          <h2 className="text-4xl font-display font-bold text-foreground mb-4">Allergen Detection Engine</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Image → CNN → OCR → NLP → Risk Engine — comprehensive allergen screening with personalized 0-100 risk scoring.
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          {/* Active Profile Selector */}
          <ActiveProfileSelector />

          {/* Pipeline Visualization */}
          {(isAnalyzing || result) && (
            <motion.div className="mb-6" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
              <PipelineVisualization activeSteps={result?.analysisMethodsUsed} />
            </motion.div>
          )}

          {/* Mode Tabs */}
          <motion.div className="flex gap-2 mb-6" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            {(Object.keys(modeConfig) as Mode[]).map((m) => {
              const cfg = modeConfig[m];
              const Icon = cfg.icon;
              const active = mode === m;
              return (
                <button
                  key={m}
                  onClick={() => { setMode(m); setResult(null); setActiveStep(-1); }}
                  className={`flex-1 flex flex-col items-center gap-1 px-4 py-3 rounded-xl text-sm font-medium transition-all border ${
                    active ? "bg-primary text-primary-foreground border-primary shadow-lg" : "bg-card text-muted-foreground border-border hover:border-primary/30"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs">{cfg.label}</span>
                  <span className={`text-[10px] ${active ? "text-primary-foreground/70" : "text-muted-foreground/60"}`}>{cfg.desc}</span>
                </button>
              );
            })}
          </motion.div>

          {/* Input Area */}
          <motion.div className="glass-card rounded-2xl p-8 mb-6" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <AnimatePresence mode="wait">
              {mode === "text" && (
                <motion.div key="text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <label className="block text-sm font-medium text-foreground mb-2 font-display">Food Ingredients</label>
                  <textarea
                    value={ingredients}
                    onChange={(e) => setIngredients(e.target.value)}
                    placeholder="Enter food ingredients separated by commas..."
                    className="w-full h-32 p-4 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-body"
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="text-xs text-muted-foreground">Try:</span>
                    {sampleIngredients.map((s, i) => (
                      <button key={i} onClick={() => setIngredients(s)} className="text-xs px-3 py-1 rounded-full bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-all">
                        Sample {i + 1}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
              {(mode === "image" || mode === "label") && (
                <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <label className="block text-sm font-medium text-foreground mb-2 font-display">
                    {mode === "image" ? "Upload Food Photo" : "Upload Food Label/Packaging"}
                  </label>
                  <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleImageUpload} className="hidden" />
                  {!imagePreview ? (
                    <button onClick={() => fileInputRef.current?.click()} className="w-full h-48 rounded-xl border-2 border-dashed border-border hover:border-primary/50 bg-secondary/30 flex flex-col items-center justify-center gap-3 transition-all group">
                      <div className="p-4 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-all">
                        <Upload className="w-8 h-8 text-primary" />
                      </div>
                      <p className="text-sm font-medium text-foreground">Click to upload or take photo</p>
                      <p className="text-xs text-muted-foreground">{mode === "image" ? "Food photo → CNN analysis" : "Ingredient label → OCR extraction"}</p>
                    </button>
                  ) : (
                    <div className="relative">
                      <img src={imagePreview} alt="Upload preview" className="w-full h-48 object-cover rounded-xl border border-border" />
                      <button onClick={() => { setImagePreview(null); setImageBase64(null); }} className="absolute top-2 right-2 p-1.5 rounded-lg bg-foreground/80 text-background hover:bg-foreground transition-all">
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  {mode === "image" && (
                    <div className="mt-3">
                      <label className="block text-xs text-muted-foreground mb-1">Optional: Add context</label>
                      <input value={ingredients} onChange={(e) => setIngredients(e.target.value)} placeholder="e.g., This is a Thai curry..." className="w-full px-4 py-2 rounded-xl bg-secondary/50 border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !canAnalyze}
              className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-primary text-primary-foreground font-display font-semibold text-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing Pipeline ({["Image Analysis", "OCR Extraction", "NLP Detection", "Risk Scoring"][Math.max(0, activeStep)] || "..."})
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Run Full Analysis
                </>
              )}
            </button>
          </motion.div>

          {/* Results */}
          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">

                {/* Top Row: Risk Gauge + Food Prediction + Methods */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Risk Gauge */}
                  {result.riskAssessment && (
                    <RiskGauge score={result.riskAssessment.riskScore} level={result.riskAssessment.riskLevel} />
                  )}

                  {/* Food Prediction */}
                  <div className="glass-card rounded-2xl p-6 flex flex-col justify-center">
                    <h4 className="text-xs font-display font-bold text-muted-foreground uppercase tracking-wide mb-2">Food Prediction</h4>
                    <p className="text-lg font-display font-bold text-foreground">{result.foodPrediction?.name || "—"}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-primary rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${(result.foodPrediction?.confidence || 0) * 100}%` }}
                          transition={{ duration: 0.8 }}
                        />
                      </div>
                      <span className="text-xs font-mono text-muted-foreground">{Math.round((result.foodPrediction?.confidence || 0) * 100)}%</span>
                    </div>
                    {result.detectedFood.length > 1 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {result.detectedFood.slice(1).map((f, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">{f}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Methods & Confidence */}
                  <div className="glass-card rounded-2xl p-6 flex flex-col justify-center">
                    <h4 className="text-xs font-display font-bold text-muted-foreground uppercase tracking-wide mb-2">Analysis Methods</h4>
                    <div className="space-y-1.5">
                      {result.analysisMethodsUsed.map((method) => {
                        const Icon = methodIcons[method] || Cpu;
                        return (
                          <div key={method} className="flex items-center gap-2 text-xs">
                            <Icon className="w-3.5 h-3.5 text-primary" />
                            <span className="text-foreground font-medium">{method}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-3 pt-3 border-t border-border">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Confidence</span>
                        <span className="font-mono font-bold text-foreground">{result.confidenceScore}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Risk Recommendation */}
                {result.riskAssessment && (
                  <div className={`p-5 rounded-2xl border-2 ${
                    result.riskAssessment.riskScore > 85 ? "bg-danger/10 text-danger border-danger/30"
                    : result.riskAssessment.riskScore > 60 ? "bg-warning/10 text-warning border-warning/30"
                    : result.riskAssessment.riskScore > 30 ? "bg-accent/10 text-accent-foreground border-accent/30"
                    : "bg-safe/10 text-safe border-safe/30"
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className="w-5 h-5" />
                      <span className="font-display font-bold text-sm">Risk Assessment</span>
                      <span className="ml-auto font-mono text-sm font-bold">{result.riskAssessment.riskScore}/100</span>
                    </div>
                    <p className="text-sm opacity-90">{result.riskAssessment.recommendation}</p>
                  </div>
                )}

                {/* Grad-CAM Explainability */}
                {imagePreview && result.attentionRegions && result.attentionRegions.length > 0 && (
                  <GradCAMHeatmap
                    imageSrc={imagePreview}
                    regions={result.attentionRegions}
                    foodName={result.foodPrediction?.name}
                  />
                )}

                {/* Extracted Ingredients */}
                {result.extractedIngredients && (
                  <div className="glass-card rounded-2xl p-6">
                    <h3 className="font-display font-bold text-xs mb-3 text-muted-foreground uppercase tracking-wide">
                      <ScanLine className="w-4 h-4 inline mr-1" /> Extracted Ingredients
                    </h3>
                    <p className="text-sm text-foreground bg-secondary/50 p-3 rounded-lg font-mono">{result.extractedIngredients}</p>
                  </div>
                )}

                {/* Profile used + Summary */}
                <div className="glass-card rounded-2xl p-6">
                  {(() => { const ap = getActiveProfile(); return ap ? (
                    <p className="text-xs text-muted-foreground mb-2">Analysis based on profile: <strong className="text-foreground">{ap.name}</strong></p>
                  ) : null; })()}
                  <p className="text-sm text-foreground">{result.summary}</p>
                  {result.personalizedWarning && (
                    <div className="mt-3 p-3 rounded-lg bg-danger/5 border border-danger/20">
                      <p className="text-sm text-danger font-medium flex items-center gap-2">
                        <Shield className="w-4 h-4 shrink-0" />
                        {result.personalizedWarning}
                      </p>
                    </div>
                  )}
                </div>

                {/* Allergen List */}
                {result.allergens.length > 0 && (
                  <div className="glass-card rounded-2xl p-6">
                    <h3 className="font-display font-bold text-lg mb-4 text-foreground">
                      Detected Allergens ({result.allergens.length})
                    </h3>
                    <div className="space-y-3">
                      {result.allergens.map((allergen, i) => {
                        const config = riskConfig[allergen.risk];
                        const Icon = config.icon;
                        const MethodIcon = methodIcons[
                          allergen.detectionMethod === "vision" ? "Computer Vision (CNN)"
                          : allergen.detectionMethod === "ocr" ? "OCR Text Extraction"
                          : allergen.detectionMethod === "nlp" ? "NLP Ingredient Analysis"
                          : "Personalized Risk Engine"
                        ] || Cpu;
                        return (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.08 }}
                            className={`p-4 rounded-xl border ${config.className} ${allergen.isPersonalRisk ? "ring-2 ring-danger/40" : ""}`}
                          >
                            <div className="flex items-start gap-3">
                              <Icon className="w-5 h-5 mt-0.5 shrink-0" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <span className="font-display font-semibold">{allergen.name}</span>
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-current/10 font-medium">{config.label}</span>
                                  {allergen.isPersonalRisk && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-danger text-danger-foreground font-medium flex items-center gap-1">
                                      <Shield className="w-3 h-3" /> Personal Risk
                                    </span>
                                  )}
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground flex items-center gap-1">
                                    <MethodIcon className="w-3 h-3" />
                                    {allergen.detectionMethod}
                                  </span>
                                </div>
                                <p className="text-sm opacity-80 mb-1"><strong>Source:</strong> {allergen.triggeredBy}</p>
                                <p className="text-sm opacity-70">{allergen.explanation}</p>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {result.recommendations.length > 0 && (
                  <div className="glass-card rounded-2xl p-6">
                    <h3 className="font-display font-bold text-lg mb-4 text-foreground">Recommendations</h3>
                    <ul className="space-y-2">
                      {result.recommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default MultiModalDetection;
