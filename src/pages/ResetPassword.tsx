import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import LotusIcon from "@/components/LotusIcon";
import EthicsFooter from "@/components/EthicsFooter";

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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <LotusIcon className="text-accent mx-auto mb-4" size={48} />
            <h1 className="text-4xl font-heading text-primary mb-2">Money Spirit</h1>
            <p className="text-accent font-body">Set your new password</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-border p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {errors.general && (
                <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-xl px-4 py-3 text-sm font-body">{errors.general}</div>
              )}

              <div>
                <label className="block text-primary text-sm font-body font-medium mb-1.5">New Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="ms-input" placeholder="••••••••" />
                {errors.password && <p className="text-destructive text-sm mt-1 font-body">{errors.password}</p>}
              </div>

              <div>
                <label className="block text-primary text-sm font-body font-medium mb-1.5">Confirm New Password</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="ms-input" placeholder="••••••••" />
                {errors.confirmPassword && <p className="text-destructive text-sm mt-1 font-body">{errors.confirmPassword}</p>}
              </div>

              <Button type="submit" variant="gold" className="w-full rounded-xl h-11" disabled={loading}>
                {loading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </div>
        </div>
      </div>
      <EthicsFooter />
    </div>
  );
};

export default ResetPassword;
