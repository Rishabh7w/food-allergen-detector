import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Plus, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  getAllProfiles, getActiveProfileId, setActiveProfileId,
  saveProfile, deleteProfile, createEmptyProfile, migrateOldProfile,
  type AllergyProfile,
} from "@/lib/profileStore";
import ProfileCard from "./ProfileCard";
import ProfileForm from "./ProfileForm";

const AllergyProfiles = () => {
  const [profiles, setProfiles] = useState<AllergyProfile[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editingProfile, setEditingProfile] = useState<AllergyProfile | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const refresh = () => {
    setProfiles(getAllProfiles());
    setActiveId(getActiveProfileId());
  };

  useEffect(() => {
    migrateOldProfile();
    refresh();
    window.addEventListener("profiles-updated", refresh);
    return () => window.removeEventListener("profiles-updated", refresh);
  }, []);

  const handleSave = (profile: AllergyProfile) => {
    saveProfile(profile);
    setEditingProfile(null);
    setIsCreating(false);
    toast({ title: "Profile Saved", description: `"${profile.name}" — ${profile.allergies.length} allergens configured.` });
  };

  const handleDelete = (p: AllergyProfile) => {
    deleteProfile(p.id);
    toast({ title: "Profile Deleted", description: `"${p.name}" has been removed.` });
  };

  const showForm = isCreating || editingProfile;

  return (
    <section id="profile" className="py-16">
      <div className="container mx-auto px-6">
        <motion.div
          className="max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-display font-bold text-foreground">Allergy Profiles</h3>
                <p className="text-sm text-muted-foreground">Manage multiple profiles for personalized allergen detection</p>
              </div>
            </div>
            {!showForm && (
              <button
                onClick={() => { setIsCreating(true); setEditingProfile(null); }}
                className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all font-medium"
              >
                <Plus className="w-4 h-4" /> New Profile
              </button>
            )}
          </div>

          {/* Form */}
          <AnimatePresence mode="wait">
            {showForm && (
              <div className="mb-6">
                <ProfileForm
                  initial={editingProfile || createEmptyProfile()}
                  onSave={handleSave}
                  onCancel={() => { setEditingProfile(null); setIsCreating(false); }}
                />
              </div>
            )}
          </AnimatePresence>

          {/* Profile cards */}
          {profiles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profiles.map((p) => (
                <ProfileCard
                  key={p.id}
                  profile={p}
                  isActive={p.id === activeId}
                  onSelect={() => { setActiveProfileId(p.id); toast({ title: "Active Profile", description: `Now using "${p.name}" for detection.` }); }}
                  onEdit={() => { setEditingProfile(p); setIsCreating(false); }}
                  onDelete={() => handleDelete(p)}
                />
              ))}
            </div>
          ) : !showForm ? (
            <div className="glass-card rounded-2xl p-10 text-center">
              <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No allergy profiles found. Please create a profile to start personalized allergen detection.
              </p>
              <button
                onClick={() => setIsCreating(true)}
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all"
              >
                <Plus className="w-4 h-4" /> Create Your First Profile
              </button>
            </div>
          ) : null}
        </motion.div>
      </div>
    </section>
  );
};

export default AllergyProfiles;
