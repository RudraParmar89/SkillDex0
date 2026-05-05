import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Eye, EyeOff, LogIn, UserPlus, Loader2, ArrowLeft } from "lucide-react";
import logo from "@/assets/skilldex-logo.png";
import { supabase } from "@/integrations/supabase/client";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) { toast.error(error); return; }
        toast.success("Welcome back!");
      } else {
        const { error } = await signUp(email, password, fullName);
        if (error) { toast.error(error); return; }
        toast.success("Account created successfully! Please sign in.");
        setIsLogin(true); // Switch to login after signup
      }
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google') => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
        }
      });
      if (error) throw error;
    } catch (err: any) {
      toast.error(err.message || `Failed to sign in with ${provider}`);
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      toast.error("Please enter your email address first.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`, // Redirects back here to type new password
      });
      if (error) throw error;
      toast.success("Password reset link sent to your email!");
    } catch (err: any) {
      toast.error(err.message || "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "radial-gradient(hsl(var(--foreground)) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <div className="absolute top-20 right-20 w-[400px] h-[400px] rounded-full opacity-[0.06]"
          style={{ background: "radial-gradient(circle, hsl(var(--primary)), transparent 70%)" }} />
        <div className="absolute bottom-20 left-20 w-[300px] h-[300px] rounded-full opacity-[0.04]"
          style={{ background: "radial-gradient(circle, hsl(var(--accent)), transparent 70%)" }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md pt-8 pb-12"
      >
        {/* Back Button */}
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>

        <div className="text-center mb-8">
          <img src={logo} alt="Skilldex" className="h-10 mx-auto mb-4" />
          <h1 className="text-2xl font-display font-bold text-foreground">
            {isLogin ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLogin ? "Sign in to access resume scanner & jobs" : "Join Skilldex to scan resumes and find jobs"}
          </p>
        </div>

        <div className="card-glass rounded-2xl p-6 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="text-sm font-medium mb-1.5 block text-foreground">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-input border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
                  placeholder="John Doe"
                  required={!isLogin}
                />
              </div>
            )}
            <div>
              <label className="text-sm font-medium mb-1.5 block text-foreground">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-input border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-foreground">Password</label>
                {isLogin && (
                  <button type="button" onClick={handleResetPassword} className="text-xs text-primary hover:underline font-medium">
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-input border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 pr-10 transition-shadow"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-2 rounded-xl font-display font-semibold text-sm text-primary-foreground flex items-center justify-center gap-2 disabled:opacity-50 transition-transform active:scale-[0.98]"
              style={{ background: "var(--gradient-primary)" }}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isLogin ? (
                <><LogIn className="w-4 h-4" /> Sign In</>
              ) : (
                <><UserPlus className="w-4 h-4" /> Create Account</>
              )}
            </button>
          </form>

          {/* Social Logins */}
          <div className="mt-6">
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-border"></div>
              <span className="flex-shrink-0 mx-4 text-xs text-muted-foreground uppercase tracking-wider font-medium">
                Or continue with
              </span>
              <div className="flex-grow border-t border-border"></div>
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={() => handleOAuth('google')}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-input border border-border rounded-xl text-sm font-medium hover:bg-secondary transition-colors disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115Z"/>
                  <path fill="#34A853" d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 0 1-6.723-4.806L1.248 17.4C3.208 21.325 7.29 24 12 24c3.106 0 5.922-1.01 7.91-2.735l-3.87-2.98Z"/>
                  <path fill="#4A90E2" d="M23.75 12.27c0-.79-.07-1.54-.19-2.27h-11.56v4.51h6.59c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82Z"/>
                  <path fill="#FBBC05" d="M5.277 14.268A7.12 7.12 0 0 1 4.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 0 0 0 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067Z"/>
                </svg>
                Continue with Google
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;