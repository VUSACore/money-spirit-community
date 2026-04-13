import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import { Search, MapPin, Flame, Heart, Users } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import EmptyState from "@/components/EmptyState";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import BadgePreview from "@/components/badges/BadgePreview";
import BadgeGrid from "@/components/badges/BadgeGrid";

const archetypeAccent: Record<string, string> = {
  giver: "#E8845C", keeper: "#5B8DB8", rebel: "#9B59B6", seeker: "#27AE8F", achiever: "#C9941E",
};
const archetypeName: Record<string, string> = {
  giver: "The Giver", keeper: "The Keeper", rebel: "The Rebel", seeker: "The Seeker", achiever: "The Achiever",
};
const lifeStageLabel: Record<string, string> = {
  under_30: "Under 30", "30_to_40": "30 to 40", "40_to_50": "40 to 50", "50_plus": "50 or over",
};

interface MemberProfile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  show_location: boolean;
  show_bio: boolean;
  ritual_streak: number;
  created_at: string;
  pathway_type: string | null;
  life_stage: string | null;
}

const getInitials = (name: string) =>
  name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

const Members = () => {
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [selected, setSelected] = useState<MemberProfile | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, bio, location, show_location, show_bio, ritual_streak, created_at, pathway_type, life_stage")
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
        <h1 className="text-3xl font-heading text-primary mb-2">Our Community</h1>
        <p className="text-muted-foreground font-body mb-8">The women walking this path with you</p>
        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-start gap-4">
                <Skeleton className="h-14 w-14 rounded-full bg-accent/30" />
                <div className="flex-1 space-y-2"><Skeleton className="h-5 w-32 bg-accent/30" /><Skeleton className="h-3 w-24 bg-accent/20" /><Skeleton className="h-3 w-20 bg-accent/20" /></div>
              </div>
              <Skeleton className="h-8 w-full bg-accent/20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fade-in">
      <SEOHead title="Members — Money Spirit" />
      <h1 className="text-3xl font-heading text-primary mb-2">Our Community</h1>
      <p className="text-muted-foreground font-body mb-6">The women walking this path with you</p>

      <div className="flex flex-col sm:flex-row gap-3 mb-8 max-w-xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 ms-input" />
        </div>
        {locations.length > 0 && (
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="w-full sm:w-48 ms-input"><SelectValue placeholder="All locations" /></SelectTrigger>
            <SelectContent>
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
            <button key={member.id} onClick={() => setSelected(member)} className="rounded-2xl border border-border bg-card p-5 text-left shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3 animate-fade-in">
              <div className="flex items-start gap-4">
                {member.avatar_url ? (
                  <img src={member.avatar_url} alt={member.display_name} className="h-14 w-14 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="h-14 w-14 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <span className="text-accent font-heading font-bold text-lg">{getInitials(member.display_name)}</span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading text-lg text-primary truncate">{member.display_name}</h3>
                    {member.ritual_streak > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-xs font-body font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded-full flex-shrink-0">
                        <Flame className="h-3 w-3" /> {member.ritual_streak}
                      </span>
                    )}
                  </div>
                  {member.location && member.show_location && (
                    <p className="flex items-center gap-1 text-sm text-muted-foreground font-body mt-1"><MapPin className="h-3 w-3" /> {member.location}</p>
                  )}
                  <p className="text-xs text-muted-foreground font-body mt-1">Member since {format(new Date(member.created_at), "MMMM yyyy")}</p>
                </div>
              </div>
              {member.bio && member.show_bio && <p className="text-sm font-body text-muted-foreground line-clamp-2">{member.bio}</p>}
              <BadgePreview userId={member.id} />
            </button>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="font-heading text-primary">{selected?.display_name}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {selected.avatar_url ? (
                  <img src={selected.avatar_url} alt={selected.display_name} className="h-20 w-20 rounded-full object-cover" />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-accent font-heading font-bold text-2xl">{getInitials(selected.display_name)}</span>
                  </div>
                )}
                <div>
                  <h2 className="font-heading text-xl text-primary">{selected.display_name}</h2>
                  {selected.location && selected.show_location && (
                    <p className="flex items-center gap-1 text-sm text-muted-foreground font-body"><MapPin className="h-3.5 w-3.5" /> {selected.location}</p>
                  )}
                  <p className="text-xs text-muted-foreground font-body mt-0.5">Member since {format(new Date(selected.created_at), "MMMM yyyy")}</p>
                  {selected.ritual_streak > 0 && (
                    <span className="inline-flex items-center gap-1 text-sm font-body font-semibold text-accent mt-1"><Flame className="h-4 w-4" /> {selected.ritual_streak}-day streak</span>
                  )}
                  {selected.pathway_type && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: archetypeAccent[selected.pathway_type] ?? "#C9941E" }} />
                      <span className="text-sm font-body font-medium" style={{ color: archetypeAccent[selected.pathway_type] ?? "#C9941E" }}>
                        {archetypeName[selected.pathway_type] ?? selected.pathway_type}
                      </span>
                    </div>
                  )}
                  {selected.life_stage && (
                    <p className="text-xs text-muted-foreground font-body mt-0.5">
                      {lifeStageLabel[selected.life_stage] ?? selected.life_stage}
                    </p>
                  )}
                </div>
              </div>
              {selected.bio && selected.show_bio && <p className="text-sm font-body text-foreground leading-relaxed">{selected.bio}</p>}
              <BadgeGrid userId={selected.id} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Members;
