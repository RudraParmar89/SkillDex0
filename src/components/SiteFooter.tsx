import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Mail, ArrowRight } from "lucide-react";
import logo from "@/assets/skilldex-logo.png";
import { useState } from "react";

interface SiteFooterProps {
  onNavigate: (section: string) => void;
}

const SiteFooter = ({ onNavigate }: SiteFooterProps) => {
  const { isRecruiter, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  // Handle the Newsletter Submission
  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      window.location.href = `mailto:skilldex07@gmail.com?subject=Newsletter Subscription&body=Hi! Please add this email to your updates list: ${email}`;
      setEmail("");
    }
  };

  const linkClass = "text-sm text-gray-400 hover:text-white transition-colors duration-200 cursor-pointer block text-left w-full";

  return (
    <footer className="bg-[hsl(220,20%,10%)] text-gray-300">
      <div className="max-w-6xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          
          {/* Brand + Newsletter */}
          <div className="md:col-span-5 space-y-5">
            <div className="flex items-center gap-2">
              <img
                src={logo}
                alt="Skilldex"
                className="h-7 brightness-0 invert opacity-90"
              />
            </div>

            <p className="text-sm text-gray-400 max-w-sm">
              Get the latest updates, AI platform features, and career tips directly to your inbox.
            </p>

            {/* Working Newsletter Form */}
            <form onSubmit={handleSubscribe} className="flex items-center border border-white/20 rounded-lg overflow-hidden max-w-sm focus-within:border-primary/50 transition-colors bg-white/5">
              <div className="px-3 text-gray-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email for updates"
                required
                className="flex-1 bg-transparent text-sm text-gray-200 placeholder:text-gray-500 py-2.5 pr-2 outline-none"
              />
              <button type="submit" aria-label="Subscribe" className="px-4 py-2.5 bg-primary/20 text-primary hover:bg-primary/40 transition-colors flex items-center justify-center">
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Active Links - Distributed into 3 clear columns */}
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
            
            {/* Platform Features */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Platform</h4>
              <ul className="space-y-3">
                <li>
                  <button onClick={() => onNavigate("scanner")} className={linkClass}>
                    AI Resume Scanner
                  </button>
                </li>
                <li>
                  <button onClick={() => onNavigate("jobs")} className={linkClass}>
                    Job Board
                  </button>
                </li>
                {isRecruiter && (
                  <li>
                    <button onClick={() => navigate("/recruiter")} className={linkClass}>
                      Recruiter Dashboard
                    </button>
                  </li>
                )}
                <li>
                  <button onClick={() => onNavigate("plans")} className={linkClass}>
                    Pricing & Plans
                  </button>
                </li>
              </ul>
            </div>

            {/* Support / Contact */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-3">
                <li>
                  <a href="mailto:skilldex07@gmail.com" className={linkClass}>
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="mailto:skilldex07@gmail.com?subject=Help/Support Request" className={linkClass}>
                    Help Center
                  </a>
                </li>
              </ul>
            </div>

            {/* Account Settings */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Account</h4>
              <ul className="space-y-3">
                {user ? (
                  <li>
                    <button onClick={() => navigate("/profile")} className={linkClass}>
                      My Profile
                    </button>
                  </li>
                ) : (
                  <li>
                    <button onClick={() => navigate("/auth")} className={linkClass}>
                      Sign In
                    </button>
                  </li>
                )}
                <li>
                  <button onClick={() => navigate("/auth")} className={linkClass}>
                    Recruiter Login
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Credits & Copyright Bottom Bar */}
      <div className="border-t border-white/10 bg-black/20">
        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-4">
          
          <p className="text-xs text-gray-500 font-medium">
            © {new Date().getFullYear()} Skilldex. All rights reserved.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs text-gray-400">
            <span>Made at</span>
            <a 
              href="https://dcyber.in/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-primary hover:text-white font-semibold transition-colors"
            >
              DCyber.in
            </a>
            <span className="px-1.5 text-gray-600">•</span>
            <span>By</span>
            <a 
              href="https://www.linkedin.com/in/rihanpadhiar/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-primary hover:text-white font-semibold transition-colors"
            >
              Rihan Padhiar
            </a>
            <span className="text-gray-500">&</span>
            <a 
              href="https://www.linkedin.com/in/rudra-parmar-688222357/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-primary hover:text-white font-semibold transition-colors"
            >
              Rudra Parmar
            </a>
          </div>

        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;