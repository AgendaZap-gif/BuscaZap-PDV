import { Link, useLocation } from "wouter";
import { clearCompanyAuth } from "./AdminLogin";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Users, Brain, Megaphone, LogOut } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [path] = useLocation();

  const handleLogout = () => {
    clearCompanyAuth();
    window.location.href = "/admin/login";
  };

  const nav = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/leads", label: "Leads", icon: Users },
    { href: "/admin/training", label: "Treinar IA", icon: Brain },
    { href: "/admin/promotions", label: "Promoções", icon: Megaphone },
  ];

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 border-r bg-muted/30 p-4 flex flex-col">
        <h1 className="text-xl font-bold mb-6">BuscaZap IA</h1>
        <nav className="space-y-1 flex-1">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}>
              <a
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${
                  path === href || (href !== "/admin" && path.startsWith(href))
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </a>
            </Link>
          ))}
        </nav>
        <Button variant="ghost" size="sm" className="justify-start gap-2" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
