import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Users, Flame, CalendarDays, DollarSign, Brain, Target } from "lucide-react";
import LotusIcon from "@/components/LotusIcon";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminRituals from "@/components/admin/AdminRituals";
import AdminEvents from "@/components/admin/AdminEvents";
import AdminRevenue from "@/components/admin/AdminRevenue";
import FounderIntelligence from "@/components/admin/FounderIntelligence";
import FMSLeadBoard from "@/components/admin/FMSLeadBoard";

const tabs = [
  { id: "users", label: "Users", icon: Users },
  { id: "rituals", label: "Rituals", icon: Flame },
  { id: "events", label: "Events", icon: CalendarDays },
  { id: "revenue", label: "Revenue", icon: DollarSign },
  { id: "intelligence", label: "Intelligence", icon: Brain },
  { id: "fms", label: "FMS Leads", icon: Target },
] as const;

type TabId = (typeof tabs)[number]["id"];

const Admin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("users");

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login", { replace: true }); return; }

      // Check role via auth_user_role() which is available as an RPC
      const { data: role } = await supabase.rpc("auth_user_role");
      if (role !== "admin") { navigate("/dashboard", { replace: true }); return; }

      setLoading(false);
    };
    check();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LotusIcon className="text-accent animate-pulse" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-[240px] shrink-0 bg-primary flex flex-col fixed inset-y-0 left-0 z-30">
        <div className="px-6 py-6 flex items-center gap-2.5">
          <LotusIcon className="text-accent" size={28} />
          <span className="text-primary-foreground font-heading text-xl tracking-wide">Admin</span>
        </div>

        <nav className="flex-1 px-3 space-y-0.5">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body transition-colors ${
                  active
                    ? "bg-accent/15 text-primary-foreground"
                    : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/5"
                }`}
              >
                <tab.icon size={18} className={active ? "text-accent" : ""} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-primary-foreground/10">
          <button
            onClick={() => navigate("/dashboard")}
            className="text-primary-foreground/50 hover:text-primary-foreground text-xs font-body transition-colors"
          >
            ← Back to platform
          </button>
        </div>
      </aside>

      <main className="ml-[240px] flex-1 min-h-screen bg-background overflow-y-auto p-8">
        {activeTab === "users" && <AdminUsers />}
        {activeTab === "rituals" && <AdminRituals />}
        {activeTab === "events" && <AdminEvents />}
        {activeTab === "revenue" && <AdminRevenue />}
        {activeTab === "intelligence" && <FounderIntelligence />}
        {activeTab === "fms" && <FMSLeadBoard />}
      </main>
    </div>
  );
};

export default Admin;
