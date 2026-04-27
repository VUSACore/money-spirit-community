import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import EthicsFooter from "@/components/EthicsFooter";
import SEOHead from "@/components/SEOHead";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!password) newErrors.password = "Password is required";
    else if (password.length < 6) newErrors.password = "Password must be at least 6 characters";
    if (password !== confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    if (Object.keys(newErrors).length) { setErrors(newErrors); return; }

    setLoading(true);
    setErrors({});
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { setErrors({ general: error.message }); setLoading(false); return; }
    navigate("/dashboard");
  };

  const labelStyle: React.CSSProperties = { display: 'block', fontFamily: 'var(--font-body)', fontSize: '13px', color: '#A08B62', marginBottom: '6px' };
  const errorStyle: React.CSSProperties = { color: '#F87171', fontSize: '13px', fontFamily: 'var(--font-body)', marginTop: '4px' };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#4169E1' }}>
      <SEOHead title="Set New Password — Money Spirit" noindex />
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', color: '#C4973A', fontWeight: 700, marginBottom: '6px' }}>Money Spirit</h1>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#A08B62' }}>Set your new password</p>
          </div>

          {!ready ? (
            <div style={{
              background: 'rgba(13,27,46,0.70)',
              border: '1px solid rgba(196,151,58,0.18)',
              borderRadius: 'var(--r-xl)',
              boxShadow: 'inset 0 1px 0 rgba(238,201,110,0.20), 0 24px 60px rgba(0,0,0,0.60)',
              padding: '40px 36px',
              backdropFilter: 'blur(20px)',
              textAlign: 'center',
            }}>
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#C4973A', borderTopColor: 'transparent' }} />
                <p style={{ color: '#A08B62', fontSize: '14px', fontFamily: 'var(--font-body)' }}>Verifying your reset link…</p>
              </div>
            </div>
          ) : (
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
                  <label style={labelStyle}>New Password</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="ms-input-dark" placeholder="••••••••" />
                  {errors.password && <p style={errorStyle}>{errors.password}</p>}
                </div>

                <div>
                  <label style={labelStyle}>Confirm New Password</label>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="ms-input-dark" placeholder="••••••••" />
                  {errors.confirmPassword && <p style={errorStyle}>{errors.confirmPassword}</p>}
                </div>

                <Button type="submit" variant="gold" className="w-full btn-gold" style={{ height: 44, borderRadius: 'var(--r-pill)' }} disabled={loading}>
                  {loading ? "Updating…" : "Update Password"}
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
      <EthicsFooter />
    </div>
  );
};

export default ResetPassword;
