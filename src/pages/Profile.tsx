import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SEOHead from "@/components/SEOHead";
import { useProfile } from "@/components/PlatformLayout";
import { format } from "date-fns";
import { Globe, MapPin, Heart, Users, Briefcase, Pencil, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import BadgeGrid from "@/components/badges/BadgeGrid";
import EditProfileDrawer from "@/components/profile/EditProfileDrawer";
import {
  archetypeAccent, archetypeName, yearsLabel, formatEnumLabel,
} from "@/lib/profileConstants";

const getInitials = (name: string) =>
  name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

const Profile = () => {
  const profile = useProfile();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);

  useEffect(() => {
    if (!profile) return;
    supabase.from("posts").select("id, content, created_at")
      .eq("author_id", profile.user_id).eq("hidden", false)
      .order("created_at", { ascending: false }).limit(3)
      .then(({ data }) => setRecentPosts(data ?? []));
    supabase.from("profile_photos").select("*")
      .eq("user_id", profile.user_id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setPhotos(data ?? []));
  }, [profile]);

  if (!profile) return null;
  const accent = archetypeAccent[profile.pathway_type ?? ""] ?? "#C9941E";
  const archName = archetypeName[profile.pathway_type ?? ""] ?? "";
  const p = profile as any;

  return (
    <div className="animate-fade-in">
      <SEOHead title="My Profile — Money Spirit" />

      {/* Cover */}
      <div className="relative w-full" style={{ height: 'clamp(140px, 20vw, 200px)', background: p.cover_url ? `url(${p.cover_url}) center/cover` : "linear-gradient(135deg, #005eb8 0%, #004a93 100%)" }}>
        <CoverUpload userId={profile.user_id} />
      </div>

      {/* Header */}
      <div className="px-4 sm:px-6 md:px-8 max-w-5xl mx-auto" style={{ marginTop: -60, position: 'relative', zIndex: 2 }}>
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="relative group shrink-0">
            {p.avatar_url ? (
              <img src={p.avatar_url} alt={profile.display_name} className="w-24 h-24 rounded-full object-cover" style={{ border: "3px solid #004a93" }} />
            ) : (
              <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ background: "#C9941E", border: "3px solid #004a93" }}>
                <span className="font-heading text-2xl font-bold" style={{ color: "#0A0D14" }}>{getInitials(profile.display_name)}</span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-heading text-xl sm:text-[28px] font-medium" style={{ color: "#FFFFFF" }}>{profile.display_name}</h1>
              <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)} className="text-xs font-body gap-1" style={{ color: "#D8C896" }}>
                <Pencil size={14} /> Edit
              </Button>
            </div>
            {archName && (
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[13px] font-body" style={{ background: `${accent}26`, color: accent }}>{archName}</span>
            )}
            <p className="text-xs font-body mt-1" style={{ color: "#D8C896" }}>Member since {format(new Date(profile.created_at), "MMMM yyyy")}</p>
            {p.bio && <p className="text-sm font-body mt-2 leading-relaxed max-w-lg" style={{ color: "#F0E8D4" }}>{p.bio}</p>}
          </div>
          <div className="flex gap-6">
            {[
              { label: "Posts", value: p.post_count ?? 0 },
              { label: "Streak", value: profile.ritual_streak },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-heading text-2xl" style={{ color: "#FFFFFF" }}>{s.value}</div>
                <div className="text-[11px] font-body" style={{ color: "#D8C896" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 md:px-8 max-w-5xl mx-auto mt-8 pb-12 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left - About */}
        <div className="ms-card space-y-4">
          <h3 className="text-sm font-body font-medium" style={{ color: "var(--ms-text-primary)" }}>About</h3>
          <DetailRow icon={Globe} label="Originally from" value={p.country_of_origin} />
          <DetailRow icon={MapPin} label="In Australia for" value={yearsLabel(p.years_in_australia)} />
          {p.show_marital_status && <DetailRow icon={Heart} label="Relationship" value={formatEnumLabel(p.marital_status)} />}
          {p.show_children && <DetailRow icon={Users} label="Children" value={p.number_of_children != null ? (p.number_of_children === 0 ? "No children" : `${p.number_of_children} children`) : null} />}
          <DetailRow icon={Briefcase} label="Work" value={formatEnumLabel(p.employment_type)} />

          {p.financial_goals?.length > 0 && (
            <div>
              <p className="text-xs font-body mb-2" style={{ color: "var(--ms-text-muted)" }}>Financial Goals</p>
              <div className="flex flex-wrap gap-1.5">
                {(p.financial_goals as string[]).map((g: string) => (
                  <span key={g} className="text-[11px] font-body px-2.5 py-1 rounded-full" style={{ background: "rgba(201,148,30,0.12)", color: "#F5C842" }}>{g}</span>
                ))}
              </div>
            </div>
          )}
          {p.interests?.length > 0 && (
            <div>
              <p className="text-xs font-body mb-2" style={{ color: "var(--ms-text-muted)" }}>Interests</p>
              <div className="flex flex-wrap gap-1.5">
                {(p.interests as string[]).map((i: string) => (
                  <span key={i} className="text-[11px] font-body px-2.5 py-1 rounded-full" style={{ background: "rgba(201,148,30,0.12)", color: "#F5C842" }}>{i}</span>
                ))}
              </div>
            </div>
          )}

          {p.show_social_links && (
            <SocialLinks linkedin={p.linkedin_url} instagram={p.instagram_url} tiktok={p.tiktok_url} website={p.website_url} />
          )}
        </div>

        {/* Right - Activity */}
        <div className="space-y-6">
          <div className="ms-card">
            <BadgeGrid userId={profile.user_id} />
          </div>

          {recentPosts.length > 0 && (
            <div className="ms-card">
              <h3 className="text-sm font-body font-medium mb-3" style={{ color: "var(--ms-text-primary)" }}>Recent Posts</h3>
              <div className="space-y-3">
                {recentPosts.map((post) => (
                  <div key={post.id} className="pb-3" style={{ borderBottom: "1px solid var(--ms-border)" }}>
                    <p className="text-sm font-body line-clamp-2" style={{ color: "var(--ms-text-secondary)" }}>{post.content}</p>
                    <p className="text-[11px] font-body mt-1" style={{ color: "var(--ms-text-muted)" }}>{format(new Date(post.created_at), "d MMM yyyy")}</p>
                  </div>
                ))}
              </div>
              <button onClick={() => navigate("/community")} className="text-xs font-body mt-2" style={{ color: "#C9941E" }}>View all posts</button>
            </div>
          )}
        </div>
      </div>

      <EditProfileDrawer open={editOpen} onClose={() => setEditOpen(false)} />
    </div>
  );
};

const DetailRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string | null | undefined }) => {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <Icon size={16} className="mt-0.5 shrink-0" style={{ color: "var(--ms-text-muted)" }} />
      <div>
        <p className="text-xs font-body" style={{ color: "var(--ms-text-muted)" }}>{label}</p>
        <p className="text-[13px] font-body" style={{ color: "var(--ms-text-primary)" }}>{value}</p>
      </div>
    </div>
  );
};

