import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SEOHead from "@/components/SEOHead";
import { format } from "date-fns";
import { Globe, MapPin, Heart, Users, Briefcase } from "lucide-react";
import BadgeGrid from "@/components/badges/BadgeGrid";
import { archetypeAccent, archetypeName, yearsLabel, formatEnumLabel } from "@/lib/profileConstants";

const getInitials = (name: string) =>
  name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

const MemberProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [recentPosts, setRecentPosts] = useState<any[]>([]);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      // userId param is the profile.user_id
      const { data } = await supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle();
      setProfile(data);
      if (data) {
        const { data: posts } = await supabase.from("posts").select("id, content, created_at")
          .eq("author_id", userId).eq("hidden", false)
          .order("created_at", { ascending: false }).limit(3);
        setRecentPosts(posts ?? []);
      }
      setLoading(false);
    };
    load();
  }, [userId]);

  if (loading) {
    return <div className="p-8 flex items-center justify-center min-h-[50vh]"><p className="text-sm font-body" style={{ color: "var(--ms-text-muted)" }}>Loading…</p></div>;
  }

  if (!profile) {
    return <div className="p-8 text-center"><p className="font-body" style={{ color: "var(--ms-text-secondary)" }}>Member not found.</p></div>;
  }

  const accent = archetypeAccent[profile.pathway_type ?? ""] ?? "#C9941E";
  const archName = archetypeName[profile.pathway_type ?? ""] ?? "";

  return (
    <div className="animate-fade-in">
      <SEOHead title={`${profile.display_name} — Money Spirit`} />

      {/* Cover */}
      <div className="w-full" style={{ height: 200, background: profile.cover_url ? `url(${profile.cover_url}) center/cover` : "linear-gradient(135deg, #005eb8 0%, var(--ms-surface-2) 100%)" }} />

      {/* Header */}
      <div className="px-8 max-w-5xl mx-auto" style={{ marginTop: -60 }}>
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="shrink-0">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.display_name} className="w-24 h-24 rounded-full object-cover" style={{ border: "3px solid var(--ms-base)" }} />
            ) : (
              <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ background: "#C9941E", border: "3px solid var(--ms-base)" }}>
                <span className="font-heading text-2xl font-bold" style={{ color: "#0A0D14" }}>{getInitials(profile.display_name)}</span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-heading text-[28px] font-medium" style={{ color: "var(--ms-text-primary)" }}>{profile.display_name}</h1>
            {archName && (
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[13px] font-body" style={{ background: `${accent}26`, color: accent }}>{archName}</span>
            )}
            <p className="text-xs font-body mt-1" style={{ color: "var(--ms-text-muted)" }}>Member since {format(new Date(profile.created_at), "MMMM yyyy")}</p>
            {profile.bio && profile.show_bio && <p className="text-sm font-body mt-2 leading-relaxed max-w-lg" style={{ color: "var(--ms-text-secondary)" }}>{profile.bio}</p>}
          </div>
          <div className="flex gap-6">
            {[
              { label: "Posts", value: profile.post_count ?? 0 },
              { label: "Streak", value: profile.ritual_streak },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-heading text-2xl" style={{ color: "var(--ms-text-primary)" }}>{s.value}</div>
                <div className="text-[11px] font-body" style={{ color: "var(--ms-text-muted)" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 max-w-5xl mx-auto mt-8 pb-12 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="ms-card space-y-4">
          <h3 className="text-sm font-body font-medium" style={{ color: "var(--ms-text-primary)" }}>About</h3>
          <DetailRow icon={Globe} label="Originally from" value={profile.country_of_origin} />
          <DetailRow icon={MapPin} label="In Australia for" value={yearsLabel(profile.years_in_australia)} />
          {profile.show_marital_status && <DetailRow icon={Heart} label="Relationship" value={formatEnumLabel(profile.marital_status)} />}
          {profile.show_children && <DetailRow icon={Users} label="Children" value={profile.number_of_children != null ? (profile.number_of_children === 0 ? "No children" : `${profile.number_of_children} children`) : null} />}
          <DetailRow icon={Briefcase} label="Work" value={formatEnumLabel(profile.employment_type)} />

          {profile.financial_goals?.length > 0 && (
            <div>
              <p className="text-xs font-body mb-2" style={{ color: "var(--ms-text-muted)" }}>Financial Goals</p>
              <div className="flex flex-wrap gap-1.5">
                {(profile.financial_goals as string[]).map((g: string) => (
                  <span key={g} className="text-[11px] font-body px-2.5 py-1 rounded-full" style={{ background: "rgba(248,220,138,0.36)", color: "#F5C842" }}>{g}</span>
                ))}
              </div>
            </div>
          )}
          {profile.interests?.length > 0 && (
            <div>
              <p className="text-xs font-body mb-2" style={{ color: "var(--ms-text-muted)" }}>Interests</p>
              <div className="flex flex-wrap gap-1.5">
                {(profile.interests as string[]).map((i: string) => (
                  <span key={i} className="text-[11px] font-body px-2.5 py-1 rounded-full" style={{ background: "rgba(248,220,138,0.36)", color: "#F5C842" }}>{i}</span>
                ))}
              </div>
            </div>
          )}

          {profile.show_social_links && <SocialLinks linkedin={profile.linkedin_url} instagram={profile.instagram_url} tiktok={profile.tiktok_url} website={profile.website_url} />}
        </div>

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
            </div>
          )}
        </div>
      </div>
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

export default MemberProfile;
