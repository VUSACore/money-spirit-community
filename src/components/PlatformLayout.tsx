import { useEffect, useState, createContext, useContext } from "react";
import { useNavigate, Outlet, NavLink, useLocation, Link } from "react-router-dom";
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

type Profile = Tables<"profiles">;

const ProfileContext = createContext<Profile | null>(null);
export const useProfile = () => useContext(ProfileContext);

const navItems: { labelKey: TranslationKey; to: string; icon: typeof Compass }[] = [
  { labelKey: "my_pathway", to: "/dashboard", icon: Compass },
  { labelKey: "community", to: "/community", icon: Users },
  { labelKey: "forums", to: "/forums", icon: MessageSquare },
  { labelKey: "rituals", to: "/rituals", icon: Flame },
  { labelKey: "learn", to: "/learn", icon: BookOpen },
  { labelKey: "events", to: "/events", icon: CalendarDays },
  { labelKey: "members", to: "/members", icon: Contact },
];

const SidebarContent = ({
  profile,
  location,
  handleSignOut,
  onNavClick,
}: {
  profile: Profile | null;
  location: ReturnType<typeof useLocation>;
  handleSignOut: () => void;
  onNavClick?: () => void;
}) => {
  const { t } = useLanguage();

  return (
    <>
      {/* Logo */}
      <div className="px-6 py-6 flex items-center gap-2.5">
        <LotusIcon className="text-gold" size={28} />
        <span className="text-white font-heading text-xl tracking-wide">Money Spirit</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const active = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavClick}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body transition-colors ${
                active
                  ? "bg-gold/15 text-white"
                  : "text-white/70 hover:text-white hover:bg-white/5"
              }`}
            >
              <item.icon size={18} className={active ? "text-gold" : ""} />
              {t(item.labelKey)}
            </NavLink>
          );
        })}
      </nav>

      {/* Notifications */}
      {profile?.user_id && (
        <div className="px-3 mb-1 space-y-0.5">
          <NotificationBell userId={profile.user_id} />
          <Link
            to="/settings/notifications"
            onClick={onNavClick}
            className="block px-3 text-[11px] font-body text-white/40 hover:underline hover:text-white/60 transition-colors"
          >
            Notification settings
          </Link>
        </div>
      )}

      {/* User / Language / Sign out */}
      <div className="px-4 py-4 border-t border-white/10 space-y-2">
        <p className="text-white text-sm font-body truncate">
          {profile?.display_name ?? "Member"}
        </p>
        {profile?.pathway_type && (() => {
          const accentMap: Record<string, string> = {
            giver: "#E8845C", keeper: "#5B8DB8", rebel: "#9B59B6", seeker: "#27AE8F", achiever: "#C9941E",
          };
          const nameMap: Record<string, string> = {
            giver: "The Giver", keeper: "The Keeper", rebel: "The Rebel", seeker: "The Seeker", achiever: "The Achiever",
          };
          const pt = profile.pathway_type;
          return (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: accentMap[pt] ?? "#C9941E" }} />
              <span className="text-xs font-body text-white/60">{nameMap[pt] ?? pt}</span>
            </div>
          );
        })()}
        {profile?.role === "admin" && (
          <Link
            to="/admin"
            onClick={onNavClick}
            className="flex items-center gap-2 text-accent hover:text-accent/80 text-xs font-body transition-colors"
          >
            <Shield size={14} />
            Admin Panel
          </Link>
        )}
        <LanguageSwitcher />
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 text-white/50 hover:text-white text-xs font-body transition-colors"
        >
          <LogOut size={14} />
          {t("sign_out")}
        </button>
      </div>
    </>
  );
};

const PlatformLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useLanguage();

  useBadgeNotification(profile?.user_id);
  useWeeklyArchetypeScore(profile?.user_id);
  useFMSScoring(profile?.user_id);

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
      <div className="min-h-screen bg-navy-deep flex items-center justify-center">
        <LotusIcon className="text-gold animate-pulse" size={48} />
      </div>
    );
  }

  return (
    <ProfileContext.Provider value={profile}>
      <div className="min-h-screen flex">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-[260px] shrink-0 bg-navy-deep flex-col fixed inset-y-0 left-0 z-30">
          <SidebarContent profile={profile} location={location} handleSignOut={handleSignOut} />
        </aside>

        {/* Mobile header */}
        <header className="fixed top-0 left-0 right-0 z-40 md:hidden bg-navy-deep flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <LotusIcon className="text-gold" size={24} />
            <span className="text-white font-heading text-lg tracking-wide">Money Spirit</span>
          </div>
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button className="text-white p-1">
                <Menu size={24} />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[260px] bg-navy-deep border-none p-0 [&>button]:hidden">
              <SidebarContent
                profile={profile}
                location={location}
                handleSignOut={handleSignOut}
                onNavClick={() => setMobileOpen(false)}
              />
            </SheetContent>
          </Sheet>
        </header>

        {/* Mobile bottom nav */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-navy-deep border-t border-white/10 flex justify-around items-center py-2 px-1">
          {navItems.slice(0, 5).map((item) => {
            const active = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-body transition-colors ${
                  active ? "text-gold" : "text-white/50"
                }`}
              >
                <item.icon size={20} />
                <span>{item.labelKey === "my_pathway" ? "Home" : t(item.labelKey)}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Main content */}
        <main className="md:ml-[260px] flex-1 min-h-screen bg-cream overflow-y-auto pt-14 pb-16 md:pt-0 md:pb-0">
          {/* Gold top border */}
          <div className="h-1 bg-gold w-full" />
          <Outlet />
        </main>
      </div>
    </ProfileContext.Provider>
  );
};

export default PlatformLayout;
