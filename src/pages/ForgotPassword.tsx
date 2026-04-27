import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import EthicsFooter from "@/components/EthicsFooter";
import SEOHead from "@/components/SEOHead";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError("Email is required"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Please enter a valid email address"); return; }

    setLoading(true);
    setError("");

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (resetError) { setError(resetError.message); setLoading(false); return; }
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#005eb8' }}>
      <SEOHead title="Reset Password — Money Spirit" description="Reset your Money Spirit password. Enter your email and we'll send you a secure reset link." />
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', color: '#E0B040', fontWeight: 700, marginBottom: '6px' }}>Money Spirit</h1>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#D8C896' }}>Reset your password</p>
          </div>

          {sent ? (
            <div style={{
              background: 'rgba(13,27,46,0.70)',
              border: '1px solid rgba(224,176,64,0.18)',
              borderRadius: 'var(--r-xl)',
              boxShadow: 'inset 0 1px 0 rgba(248,220,138,0.20), 0 24px 60px rgba(0,0,0,0.60)',
              padding: '40px 36px',
              backdropFilter: 'blur(20px)',
              textAlign: 'center',
            }}>
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center" style={{
                  background: 'rgba(39,174,143,0.12)',
                  border: '1px solid rgba(39,174,143,0.25)',
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#27AE8F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
                </div>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#F0E8D4', lineHeight: 1.6 }}>
                  We've sent a reset link to <span style={{ color: '#F8DC8A', fontWeight: 500 }}>{email}</span>. Please check your inbox.
                </p>
                <Link to="/login" style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#E0B040' }}>
                  Back to sign in
                </Link>
              </div>
            </div>
          ) : (
            <div style={{
              background: 'rgba(13,27,46,0.70)',
              border: '1px solid rgba(224,176,64,0.18)',
              borderRadius: 'var(--r-xl)',
              boxShadow: 'inset 0 1px 0 rgba(248,220,138,0.20), 0 24px 60px rgba(0,0,0,0.60)',
              padding: '40px 36px',
              backdropFilter: 'blur(20px)',
            }}>
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div style={{
                    background: 'rgba(220,38,38,0.10)', border: '1px solid rgba(220,38,38,0.30)',
                    borderRadius: '12px', padding: '12px 16px',
                    fontFamily: 'var(--font-body)', fontSize: '14px', color: '#F87171',
                  }}>
                    {error}
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '13px', color: '#D8C896', marginBottom: '6px' }}>Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="ms-input-dark" placeholder="you@example.com" />
                </div>

                <Button type="submit" variant="gold" className="w-full btn-gold" style={{ height: 44, borderRadius: 'var(--r-pill)' }} disabled={loading}>
                  {loading ? "Sending…" : "Send Reset Link"}
                </Button>

                <p style={{ textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: '14px', color: '#5C4E34' }}>
                  Remember your password?{" "}
                  <Link to="/login" style={{ color: '#E0B040', fontWeight: 500 }}>Sign in</Link>
                </p>
              </form>
            </div>
          )}
        </div>
      </div>
      <EthicsFooter />
    </div>
  );
};

export default ForgotPassword;
