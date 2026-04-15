import { useEffect, useState, useRef, createContext, useContext } from "react";
import { useNavigate, Outlet, NavLink, useLocation, Link } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import {
  Compass, Users, MessageSquare, Flame, BookOpen, CalendarDays,
  Contact, LogOut, Shield, Menu, Bell,
} from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import NotificationBell from "@/components/notifications/NotificationBell";
import NotificationPanel from "@/components/notifications/NotificationPanel";
import { getUnreadCount } from "@/lib/actions/notifications";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { TranslationKey } from "@/lib/i18n/translations";
import type { Tables } from "@/integrations/supabase/types";
import { useBadgeNotification } from "@/hooks/useBadgeNotification";
import { useWeeklyArchetypeScore } from "@/hooks/useWeeklyArchetypeScore";
import { useFMSScoring } from "@/hooks/useFMSScoring";
import { useRitualReminder } from "@/hooks/useRitualReminder";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";

type Profile = Tables<"profiles">;

const ProfileContext = createContext<Profile | null>(null);
export const useProfile = () => useContext(ProfileContext);

const navItems: { labelKey: TranslationKey; label: string; to: string; icon: typeof Compass }[] = [
  { labelKey: "my_pathway", label: "My Pathway", to: "/dashboard", icon: Compass },
  { labelKey: "community", label: "Community", to: "/community", icon: Users },
  { labelKey: "forums", label: "Forums", to: "/forums", icon: MessageSquare },
  { labelKey: "rituals", label: "Rituals", to: "/rituals", icon: Flame },
  { labelKey: "learn", label: "Learn", to: "/learn", icon: BookOpen },
  { labelKey: "events", label: "Events", to: "/events", icon: CalendarDays },
  { labelKey: "members", label: "Members", to: "/members", icon: Contact },
];

const accentMap: Record<string, string> = {
  giver: "#D4856A", keeper: "#6B9EC4", rebel: "#A87CC4", seeker: "#4DB89A", achiever: "#C4973A",
};
const nameMap: Record<string, string> = {
  giver: "The Giver", keeper: "The Keeper", rebel: "The Rebel", seeker: "The Seeker", achiever: "The Achiever",
};

const getInitials = (name: string) =>
  name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

const getPageTitle = (pathname: string, t: (key: TranslationKey) => string) => {
  const item = navItems.find((n) => pathname.startsWith(n.to));
  if (item) return t(item.labelKey);
  if (pathname.startsWith("/settings")) return "Settings";
  return "Money Spirit";
};

const tooltipStyle: React.CSSProperties = {
  background: 'rgba(11,21,37,0.95)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(196,151,58,0.25)',
  borderRadius: '10px',
  padding: '7px 14px',
  fontSize: '13px',
  fontFamily: 'Outfit, sans-serif',
  color: '#D4C49A',
  boxShadow: 'inset 0 1px 0 rgba(238,201,110,0.15), 0 8px 24px rgba(0,0,0,0.50)',
  whiteSpace: 'nowrap',
};

