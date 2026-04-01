import { useEffect, useState, createContext, useContext } from "react";
import { useNavigate, Outlet, NavLink, useLocation } from "react-router-dom";
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
} from "lucide-react";
import LotusIcon from "@/components/LotusIcon";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;

const ProfileContext = createContext<Profile | null>(null);
export const useProfile = () => useContext(ProfileContext);

const navItems = [
  { label: "My Pathway", to: "/dashboard", icon: Compass },
  { label: "Community", to: "/community", icon: Users },
  { label: "Forums", to: "/forums", icon: MessageSquare },
  { label: "Rituals", to: "/rituals", icon: Flame },
  { label: "Learn", to: "/learn", icon: BookOpen },
  { label: "Events", to: "/events", icon: CalendarDays },
  { label: "Members", to: "/members", icon: Contact },
];

const PlatformLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

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
        .eq("id", session.user.id)
        .single();

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
        {/* Sidebar */}
        <aside className="w-[260px] shrink-0 bg-navy-deep flex flex-col fixed inset-y-0 left-0 z-30">
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
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body transition-colors ${
                    active
                      ? "bg-gold/15 text-white"
                      : "text-white/70 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <item.icon size={18} className={active ? "text-gold" : ""} />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          {/* User / Sign out */}
          <div className="px-4 py-4 border-t border-white/10">
            <p className="text-white text-sm font-body truncate mb-2">
              {profile?.display_name ?? "Member"}
            </p>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 text-white/50 hover:text-white text-xs font-body transition-colors"
            >
              <LogOut size={14} />
              Sign out
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="ml-[260px] flex-1 min-h-screen bg-cream overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </ProfileContext.Provider>
  );
};

export default PlatformLayout;
