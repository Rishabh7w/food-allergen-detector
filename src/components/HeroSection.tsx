import { motion } from "framer-motion";
import { Shield, Search, AlertTriangle, ChevronDown } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = ({ onGetStarted }: { onGetStarted: () => void }) => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img src={heroBg} alt="Food allergens" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/90 via-foreground/70 to-foreground/40" />
      </div>

      <div className="relative z-10 container mx-auto px-6 py-20">
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary-foreground text-sm font-medium mb-6 border border-primary/30">
              <Shield className="w-4 h-4" />
              ML-Powered Food Safety
            </span>
          </motion.div>

          <motion.h1
            className="text-5xl md:text-7xl font-display font-bold text-primary-foreground mb-6 leading-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
          >
            Food Allergen
            <br />
            <span className="text-accent">Detection</span>
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-primary-foreground/80 mb-8 leading-relaxed max-w-xl"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            Instantly analyze food ingredients for potential allergens using advanced
            machine learning algorithms. Protect yourself and your loved ones.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45 }}
          >
            <button
              onClick={onGetStarted}
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-lg bg-primary text-primary-foreground font-display font-semibold text-lg hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl animate-pulse-glow"
            >
              <Search className="w-5 h-5" />
              Analyze Ingredients
            </button>
            <a
              href="#about"
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-lg border border-primary-foreground/30 text-primary-foreground font-display font-medium hover:bg-primary-foreground/10 transition-all"
            >
              Learn More
            </a>
          </motion.div>

          {/* Stats */}
          <motion.div
            className="mt-16 grid grid-cols-3 gap-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            {[
              { 
                title: "Multi-Modal Detection", 
                description: "Analyzes food images, ingredient text, and label OCR" 
              },
              { 
                title: "AI-Powered Analysis", 
                description: "Uses vision and language models to detect allergens" 
              },
              { 
                title: "Real-Time Risk Assessment", 
                description: "Generates personalized safety recommendations instantly" 
              },
            ].map((stat) => (
              <div key={stat.title} className="text-center sm:text-left">
                <div className="text-lg md:text-xl font-display font-bold text-accent mb-2">
                  {stat.title}
                </div>
                <div className="text-sm text-primary-foreground/70">{stat.description}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <ChevronDown className="w-6 h-6 text-primary-foreground/50" />
      </motion.div>
    </section>
  );
};

export default HeroSection;
