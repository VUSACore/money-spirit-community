import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import { Search, MapPin, Flame, Users, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import EmptyState from "@/components/EmptyState";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import BadgePreview from "@/components/badges/BadgePreview";
import { archetypeAccent, archetypeName, yearsLabel } from "@/lib/profileConstants";

interface MemberProfile {
  id: string; display_name: string; avatar_url: string | null; bio: string | null;
  location: string | null; show_location: boolean; show_bio: boolean; ritual_streak: number;
  created_at: string; pathway_type: string | null; life_stage: string | null;
  country_of_origin: string | null; years_in_australia: string | null;
  financial_goals: string[] | null; user_id: string;
}

const getInitials = (name: string) =>
  name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

const Members = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, user_id, display_name, avatar_url, bio, location, show_location, show_bio, ritual_streak, created_at, pathway_type, life_stage, country_of_origin, years_in_australia, financial_goals")
        .eq("visible_in_directory", true)
        .order("display_name", { ascending: true });
      setMembers((data as MemberProfile[]) ?? []);
      setLoading(false);
    };
    load();
  }, []);

  const locations = useMemo(() => {
    const locs = members.filter((m) => m.location && m.show_location).map((m) => m.location as string);
    return [...new Set(locs)].sort();
  }, [members]);

  const filtered = useMemo(() => {
    return members.filter((m) => {
      const matchesSearch = m.display_name.toLowerCase().includes(search.toLowerCase());
      const matchesLocation = locationFilter === "all" || (m.location && m.show_location && m.location === locationFilter);
      return matchesSearch && matchesLocation;
    });
  }, [members, search, locationFilter]);

  if (loading) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <h1 className="text-3xl font-heading mb-2" style={{ color: "var(--ms-text-primary)" }}>Our Community</h1>
        <p className="font-body mb-8" style={{ color: "var(--ms-text-secondary)" }}>The women walking this path with you</p>
        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="ms-card space-y-3">
              <Skeleton className="h-14 w-14 rounded-full" style={{ background: "var(--ms-surface-3)" }} />
              <Skeleton className="h-5 w-32" style={{ background: "var(--ms-surface-3)" }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fade-in">
      <SEOHead title="Members — Money Spirit" />
      <h1 className="text-3xl font-heading mb-2" style={{ color: "var(--ms-text-primary)" }}>Our Community</h1>
      <p className="font-body mb-6" style={{ color: "var(--ms-text-secondary)" }}>The women walking this path with you</p>

      <div className="flex flex-col sm:flex-row gap-3 mb-8 max-w-xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--ms-text-muted)" }} />
          <input
            placeholder="Search by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ms-input-dark pl-10"
          />
        </div>
        {locations.length > 0 && (
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="w-full sm:w-48 ms-input-dark"><SelectValue placeholder="All locations" /></SelectTrigger>
            <SelectContent style={{ background: "var(--ms-surface-2)", border: "1px solid var(--ms-border-active)" }}>
              <SelectItem value="all">All locations</SelectItem>
              {locations.map((loc) => (<SelectItem key={loc} value={loc}>{loc}</SelectItem>))}
            </SelectContent>
          </Select>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} heading="Your community is growing" body="Members who have chosen to appear in the directory will show here." />
      ) : (
        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((member) => (
            <button
              key={member.id}
              onClick={() => navigate(`/members/${member.user_id}`)}
              className="ms-card-interactive text-left flex flex-col gap-3 animate-fade-in"
            >
              <div className="flex items-start gap-4">
                {member.avatar_url ? (
                  <img src={member.avatar_url} alt={member.display_name} className="h-14 w-14 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="h-14 w-14 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#C9941E" }}>
                    <span className="font-heading font-bold text-lg" style={{ color: "#0A0D14" }}>{getInitials(member.display_name)}</span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-body text-sm font-medium truncate" style={{ color: "var(--ms-text-primary)" }}>{member.display_name}</h3>
                    {member.ritual_streak > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-xs font-body font-semibold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: "rgba(201,148,30,0.15)", color: "#F5C842" }}>
                        <Flame className="h-3 w-3" /> {member.ritual_streak}
                      </span>
                    )}
                  </div>
                  {member.pathway_type && (
                    <span
                      className="inline-flex items-center text-[11px] font-body mt-1 px-2 py-0.5 rounded-full"
                      style={{
                        background: `${archetypeAccent[member.pathway_type] ?? "#C9941E"}26`,
                        color: archetypeAccent[member.pathway_type] ?? "#C9941E",
                      }}
                    >
                      {archetypeName[member.pathway_type] ?? member.pathway_type}
                    </span>
                  )}
                  {member.country_of_origin && (
                    <p className="flex items-center gap-1 text-xs font-body mt-1" style={{ color: "var(--ms-text-muted)" }}>
                      <Globe className="h-3 w-3" /> {member.country_of_origin}
                    </p>
                  )}
                  {member.years_in_australia && (
                    <p className="flex items-center gap-1 text-xs font-body mt-1" style={{ color: "var(--ms-text-muted)" }}>
                      <MapPin className="h-3 w-3" /> {yearsLabel(member.years_in_australia)}
                    </p>
                  )}
                </div>
              </div>
              {member.financial_goals && member.financial_goals.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {member.financial_goals.slice(0, 2).map((goal) => (
                    <span key={goal} className="text-[10px] font-body px-2 py-0.5 rounded-full" style={{ background: "rgba(201,148,30,0.12)", color: "#C9941E" }}>
                      {goal}
                    </span>
                  ))}
                  {member.financial_goals.length > 2 && (
                    <span className="text-[10px] font-body px-2 py-0.5 rounded-full" style={{ color: "var(--ms-text-muted)" }}>
                      +{member.financial_goals.length - 2}
                    </span>
                  )}
                </div>
              )}
              <BadgePreview userId={member.id} />
              <span className="text-xs font-body font-medium mt-auto" style={{ color: "#C9941E" }}>View Profile →</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Members;
