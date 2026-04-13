import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Users, Flame, CalendarDays, DollarSign, Brain, Target, FileText, BookOpen, Settings, ClipboardList } from "lucide-react";
import LotusIcon from "@/components/LotusIcon";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminRituals from "@/components/admin/AdminRituals";
import AdminEvents from "@/components/admin/AdminEvents";
import AdminRevenue from "@/components/admin/AdminRevenue";
import FounderIntelligence from "@/components/admin/FounderIntelligence";
import FMSLeadBoard from "@/components/admin/FMSLeadBoard";
import AdminContent from "@/components/admin/AdminContent";
import AdminCourses from "@/components/admin/AdminCourses";
import AdminSettings from "@/components/admin/AdminSettings";
import AdminAuditLog from "@/components/admin/AdminAuditLog";

const tabs = [
  { id: "users", label: "Users", icon: Users },
  { id: "content", label: "Content", icon: FileText },
  { id: "courses", label: "Courses", icon: BookOpen },
  { id: "rituals", label: "Rituals", icon: Flame },
  { id: "events", label: "Events", icon: CalendarDays },
  { id: "revenue", label: "Revenue", icon: DollarSign },
  { id: "intelligence", label: "Intelligence", icon: Brain },
  { id: "fms", label: "FMS Leads", icon: Target },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "audit", label: "Audit Log", icon: ClipboardList },
] as const;

type TabId = (typeof tabs)[number]["id"];

const tabIdFromParam = (param?: string): TabId | null => {
  const map: Record<string, TabId> = {
    users: "users", content: "content", courses: "courses",
    rituals: "rituals", events: "events", revenue: "revenue",
    intelligence: "intelligence", "fms-leads": "fms", fms: "fms",
    settings: "settings", audit: "audit",
  };
  return param ? map[param] ?? null : null;
};

const Admin = () => {
  const navigate = useNavigate();
  const { tabId: tabParam } = useParams<{ tabId?: string }>();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>(tabIdFromParam(tabParam) || "users");
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  useEffect(() => {
    const t = tabIdFromParam(tabParam);
    if (t && t !== activeTab) setActiveTab(t);
  }, [tabParam]);

  const handleTabChange = (id: TabId) => {
    setActiveTab(id);
    navigate(`/admin/${id === "fms" ? "fms-leads" : id}`, { replace: true });
  };

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login", { replace: true }); return; }
      const { data: role } = await supabase.rpc("auth_user_role");
      if (role !== "admin") { navigate("/dashboard", { replace: true }); return; }
      setLoading(false);
    };
    check();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--ms-base)" }}>
        <LotusIcon className="text-gold animate-pulse" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ background: "var(--ms-base)" }}>
      <aside
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
        className="flex flex-col fixed inset-y-0 left-0 z-30 overflow-hidden"
        style={{
          width: sidebarExpanded ? 240 : 64,
          background: "var(--ms-surface-1)",
          borderRight: "1px solid var(--ms-border)",
          transition: "width 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div className="px-5 py-5 flex items-center gap-2.5 min-h-[56px]">
          <LotusIcon className="text-gold shrink-0" size={24} />
          {sidebarExpanded && (
            <span className="font-heading text-lg tracking-wide whitespace-nowrap" style={{ color: "#C9941E" }}>Admin</span>
          )}
        </div>

        <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className="w-full flex items-center gap-3 rounded-lg text-[13px] font-body font-medium transition-colors"
                style={{
                  padding: sidebarExpanded ? "10px 16px" : "10px 0",
                  justifyContent: sidebarExpanded ? "flex-start" : "center",
                  height: 44,
                  background: active ? "var(--ms-surface-3)" : "transparent",
                  borderLeft: active && sidebarExpanded ? "2px solid #F5C842" : "2px solid transparent",
                  color: active ? "#F5C842" : "var(--ms-text-muted)",
                }}
                onMouseEnter={(e) => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = "var(--ms-surface-2)";
                }}
                onMouseLeave={(e) => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                <tab.icon size={18} className="shrink-0" style={{ color: active ? "#F5C842" : "var(--ms-text-muted)" }} />
                {sidebarExpanded && <span className="whitespace-nowrap">{tab.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="px-3 py-4" style={{ borderTop: "1px solid var(--ms-border)" }}>
          {sidebarExpanded ? (
            <button
              onClick={() => navigate("/dashboard")}
              className="text-xs font-body transition-colors"
              style={{ color: "var(--ms-text-muted)" }}
            >
              ← Back to platform
            </button>
          ) : null}
        </div>
      </aside>

      <main
        className="flex-1 min-h-screen overflow-y-auto p-8"
        style={{
          marginLeft: sidebarExpanded ? 240 : 64,
          background: "var(--ms-base)",
          transition: "margin-left 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div className="md:hidden rounded-lg px-4 py-3 mb-6" style={{ background: "var(--ms-surface-1)", border: "1px solid var(--ms-border)" }}>
          <p className="text-sm font-body" style={{ color: "var(--ms-text-secondary)" }}>The admin panel is best viewed on desktop.</p>
        </div>
        {activeTab === "users" && <AdminUsers />}
        {activeTab === "content" && <AdminContent />}
        {activeTab === "courses" && <AdminCourses />}
        {activeTab === "rituals" && <AdminRituals />}
        {activeTab === "events" && <AdminEvents />}
        {activeTab === "revenue" && <AdminRevenue />}
        {activeTab === "intelligence" && <FounderIntelligence />}
        {activeTab === "fms" && <FMSLeadBoard />}
        {activeTab === "settings" && <AdminSettings />}
        {activeTab === "audit" && <AdminAuditLog />}
      </main>
    </div>
  );
};

export default Admin;
