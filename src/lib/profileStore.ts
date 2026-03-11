// Multi-profile storage layer

const PROFILES_KEY = "user-allergy-profiles";
const ACTIVE_KEY = "active-profile-id";

export interface AllergyProfile {
  id: string;
  name: string;
  allergies: string[];
  severity: "mild" | "moderate" | "severe";
  crossContaminationSensitive: boolean;
}

export const getAllProfiles = (): AllergyProfile[] => {
  try {
    return JSON.parse(localStorage.getItem(PROFILES_KEY) || "[]");
  } catch {
    return [];
  }
};

export const getActiveProfileId = (): string | null => {
  return localStorage.getItem(ACTIVE_KEY);
};

export const getActiveProfile = (): AllergyProfile | null => {
  const id = getActiveProfileId();
  if (!id) return null;
  return getAllProfiles().find((p) => p.id === id) || null;
};

export const setActiveProfileId = (id: string | null) => {
  if (id) {
    localStorage.setItem(ACTIVE_KEY, id);
  } else {
    localStorage.removeItem(ACTIVE_KEY);
  }
  window.dispatchEvent(new Event("profiles-updated"));
};

export const saveProfile = (profile: AllergyProfile) => {
  const profiles = getAllProfiles();
  const idx = profiles.findIndex((p) => p.id === profile.id);
  if (idx >= 0) {
    profiles[idx] = profile;
  } else {
    profiles.push(profile);
  }
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  // Auto-activate if first profile
  if (profiles.length === 1) setActiveProfileId(profile.id);
  window.dispatchEvent(new Event("profiles-updated"));
};

export const deleteProfile = (id: string) => {
  const profiles = getAllProfiles().filter((p) => p.id !== id);
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  if (getActiveProfileId() === id) {
    setActiveProfileId(profiles[0]?.id || null);
  }
  window.dispatchEvent(new Event("profiles-updated"));
};

export const createEmptyProfile = (): AllergyProfile => ({
  id: crypto.randomUUID(),
  name: "",
  allergies: [],
  severity: "moderate",
  crossContaminationSensitive: false,
});

// Migration from old single-profile format
export const migrateOldProfile = () => {
  const profiles = getAllProfiles();
  if (profiles.length > 0) return; // already migrated

  try {
    const old = JSON.parse(localStorage.getItem("user-allergy-profile") || "{}");
    if (old.allergies && old.allergies.length > 0) {
      const migrated: AllergyProfile = {
        id: crypto.randomUUID(),
        name: "My Profile",
        allergies: old.allergies,
        severity: old.severity || "moderate",
        crossContaminationSensitive: old.crossContaminationSensitive || false,
      };
      saveProfile(migrated);
      setActiveProfileId(migrated.id);
    }
  } catch {
    // ignore
  }
};
