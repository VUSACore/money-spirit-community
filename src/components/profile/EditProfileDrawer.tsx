import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/components/PlatformLayout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import PillSelect from "./PillSelect";
import TagSelect from "./TagSelect";
import NumberStepper from "./NumberStepper";
import {
  countries, yearsInAustraliaOptions, maritalStatusOptions,
  employmentOptions, financialGoalOptions, interestOptions,
  archetypeName, archetypeAccent,
} from "@/lib/profileConstants";
import { isProfileComplete } from "@/lib/profileCompletion";

interface EditProfileDrawerProps {
  open: boolean;
  onClose: () => void;
}

const EditProfileDrawer = ({ open, onClose }: EditProfileDrawerProps) => {
  const profile = useProfile() as any;
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    display_name: "",
    bio: "",
    location: "",
    country_of_origin: "",
    years_in_australia: "",
    marital_status: "",
    number_of_children: 0,
    employment_type: "",
    financial_goals: [] as string[],
    interests: [] as string[],
    linkedin_url: "",
    instagram_url: "",
    tiktok_url: "",
    snapchat_username: "",
    website_url: "",
    show_social_links: true,
    show_marital_status: true,
    show_children: true,
    visible_in_directory: true,
  });

  useEffect(() => {
    if (profile && open) {
      setForm({
        display_name: profile.display_name ?? "",
        bio: profile.bio ?? "",
        location: profile.location ?? "",
        country_of_origin: profile.country_of_origin ?? "",
        years_in_australia: profile.years_in_australia ?? "",
        marital_status: profile.marital_status ?? "",
        number_of_children: profile.number_of_children ?? 0,
        employment_type: profile.employment_type ?? "",
        financial_goals: profile.financial_goals ?? [],
        interests: profile.interests ?? [],
        linkedin_url: profile.linkedin_url ?? "",
        instagram_url: profile.instagram_url ?? "",
        tiktok_url: profile.tiktok_url ?? "",
        snapchat_username: profile.snapchat_username ?? "",
        website_url: profile.website_url ?? "",
        show_social_links: profile.show_social_links ?? true,
        show_marital_status: profile.show_marital_status ?? true,
        show_children: profile.show_children ?? true,
        visible_in_directory: profile.visible_in_directory ?? true,
      });
    }
  }, [profile, open]);

  const handleSave = async () => {
    if (!profile) return;
    if (!form.display_name.trim()) {
      toast.error("Display name is required");
      return;
    }
    setSaving(true);

    // Compute profile_complete based on the form values being saved
    const updatedProfile = { ...profile, ...form };
    const complete = isProfileComplete(updatedProfile);

    const { error } = await supabase.from("profiles").update({
      ...form,
      profile_complete: complete,
    } as any).eq("user_id", profile.user_id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Profile updated");
      onClose();
      window.location.reload();
    }
    setSaving(false);
  };

  const set = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  if (!open) return null;

  const archetype = profile?.pathway_type;
  const archName = archetype ? archetypeName[archetype] : null;
  const archAccent = archetype ? archetypeAccent[archetype] : null;

  return (
    <>
      <div className="fixed inset-0 bg-black/70 z-50" onClick={onClose} />
      <div className="fixed top-0 right-0 bottom-0 z-50 overflow-y-auto"
        style={{ width: "min(420px, 100vw)", background: "#0B1F3A", borderLeft: "1px solid var(--ms-border)", boxShadow: "-12px 0 40px rgba(0,0,0,0.5)" }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--ms-border)" }}>
          <h2 className="text-base font-body font-medium" style={{ color: "var(--ms-text-primary)" }}>Edit Profile</h2>
          <button onClick={onClose}><X size={20} style={{ color: "var(--ms-text-muted)" }} /></button>
        </div>

        <div className="px-6 py-6 space-y-6">
          {/* Archetype (read-only) */}
          {archName && (
            <div>
              <label className="block text-xs font-body mb-1.5" style={{ color: "var(--ms-text-secondary)" }}>Your Money Archetype</label>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: `${archAccent}15`, border: `1px solid ${archAccent}30` }}>
                <span className="text-sm font-body font-medium" style={{ color: archAccent ?? "var(--ms-text-primary)" }}>{archName}</span>
                <span className="text-[11px] font-body ml-auto" style={{ color: "var(--ms-text-muted)" }}>Set during onboarding</span>
              </div>
            </div>
          )}

          <SectionHeading>Basic Information</SectionHeading>
          <Field label="Display Name *">
            <input className="ms-input-dark" value={form.display_name} onChange={(e) => set("display_name", e.target.value)} />
          </Field>
          <Field label={`Bio (${form.bio.length}/160) *`}>
            <textarea className="ms-input-dark min-h-[80px] resize-none" maxLength={160} value={form.bio} onChange={(e) => set("bio", e.target.value)} placeholder="Tell the community about yourself…" />
          </Field>
          <Field label="Location *">
            <input className="ms-input-dark" value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="e.g. Sydney, Melbourne" />
          </Field>

          <SectionHeading>Background</SectionHeading>
          <Field label="Country of origin">
            <select className="ms-input-dark" value={form.country_of_origin} onChange={(e) => set("country_of_origin", e.target.value)}>
              <option value="">Select</option>
              {countries.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Years in Australia">
            <PillSelect options={[...yearsInAustraliaOptions]} value={form.years_in_australia} onChange={(v) => set("years_in_australia", v)} />
          </Field>
          <Field label="Marital status">
            <PillSelect options={[...maritalStatusOptions]} value={form.marital_status} onChange={(v) => set("marital_status", v)} />
          </Field>
          <Field label="Children">
            <NumberStepper value={form.number_of_children} onChange={(v) => set("number_of_children", v)} />
          </Field>
          <Field label="Employment">
            <PillSelect options={[...employmentOptions]} value={form.employment_type} onChange={(v) => set("employment_type", v)} />
          </Field>

          <SectionHeading>Goals & Interests</SectionHeading>
          <Field label="Financial goals">
            <TagSelect options={financialGoalOptions} selected={form.financial_goals} onChange={(v) => set("financial_goals", v)} />
          </Field>
          <Field label="Interests">
            <TagSelect options={interestOptions} selected={form.interests} onChange={(v) => set("interests", v)} />
          </Field>

          <SectionHeading>Social Links</SectionHeading>
          <div className="space-y-3">
            <input className="ms-input-dark" placeholder="LinkedIn URL or username" value={form.linkedin_url} onChange={(e) => set("linkedin_url", e.target.value)} />
            <input className="ms-input-dark" placeholder="@instagram" value={form.instagram_url} onChange={(e) => set("instagram_url", e.target.value)} />
            <input className="ms-input-dark" placeholder="@tiktok" value={form.tiktok_url} onChange={(e) => set("tiktok_url", e.target.value)} />
            <input className="ms-input-dark" placeholder="Snapchat username" value={form.snapchat_username} onChange={(e) => set("snapchat_username", e.target.value)} />
            <input className="ms-input-dark" placeholder="Website URL" value={form.website_url} onChange={(e) => set("website_url", e.target.value)} />
          </div>

          <SectionHeading>Privacy</SectionHeading>
          <div className="space-y-3">
            <Toggle label="Show in member directory" checked={form.visible_in_directory} onChange={(v) => set("visible_in_directory", v)} />
            <Toggle label="Show relationship status" checked={form.show_marital_status} onChange={(v) => set("show_marital_status", v)} />
            <Toggle label="Show children" checked={form.show_children} onChange={(v) => set("show_children", v)} />
            <Toggle label="Show social links" checked={form.show_social_links} onChange={(v) => set("show_social_links", v)} />
          </div>

          <Button className="btn-gold w-full rounded-xl h-11" disabled={saving} onClick={handleSave}>
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </div>
    </>
  );
};

const SectionHeading = ({ children }: { children: React.ReactNode }) => (
  <div style={{ borderTop: "1px solid var(--ms-border)", paddingTop: 16 }}>
    <p className="text-[11px] font-body font-semibold tracking-wider uppercase" style={{ color: "var(--ms-text-muted)" }}>{children}</p>
  </div>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-xs font-body mb-1.5" style={{ color: "var(--ms-text-secondary)" }}>{label}</label>
    {children}
  </div>
);

const Toggle = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <label className="flex items-center justify-between cursor-pointer">
    <span className="text-sm font-body" style={{ color: "var(--ms-text-secondary)" }}>{label}</span>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="w-10 h-5 rounded-full relative transition-colors"
      style={{ background: checked ? "#C9941E" : "var(--ms-surface-3)" }}
    >
      <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform" style={{ left: checked ? 22 : 2 }} />
    </button>
  </label>
);

export default EditProfileDrawer;
