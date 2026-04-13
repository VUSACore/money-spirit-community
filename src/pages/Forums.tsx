import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import type { Tables } from "@/integrations/supabase/types";
import EducationBanner from "@/components/EducationBanner";
import EmptyState from "@/components/EmptyState";

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
        <h1 className="text-3xl font-heading font-normal mb-1" style={{ color: "var(--ms-text-primary)" }}>Forums</h1>
        <p className="font-body text-base" style={{ color: "var(--ms-text-secondary)" }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6 animate-fade-in">
      <SEOHead title="Community Forums — Money Spirit" description="Join the conversation. Discuss money, mindset, spirituality and wellbeing with the Money Spirit community." />
      {hasFinanceForum && <EducationBanner />}

      <div>
        <h1 className="text-3xl font-heading font-normal mb-1" style={{ color: "var(--ms-text-primary)" }}>Forums</h1>
        <p className="font-body text-base mb-6" style={{ color: "var(--ms-text-secondary)" }}>Join the conversation.</p>
      </div>

      {forums.length === 0 ? (
        <EmptyState icon={MessageSquare} heading="No discussions yet" body="Be the first to start a conversation in this forum." />
      ) : (
        <div className="space-y-3 animate-slide-up">
          {forums.map((forum) => (
            <div
              key={forum.id}
              className="ms-card-interactive"
            >
              <div className="flex items-start gap-3">
                <MessageSquare className="h-5 w-5 mt-0.5 shrink-0" style={{ color: "#C9941E" }} />
                <div>
                  <h3 className="font-heading text-base font-semibold leading-snug" style={{ color: "var(--ms-text-primary)" }}>{forum.title}</h3>
                  {forum.description && (
                    <p className="text-[13px] font-body mt-0.5 leading-relaxed" style={{ color: "var(--ms-text-secondary)" }}>{forum.description}</p>
                  )}
                  {forum.is_finance && (
                    <span
                      className="inline-flex mt-2 px-2.5 py-0.5 rounded-full text-[11px] font-medium"
                      style={{ background: "rgba(201,148,30,0.10)", color: "#F5C842" }}
                    >
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