/** Compact bell for mobile header — shows unread dot + opens panel */
const MobileBell = ({ userId }: { userId: string }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getUnreadCount(userId).then(setUnreadCount);
    const channel = supabase
      .channel(`mobile-notif-${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` }, () => {
        getUnreadCount(userId).then(setUnreadCount);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` }, () => {
        getUnreadCount(userId).then(setUnreadCount);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="relative p-1" aria-label="Notifications">
        <Bell size={20} style={{ color: unreadCount > 0 ? '#EEC96E' : 'rgba(160,139,98,0.60)', transition: 'color 0.2s ease' }} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] flex items-center justify-center rounded-full text-[10px] font-semibold px-1"
            style={{ background: '#C4973A', color: '#0B1525', boxShadow: '0 0 8px rgba(196,151,58,0.40)' }}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="fixed inset-x-0 top-[56px] z-50 px-3">
          <NotificationPanel userId={userId} onClose={() => setOpen(false)} onCountChange={setUnreadCount} />
        </div>
      )}
    </div>
  );
};

const PlatformLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const { t } = useLanguage();
  const isMobile = useIsMobile();

  useBadgeNotification(profile?.user_id);
  useWeeklyArchetypeScore(profile?.user_id);
  useFMSScoring(profile?.user_id);
  useRitualReminder(profile?.user_id);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login", { replace: true }); return; }
      const { data } = await supabase.from("profiles").select("*").eq("user_id", session.user.id).maybeSingle();
      setProfile(data);
      setLoading(false);
    };
    load();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) return;
      if (!session && window.location.pathname !== "/login") navigate("/login", { replace: true });
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0B1F3A" }}>
        <img src="/logo.png" alt="Money Spirit" style={{ width: 48, filter: 'drop-shadow(0 0 10px rgba(196,151,58,0.20))' }} className="animate-pulse" />
      </div>
    );
  }

  const pageTitle = getPageTitle(location.pathname, t);
  const initials = getInitials(profile?.display_name ?? "M");

  return (
    <ProfileContext.Provider value={profile}>
      <TooltipProvider delayDuration={0}>
        <div
          className="min-h-screen flex"
          style={{
            minHeight: '100vh',
            position: 'relative',
            overflow: 'hidden',
            background: `radial-gradient(ellipse 100% 100% at 50% 50%, #0B1F3A 60%, #081629 100%)`,
          }}
        >
          {/* SacredBackground removed — logo IS the mandala */}

          {/* Desktop sidebar */}
          <aside
            onMouseEnter={() => setSidebarExpanded(true)}
            onMouseLeave={() => setSidebarExpanded(false)}
            className="hidden md:flex flex-col fixed inset-y-0 left-0 z-30 overflow-hidden"
            style={{
              width: sidebarExpanded ? 240 : 64,
              background: 'rgba(6, 12, 24, 0.82)',
              backdropFilter: 'blur(32px)',
              WebkitBackdropFilter: 'blur(32px)',
              borderRight: '1px solid rgba(196,151,58,0.12)',
              boxShadow: 'inset -1px 0 0 rgba(196,151,58,0.06), 8px 0 32px rgba(0,0,0,0.40)',
              transition: 'width 0.30s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {/* Logo */}
            <div className="flex items-center gap-2.5 px-4 py-4 min-h-[56px]" style={{ borderBottom: '1px solid rgba(196,151,58,0.08)' }}>
              {sidebarExpanded && (
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, letterSpacing: '-0.01em', color: '#C4973A', whiteSpace: 'nowrap' }}>
                  Money Spirit
                </span>
              )}
            </div>

            {/* Nav */}
            <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
              {navItems.map((item) => {
                const active = location.pathname === item.to || location.pathname.startsWith(item.to + "/");
                const navButton = (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className="flex items-center gap-3 transition-colors relative"
                    style={{
                      padding: sidebarExpanded ? "10px 16px" : "10px 0",
                      justifyContent: sidebarExpanded ? "flex-start" : "center",
                      height: 44,
                      fontFamily: 'var(--font-body)',
                      fontSize: '13px',
                      fontWeight: active ? 500 : 400,
                      letterSpacing: '0.01em',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      ...(active ? {
                        background: 'rgba(196,151,58,0.12)',
                        borderRadius: '10px',
                        borderLeft: '2px solid rgba(238,201,110,0.65)',
                        boxShadow: 'inset 0 1px 0 rgba(238,201,110,0.12), 0 0 16px rgba(196,151,58,0.08)',
                        color: '#EEC96E',
                      } : {
                        background: 'transparent',
                        borderRadius: '10px',
                        borderLeft: '2px solid transparent',
                        color: 'rgba(160,139,98,0.80)',
                      }),
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(196,151,58,0.07)';
                        (e.currentTarget as HTMLElement).style.color = 'rgba(210,180,120,0.90)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                        (e.currentTarget as HTMLElement).style.color = 'rgba(160,139,98,0.80)';
                      }
                    }}
                  >
                    <item.icon size={18} className="shrink-0" />
                    {sidebarExpanded && (
                      <span style={{ opacity: 1, transition: 'opacity 0.15s ease' }}>{t(item.labelKey)}</span>
                    )}
                  </NavLink>
                );

                if (!sidebarExpanded) {
                  return (
                    <Tooltip key={item.to}>
                      <TooltipTrigger asChild>{navButton}</TooltipTrigger>
                      <TooltipContent side="right" sideOffset={16} style={tooltipStyle}>
                        {t(item.labelKey)}
                      </TooltipContent>
                    </Tooltip>
                  );
                }
                return navButton;
              })}
            </nav>

            {/* Bottom section */}
            <div className="px-2 pb-3 space-y-1" style={{ borderTop: '1px solid rgba(196,151,58,0.08)', background: 'rgba(4,8,16,0.40)' }}>
              {profile?.user_id && sidebarExpanded && (
                <div className="pt-2">
                  <NotificationBell userId={profile.user_id} />
                  <Link to="/settings/notifications" className="block px-3 text-[11px] transition-colors" style={{ fontFamily: 'var(--font-body)', color: '#5C4E34' }}>
                    Notification settings
                  </Link>
                </div>
              )}
              {!sidebarExpanded && profile?.user_id && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <NavLink to="/settings/notifications" className="flex justify-center py-2">
                      <Bell size={18} style={{ color: 'rgba(160,139,98,0.60)', transition: 'color 0.15s ease' }} />
                    </NavLink>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={16} style={tooltipStyle}>Notifications</TooltipContent>
                </Tooltip>
              )}

              {profile?.role === "admin" && sidebarExpanded && (
                <Link to="/admin" className="flex items-center gap-2 px-3 py-2 text-xs transition-colors" style={{ fontFamily: 'var(--font-body)', color: '#EEC96E' }}>
                  <Shield size={14} />
                  Admin Panel
                </Link>
              )}

              {sidebarExpanded ? (
                <div className="px-3 py-2 space-y-1">
                  <Link to="/profile" className="text-[13px] truncate block hover:underline" style={{ fontFamily: 'var(--font-body)', fontWeight: 500, color: '#F2EAD8' }}>
                    {profile?.display_name ?? "Member"}
                  </Link>
                  {profile?.pathway_type && (
                    <p className="text-[11px]" style={{ fontFamily: 'var(--font-body)', color: '#A08B62' }}>
                      {nameMap[profile.pathway_type] ?? profile.pathway_type}
                    </p>
                  )}
                  <LanguageSwitcher />
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 text-[12px] transition-colors mt-1"
                    style={{ fontFamily: 'var(--font-body)', color: '#A08B62' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#F2EAD8'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#A08B62'; }}
                  >
                    <LogOut size={14} />
                    {t("sign_out")}
                  </button>
                </div>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex justify-center py-2">
                      <div
                        className="flex items-center justify-center shrink-0"
                        style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: 'var(--ss-gold-gradient)',
                          border: '1.5px solid rgba(238,201,110,0.40)',
                          boxShadow: '0 0 16px rgba(196,151,58,0.20)',
                          fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600,
                          color: '#0B1525',
                        }}
                      >
                        {initials}
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={16} style={tooltipStyle}>
                    {profile?.display_name ?? "Member"}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </aside>

          {/* Mobile header */}
          <header
            className="fixed top-0 left-0 right-0 z-40 md:hidden flex items-center justify-between px-4"
            style={{
              height: 56,
              background: 'rgba(4, 8, 16, 0.75)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              borderBottom: '1px solid rgba(196,151,58,0.10)',
              boxShadow: '0 1px 0 rgba(196,151,58,0.05)',
            }}
          >
            <div className="flex items-center gap-2">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <button style={{ color: '#F2EAD8' }} className="p-1">
                    <Menu size={24} />
                  </button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[260px] border-none p-0 [&>button]:hidden" style={{
                  background: 'rgba(6,12,24,0.95)',
                  backdropFilter: 'blur(32px)',
                }}>
                  <div className="flex flex-col h-full">
                    <div className="px-6 py-6 flex items-center gap-2.5" style={{ borderBottom: '1px solid rgba(196,151,58,0.08)' }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: '#C4973A', fontWeight: 700 }}>Money Spirit</span>
                    </div>
                    <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
                      {navItems.map((item) => {
                        const active = location.pathname === item.to;
                        return (
                          <NavLink
                            key={item.to}
                            to={item.to}
                            onClick={() => setMobileOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors"
                            style={{
                              fontFamily: 'var(--font-body)',
                              background: active ? 'rgba(196,151,58,0.12)' : 'transparent',
                              color: active ? '#EEC96E' : 'rgba(160,139,98,0.80)',
                            }}
                          >
                            <item.icon size={18} />
                            {t(item.labelKey)}
                          </NavLink>
                        );
                      })}
                    </nav>
                    {profile?.role === "admin" && (
                      <Link to="/admin" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-6 py-2 text-xs" style={{ fontFamily: 'var(--font-body)', color: '#EEC96E' }}>
                        <Shield size={14} />
                        Admin Panel
                      </Link>
                    )}
                    <div className="px-4 py-4 space-y-2" style={{ borderTop: '1px solid rgba(196,151,58,0.08)', background: 'rgba(4,8,16,0.40)' }}>
                      <p className="text-sm truncate" style={{ fontFamily: 'var(--font-body)', fontWeight: 500, color: '#F2EAD8' }}>
                        {profile?.display_name ?? "Member"}
                      </p>
                      <button onClick={handleSignOut} className="flex items-center gap-2 text-xs transition-colors" style={{ fontFamily: 'var(--font-body)', color: '#A08B62' }}>
                        <LogOut size={14} />
                        {t("sign_out")}
                      </button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '16px', color: '#C4973A', fontWeight: 700 }}>Money Spirit</span>
            </div>
            <div className="flex items-center gap-3">
              {profile?.user_id && (
                <MobileBell userId={profile.user_id} />
              )}
              <div
                className="flex items-center justify-center"
                style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'var(--ss-gold-gradient)',
                  border: '1.5px solid rgba(238,201,110,0.40)',
                  boxShadow: '0 0 16px rgba(196,151,58,0.20)',
                  fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600,
                  color: '#0B1525',
                }}
              >
                {initials}
              </div>
            </div>
          </header>

          {/* Mobile bottom nav */}
          <nav
            className="fixed bottom-0 left-0 right-0 z-40 md:hidden flex justify-around items-center py-2 px-1"
            style={{
              background: 'rgba(4,8,16,0.85)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              borderTop: '1px solid rgba(196,151,58,0.10)',
            }}
          >
            {navItems.slice(0, 5).map((item) => {
              const active = location.pathname === item.to;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] transition-colors"
                  style={{ fontFamily: 'var(--font-body)', color: active ? '#EEC96E' : '#5C4E34' }}
                >
                  <item.icon size={20} />
                  <span>{item.labelKey === "my_pathway" ? "Home" : t(item.labelKey)}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Main content */}
          <main className="flex-1 min-h-screen overflow-y-auto pt-14 pb-16 md:pt-0 md:pb-0" style={{ position: 'relative', zIndex: 1 }}>
            <div
              className="platform-content"
              style={{
                marginLeft: isMobile ? 0 : (sidebarExpanded ? 240 : 64),
                transition: "margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              {/* Desktop top header bar */}
              <div
                className="hidden md:flex sticky top-0 z-40 items-center justify-between px-8"
                style={{
                  height: 56,
                  background: 'rgba(4, 8, 16, 0.75)',
                  backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                  borderBottom: '1px solid rgba(196,151,58,0.10)',
                  boxShadow: '0 1px 0 rgba(196,151,58,0.05)',
                }}
              >
                <h2 style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '12px',
                  fontWeight: 500,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'rgba(160,139,98,0.70)',
                }}>
                  {pageTitle}
                </h2>
                <div className="flex items-center gap-4">
                  {profile?.user_id && (
                    <div className="relative">
                      <Bell size={20} style={{ color: 'rgba(160,139,98,0.60)', cursor: 'pointer', transition: 'color 0.15s ease' }} />
                    </div>
                  )}
                  <Link to="/profile"
                    className="flex items-center justify-center"
                    style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: 'var(--ss-gold-gradient)',
                      border: '1.5px solid rgba(238,201,110,0.40)',
                      boxShadow: '0 0 16px rgba(196,151,58,0.20)',
                      fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600,
                      color: '#0B1525',
                    }}
                  >
                    {initials}
                  </Link>
                </div>
              </div>
              <Outlet />
            </div>
          </main>
        </div>
      </TooltipProvider>
    </ProfileContext.Provider>
  );
};

export default PlatformLayout;
