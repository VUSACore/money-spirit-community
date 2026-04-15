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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-void)' }}>
        <LotusIcon className="text-gold animate-pulse" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex platform-bg" style={{
      background: `
        radial-gradient(ellipse 80% 50% at 50% -10%, rgba(201, 148, 30, 0.08) 0%, transparent 60%),
        linear-gradient(180deg, #060912 0%, #080D1A 40%, #0C1221 100%)
      `,
    }}>
      {/* Desktop sidebar - hidden on mobile */}
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
        <div className="px-5 py-5 flex items-center gap-2.5 min-h-[56px]">
          <LotusIcon className="text-gold shrink-0" size={24} />
          {sidebarExpanded && (
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 400, color: 'var(--gold-base)', whiteSpace: 'nowrap' }}>Admin</span>
          )}
        </div>

        <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className="w-full flex items-center gap-3 transition-colors"
                style={{
                  padding: sidebarExpanded ? '10px 16px' : '10px 0',
                  justifyContent: sidebarExpanded ? 'flex-start' : 'center',
                  height: 44,
                  fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 500,
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
                onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; }}
                onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <tab.icon size={18} className="shrink-0" style={{ color: active ? 'var(--gold-bright)' : 'var(--text-3)' }} />
                {sidebarExpanded && <span className="whitespace-nowrap">{tab.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="px-3 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {sidebarExpanded && (
            <button onClick={() => navigate("/dashboard")} style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--text-3)' }} className="transition-colors">
              ← Back to platform
            </button>
          )}
        </div>
      </aside>

      {/* Mobile header */}
      <header
        className="fixed top-0 left-0 right-0 z-40 md:hidden flex items-center justify-between px-4"
        style={{
          height: 56,
          background: 'rgba(6, 12, 24, 0.90)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="flex items-center gap-2">
          <LotusIcon className="text-gold shrink-0" size={20} />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 400, color: 'var(--gold-base)' }}>Admin</span>
        </div>
        <button onClick={() => navigate("/dashboard")} style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--text-3)' }}>
          ← Platform
        </button>
      </header>

      {/* Mobile tab bar — horizontal scroll */}
      <div
        className="fixed top-14 left-0 right-0 z-30 md:hidden overflow-x-auto scrollbar-hide"
        style={{
          background: 'rgba(6, 12, 24, 0.85)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="flex gap-1 px-3 py-2 min-w-max">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { handleTabChange(tab.id); setMobileMenuOpen(false); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors"
                style={{
                  fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 500,
                  background: active ? 'rgba(201,148,30,0.15)' : 'transparent',
                  color: active ? 'var(--gold-bright)' : 'var(--text-3)',
                  border: active ? '1px solid rgba(201,148,30,0.25)' : '1px solid transparent',
                }}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <main
        className="flex-1 min-h-screen overflow-y-auto p-4 pt-28 md:pt-8 md:p-8"
        style={{
          marginLeft: 0,
          transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div className="hidden md:block" style={{
          marginLeft: sidebarExpanded ? 240 : 64,
          transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}>
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
        </div>
        <div className="md:hidden">
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
        </div>
      </main>
    </div>
  );
};

export default Admin;
