import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogIn, User, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/skilldex-logo.png";

interface NavbarProps {
  activeSection: string;
  onNavigate: (section: string) => void;
}

const Navbar = ({ activeSection, onNavigate }: NavbarProps) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isEnterprise, setIsEnterprise] = useState(false);
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Strict Enterprise Check for Navbar
  useEffect(() => {
    if (!user) {
      setIsEnterprise(false);
      return;
    }
    
    const checkEnterpriseAccess = async () => {
      // Admins always get access to the dashboard button
      if (isAdmin) {
        setIsEnterprise(true);
        return;
      }
      
      const { data: cust } = await supabase.from('billing_customers').select('id').eq('user_id', user.id).maybeSingle();
      if (cust) {
        const { data: sub } = await supabase.from('billing_subscriptions').select('plan_name, status')
          .eq('billing_customer_id', cust.id)
          .order('created_at', { ascending: false }).limit(1).maybeSingle();
          
        if (sub && sub.status === 'active' && sub.plan_name === 'enterprise') {
          setIsEnterprise(true);
        } else {
          setIsEnterprise(false);
        }
      }
    };

    checkEnterpriseAccess();
  }, [user, isAdmin]);

  const handleNav = (section: string) => {
    onNavigate(section);
    setMobileOpen(false);
  };

  const navLinks = [
    { id: "home", label: "Home" },
    { id: "scanner", label: "Resume Scanner" },
    { id: "jobs", label: "Job Board" },
    // Only show Dashboard link if they are Enterprise or Admin
    ...(user && isEnterprise ? [{ id: "dashboard", label: "Dashboard", icon: true }] : []),
  ];

  return (
    <>
      <motion.header
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 30 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-background/90 backdrop-blur-2xl shadow-md border-b border-border/60"
            : "bg-background/70 backdrop-blur-xl"
        }`}
      >
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <button onClick={() => handleNav("home")} className="flex items-center gap-2 shrink-0">
            <img src={logo} alt="Skilldex" className="h-8" />
          </button>

          {/* Desktop nav pills */}
          <div className="hidden md:flex items-center gap-1 bg-secondary/80 rounded-full p-1 border border-border/40">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => link.id === "dashboard" ? navigate("/recruiter") : handleNav(link.id)}
                className={`relative px-5 py-1.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                  activeSection === link.id
                    ? "text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {activeSection === link.id && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-full"
                    style={{ background: "var(--gradient-primary)" }}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                  />
                )}
                {'icon' in link && link.icon && <LayoutDashboard className="relative z-10 w-3.5 h-3.5" />}
                <span className="relative z-10">{link.label}</span>
              </button>
            ))}
          </div>

          {/* Right section */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Profile avatar or Sign In */}
            {user ? (
              <button
                onClick={() => navigate("/profile")}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-secondary/80 transition-all"
              >
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground font-display" style={{ background: "var(--gradient-primary)" }}>
                  {(user.user_metadata?.full_name || user.email || "U")[0].toUpperCase()}
                </div>
                <span className="text-sm font-medium text-foreground max-w-[80px] truncate">
                  {user.user_metadata?.full_name || user.email?.split("@")[0]}
                </span>
              </button>
            ) : (
              <button
                onClick={() => navigate("/auth")}
                className="hidden md:flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                <LogIn className="w-4 h-4" /> Sign In
              </button>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-xl hover:bg-secondary transition-colors text-foreground"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </nav>
      </motion.header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
              className="fixed inset-x-0 top-16 z-50 bg-background/98 backdrop-blur-2xl border-b border-border shadow-xl rounded-b-2xl md:hidden"
            >
              <div className="px-4 py-4 space-y-1 max-h-[70vh] overflow-y-auto">
                {navLinks.map((link) => (
                  <button
                    key={link.id}
                    onClick={() => link.id === "dashboard" ? navigate("/recruiter") : handleNav(link.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      activeSection === link.id
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                  >
                    {link.label}
                  </button>
                ))}

                <div className="border-t border-border my-2" />

                {user ? (
                  <button
                    onClick={() => { navigate("/profile"); setMobileOpen(false); }}
                    className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-foreground hover:bg-secondary flex items-center gap-2 transition-all"
                  >
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-primary-foreground font-display" style={{ background: "var(--gradient-primary)" }}>
                      {(user.user_metadata?.full_name || user.email || "U")[0].toUpperCase()}
                    </div>
                    My Profile
                  </button>
                ) : (
                  <button
                    onClick={() => { navigate("/auth"); setMobileOpen(false); }}
                    className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-foreground hover:bg-secondary flex items-center gap-2"
                  >
                    <LogIn className="w-4 h-4" /> Sign In
                  </button>
                )}

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;