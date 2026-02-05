import { Link, useLocation } from "wouter";
import { clearCompanyAuth } from "./AdminLogin";
import { Button } from "@/components/ui/button";
import { CalendarDays, LogOut, Users, Heart, Settings } from "lucide-react";

export default function SecretaryLayout({ children }: { children: React.ReactNode }) {
  const [path] = useLocation();

  const handleLogout = () => {
    clearCompanyAuth();
    window.location.href = "/secretaria/agenda";
  };

  const nav = [
    { href: "/secretaria/agenda/painel", label: "Agenda", icon: CalendarDays },
    { href: "/secretaria/agenda/pacientes", label: "Pacientes", icon: Users },
    { href: "/secretaria/agenda/planos", label: "Planos de saúde", icon: Heart },
    { href: "/secretaria/agenda/config", label: "Disponibilidade", icon: Settings },
  ];

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 border-r bg-muted/30 p-4 flex flex-col">
        <h1 className="text-xl font-bold mb-6">Secretária — Agenda</h1>
        <p className="text-xs text-muted-foreground mb-4">
          Hospitais, clínicas e comércios com agendamento
        </p>
        <nav className="space-y-1 flex-1">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}>
              <a
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${
                  path === href ? "bg-primary text-primary-foreground" : "hover:bg-muted"
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
