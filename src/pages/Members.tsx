import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Search, MapPin, Flame } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

interface MemberProfile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  ritual_streak: number;
  created_at: string;
}

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const Members = () => {
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<MemberProfile | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, bio, location, ritual_streak, created_at")
        .eq("visible_in_directory", true)
        .order("display_name", { ascending: true });

      setMembers((data as MemberProfile[]) ?? []);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = members.filter((m) =>
    m.display_name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-heading text-primary mb-6">Members</h1>
        <p className="text-muted-foreground font-body">Loading members…</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-heading text-primary mb-2">Members</h1>
      <p className="text-muted-foreground font-body mb-6">Browse the community directory.</p>

      <div className="relative mb-8 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 ms-input"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground font-body text-center py-12">No members found.</p>
      ) : (
        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((member) => (
            <button
              key={member.id}
              onClick={() => setSelected(member)}
              className="rounded-2xl border border-border bg-card p-5 text-left shadow-sm hover:shadow-md transition-shadow flex items-start gap-4"
            >
              {member.avatar_url ? (
                <img
                  src={member.avatar_url}
                  alt={member.display_name}
                  className="h-14 w-14 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="h-14 w-14 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                  <span className="text-accent-foreground font-heading font-bold text-lg">
                    {getInitials(member.display_name)}
                  </span>
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

                {member.location && (
                  <p className="flex items-center gap-1 text-sm text-muted-foreground font-body mt-1">
                    <MapPin className="h-3 w-3" /> {member.location}
                  </p>
                )}

                <p className="text-xs text-muted-foreground font-body mt-1">
                  Member since {format(new Date(member.created_at), "MMMM yyyy")}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-primary">{selected?.display_name}</DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {selected.avatar_url ? (
                  <img
                    src={selected.avatar_url}
                    alt={selected.display_name}
                    className="h-20 w-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-accent flex items-center justify-center">
                    <span className="text-accent-foreground font-heading font-bold text-2xl">
                      {getInitials(selected.display_name)}
                    </span>
                  </div>
                )}

                <div>
                  <h2 className="font-heading text-xl text-primary">{selected.display_name}</h2>
                  {selected.location && (
                    <p className="flex items-center gap-1 text-sm text-muted-foreground font-body">
                      <MapPin className="h-3.5 w-3.5" /> {selected.location}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground font-body mt-0.5">
                    Member since {format(new Date(selected.created_at), "MMMM yyyy")}
                  </p>
                  {selected.ritual_streak > 0 && (
                    <span className="inline-flex items-center gap-1 text-sm font-body font-semibold text-accent mt-1">
                      <Flame className="h-4 w-4" /> {selected.ritual_streak}-day streak
                    </span>
                  )}
                </div>
              </div>

              {selected.bio && (
                <p className="text-sm font-body text-foreground leading-relaxed">{selected.bio}</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Members;
