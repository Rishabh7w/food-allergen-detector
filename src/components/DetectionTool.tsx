import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, AlertTriangle, CheckCircle, XCircle, Info, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { saveToHistory } from "@/components/HistorySection";

interface Allergen {
  name: string;
  risk: "high" | "medium" | "low";
  triggeredBy: string;
  explanation: string;
}

interface AnalysisResult {
  allergens: Allergen[];
  overallSafety: "safe" | "caution" | "danger";
  summary: string;
  recommendations: string[];
}

const riskConfig = {
  high: { icon: XCircle, label: "High Risk", className: "bg-danger/10 text-danger border-danger/30" },
  medium: { icon: AlertTriangle, label: "Medium Risk", className: "bg-warning/10 text-warning border-warning/30" },
  low: { icon: Info, label: "Low Risk", className: "bg-blue-50 text-blue-600 border-blue-200" },
};

const safetyConfig = {
  safe: { icon: CheckCircle, label: "Safe", className: "bg-safe/10 text-safe border-safe/30", text: "No major allergens detected" },
  caution: { icon: AlertTriangle, label: "Caution", className: "bg-warning/10 text-warning border-warning/30", text: "Potential allergens found" },
  danger: { icon: XCircle, label: "Danger", className: "bg-danger/10 text-danger border-danger/30", text: "Major allergens detected" },
};

const DetectionTool = () => {
  const [ingredients, setIngredients] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const { toast } = useToast();

  const sampleIngredients = [
    "Wheat flour, sugar, butter, eggs, milk, vanilla extract, baking powder",
    "Rice, soy sauce, sesame oil, chicken, garlic, ginger, green onions",
    "Lettuce, tomato, cucumber, olive oil, lemon juice, salt, pepper",
    "Peanut butter, bread, strawberry jam, honey",
  ];

  const handleAnalyze = async () => {
    if (!ingredients.trim()) {
      toast({ title: "Please enter ingredients", description: "Type or paste food ingredients to analyze.", variant: "destructive" });
      return;
    }

    setIsAnalyzing(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("detect-allergens", {
        body: { ingredients: ingredients.trim() },
      });

      if (error) throw error;
      setResult(data);
      saveToHistory({ ingredients: ingredients.trim(), result: data });
      window.dispatchEvent(new Event("allergen-history-updated"));
    } catch (err: any) {
      console.error("Analysis error:", err);
      toast({
        title: "Analysis Failed",
        description: err?.message || "Could not analyze ingredients. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <section id="detect" className="py-24">
      <div className="container mx-auto px-6">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl font-display font-bold text-foreground mb-4">
            Allergen Detection Tool
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Enter food ingredients below and our ML model will analyze them for potential allergens.
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto">
          {/* Input Area */}
          <motion.div
            className="glass-card rounded-2xl p-8 mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <label className="block text-sm font-medium text-foreground mb-2 font-display">
              Food Ingredients
            </label>
            <textarea
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              placeholder="Enter food ingredients separated by commas (e.g., wheat flour, eggs, milk, sugar...)"
              className="w-full h-32 p-4 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-body"
            />

            {/* Sample buttons */}
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-xs text-muted-foreground">Try:</span>
              {sampleIngredients.map((sample, i) => (
                <button
                  key={i}
                  onClick={() => setIngredients(sample)}
                  className="text-xs px-3 py-1 rounded-full bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-all"
                >
                  Sample {i + 1}
                </button>
              ))}
            </div>

            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !ingredients.trim()}
              className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-primary text-primary-foreground font-display font-semibold text-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Detect Allergens
                </>
              )}
            </button>
          </motion.div>

          {/* Results */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Overall Safety */}
                {(() => {
                  const config = safetyConfig[result.overallSafety];
                  const Icon = config.icon;
                  return (
                    <div className={`p-6 rounded-2xl border-2 ${config.className}`}>
                      <div className="flex items-center gap-3 mb-3">
                        <Icon className="w-8 h-8" />
                        <div>
                          <h3 className="text-xl font-display font-bold">{config.label}</h3>
                          <p className="text-sm opacity-80">{config.text}</p>
                        </div>
                      </div>
                      <p className="text-sm mt-2">{result.summary}</p>
                    </div>
                  );
                })()}

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
                        return (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={`p-4 rounded-xl border ${config.className}`}
                          >
                            <div className="flex items-start gap-3">
                              <Icon className="w-5 h-5 mt-0.5 shrink-0" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-display font-semibold">{allergen.name}</span>
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-current/10 font-medium">
                                    {config.label}
                                  </span>
                                </div>
                                <p className="text-sm opacity-80 mb-1">
                                  <strong>Triggered by:</strong> {allergen.triggeredBy}
                                </p>
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
                    <h3 className="font-display font-bold text-lg mb-4 text-foreground">
                      Recommendations
                    </h3>
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

export default DetectionTool;
