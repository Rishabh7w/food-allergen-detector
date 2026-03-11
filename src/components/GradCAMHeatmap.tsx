import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Flame, Activity } from "lucide-react";

interface AttentionRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  intensity: number;
  allergenRisk: "high" | "medium" | "low" | "none";
}

interface GradCAMHeatmapProps {
  imageSrc: string;
  regions: AttentionRegion[];
  foodName?: string;
}

const riskColors: Record<string, { r: number; g: number; b: number }> = {
  high: { r: 255, g: 0, b: 0 },
  medium: { r: 255, g: 165, b: 0 },
  low: { r: 255, g: 255, b: 0 },
  none: { r: 0, g: 200, b: 255 },
};

const GradCAMHeatmap = ({ imageSrc, regions, foodName }: GradCAMHeatmapProps) => {
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [hoveredRegion, setHoveredRegion] = useState<AttentionRegion | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const drawHeatmap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !dimensions.width || !regions.length) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw each attention region as a radial gradient
    regions.forEach((region) => {
      const cx = region.x * canvas.width;
      const cy = region.y * canvas.height;
      const rw = (region.width * canvas.width) / 2;
      const rh = (region.height * canvas.height) / 2;
      const radius = Math.max(rw, rh) * 1.5;

      const color = riskColors[region.allergenRisk] || riskColors.none;
      const alpha = region.intensity * 0.6;

      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`);
      gradient.addColorStop(0.5, `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha * 0.5})`);
      gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    });
  }, [regions, dimensions]);

  useEffect(() => {
    if (showHeatmap) drawHeatmap();
  }, [showHeatmap, drawHeatmap]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setDimensions({ width: img.clientWidth, height: img.clientHeight });
  };

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const img = entry.target.querySelector("img");
        if (img) setDimensions({ width: img.clientWidth, height: img.clientHeight });
      }
    });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  if (!regions || regions.length === 0) return null;

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-primary" />
          <h3 className="font-display font-bold text-foreground text-lg">
            Explainable AI — Grad-CAM
          </h3>
        </div>
        <button
          onClick={() => setShowHeatmap(!showHeatmap)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
            showHeatmap
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card text-muted-foreground border-border hover:border-primary/30"
          }`}
        >
          {showHeatmap ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {showHeatmap ? "Hide Heatmap" : "Show Explainability"}
        </button>
      </div>

      <div ref={containerRef} className="relative rounded-xl overflow-hidden border border-border">
        <img
          src={imageSrc}
          alt={foodName || "Analyzed food"}
          className="w-full h-auto object-cover"
          onLoad={handleImageLoad}
        />

        <AnimatePresence>
          {showHeatmap && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0"
            >
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full mix-blend-screen"
                style={{ pointerEvents: "none" }}
              />
              {/* Region labels */}
              {regions.map((region, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="absolute cursor-pointer"
                  style={{
                    left: `${region.x * 100}%`,
                    top: `${region.y * 100}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                  onMouseEnter={() => setHoveredRegion(region)}
                  onMouseLeave={() => setHoveredRegion(null)}
                >
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center animate-pulse ${
                      region.allergenRisk === "high"
                        ? "border-danger bg-danger/30"
                        : region.allergenRisk === "medium"
                        ? "border-warning bg-warning/30"
                        : region.allergenRisk === "low"
                        ? "border-primary bg-primary/30"
                        : "border-muted-foreground bg-muted/30"
                    }`}
                  >
                    <Activity className="w-3 h-3 text-foreground" />
                  </div>
                </motion.div>
              ))}

              {/* Tooltip */}
              {hoveredRegion && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute z-20 px-3 py-2 rounded-lg bg-foreground text-background text-xs shadow-xl max-w-48"
                  style={{
                    left: `${Math.min(hoveredRegion.x * 100, 75)}%`,
                    top: `${Math.max(hoveredRegion.y * 100 - 15, 5)}%`,
                  }}
                >
                  <p className="font-bold">{hoveredRegion.label}</p>
                  <p className="opacity-70">
                    Attention: {Math.round(hoveredRegion.intensity * 100)}% | Risk: {hoveredRegion.allergenRisk}
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Gradient legend */}
        {showHeatmap && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute bottom-3 right-3 bg-foreground/80 backdrop-blur-sm rounded-lg px-3 py-2"
          >
            <p className="text-[10px] text-background font-bold mb-1">Attention Intensity</p>
            <div className="flex items-center gap-1">
              <div className="w-16 h-2 rounded-full bg-gradient-to-r from-blue-400 via-yellow-400 via-orange-400 to-red-500" />
              <div className="flex justify-between w-16">
                <span className="text-[8px] text-background/70">Low</span>
                <span className="text-[8px] text-background/70">High</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Regions table */}
      {showHeatmap && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-4 space-y-2"
        >
          <h4 className="text-xs font-display font-bold text-muted-foreground uppercase tracking-wide">
            Attention Regions ({regions.length})
          </h4>
          <div className="grid gap-2">
            {regions.map((region, i) => (
              <div
                key={i}
                className={`flex items-center justify-between px-3 py-2 rounded-lg border text-sm ${
                  region.allergenRisk === "high"
                    ? "bg-danger/5 border-danger/20"
                    : region.allergenRisk === "medium"
                    ? "bg-warning/5 border-warning/20"
                    : "bg-secondary/50 border-border"
                }`}
              >
                <span className="font-medium text-foreground">{region.label}</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <div className="w-12 h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${region.intensity * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">
                      {Math.round(region.intensity * 100)}%
                    </span>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      region.allergenRisk === "high"
                        ? "bg-danger/10 text-danger"
                        : region.allergenRisk === "medium"
                        ? "bg-warning/10 text-warning"
                        : region.allergenRisk === "low"
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {region.allergenRisk}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default GradCAMHeatmap;
