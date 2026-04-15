import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { CalendarDays, MapPin, Globe, Ticket, Sparkles, Users } from "lucide-react";
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
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [ticketedIds, setTicketedIds] = useState<Set<string>>(new Set());
  const [interestedIds, setInterestedIds] = useState<Set<string>>(new Set());
  const [ticketCounts, setTicketCounts] = useState<Record<string, number>>({});
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("events").select("*").eq("published", true).order("event_date", { ascending: true });
      const allEvents = data ?? [];
      setEvents(allEvents);

      // Get ticket counts for capacity display
      if (allEvents.length > 0) {
        const counts: Record<string, number> = {};
        // Batch: fetch all active tickets for these events
        const eventIds = allEvents.filter(e => e.capacity).map(e => e.id);
        if (eventIds.length > 0) {
          const { data: tickets } = await supabase
            .from("event_tickets")
            .select("event_id")
            .in("event_id", eventIds)
            .eq("status", "active");
          (tickets ?? []).forEach(t => { counts[t.event_id] = (counts[t.event_id] || 0) + 1; });
        }
        setTicketCounts(counts);
      }

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

  const claimFreeTicket = async (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setClaimingId(eventId);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast({ title: "Please sign in", description: "You need an account to get a ticket.", variant: "destructive" }); setClaimingId(null); return; }
    const { data: ticket, error } = await supabase.from("event_tickets").insert({ event_id: eventId, user_id: user.id }).select("id").single();
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    else {
      setTicketedIds((prev) => new Set(prev).add(eventId));
      setTicketCounts(prev => ({ ...prev, [eventId]: (prev[eventId] || 0) + 1 }));
      toast({ title: "Ticket confirmed!", description: "You're all set." });
      const evt = events.find(ev => ev.id === eventId);
      if (evt && user.email && ticket) {
        const { data: prof } = await supabase.from("profiles").select("display_name").eq("user_id", user.id).maybeSingle();
        sendTicketConfirmation(user.email, prof?.display_name ?? "there", evt.title, format(new Date(evt.event_date), "EEEE, d MMMM yyyy"), evt.is_virtual ? "Online event" : (evt.location ?? "Location TBA"), ticket.id);
      }
    }
    setClaimingId(null);
  };

  const registerInterest = async (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setClaimingId(eventId);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast({ title: "Please sign in", variant: "destructive" }); setClaimingId(null); return; }
    const { error } = await supabase.from("event_waitlist").insert({ event_id: eventId, user_id: user.id });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    else { setInterestedIds((prev) => new Set(prev).add(eventId)); toast({ title: "Thanks!", description: "We will be in touch with payment details shortly." }); }
    setClaimingId(null);
  };

  const now = new Date();
  const upcoming = events.filter(e => new Date(e.event_date) >= now);
  const past = events.filter(e => new Date(e.event_date) < now);

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 300, color: '#F2EAD8', letterSpacing: '-0.03em', marginBottom: '8px' }}>Events</h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#A08B62', marginBottom: '32px' }}>Workshops, circles, and gatherings to support your journey.</p>
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

  const renderEventCard = (event: Event) => {
    const hasTicket = ticketedIds.has(event.id);
    const hasInterest = interestedIds.has(event.id);
    const isFree = event.price_pence === 0;
    const isEventPast = new Date(event.event_date) < now;
    const sold = ticketCounts[event.id] || 0;
    const isSoldOut = event.capacity ? sold >= event.capacity : false;
    const nearlyFull = event.capacity ? sold >= event.capacity * 0.8 && !isSoldOut : false;
    const spacesLeft = event.capacity ? event.capacity - sold : null;

    return (
      <button
        key={event.id}
        onClick={() => navigate(`/events/${event.id}`)}
        className="ss-interactive overflow-hidden p-0 text-left w-full block"
      >
        <div className="h-36 flex items-center justify-center" style={{
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

          {/* Capacity badge */}
          {event.capacity && !isEventPast && (
            <div className="flex items-center gap-2" style={{ fontSize: '12px', fontFamily: 'var(--font-body)', color: isSoldOut ? '#f59e0b' : nearlyFull ? '#f59e0b' : '#A08B62' }}>
              <Users className="h-3.5 w-3.5" />
              {isSoldOut ? "Sold out" : nearlyFull ? `Only ${spacesLeft} spots left` : `${spacesLeft} spots available`}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <span style={{
              background: 'rgba(196,151,58,0.11)', border: '1px solid rgba(196,151,58,0.25)',
              borderRadius: 'var(--r-pill)', padding: '4px 12px',
              fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 500, color: '#EEC96E',
            }}>{formatPrice(event.price_pence)}</span>

            {isEventPast ? (
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--text-4)' }}>Past event</span>
            ) : hasTicket ? (
              <span className="inline-flex items-center gap-1.5" style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 500, color: '#EEC96E' }}>
                <Ticket className="h-4 w-4" /> Registered
              </span>
            ) : hasInterest ? (
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 500, color: '#EEC96E' }}>✓ Interest registered</span>
            ) : isSoldOut && event.waitlist_enabled ? (
              <Button variant="gold" size="sm" disabled={claimingId === event.id} onClick={(e) => registerInterest(event.id, e)} className="btn-gold">
                {claimingId === event.id ? "Joining…" : "Join waitlist"}
              </Button>
            ) : isSoldOut ? (
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: '#f59e0b' }}>Sold out</span>
            ) : (
              <Button variant="gold" size="sm" disabled={claimingId === event.id} onClick={(e) => { e.stopPropagation(); if (isFree) claimFreeTicket(event.id, e); else registerInterest(event.id, e); }} className="btn-gold">
                {claimingId === event.id ? "Submitting…" : isFree ? "Get ticket" : "Register interest"}
              </Button>
            )}
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="p-8 max-w-5xl mx-auto ss-appear">
      <SEOHead title="Events — Money Spirit" />
      <EducationBanner />
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 300, color: '#F2EAD8', letterSpacing: '-0.03em', marginBottom: '8px' }}>Events</h1>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#A08B62', marginBottom: '32px' }}>Workshops, circles, and gatherings to support your journey.</p>

      {upcoming.length === 0 && past.length === 0 ? (
        <EmptyState icon={CalendarDays} heading="Events are on the way" body="We're preparing meaningful gatherings. Check back soon." />
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 mb-10">
              {upcoming.map(renderEventCard)}
            </div>
          )}
          {upcoming.length === 0 && (
            <div className="mb-10">
              <EmptyState icon={CalendarDays} heading="No upcoming events right now" body="New events are added regularly. Check back soon or explore past events below." />
            </div>
          )}
          {past.length > 0 && (
            <>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 300, color: 'var(--text-3)', marginBottom: 16 }}>Past events</h2>
              <div className="grid gap-6 sm:grid-cols-2 opacity-70">
                {past.map(renderEventCard)}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Events;
