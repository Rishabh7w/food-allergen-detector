import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, X, Save, Activity } from "lucide-react";
import type { AllergyProfile } from "@/lib/profileStore";

const COMMON_ALLERGENS = [
  "Milk/Dairy", "Eggs", "Peanuts", "Tree Nuts", "Wheat/Gluten",
  "Soy", "Fish", "Shellfish", "Sesame", "Mustard",
  "Celery", "Lupin", "Mollusks", "Sulfites",
];

const severityConfig = {
  mild: { label: "Mild", desc: "Minor reactions, can tolerate traces", color: "bg-primary/10 text-primary border-primary/30" },
  moderate: { label: "Moderate", desc: "Noticeable reactions, avoid direct contact", color: "bg-warning/10 text-warning border-warning/30" },
  severe: { label: "Severe", desc: "Anaphylaxis risk, zero tolerance", color: "bg-danger/10 text-danger border-danger/30" },
};

interface Props {
  initial: AllergyProfile;
  onSave: (profile: AllergyProfile) => void;
  onCancel: () => void;
}

const ProfileForm = ({ initial, onSave, onCancel }: Props) => {
  const [profile, setProfile] = useState<AllergyProfile>({ ...initial });
  const [customAllergen, setCustomAllergen] = useState("");

  const toggleAllergen = (a: string) => {
    setProfile((p) => ({
      ...p,
      allergies: p.allergies.includes(a) ? p.allergies.filter((x) => x !== a) : [...p.allergies, a],
    }));
  };

  const addCustom = () => {
    const t = customAllergen.trim();
    if (t && !profile.allergies.includes(t)) {
      setProfile((p) => ({ ...p, allergies: [...p.allergies, t] }));
      setCustomAllergen("");
    }
  };

  const handleSubmit = () => {
    if (!profile.name.trim()) return;
    onSave({ ...profile, name: profile.name.trim() });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="glass-card rounded-2xl p-6 space-y-5"
    >
      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Profile Name</label>
        <input
          type="text"
          value={profile.name}
          onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
          placeholder="e.g., My Profile"
          className="w-full px-4 py-2.5 rounded-xl bg-secondary/50 border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {/* Allergen selection */}
      <div>
        <p className="text-sm font-medium text-foreground mb-3">Select allergens:</p>
        <div className="flex flex-wrap gap-2">
          {COMMON_ALLERGENS.map((a) => {
            const active = profile.allergies.includes(a);
            return (
              <button
                key={a}
                onClick={() => toggleAllergen(a)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                  active ? "bg-danger/10 text-danger border-danger/30" : "bg-secondary text-secondary-foreground border-border hover:bg-secondary/80"
                }`}
              >
                {active && <span className="mr-1">✓</span>}{a}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom allergen */}
      <div className="flex gap-2">
        <input
          type="text"
          value={customAllergen}
          onChange={(e) => setCustomAllergen(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addCustom()}
          placeholder="Add custom allergen..."
          className="flex-1 px-4 py-2 rounded-xl bg-secondary/50 border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <button onClick={addCustom} disabled={!customAllergen.trim()} className="p-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all">
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Selected summary */}
      {profile.allergies.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {profile.allergies.map((a) => (
            <span key={a} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-danger/10 text-danger text-xs border border-danger/20">
              {a}
              <button onClick={() => toggleAllergen(a)}><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
      )}

      {/* Severity */}
      <div>
        <p className="text-sm font-medium text-foreground mb-3">Reaction severity:</p>
        <div className="grid grid-cols-3 gap-2">
          {(Object.entries(severityConfig) as [AllergyProfile["severity"], typeof severityConfig.mild][]).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setProfile((p) => ({ ...p, severity: key }))}
              className={`p-3 rounded-xl text-left border transition-all ${
                profile.severity === key ? cfg.color + " ring-2 ring-current/20" : "bg-secondary text-secondary-foreground border-border hover:bg-secondary/80"
              }`}
            >
              <p className="text-sm font-semibold">{cfg.label}</p>
              <p className="text-xs opacity-70 mt-0.5">{cfg.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Cross-contamination toggle */}
      <button
        onClick={() => setProfile((p) => ({ ...p, crossContaminationSensitive: !p.crossContaminationSensitive }))}
        className={`w-full p-4 rounded-xl border text-left transition-all flex items-center gap-3 ${
          profile.crossContaminationSensitive ? "bg-warning/10 text-warning border-warning/30" : "bg-secondary text-secondary-foreground border-border"
        }`}
      >
        <Activity className="w-5 h-5 shrink-0" />
        <div>
          <p className="text-sm font-semibold">Cross-Contamination Sensitive</p>
          <p className="text-xs opacity-70">Enable for "may contain" and shared equipment warnings (+10 risk score)</p>
        </div>
        <div className={`ml-auto w-10 h-6 rounded-full transition-all flex items-center px-0.5 ${
          profile.crossContaminationSensitive ? "bg-warning justify-end" : "bg-border justify-start"
        }`}>
          <div className="w-5 h-5 rounded-full bg-card shadow-sm" />
        </div>
      </button>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={!profile.name.trim()}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-display font-semibold hover:bg-primary/90 transition-all disabled:opacity-50"
        >
          <Save className="w-4 h-4" /> Save Profile
        </button>
        <button onClick={onCancel} className="px-6 py-3 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all font-medium">
          Cancel
        </button>
      </div>
    </motion.div>
  );
};

export default ProfileForm;
