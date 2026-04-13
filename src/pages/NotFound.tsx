import { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import LotusIcon from "@/components/LotusIcon";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    supabase.auth.getSession().then(({ data: { session } }) => setAuthed(!!session));
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-sidebar-background flex flex-col items-center justify-center px-6 text-center">
      <LotusIcon className="text-accent" size={36} />
      <p className="font-heading text-2xl text-accent mt-4 tracking-wide">Money Spirit</p>
      <p className="font-heading italic text-sm text-sidebar-foreground/50 mb-8">Spirit Inspired Freedom</p>

      <p className="font-heading text-[120px] leading-none text-accent/30 select-none">404</p>
      <h1 className="font-heading text-[32px] text-sidebar-foreground mt-2">This page has moved on its journey</h1>
      <p className="font-body text-base text-sidebar-foreground/60 max-w-[400px] mt-3 leading-relaxed">
        The page you are looking for does not exist or has been moved. Let us guide you back.
      </p>
      <div className="flex gap-3 mt-8">
        <button
          onClick={() => navigate(authed ? "/dashboard" : "/login")}
          className="btn-gold px-8 py-3 rounded-lg font-body font-semibold text-sm"
        >
          Go to Dashboard
        </button>
        <Link to="/" className="px-8 py-3 rounded-lg font-body font-semibold text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground border border-sidebar-foreground/20 hover:border-sidebar-foreground/40 transition-colors">
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
