import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, ChevronRight } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import type { Tables } from "@/integrations/supabase/types";
import EducationBanner from "@/components/EducationBanner";
import EmptyState from "@/components/EmptyState";

type Forum = Tables<"forums">;

const Forums = () => {
  const navigate = useNavigate();
  const [forums, setForums] = useState<Forum[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("forums").select("*").order("sort_order", { ascending: true });
      setForums(data ?? []);
      setLoading(false);
    };
    load();
  }, []);

  const hasFinanceForum = forums.some((f) => f.is_finance);

  if (loading) {
    return (
      <div className="p-8">
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 300, color: 'var(--text-1)', letterSpacing: '-0.03em' }}>Forums</h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-3)', marginTop: '4px' }}>Loading forums…</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6 ss-appear">
      <SEOHead title="Community Forums — Money Spirit" description="Join the conversation." />
      {hasFinanceForum && <EducationBanner />}

      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 300, color: 'var(--text-1)', letterSpacing: '-0.03em', marginBottom: '4px' }}>Forums</h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-3)', marginBottom: '24px' }}>Deeper conversations about money, life, and wellbeing.</p>
      </div>

      {forums.length === 0 ? (
        <EmptyState icon={MessageSquare} heading="Forums are on the way" body="We're setting up spaces for deeper conversations. Check back soon." />
      ) : (
        <div className="space-y-2">
          {forums.map((forum) => (
            <button
              key={forum.id}
              onClick={() => navigate(`/forums/${forum.slug}`)}
              className="w-full text-left ss-interactive transition-all"
              style={{ padding: '20px 24px', display: 'block' }}
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 shrink-0" style={{ color: 'var(--gold-base)', opacity: 0.6 }} />
                <div className="flex-1 min-w-0">
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '19px', fontWeight: 400, color: 'var(--text-1)', lineHeight: 1.3 }}>{forum.title}</h3>
                  {forum.description && (
                    <p style={{ fontSize: '13px', fontFamily: 'var(--font-body)', color: 'var(--text-3)', lineHeight: 1.5, marginTop: '4px' }}>{forum.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    {forum.is_finance && (
                      <span style={{
                        background: 'rgba(196,151,58,0.08)', border: '1px solid rgba(196,151,58,0.18)',
                        borderRadius: 'var(--r-pill)', padding: '2px 10px',
                        fontFamily: 'var(--font-body)', fontSize: '10px', fontWeight: 500, color: 'var(--gold-base)',
                      }}>Finance</span>
                    )}
                    {forum.requires_member && (
                      <span style={{
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 'var(--r-pill)', padding: '2px 10px',
                        fontFamily: 'var(--font-body)', fontSize: '10px', fontWeight: 500, color: 'var(--text-4)',
                      }}>Members only</span>
                    )}
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: 'var(--text-4)', opacity: 0.5 }} className="shrink-0" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Forums;
