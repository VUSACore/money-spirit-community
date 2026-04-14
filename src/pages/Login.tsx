import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import EthicsFooter from "@/components/EthicsFooter";
import LoadingScreen from "@/components/LoadingScreen";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [loading, setLoading] = useState(false);
  const [showLoading, setShowLoading] = useState(false);

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = "Invalid email address";
    if (!password) newErrors.password = "Password is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) { setErrors({ general: error.message }); setLoading(false); return; }
    setShowLoading(true);
  };

  return (
    <>
      {showLoading && (
        <LoadingScreen onComplete={() => navigate('/dashboard')} />
      )}
      <div className="min-h-screen flex flex-col" style={{ background: '#0B1F3A' }}>
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', color: '#C4973A', fontWeight: 700, marginBottom: '6px' }}>Money Spirit</h1>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#A08B62', marginBottom: '24px' }}>Welcome back</p>
          </div>

          <div style={{
            background: 'rgba(13,27,46,0.70)',
            border: '1px solid rgba(196,151,58,0.18)',
            borderRadius: 'var(--r-xl)',
            boxShadow: 'inset 0 1px 0 rgba(238,201,110,0.20), 0 24px 60px rgba(0,0,0,0.60)',
            padding: '40px 36px',
            backdropFilter: 'blur(20px)',
          }}>
            <form onSubmit={handleSubmit} className="space-y-5">
              {errors.general && (
                <div style={{
                  background: 'rgba(220,38,38,0.10)', border: '1px solid rgba(220,38,38,0.30)',
                  borderRadius: '12px', padding: '12px 16px',
                  fontFamily: 'var(--font-body)', fontSize: '14px', color: '#F87171',
                }}>
                  {errors.general}
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '13px', color: '#A08B62', marginBottom: '6px' }}>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="ms-input-dark" placeholder="you@example.com" />
                {errors.email && <p style={{ color: '#F87171', fontSize: '13px', fontFamily: 'var(--font-body)', marginTop: '4px' }}>{errors.email}</p>}
              </div>

              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '13px', color: '#A08B62', marginBottom: '6px' }}>Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="ms-input-dark" placeholder="••••••••" />
                {errors.password && <p style={{ color: '#F87171', fontSize: '13px', fontFamily: 'var(--font-body)', marginTop: '4px' }}>{errors.password}</p>}
              </div>

              <div className="text-right">
                <Link to="/forgot-password" style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#C4973A' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#EEC96E'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#C4973A'; }}
                >
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" variant="gold" className="w-full btn-gold" style={{ height: 44, borderRadius: 'var(--r-pill)' }} disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </Button>

              <p style={{ textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: '14px', color: '#5C4E34' }}>
                Don't have an account?{" "}
                <Link to="/register" style={{ color: '#C4973A', fontWeight: 500 }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#EEC96E'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#C4973A'; }}
                >
                  Create one
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
      <EthicsFooter />
    </div>
  );
};

export default Login;
