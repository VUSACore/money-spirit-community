import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import LotusIcon from "@/components/LotusIcon";

const Register = () => {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

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
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setErrors({});

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { display_name: displayName.trim() },
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      setErrors({ general: error.message });
      setLoading(false);
      return;
    }

    navigate("/onboarding");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <LotusIcon className="text-accent mx-auto mb-4" size={48} />
          <h1 className="text-4xl font-heading text-primary mb-2">Money Spirit</h1>
          <p className="text-accent font-body">Join Money Spirit</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-border p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {errors.general && (
              <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-xl px-4 py-3 text-sm font-body">
                {errors.general}
              </div>
            )}

            <div>
              <label className="block text-primary text-sm font-body font-medium mb-1.5">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="ms-input"
                placeholder="Your name"
              />
              {errors.displayName && <p className="text-destructive text-sm mt-1 font-body">{errors.displayName}</p>}
            </div>

            <div>
              <label className="block text-primary text-sm font-body font-medium mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="ms-input"
                placeholder="you@example.com"
              />
              {errors.email && <p className="text-destructive text-sm mt-1 font-body">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-primary text-sm font-body font-medium mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="ms-input"
                placeholder="••••••••"
              />
              {errors.password && <p className="text-destructive text-sm mt-1 font-body">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-primary text-sm font-body font-medium mb-1.5">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="ms-input"
                placeholder="••••••••"
              />
              {errors.confirmPassword && <p className="text-destructive text-sm mt-1 font-body">{errors.confirmPassword}</p>}
            </div>

            <Button type="submit" variant="gold" className="w-full rounded-xl h-11" disabled={loading}>
              {loading ? "Creating account..." : "Join Money Spirit"}
            </Button>

            <p className="text-center text-muted-foreground text-sm font-body">
              Already have an account?{" "}
              <Link to="/login" className="text-accent hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </form>
        </div>

        <p className="text-center text-muted-foreground text-xs font-body mt-6">
          <Link to="/ethics" className="hover:underline">Ethics &amp; educational commitment</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
