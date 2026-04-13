import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare } from "lucide-react";
import SEOHead from "@/components/SEOHead";
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
        <h1 className="text-3xl font-heading text-primary font-normal mb-1">Forums</h1>
        <p className="text-primary/70 font-body text-base">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6 animate-fade-in">
      <SEOHead title="Community Forums — Money Spirit" description="Join the conversation. Discuss money, mindset, spirituality and wellbeing with the Money Spirit community." />
      {hasFinanceForum && <EducationBanner />}

      <div>
        <h1 className="text-3xl font-heading text-primary font-normal mb-1">Forums</h1>
        <p className="text-primary/70 font-body text-base mb-6">Join the conversation.</p>
      </div>

      {forums.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <MessageSquare className="mx-auto h-12 w-12 text-accent/60" />
          <p className="text-lg font-body text-muted-foreground">Start the conversation. Create the first thread.</p>
        </div>
      ) : (
        <div className="space-y-3 animate-slide-up">
          {forums.map((forum) => (
            <div
              key={forum.id}
              className="rounded-xl border border-stone-200 bg-white shadow-sm p-4 cursor-pointer hover:border-amber-400 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start gap-3">
                <MessageSquare className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-heading text-base text-primary font-semibold leading-snug">{forum.title}</h3>
                  {forum.description && (
                    <p className="text-sm font-body text-primary/60 mt-0.5 leading-relaxed">{forum.description}</p>
                  )}
                  {forum.is_finance && (
                    <span className="inline-flex mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">
                      Finance
                    </span>
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
