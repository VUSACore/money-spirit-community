import { useEffect, useState, createContext, useContext } from "react";
import { useNavigate, Outlet, NavLink, useLocation, Link } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import {
  Compass,
  Users,
  MessageSquare,
  Flame,
  BookOpen,
  CalendarDays,
  Contact,
  LogOut,
  Shield,
  Menu,
  Bell,
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
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
      if (!session) {
        navigate("/login", { replace: true });
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

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
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--ms-base)" }}>
        <LotusIcon className="text-gold animate-pulse" size={48} />
      </div>
    );
  }

  const pageTitle = getPageTitle(location.pathname, t);
  const initials = getInitials(profile?.display_name ?? "M");

  return (
    <ProfileContext.Provider value={profile}>
      <TooltipProvider delayDuration={0}>
        <div className="min-h-screen flex" style={{ background: "var(--ms-base)" }}>
          {/* Desktop sidebar */}
          <aside
            onMouseEnter={() => setSidebarExpanded(true)}
            onMouseLeave={() => setSidebarExpanded(false)}
            className="hidden md:flex flex-col fixed inset-y-0 left-0 z-30 overflow-hidden"
            style={{
              width: sidebarExpanded ? 240 : 64,
              background: "var(--ms-surface-1)",
              borderRight: "1px solid var(--ms-border)",
              transition: "width 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            {/* Logo */}
            <div className="flex items-center gap-2.5 px-5 py-5 min-h-[56px]">
              <LotusIcon className="text-gold shrink-0" size={24} />
              {sidebarExpanded && (
                <span className="font-heading text-lg tracking-wide whitespace-nowrap" style={{ color: "#C9941E" }}>
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
                    className="flex items-center gap-3 rounded-lg font-body text-[13px] font-medium transition-colors relative"
                    style={{
                      padding: sidebarExpanded ? "10px 16px" : "10px 0",
                      justifyContent: sidebarExpanded ? "flex-start" : "center",
                      height: 44,
                      background: active ? "var(--ms-surface-3)" : "transparent",
                      borderLeft: active && sidebarExpanded ? "2px solid #F5C842" : "2px solid transparent",
                      color: active ? "#F5C842" : "var(--ms-text-muted)",
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.background = "var(--ms-surface-2)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.background = "transparent";
                      }
                    }}
                  >
                    <item.icon size={18} className="shrink-0" style={{ color: active ? "#F5C842" : "var(--ms-text-muted)" }} />
                    {sidebarExpanded && <span className="whitespace-nowrap">{t(item.labelKey)}</span>}
                  </NavLink>
                );

                if (!sidebarExpanded) {
                  return (
                    <Tooltip key={item.to}>
                      <TooltipTrigger asChild>{navButton}</TooltipTrigger>
                      <TooltipContent
                        side="right"
                        sideOffset={16}
                        className="font-body text-[13px] px-3 py-1.5 rounded-md"
                        style={{
                          background: "#1C2333",
                          border: "1px solid var(--ms-border-active)",
                          color: "#F1F5F9",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                        }}
                      >
                        {t(item.labelKey)}
                      </TooltipContent>
                    </Tooltip>
                  );
                }
                return navButton;
              })}
            </nav>

            {/* Bottom section */}
            <div className="px-2 pb-3 space-y-1" style={{ borderTop: "1px solid var(--ms-border)" }}>
              {/* Notifications */}
              {profile?.user_id && sidebarExpanded && (
                <div className="pt-2">
                  <NotificationBell userId={profile.user_id} />
                  <Link
                    to="/settings/notifications"
                    className="block px-3 text-[11px] font-body transition-colors"
                    style={{ color: "var(--ms-text-muted)" }}
                  >
                    Notification settings
                  </Link>
                </div>
              )}
              {!sidebarExpanded && profile?.user_id && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <NavLink to="/settings/notifications" className="flex justify-center py-2">
                      <Bell size={18} style={{ color: "var(--ms-text-muted)" }} />
                    </NavLink>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={16} className="font-body text-[13px] px-3 py-1.5 rounded-md" style={{ background: "#1C2333", border: "1px solid var(--ms-border-active)", color: "#F1F5F9", boxShadow: "0 4px 12px rgba(0,0,0,0.4)" }}>
                    Notifications
                  </TooltipContent>
                </Tooltip>
              )}

              {/* Admin link */}
              {profile?.role === "admin" && sidebarExpanded && (
                <Link
                  to="/admin"
                  className="flex items-center gap-2 px-3 py-2 text-xs font-body transition-colors"
                  style={{ color: "#F5C842" }}
                >
                  <Shield size={14} />
                  Admin Panel
                </Link>
              )}

              {/* User info */}
              {sidebarExpanded ? (
                <div className="px-3 py-2 space-y-1">
                  <Link to="/profile" className="text-[13px] font-body truncate block hover:underline" style={{ color: "var(--ms-text-primary)" }}>
                    {profile?.display_name ?? "Member"}
                  </Link>
                  {profile?.pathway_type && (
                    <p className="text-[11px] font-body" style={{ color: "var(--ms-text-muted)" }}>
                      {nameMap[profile.pathway_type] ?? profile.pathway_type}
                    </p>
                  )}
                  <LanguageSwitcher />
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 text-[12px] font-body transition-colors mt-1"
                    style={{ color: "var(--ms-text-muted)" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--ms-text-primary)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--ms-text-muted)"; }}
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
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-body font-semibold shrink-0"
                        style={{ background: "#C9941E", color: "#0A0D14" }}
                      >
                        {initials}
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={16} className="font-body text-[13px] px-3 py-1.5 rounded-md" style={{ background: "#1C2333", border: "1px solid var(--ms-border-active)", color: "#F1F5F9", boxShadow: "0 4px 12px rgba(0,0,0,0.4)" }}>
                    {profile?.display_name ?? "Member"}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </aside>

          {/* Mobile header */}
          <header
            className="fixed top-0 left-0 right-0 z-40 md:hidden flex items-center justify-between px-4"
            style={{ height: 56, background: "var(--ms-surface-1)", borderBottom: "1px solid var(--ms-border)" }}
          >
            <div className="flex items-center gap-2">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <button style={{ color: "var(--ms-text-primary)" }} className="p-1">
                    <Menu size={24} />
                  </button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[260px] border-none p-0 [&>button]:hidden" style={{ background: "var(--ms-surface-1)" }}>
                  {/* Mobile sidebar content */}
                  <div className="flex flex-col h-full">
                    <div className="px-6 py-6 flex items-center gap-2.5">
                      <LotusIcon className="text-gold" size={28} />
                      <span className="font-heading text-xl tracking-wide" style={{ color: "#C9941E" }}>Money Spirit</span>
                    </div>
                    <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
                      {navItems.map((item) => {
                        const active = location.pathname === item.to;
                        return (
                          <NavLink
                            key={item.to}
                            to={item.to}
                            onClick={() => setMobileOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body transition-colors"
                            style={{
                              background: active ? "var(--ms-surface-3)" : "transparent",
                              color: active ? "#F5C842" : "var(--ms-text-secondary)",
                            }}
                          >
                            <item.icon size={18} style={{ color: active ? "#F5C842" : "var(--ms-text-muted)" }} />
                            {t(item.labelKey)}
                          </NavLink>
                        );
                      })}
                    </nav>
                    {profile?.role === "admin" && (
                      <Link
                        to="/admin"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-2 px-6 py-2 text-xs font-body"
                        style={{ color: "#F5C842" }}
                      >
                        <Shield size={14} />
                        Admin Panel
                      </Link>
                    )}
                    <div className="px-4 py-4 space-y-2" style={{ borderTop: "1px solid var(--ms-border)" }}>
                      <p className="text-sm font-body truncate" style={{ color: "var(--ms-text-primary)" }}>
                        {profile?.display_name ?? "Member"}
                      </p>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-2 text-xs font-body transition-colors"
                        style={{ color: "var(--ms-text-muted)" }}
                      >
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
                  <Bell size={20} style={{ color: "var(--ms-text-secondary)" }} />
                </div>
              )}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-body font-semibold"
                style={{ background: "#C9941E", color: "#0A0D14" }}
              >
                {initials}
              </div>
            </div>
          </header>

          {/* Mobile bottom nav */}
          <nav
            className="fixed bottom-0 left-0 right-0 z-40 md:hidden flex justify-around items-center py-2 px-1"
            style={{ background: "var(--ms-surface-1)", borderTop: "1px solid var(--ms-border)" }}
          >
            {navItems.slice(0, 5).map((item) => {
              const active = location.pathname === item.to;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-body transition-colors"
                  style={{ color: active ? "#F5C842" : "var(--ms-text-muted)" }}
                >
                  <item.icon size={20} />
                  <span>{item.labelKey === "my_pathway" ? "Home" : t(item.labelKey)}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Main content */}
          <main
            className="flex-1 min-h-screen overflow-y-auto pt-14 pb-16 md:pt-0 md:pb-0"
            style={{
              background: "#0A0D14",
              color: "var(--ms-text-primary)",
            }}
          >
            <div
              className="platform-content md:ml-16"
              style={{
                transition: "margin-left 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                ...(typeof window !== 'undefined' && window.innerWidth >= 768 ? { marginLeft: sidebarExpanded ? 240 : 64 } : {}),
              }}
            >
              {/* Desktop top header bar */}
              <div
                className="hidden md:flex sticky top-0 z-40 items-center justify-between px-6"
                style={{
                  height: 56,
                  background: "var(--ms-surface-1)",
                  borderBottom: "1px solid var(--ms-border)",
                }}
              >
                <h2 className="font-heading text-lg" style={{ color: "#F1F5F9" }}>
                  {pageTitle}
                </h2>
                <div className="flex items-center gap-4">
                  {profile?.user_id && (
                    <div className="relative">
                      <Bell size={20} style={{ color: "#94A3B8" }} />
                    </div>
                  )}
                  <Link to="/profile" className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-body font-semibold"
                    style={{ background: "#C9941E", color: "#0A0D14" }}>
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
