import { useState, useEffect } from "react";
import { User, ChevronDown } from "lucide-react";
import { getAllProfiles, getActiveProfile, setActiveProfileId, type AllergyProfile } from "@/lib/profileStore";

const ActiveProfileSelector = () => {
  const [profiles, setProfiles] = useState<AllergyProfile[]>([]);
  const [active, setActive] = useState<AllergyProfile | null>(null);
  const [open, setOpen] = useState(false);

  const refresh = () => {
    setProfiles(getAllProfiles());
    setActive(getActiveProfile());
  };

  useEffect(() => {
    refresh();
    window.addEventListener("profiles-updated", refresh);
    return () => window.removeEventListener("profiles-updated", refresh);
  }, []);

  if (profiles.length === 0) return null;

  return (
    <div className="relative mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card text-foreground hover:border-primary/40 transition-all"
      >
        <User className="w-4 h-4 text-primary shrink-0" />
        <span className="flex-1 text-left text-sm font-medium">
          {active ? `Active Profile: ${active.name}` : "Select a profile"}
        </span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-10 mt-1 w-full rounded-xl border border-border bg-card shadow-lg overflow-hidden">
          {profiles.map((p) => (
            <button
              key={p.id}
              onClick={() => { setActiveProfileId(p.id); setOpen(false); }}
              className={`w-full text-left px-4 py-3 text-sm hover:bg-secondary/50 transition-all flex items-center justify-between ${
                p.id === active?.id ? "bg-primary/5 text-primary font-medium" : "text-foreground"
              }`}
            >
              <span>{p.name}</span>
              <span className="text-xs text-muted-foreground">{p.allergies.length} allergen{p.allergies.length !== 1 ? "s" : ""} · {p.severity}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActiveProfileSelector;
