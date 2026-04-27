import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import EthicsFooter from "@/components/EthicsFooter";
import SEOHead from "@/components/SEOHead";

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [affiliate, setAffiliate] = useState<{ id: string; name: string; discount_percent: number } | null>(null);

  // Look up affiliate from ?ref=code
  useEffect(() => {
    const code = searchParams.get("ref");
    if (!code) return;
    (async () => {
      const { data } = await supabase
        .from("affiliates" as any)
        .select("id, name, discount_percent")
        .eq("code", code)
        .eq("active", true)
        .maybeSingle();
      if (data) setAffiliate(data as any);
    })();
  }, [searchParams]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!displayName.trim()) newErrors.displayName = "Display name is required";
    else if (displayName.trim().length > 100) newErrors.displayName = "Display name must be less than 100 characters";
    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = "Invalid email address";
    if (!password) newErrors.password = "Password is required";
    else if (password.length < 6) newErrors.password = "Password must be at least 6 characters";
    if (!confirmPassword) newErrors.confirmPassword = "Please confirm your password";
    else if (password !== confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    if (!termsAccepted) newErrors.terms = "Please accept the terms to continue";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    const { data: signUpData, error } = await supabase.auth.signUp({
      email: email.trim(), password,
      options: { data: { display_name: displayName.trim() }, emailRedirectTo: window.location.origin },
    });
    if (error) { setErrors({ general: error.message }); setLoading(false); return; }

    // Record affiliate referral if applicable
    const userId = signUpData.user?.id;
    if (affiliate && userId) {
      try {
        await supabase.from("affiliate_referrals" as any).insert({
          affiliate_id: affiliate.id,
          user_id: userId,
        });
        await supabase.from("profiles").update({
          referred_by_affiliate_id: affiliate.id,
          affiliate_discount_percent: affiliate.discount_percent,
        } as any).eq("user_id", userId);
      } catch {
        // non-blocking
      }
    }

    navigate("/onboarding");
  };

  const labelStyle: React.CSSProperties = { display: 'block', fontFamily: 'var(--font-body)', fontSize: '13px', color: '#A08B62', marginBottom: '6px' };
  const errorStyle: React.CSSProperties = { color: '#F87171', fontSize: '13px', fontFamily: 'var(--font-body)', marginTop: '4px' };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0B1F3A' }}>
      <SEOHead title="Create Account — Money Spirit" description="Join Money Spirit. Create your free account to access rituals, courses, events and a supportive community for financial wellbeing." />
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img src="/logo.png" alt="Money Spirit" style={{ width: 64, height: 64, margin: '0 auto 16px', filter: 'drop-shadow(0 0 10px rgba(196,151,58,0.20))' }} />
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', color: '#C4973A', fontWeight: 700, marginBottom: '6px' }}>Money Spirit</h1>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#A08B62' }}>Join Money Spirit</p>
            {affiliate && (
              <div style={{
                marginTop: 16,
                background: 'rgba(196,151,58,0.10)',
                border: '1px solid rgba(196,151,58,0.30)',
                borderRadius: 12,
                padding: '10px 14px',
                fontFamily: 'var(--font-body)', fontSize: 13, color: '#C4973A',
              }}>
                Referred by <strong>{affiliate.name}</strong>
                {affiliate.discount_percent > 0 && ` · ${affiliate.discount_percent}% off your subscription`}
              </div>
            )}
          </div>

          <div style={{
            background: 'rgba(13,27,46,0.70)',
            border: '1px solid rgba(196,151,58,0.18)',
            borderRadius: 'var(--r-xl)',
            boxShadow: 'inset 0 1px 0 rgba(238,201,110,0.20), 0 24px 60px rgba(0,0,0,0.60)',
            padding: 'clamp(24px, 5vw, 40px) clamp(20px, 5vw, 36px)',
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
                <label style={labelStyle}>Display Name</label>
                <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="ms-input-dark" placeholder="Your name" />
                {errors.displayName && <p style={errorStyle}>{errors.displayName}</p>}
              </div>

              <div>
                <label style={labelStyle}>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="ms-input-dark" placeholder="you@example.com" />
                {errors.email && <p style={errorStyle}>{errors.email}</p>}
              </div>

              <div>
                <label style={labelStyle}>Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="ms-input-dark" placeholder="••••••••" />
                {errors.password && <p style={errorStyle}>{errors.password}</p>}
              </div>

              <div>
                <label style={labelStyle}>Confirm Password</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="ms-input-dark" placeholder="••••••••" />
                {errors.confirmPassword && <p style={errorStyle}>{errors.confirmPassword}</p>}
              </div>

              <div className="flex items-start gap-2.5">
                <input type="checkbox" id="terms" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded" style={{ accentColor: '#C4973A' }} />
                <label htmlFor="terms" style={{ fontSize: '13px', fontFamily: 'var(--font-body)', color: '#A08B62', lineHeight: 1.5 }}>
                  I agree to the{" "}
                  <Link to="/terms" style={{ color: '#C4973A' }} target="_blank">Terms of Service</Link>
                  {" "}and have read the{" "}
                  <Link to="/privacy" style={{ color: '#C4973A' }} target="_blank">Privacy Policy</Link>
                  {" "}and{" "}
                  <Link to="/ethics" style={{ color: '#C4973A' }} target="_blank">Ethics &amp; Education Policy</Link>.
                </label>
              </div>
              {errors.terms && <p style={errorStyle}>{errors.terms}</p>}

              <Button type="submit" variant="gold" className="w-full btn-gold" style={{ height: 44, borderRadius: 'var(--r-pill)' }} disabled={loading}>
                {loading ? "Creating account..." : "Join Money Spirit"}
              </Button>

              <p style={{ textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: '14px', color: '#5C4E34' }}>
                Already have an account?{" "}
                <Link to="/login" style={{ color: '#C4973A', fontWeight: 500 }}>Sign in</Link>
              </p>
            </form>
          </div>
        </div>
      </div>
      <EthicsFooter />
    </div>
  );
};

export default Register;
