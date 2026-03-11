import { motion } from "framer-motion";
import { Shield, AlertTriangle, Activity, CheckCircle, Edit2, Trash2 } from "lucide-react";
import type { AllergyProfile } from "@/lib/profileStore";

const severityBadge = {
  mild: { label: "Mild", className: "bg-primary/10 text-primary border-primary/30" },
  moderate: { label: "Moderate", className: "bg-warning/10 text-warning border-warning/30" },
  severe: { label: "Severe", className: "bg-danger/10 text-danger border-danger/30" },
};

interface Props {
  profile: AllergyProfile;
  isActive: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const ProfileCard = ({ profile, isActive, onSelect, onEdit, onDelete }: Props) => {
  const sev = severityBadge[profile.severity];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative glass-card rounded-2xl p-5 transition-all cursor-pointer border-2 ${
        isActive ? "border-primary ring-2 ring-primary/20" : "border-transparent hover:border-primary/20"
      }`}
      onClick={onSelect}
    >
      {isActive && (
        <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full">
          <CheckCircle className="w-3.5 h-3.5" /> Active
        </span>
      )}

      <h4 className="font-display font-bold text-foreground text-lg pr-20">{profile.name || "Unnamed Profile"}</h4>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {profile.allergies.length > 0 ? (
          profile.allergies.slice(0, 5).map((a) => (
            <span key={a} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-danger/10 text-danger text-xs border border-danger/20">
              <Shield className="w-3 h-3" /> {a}
            </span>
          ))
        ) : (
          <span className="text-xs text-muted-foreground italic">No allergens configured</span>
        )}
        {profile.allergies.length > 5 && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground">+{profile.allergies.length - 5} more</span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border ${sev.className}`}>
          <AlertTriangle className="w-3 h-3" /> {sev.label}
        </span>
        {profile.crossContaminationSensitive && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border bg-warning/10 text-warning border-warning/30">
            <Activity className="w-3 h-3" /> Cross-contam.
          </span>
        )}
      </div>

      <div className="mt-4 flex gap-2" onClick={(e) => e.stopPropagation()}>
        <button onClick={onEdit} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all">
          <Edit2 className="w-3.5 h-3.5" /> Edit
        </button>
        <button onClick={onDelete} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all">
          <Trash2 className="w-3.5 h-3.5" /> Delete
        </button>
      </div>
    </motion.div>
  );
};

export default ProfileCard;