const SocialLinks = ({ linkedin, instagram, tiktok, website }: { linkedin?: string; instagram?: string; tiktok?: string; website?: string }) => {
  const links = [
    linkedin && { href: linkedin.startsWith("http") ? linkedin : `https://linkedin.com/in/${linkedin}`, label: "LinkedIn" },
    instagram && { href: `https://instagram.com/${instagram.replace("@", "")}`, label: "Instagram" },
    tiktok && { href: `https://tiktok.com/@${tiktok.replace("@", "")}`, label: "TikTok" },
    website && { href: website.startsWith("http") ? website : `https://${website}`, label: "Website" },
  ].filter(Boolean) as { href: string; label: string }[];
  if (!links.length) return null;
  return (
    <div>
      <p className="text-xs font-body mb-2" style={{ color: "var(--ms-text-muted)" }}>Connect</p>
      <div className="flex gap-2">
        {links.map((l) => (
          <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer"
            className="text-xs font-body px-3 py-1.5 rounded-lg transition-colors"
            style={{ background: "var(--ms-surface-2)", color: "var(--ms-text-muted)" }}
          >{l.label}</a>
        ))}
      </div>
    </div>
  );
};

const CoverUpload = ({ userId }: { userId: string }) => {
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const path = `${userId}/cover.jpg`;
    await supabase.storage.from("covers").upload(path, file, { upsert: true });
    const { data } = supabase.storage.from("covers").getPublicUrl(path);
    await supabase.from("profiles").update({ cover_url: data.publicUrl + "?t=" + Date.now() } as any).eq("user_id", userId);
    window.location.reload();
  };
  return (
    <label className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer text-xs font-body"
      style={{ background: "rgba(0,0,0,0.5)", color: "#fff", backdropFilter: "blur(4px)" }}>
      <Camera size={14} /> Edit Cover
      <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
    </label>
  );
};

export default Profile;
