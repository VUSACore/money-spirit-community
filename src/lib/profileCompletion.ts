import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;

export const REQUIRED_PROFILE_FIELDS = [
  { key: "display_name", label: "Display name" },
  { key: "bio", label: "Bio" },
  { key: "location", label: "Location" },
  { key: "pathway_type", label: "Money archetype" },
] as const;

export function getProfileMissingFields(profile: Profile | null): string[] {
  if (!profile) return REQUIRED_PROFILE_FIELDS.map((f) => f.label);
  return REQUIRED_PROFILE_FIELDS.filter((f) => {
    const val = (profile as any)[f.key];
    return val === null || val === undefined || (typeof val === "string" && val.trim() === "");
  }).map((f) => f.label);
}

export function isProfileComplete(profile: Profile | null): boolean {
  return getProfileMissingFields(profile).length === 0;
}
