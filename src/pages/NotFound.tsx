import { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SEOHead from "@/components/SEOHead";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    supabase.auth.getSession().then(({ data: { session } }) => setAuthed(!!session));
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: '#0B1F3A' }}>
      <SEOHead title="Page Not Found — Money Spirit" description="The page you're looking for doesn't exist or has been moved." />
      <p style={{
        fontFamily: 'var(--font-display)', fontSize: '120px', lineHeight: 1,
        color: 'rgba(196,151,58,0.12)', fontWeight: 300, userSelect: 'none',
      }}>404</p>
      <h1 style={{
        fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 400,
        color: '#F2EAD8', marginTop: '8px', letterSpacing: '-0.02em',
      }}>This page has moved on its journey</h1>
      <p style={{
        fontFamily: 'var(--font-body)', fontSize: '14px', color: '#A08B62',
        maxWidth: '380px', marginTop: '12px', lineHeight: 1.65,
      }}>
        The page you're looking for doesn't exist or has been moved. Let us guide you back.
      </p>
      <div className="flex gap-3 mt-8">
        <button
          onClick={() => navigate(authed ? "/dashboard" : "/login")}
          className="btn-gold px-8 py-3"
        >
          {authed ? "Go to Dashboard" : "Sign In"}
        </button>
        <Link to="/" className="px-8 py-3 rounded-full font-body text-sm transition-colors" style={{
          color: '#A08B62', border: '1px solid rgba(196,151,58,0.20)',
        }}>
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
