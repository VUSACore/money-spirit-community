import { useEffect, useState, createContext, useContext } from "react";
import { useNavigate, Outlet, NavLink, useLocation, Link } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import {
  Compass, Users, MessageSquare, Flame, BookOpen, CalendarDays,
  Contact, LogOut, Shield, Menu, Bell,
} from "lucide-react";
import LotusIcon from "@/components/LotusIcon";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import NotificationBell from "@/components/notifications/NotificationBell";
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
  giver: "#E8845C", keeper: "#5B8DB8", rebel: "#9B59B6", seeker: "#27AE8F", achiever: "#C9941E",
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

const tooltipStyle = {
  background: 'rgba(12, 18, 33, 0.9)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: '10px',
  padding: '6px 12px',
  fontSize: '13px',
  fontFamily: 'var(--font-body)',
  color: 'var(--text-1)',
  boxShadow: '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.10)',
  whiteSpace: 'nowrap' as const,
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate("/login", { replace: true });
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-void)" }}>
        <LotusIcon className="text-gold animate-pulse" size={48} />
      </div>
    );
  }

  const pageTitle = getPageTitle(location.pathname, t);
  const initials = getInitials(profile?.display_name ?? "M");

  return (
    <ProfileContext.Provider value={profile}>
      <TooltipProvider delayDuration={0}>
        <div
          className="min-h-screen flex platform-bg"
          style={{
            background: `
              radial-gradient(ellipse 80% 50% at 50% -10%, rgba(201, 148, 30, 0.12) 0%, transparent 60%),
              radial-gradient(ellipse 60% 40% at 80% 80%, rgba(27, 75, 138, 0.15) 0%, transparent 50%),
              linear-gradient(180deg, #060912 0%, #080D1A 40%, #0C1221 100%)
            `,
            minHeight: '100vh',
          }}
        >
          {/* Desktop sidebar */}
          <aside
            onMouseEnter={() => setSidebarExpanded(true)}
            onMouseLeave={() => setSidebarExpanded(false)}
            className="hidden md:flex flex-col fixed inset-y-0 left-0 z-30 overflow-hidden"
            style={{
              width: sidebarExpanded ? 240 : 64,
              background: 'rgba(8, 13, 26, 0.7)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              borderRight: '1px solid rgba(255,255,255,0.06)',
              boxShadow: 'inset -1px 0 0 rgba(255,255,255,0.04), 4px 0 24px rgba(0,0,0,0.3)',
              transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {/* Logo */}
            <div className="flex items-center gap-2.5 px-5 py-5 min-h-[56px]">
              <LotusIcon className="text-gold shrink-0" size={24} />
              {sidebarExpanded && (
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 400, letterSpacing: '-0.01em', color: 'var(--gold-base)', whiteSpace: 'nowrap' }}>
                  Money Spirit
                </span>
              )}
            </div>

            {/* Nav */}
            <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
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
                      fontWeight: 500,
                      ...(active ? {
                        background: 'rgba(201, 148, 30, 0.12)',
                        borderRadius: '12px',
                        borderLeft: '2px solid rgba(245,200,66,0.6)',
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
                        color: 'var(--gold-bright)',
                      } : {
                        background: 'transparent',
                        borderRadius: '12px',
                        borderLeft: '2px solid transparent',
                        color: 'var(--text-3)',
                      }),
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                      }
                    }}
                  >
                    <item.icon size={18} className="shrink-0" style={{ color: active ? 'var(--gold-bright)' : 'var(--text-3)' }} />
                    {sidebarExpanded && <span className="whitespace-nowrap">{t(item.labelKey)}</span>}
                  </NavLink>
                );

                if (!sidebarExpanded) {
                  return (
                    <Tooltip key={item.to}>
                      <TooltipTrigger asChild>{navButton}</TooltipTrigger>
                      <TooltipContent side="right" sideOffset={16} className="font-body text-[13px] px-3 py-1.5 rounded-md" style={tooltipStyle}>
                        {t(item.labelKey)}
                      </TooltipContent>
                    </Tooltip>
                  );
                }
                return navButton;
              })}
            </nav>

            {/* Bottom section */}
            <div className="px-2 pb-3 space-y-1" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              {profile?.user_id && sidebarExpanded && (
                <div className="pt-2">
                  <NotificationBell userId={profile.user_id} />
                  <Link to="/settings/notifications" className="block px-3 text-[11px] transition-colors" style={{ fontFamily: 'var(--font-body)', color: 'var(--text-4)' }}>
                    Notification settings
                  </Link>
                </div>
              )}
              {!sidebarExpanded && profile?.user_id && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <NavLink to="/settings/notifications" className="flex justify-center py-2">
                      <Bell size={18} style={{ color: 'var(--text-3)' }} />
                    </NavLink>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={16} style={tooltipStyle}>Notifications</TooltipContent>
                </Tooltip>
              )}

              {profile?.role === "admin" && sidebarExpanded && (
                <Link to="/admin" className="flex items-center gap-2 px-3 py-2 text-xs transition-colors" style={{ fontFamily: 'var(--font-body)', color: 'var(--text-gold)' }}>
                  <Shield size={14} />
                  Admin Panel
                </Link>
              )}

              {sidebarExpanded ? (
                <div className="px-3 py-2 space-y-1">
                  <Link to="/profile" className="text-[13px] truncate block hover:underline" style={{ fontFamily: 'var(--font-body)', color: 'var(--text-1)' }}>
                    {profile?.display_name ?? "Member"}
                  </Link>
                  {profile?.pathway_type && (
                    <p className="text-[11px]" style={{ fontFamily: 'var(--font-body)', color: 'var(--text-4)' }}>
                      {nameMap[profile.pathway_type] ?? profile.pathway_type}
                    </p>
                  )}
                  <LanguageSwitcher />
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 text-[12px] transition-colors mt-1"
                    style={{ fontFamily: 'var(--font-body)', color: 'var(--text-3)' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-1)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-3)'; }}
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
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                        style={{ background: 'var(--gold-base)', color: '#060912', fontFamily: 'var(--font-body)' }}
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
              background: 'rgba(8, 13, 26, 0.65)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              boxShadow: '0 1px 0 rgba(255,255,255,0.04)',
            }}
          >
            <div className="flex items-center gap-2">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <button style={{ color: 'var(--text-1)' }} className="p-1">
                    <Menu size={24} />
                  </button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[260px] border-none p-0 [&>button]:hidden" style={{
                  background: 'rgba(8, 13, 26, 0.95)',
                  backdropFilter: 'blur(24px)',
                }}>
                  <div className="flex flex-col h-full">
                    <div className="px-6 py-6 flex items-center gap-2.5">
                      <LotusIcon className="text-gold" size={28} />
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--gold-base)' }}>Money Spirit</span>
                    </div>
                    <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
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
                              background: active ? 'rgba(201,148,30,0.12)' : 'transparent',
                              color: active ? 'var(--text-gold)' : 'var(--text-3)',
                            }}
                          >
                            <item.icon size={18} style={{ color: active ? 'var(--text-gold)' : 'var(--text-3)' }} />
                            {t(item.labelKey)}
                          </NavLink>
                        );
                      })}
                    </nav>
                    {profile?.role === "admin" && (
                      <Link to="/admin" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-6 py-2 text-xs" style={{ fontFamily: 'var(--font-body)', color: 'var(--text-gold)' }}>
                        <Shield size={14} />
                        Admin Panel
                      </Link>
                    )}
                    <div className="px-4 py-4 space-y-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <p className="text-sm truncate" style={{ fontFamily: 'var(--font-body)', color: 'var(--text-1)' }}>
                        {profile?.display_name ?? "Member"}
                      </p>
                      <button onClick={handleSignOut} className="flex items-center gap-2 text-xs transition-colors" style={{ fontFamily: 'var(--font-body)', color: 'var(--text-3)' }}>
                        <LogOut size={14} />
                        {t("sign_out")}
                      </button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
              <LotusIcon className="text-gold" size={24} />
            </div>
            <div className="flex items-center gap-3">
              {profile?.user_id && (
                <div className="relative">
                  <Bell size={20} style={{ color: 'var(--text-3)' }} />
                </div>
              )}
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
                style={{ background: 'var(--gold-base)', color: '#060912', fontFamily: 'var(--font-body)' }}>
                {initials}
              </div>
            </div>
          </header>

          {/* Mobile bottom nav */}
          <nav
            className="fixed bottom-0 left-0 right-0 z-40 md:hidden flex justify-around items-center py-2 px-1"
            style={{
              background: 'rgba(8, 13, 26, 0.8)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderTop: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {navItems.slice(0, 5).map((item) => {
              const active = location.pathname === item.to;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] transition-colors"
                  style={{ fontFamily: 'var(--font-body)', color: active ? 'var(--text-gold)' : 'var(--text-4)' }}
                >
                  <item.icon size={20} />
                  <span>{item.labelKey === "my_pathway" ? "Home" : t(item.labelKey)}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Main content */}
          <main className="flex-1 min-h-screen overflow-y-auto pt-14 pb-16 md:pt-0 md:pb-0">
            <div
              className="platform-content"
              style={{
                marginLeft: isMobile ? 0 : (sidebarExpanded ? 240 : 64),
                transition: "margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              {/* Desktop top header bar */}
              <div
                className="hidden md:flex sticky top-0 z-40 items-center justify-between px-6"
                style={{
                  height: 56,
                  background: 'rgba(8, 13, 26, 0.65)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  boxShadow: '0 1px 0 rgba(255,255,255,0.04)',
                }}
              >
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 400, letterSpacing: '-0.01em', color: 'var(--text-1)' }}>
                  {pageTitle}
                </h2>
                <div className="flex items-center gap-4">
                  {profile?.user_id && (
                    <div className="relative">
                      <Bell size={20} style={{ color: 'var(--text-3)' }} />
                    </div>
                  )}
                  <Link to="/profile" className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
                    style={{ background: 'var(--gold-base)', color: '#060912', fontFamily: 'var(--font-body)' }}>
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
