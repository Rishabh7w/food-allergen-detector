import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Trash2, ChevronDown, ChevronUp, XCircle, AlertTriangle, CheckCircle, Info } from "lucide-react";

export interface HistoryEntry {
  id: string;
  ingredients: string;
  result: {
    allergens: { name: string; risk: "high" | "medium" | "low"; triggeredBy: string; explanation: string }[];
    overallSafety: "safe" | "caution" | "danger";
    summary: string;
    recommendations: string[];
  };
  timestamp: number;
}

const STORAGE_KEY = "allergen-history";

export const getHistory = (): HistoryEntry[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch { return []; }
};

export const saveToHistory = (entry: Omit<HistoryEntry, "id" | "timestamp">) => {
  const history = getHistory();
  history.unshift({ ...entry, id: crypto.randomUUID(), timestamp: Date.now() });
  if (history.length > 20) history.pop();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
};

const safetyBadge = {
  safe: { icon: CheckCircle, label: "Safe", cls: "bg-safe/10 text-safe" },
  caution: { icon: AlertTriangle, label: "Caution", cls: "bg-warning/10 text-warning" },
  danger: { icon: XCircle, label: "Danger", cls: "bg-danger/10 text-danger" },
};

const riskDot = { high: "bg-danger", medium: "bg-warning", low: "bg-blue-400" };

const HistorySection = () => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => setHistory(getHistory());
    refresh();
    window.addEventListener("allergen-history-updated", refresh);
    return () => window.removeEventListener("allergen-history-updated", refresh);
  }, []);

  const deleteEntry = (id: string) => {
    const updated = history.filter((h) => h.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setHistory(updated);
  };

  const clearAll = () => {
    localStorage.removeItem(STORAGE_KEY);
    setHistory([]);
  };

  if (history.length === 0) return null;

  return (
    <section className="py-24 bg-secondary/30">
      <div className="container mx-auto px-6">
        <motion.div
          className="flex items-center justify-between mb-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div>
            <h2 className="text-4xl font-display font-bold text-foreground flex items-center gap-3">
              <Clock className="w-8 h-8 text-primary" />
              Scan History
            </h2>
            <p className="text-muted-foreground mt-1">Your previous allergen analyses</p>
          </div>
          <button
            onClick={clearAll}
            className="text-sm px-4 py-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all font-medium"
          >
            Clear All
          </button>
        </motion.div>

        <div className="max-w-3xl mx-auto space-y-4">
          <AnimatePresence>
            {history.map((entry, i) => {
              const badge = safetyBadge[entry.result.overallSafety];
              const BadgeIcon = badge.icon;
              const isExpanded = expandedId === entry.id;

              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card rounded-xl overflow-hidden"
                >
                  {/* Header */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                    className="w-full flex items-center gap-4 p-5 text-left hover:bg-secondary/30 transition-all"
                  >
                    <div className={`shrink-0 p-2 rounded-lg ${badge.cls}`}>
                      <BadgeIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {entry.ingredients}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {new Date(entry.timestamp).toLocaleDateString()} · {new Date(entry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        {entry.result.allergens.length > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {entry.result.allergens.length} allergen{entry.result.allergens.length > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteEntry(entry.id); }}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </button>

                  {/* Expanded details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 border-t border-border pt-4 space-y-3">
                          <p className="text-sm text-muted-foreground">{entry.result.summary}</p>
                          {entry.result.allergens.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {entry.result.allergens.map((a, j) => (
                                <span key={j} className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground">
                                  <span className={`w-2 h-2 rounded-full ${riskDot[a.risk]}`} />
                                  {a.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default HistorySection;
