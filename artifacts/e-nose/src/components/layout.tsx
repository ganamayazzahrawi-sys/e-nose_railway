import { Link, useLocation } from "wouter";
import { LayoutDashboard, Users, ActivitySquare, Database, Menu, X, Wind } from "lucide-react";
import { useState, useEffect } from "react";
import { DeviceStatusBadge } from "./device-status";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/respondents", label: "Respondents", icon: Users },
  { href: "/sessions/new", label: "New Session", icon: ActivitySquare },
  { href: "/data", label: "Data Explorer", icon: Database },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row font-sans">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b bg-card z-20 sticky top-0">
        <div className="flex items-center gap-2">
          <Wind className="w-6 h-6 text-primary" />
          <span className="font-display font-bold text-lg">E-Nose IoT</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </Button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-10 w-64 bg-card border-r flex flex-col transition-transform duration-300 ease-in-out shadow-lg md:shadow-none
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        md:sticky md:top-0 md:h-screen
      `}>
        <div className="p-6 hidden md:flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-md shadow-primary/20">
            <Wind className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl tracking-tight text-foreground leading-none">E-Nose</h1>
            <p className="text-xs text-muted-foreground font-medium">IoT Diabetes Detection</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 md:py-2 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            const Icon = item.icon;
            
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200
                  ${isActive 
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }
                `}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-primary-foreground" : ""}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t">
          <div className="bg-muted rounded-xl p-4">
            <p className="text-xs text-muted-foreground font-medium mb-1">System Status</p>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              All systems nominal
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b bg-card/80 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between px-6 shrink-0">
          <h2 className="font-display font-semibold text-lg hidden md:block">
            {NAV_ITEMS.find(item => item.href === location || (item.href !== "/" && location.startsWith(item.href)))?.label || "Dashboard"}
          </h2>
          <div className="flex items-center gap-4 ml-auto">
            <DeviceStatusBadge />
          </div>
        </header>

        {/* Page Content with scroll */}
        <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 relative">
          <div className="max-w-6xl mx-auto w-full">
            {children}
          </div>
        </div>
      </main>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-0 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
