import { useEffect, useState } from "react";
import { format } from "date-fns";
import { CalendarDays, MapPin, Globe, Ticket, Sparkles } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";
import EducationBanner from "@/components/EducationBanner";
import { sendTicketConfirmation } from "@/lib/email/emailService";
import EmptyState from "@/components/EmptyState";

type Event = Tables<"events">;

const formatPrice = (pence: number) => {
  if (pence === 0) return "Free";
  return `AU$${(pence / 100).toFixed(0)}`;
};

const Events = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [ticketedIds, setTicketedIds] = useState<Set<string>>(new Set());
  const [interestedIds, setInterestedIds] = useState<Set<string>>(new Set());
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("events").select("*").eq("published", true).order("event_date", { ascending: true });
      setEvents(data ?? []);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: tickets } = await supabase.from("event_tickets").select("event_id").eq("user_id", user.id).eq("status", "active");
        setTicketedIds(new Set((tickets ?? []).map((t) => t.event_id)));
        const { data: interests } = await supabase.from("event_waitlist").select("event_id").eq("user_id", user.id);
        setInterestedIds(new Set((interests ?? []).map((t) => t.event_id)));
      }
      setLoading(false);
    };
    load();
  }, []);

  const claimFreeTicket = async (eventId: string) => {
    setClaimingId(eventId);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast({ title: "Please sign in", description: "You need an account to get a ticket.", variant: "destructive" }); setClaimingId(null); return; }
    const { data: ticket, error } = await supabase.from("event_tickets").insert({ event_id: eventId, user_id: user.id }).select("id").single();
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    else {
      setTicketedIds((prev) => new Set(prev).add(eventId));
      toast({ title: "Ticket confirmed!", description: "You're all set." });
      const evt = events.find(e => e.id === eventId);
      if (evt && user.email && ticket) {
        const { data: prof } = await supabase.from("profiles").select("display_name").eq("user_id", user.id).maybeSingle();
        sendTicketConfirmation(user.email, prof?.display_name ?? "there", evt.title, format(new Date(evt.event_date), "EEEE, d MMMM yyyy"), evt.is_virtual ? "Online event" : (evt.location ?? "Location TBA"), ticket.id);
      }
    }
    setClaimingId(null);
  };

  const registerInterest = async (eventId: string) => {
    setClaimingId(eventId);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast({ title: "Please sign in", variant: "destructive" }); setClaimingId(null); return; }
    const { error } = await supabase.from("event_waitlist").insert({ event_id: eventId, user_id: user.id });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    else { setInterestedIds((prev) => new Set(prev).add(eventId)); toast({ title: "Thanks!", description: "We will be in touch with payment details shortly." }); }
    setClaimingId(null);
  };

  const handleGetTicket = (event: Event) => {
    if (event.price_pence === 0) claimFreeTicket(event.id);
    else registerInterest(event.id);
  };

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 300, color: '#F2EAD8', letterSpacing: '-0.03em', marginBottom: '8px' }}>Events</h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#A08B62', marginBottom: '32px' }}>Workshops, circles and gatherings for the community.</p>
        <div className="grid gap-6 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="ss-card overflow-hidden p-0">
              <Skeleton className="h-40 w-full rounded-none" style={{ background: 'rgba(196,151,58,0.06)' }} />
              <div className="p-5 space-y-3"><Skeleton className="h-6 w-3/4" style={{ background: 'rgba(196,151,58,0.06)' }} /></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto ss-appear">
      <SEOHead title="Events — Money Spirit" />
      <EducationBanner />
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 300, color: '#F2EAD8', letterSpacing: '-0.03em', marginBottom: '8px' }}>Events</h1>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#A08B62', marginBottom: '32px' }}>Workshops, circles and gatherings for the community.</p>

      {events.length === 0 ? (
        <EmptyState icon={CalendarDays} heading="No upcoming events" body="Check back soon." />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {events.map((event) => {
            const hasTicket = ticketedIds.has(event.id);
            const hasInterest = interestedIds.has(event.id);
            const isFree = event.price_pence === 0;
            return (
              <div key={event.id} className="ss-interactive overflow-hidden p-0">
                <div className="h-40 flex items-center justify-center" style={{
                  background: 'linear-gradient(145deg, rgba(17,32,54,0.90), rgba(6,12,24,0.95))',
                  borderRadius: '14px 14px 0 0',
                }}>
                  <Sparkles className="h-8 w-8" style={{ color: 'rgba(196,151,58,0.25)' }} />
                </div>
                <div className="p-5 space-y-3">
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '21px', fontWeight: 400, color: '#F2EAD8' }}>{event.title}</h2>
                  <div className="flex items-center gap-2" style={{ fontSize: '12px', fontFamily: 'var(--font-body)', color: '#A08B62' }}>
                    <CalendarDays className="h-4 w-4" style={{ color: '#C4973A' }} />
                    {format(new Date(event.event_date), "EEEE d MMMM yyyy")}
                  </div>
                  <div className="flex items-center gap-2" style={{ fontSize: '12px', fontFamily: 'var(--font-body)', color: '#A08B62' }}>
                    {event.is_virtual ? (<><Globe className="h-4 w-4" style={{ color: '#C4973A' }} />Online event</>) : (<><MapPin className="h-4 w-4" style={{ color: '#C4973A' }} />{event.location ?? "Location TBA"}</>)}
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span style={{
                      background: 'rgba(196,151,58,0.11)', border: '1px solid rgba(196,151,58,0.25)',
                      borderRadius: 'var(--r-pill)', padding: '4px 12px',
                      fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 500, color: '#EEC96E',
                    }}>{formatPrice(event.price_pence)}</span>
                    {hasTicket ? (
                      <span className="inline-flex items-center gap-1.5" style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 500, color: '#EEC96E' }}>
                        <Ticket className="h-4 w-4" /> Ticket confirmed
                      </span>
                    ) : hasInterest ? (
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 500, color: '#EEC96E' }}>✓ Interest registered</span>
                    ) : (
                      <Button variant="gold" size="sm" disabled={claimingId === event.id} onClick={() => handleGetTicket(event)} className="btn-gold">
                        {claimingId === event.id ? "Submitting…" : isFree ? "Get your ticket" : "Register your interest"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Events;
