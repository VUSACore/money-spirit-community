import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import EducationBanner from "@/components/EducationBanner";

type Forum = Tables<"forums">;

const Forums = () => {
  const [forums, setForums] = useState<Forum[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("forums")
        .select("*")
        .order("sort_order", { ascending: true });
      setForums(data ?? []);
      setLoading(false);
    };
    load();
  }, []);

  const hasFinanceForum = forums.some((f) => f.is_finance);

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-heading text-primary mb-2">Forums</h1>
        <p className="text-muted-foreground font-body">Loading…</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6 animate-fade-in">
      {hasFinanceForum && <EducationBanner />}

      <div>
        <h1 className="text-3xl font-heading text-primary mb-2">Forums</h1>
        <p className="text-muted-foreground font-body">Join the conversation.</p>
      </div>

      {forums.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <MessageSquare className="mx-auto h-12 w-12 text-accent/60" />
          <p className="text-lg font-body text-muted-foreground">Start the conversation — create the first thread.</p>
        </div>
      ) : (
        <div className="space-y-3 animate-slide-up">
          {forums.map((forum) => (
            <div key={forum.id} className="rounded-2xl border border-border bg-card p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start gap-3">
                <MessageSquare className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-heading text-lg text-primary">{forum.title}</h3>
                  {forum.description && (
                    <p className="text-sm font-body text-muted-foreground mt-1">{forum.description}</p>
                  )}
                  {forum.is_finance && (
                    <span className="inline-block text-xs font-body text-accent bg-accent/10 px-2 py-0.5 rounded-full mt-2">Finance</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Forums;
