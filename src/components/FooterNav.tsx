import { FileSearch, Briefcase, LayoutDashboard, Home } from "lucide-react";

interface FooterNavProps {
  activeSection: string;
  onNavigate: (section: string) => void;
}

const navItems = [
  { id: "home", label: "Home", icon: Home },
  { id: "scanner", label: "Scanner", icon: FileSearch },
  { id: "jobs", label: "Jobs", icon: Briefcase },
  { id: "recruiter", label: "Recruiter", icon: LayoutDashboard },
];

const FooterNav = ({ activeSection, onNavigate }: FooterNavProps) => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/90 backdrop-blur-xl">
      <nav className="flex items-center justify-around max-w-lg mx-auto py-2">
        {navItems.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all duration-200 ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? "drop-shadow-[0_0_6px_hsl(190_100%_50%/0.6)]" : ""}`} />
              <span className="text-xs font-medium font-display">{item.label}</span>
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </nav>
    </footer>
  );
};

export default FooterNav;
