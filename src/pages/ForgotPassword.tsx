import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import LotusIcon from "@/components/LotusIcon";
import EthicsFooter from "@/components/EthicsFooter";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError("Email is required"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Invalid email address"); return; }

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
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <LotusIcon className="text-accent mx-auto mb-4" size={48} />
            <h1 className="text-4xl font-heading text-primary mb-2">Money Spirit</h1>
            <p className="text-accent font-body">Reset your password</p>
          </div>

          {sent ? (
            <div className="text-center space-y-4">
              <p className="text-foreground font-body">
                We've sent a password reset link to <span className="text-accent font-semibold">{email}</span>. Please check your inbox.
              </p>
              <Link to="/login" className="text-accent hover:underline text-sm font-body">
                Back to sign in
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-border p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-xl px-4 py-3 text-sm font-body">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-primary text-sm font-body font-medium mb-1.5">Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="ms-input" placeholder="you@example.com" />
                </div>

                <Button type="submit" variant="gold" className="w-full rounded-xl h-11" disabled={loading}>
                  {loading ? "Sending..." : "Send Reset Link"}
                </Button>

                <p className="text-center text-muted-foreground text-sm font-body">
                  Remember your password?{" "}
                  <Link to="/login" className="text-accent hover:underline">Sign in</Link>
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
