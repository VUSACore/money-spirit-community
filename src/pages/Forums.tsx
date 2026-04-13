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
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 300, color: '#F2EAD8', letterSpacing: '-0.03em' }}>Forums</h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#A08B62' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6 ss-appear">
      <SEOHead title="Community Forums — Money Spirit" description="Join the conversation." />
      {hasFinanceForum && <EducationBanner />}

      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 300, color: '#F2EAD8', letterSpacing: '-0.03em', marginBottom: '4px' }}>Forums</h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#A08B62', marginBottom: '24px' }}>Join the conversation.</p>
      </div>

      {forums.length === 0 ? (
        <EmptyState icon={MessageSquare} heading="No discussions yet" body="Be the first to start a conversation in this forum." />
      ) : (
        <div className="space-y-3">
          {forums.map((forum) => (
            <div key={forum.id} className="ss-interactive" style={{ padding: '20px 24px' }}>
              <div className="flex items-start gap-3">
                <MessageSquare className="h-5 w-5 mt-0.5 shrink-0" style={{ color: '#C4973A' }} />
                <div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '19px', fontWeight: 400, color: '#F2EAD8', lineHeight: 1.3 }}>{forum.title}</h3>
                  {forum.description && (
                    <p style={{ fontSize: '13px', fontFamily: 'var(--font-body)', color: '#A08B62', lineHeight: 1.5, marginTop: '4px' }}>{forum.description}</p>
                  )}
                  {forum.is_finance && (
                    <span style={{
                      display: 'inline-flex', marginTop: '8px',
                      background: 'rgba(196,151,58,0.08)',
                      border: '1px solid rgba(196,151,58,0.18)',
                      borderRadius: 'var(--r-pill)',
                      padding: '2px 10px',
                      fontFamily: 'var(--font-body)', fontSize: '10px', fontWeight: 500, color: '#C4973A',
                    }}>Finance</span>
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
