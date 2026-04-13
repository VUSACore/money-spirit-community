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
} from "@/lib/profileConstants";

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
  });

  useEffect(() => {
    if (profile && open) {
      setForm({
        display_name: profile.display_name ?? "",
        bio: profile.bio ?? "",
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
      });
    }
  }, [profile, open]);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update(form as any).eq("user_id", profile.user_id);
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

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
      <div className="fixed top-0 right-0 bottom-0 z-50 overflow-y-auto"
        style={{ width: "min(400px, 100vw)", background: "var(--ms-surface-1)", borderLeft: "1px solid var(--ms-border)" }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--ms-border)" }}>
          <h2 className="text-base font-body font-medium" style={{ color: "var(--ms-text-primary)" }}>Edit Profile</h2>
          <button onClick={onClose}><X size={20} style={{ color: "var(--ms-text-muted)" }} /></button>
        </div>

        <div className="px-6 py-6 space-y-6">
          <Field label="Display Name">
            <input className="ms-input-dark" value={form.display_name} onChange={(e) => set("display_name", e.target.value)} />
          </Field>
          <Field label={`Bio (${form.bio.length}/160)`}>
            <textarea className="ms-input-dark min-h-[80px] resize-none" maxLength={160} value={form.bio} onChange={(e) => set("bio", e.target.value)} />
          </Field>
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
          <Field label="Financial goals">
            <TagSelect options={financialGoalOptions} selected={form.financial_goals} onChange={(v) => set("financial_goals", v)} />
          </Field>
          <Field label="Interests">
            <TagSelect options={interestOptions} selected={form.interests} onChange={(v) => set("interests", v)} />
          </Field>

          <div style={{ borderTop: "1px solid var(--ms-border)", paddingTop: 16 }}>
            <p className="text-xs font-body font-medium mb-3" style={{ color: "var(--ms-text-primary)" }}>Social links</p>
            <div className="space-y-3">
              <input className="ms-input-dark" placeholder="LinkedIn URL or username" value={form.linkedin_url} onChange={(e) => set("linkedin_url", e.target.value)} />
              <input className="ms-input-dark" placeholder="@instagram" value={form.instagram_url} onChange={(e) => set("instagram_url", e.target.value)} />
              <input className="ms-input-dark" placeholder="@tiktok" value={form.tiktok_url} onChange={(e) => set("tiktok_url", e.target.value)} />
              <input className="ms-input-dark" placeholder="Snapchat username" value={form.snapchat_username} onChange={(e) => set("snapchat_username", e.target.value)} />
              <input className="ms-input-dark" placeholder="Website URL" value={form.website_url} onChange={(e) => set("website_url", e.target.value)} />
            </div>
          </div>

          <div style={{ borderTop: "1px solid var(--ms-border)", paddingTop: 16 }}>
            <p className="text-xs font-body font-medium mb-3" style={{ color: "var(--ms-text-primary)" }}>Privacy</p>
            <div className="space-y-3">
              <Toggle label="Show relationship status" checked={form.show_marital_status} onChange={(v) => set("show_marital_status", v)} />
              <Toggle label="Show children" checked={form.show_children} onChange={(v) => set("show_children", v)} />
              <Toggle label="Show social links" checked={form.show_social_links} onChange={(v) => set("show_social_links", v)} />
            </div>
          </div>

          <Button className="btn-gold w-full rounded-xl h-11" disabled={saving} onClick={handleSave}>
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </div>
    </>
  );
};

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
