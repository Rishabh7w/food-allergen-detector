import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Plus, X, Shield, Save, AlertTriangle, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PROFILE_KEY = "user-allergy-profile";

const COMMON_ALLERGENS = [
  "Milk/Dairy", "Eggs", "Peanuts", "Tree Nuts", "Wheat/Gluten",
  "Soy", "Fish", "Shellfish", "Sesame", "Mustard",
  "Celery", "Lupin", "Mollusks", "Sulfites",
];

export interface UserProfile {
  allergies: string[];
  severity: "mild" | "moderate" | "severe";
  crossContaminationSensitive: boolean;
}

export const getUserProfile = (): UserProfile => {
  try {
    const stored = JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}");
    return {
      allergies: stored.allergies || [],
      severity: stored.severity || "moderate",
      crossContaminationSensitive: stored.crossContaminationSensitive || false,
    };
  } catch {
    return { allergies: [], severity: "moderate", crossContaminationSensitive: false };
  }
};

export const getUserAllergens = (): string[] => getUserProfile().allergies;

export const saveUserProfile = (profile: UserProfile) => {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
};

export const saveUserAllergens = (allergens: string[]) => {
  const profile = getUserProfile();
  profile.allergies = allergens;
  saveUserProfile(profile);
};

const severityConfig = {
  mild: { label: "Mild", desc: "Minor reactions, can tolerate traces", color: "bg-primary/10 text-primary border-primary/30" },
  moderate: { label: "Moderate", desc: "Noticeable reactions, avoid direct contact", color: "bg-warning/10 text-warning border-warning/30" },
  severe: { label: "Severe", desc: "Anaphylaxis risk, zero tolerance", color: "bg-danger/10 text-danger border-danger/30" },
};

const UserAllergyProfile = () => {
  const [profile, setProfile] = useState<UserProfile>(getUserProfile());
  const [customAllergen, setCustomAllergen] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setProfile(getUserProfile());
  }, []);

  const toggleAllergen = (allergen: string) => {
    setProfile((prev) => ({
      ...prev,
      allergies: prev.allergies.includes(allergen)
        ? prev.allergies.filter((a) => a !== allergen)
        : [...prev.allergies, allergen],
    }));
  };

  const addCustom = () => {
    const trimmed = customAllergen.trim();
    if (trimmed && !profile.allergies.includes(trimmed)) {
      setProfile((prev) => ({ ...prev, allergies: [...prev.allergies, trimmed] }));
      setCustomAllergen("");
    }
  };

  const handleSave = () => {
    saveUserProfile(profile);
    setIsEditing(false);
    toast({ title: "Profile Saved", description: `${profile.allergies.length} allergens configured (${profile.severity} severity).` });
  };

  return (
    <section id="profile" className="py-16">
      <div className="container mx-auto px-6">
        <motion.div
          className="max-w-3xl mx-auto glass-card rounded-2xl p-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-display font-bold text-foreground">Your Allergy Profile</h3>
                <p className="text-sm text-muted-foreground">Personalize detection with severity & cross-contamination settings</p>
              </div>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-sm px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all font-medium"
            >
              {isEditing ? "Cancel" : "Edit Profile"}
            </button>
          </div>

          {/* Current profile display */}
          {!isEditing && (
            <div className="space-y-4">
              {profile.allergies.length > 0 ? (
                <>
                  <div className="flex flex-wrap gap-2">
                    {profile.allergies.map((a) => (
                      <span key={a} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-danger/10 text-danger text-sm font-medium border border-danger/20">
                        <Shield className="w-3.5 h-3.5" />
                        {a}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${severityConfig[profile.severity].color}`}>
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Severity: {severityConfig[profile.severity].label}
                    </span>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${profile.crossContaminationSensitive ? "bg-warning/10 text-warning border-warning/30" : "bg-secondary text-secondary-foreground border-border"}`}>
                      <Activity className="w-3.5 h-3.5" />
                      Cross-contamination: {profile.crossContaminationSensitive ? "Sensitive" : "Not sensitive"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ✅ Risk engine active — risk scores calibrated to {profile.severity} severity{profile.crossContaminationSensitive ? " + cross-contamination" : ""}.
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No allergies configured. Click "Edit Profile" to add your known allergens for personalized risk scoring.
                </p>
              )}
            </div>
          )}

          {/* Edit mode */}
          <AnimatePresence>
            {isEditing && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-5 overflow-hidden"
              >
                {/* Allergen selection */}
                <div>
                  <p className="text-sm font-medium text-foreground mb-3">Select your allergens:</p>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_ALLERGENS.map((a) => {
                      const isActive = profile.allergies.includes(a);
                      return (
                        <button
                          key={a}
                          onClick={() => toggleAllergen(a)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                            isActive
                              ? "bg-danger/10 text-danger border-danger/30"
                              : "bg-secondary text-secondary-foreground border-border hover:bg-secondary/80"
                          }`}
                        >
                          {isActive && <span className="mr-1">✓</span>}
                          {a}
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
                  <button
                    onClick={addCustom}
                    disabled={!customAllergen.trim()}
                    className="p-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all"
                  >
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

                {/* Severity selector */}
                <div>
                  <p className="text-sm font-medium text-foreground mb-3">Reaction severity:</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.entries(severityConfig) as [UserProfile["severity"], typeof severityConfig.mild][]).map(([key, cfg]) => (
                      <button
                        key={key}
                        onClick={() => setProfile((prev) => ({ ...prev, severity: key }))}
                        className={`p-3 rounded-xl text-left border transition-all ${
                          profile.severity === key
                            ? cfg.color + " ring-2 ring-current/20"
                            : "bg-secondary text-secondary-foreground border-border hover:bg-secondary/80"
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
                  onClick={() => setProfile((prev) => ({ ...prev, crossContaminationSensitive: !prev.crossContaminationSensitive }))}
                  className={`w-full p-4 rounded-xl border text-left transition-all flex items-center gap-3 ${
                    profile.crossContaminationSensitive
                      ? "bg-warning/10 text-warning border-warning/30"
                      : "bg-secondary text-secondary-foreground border-border"
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

                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-display font-semibold hover:bg-primary/90 transition-all"
                >
                  <Save className="w-4 h-4" />
                  Save Profile
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
};

export default UserAllergyProfile;
