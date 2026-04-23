import { useState } from "react";
import { useLocation } from "wouter";
import { useBusinessType } from "@/contexts/BusinessTypeContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { getAppDisplayName } from "@/const";
import { useNotifications } from "@/hooks/useNotifications";
import {
  ShoppingCart,
  Clock,
  Package,
  Users,
  TrendingUp,
  Settings,
  LogOut,
  Menu,
  X,
  Home,
  BarChart3,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const BUSINESS_TYPE_LABELS = {
  commerce: "Comércio",
  services: "Serviços",
  restaurant: "Restaurante",
};

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  businessTypes?: ("commerce" | "services" | "restaurant")[];
}

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const [location, navigate] = useLocation();
  const { businessType } = useBusinessType();
  const { logout } = useAuth();
  const appName = getAppDisplayName();
  const { unreadCount } = useNotifications();

  const navItems: NavItem[] = [
    {
      label: "Dashboard",
      path: "/",
      icon: <Home className="w-5 h-5" />,
    },
    {
      label: "Notificações",
      path: "/notifications",
      icon: (
        <div className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>
      ),
    },
    {
      label: businessType === "services" ? "Serviços" : businessType === "restaurant" ? "Cardápio" : "Produtos",
      path: "/products",
      icon: <ShoppingCart className="w-5 h-5" />,
    },
    {
      label: "Clientes",
      path: "/customers",
      icon: <Users className="w-5 h-5" />,
    },
    {
      label: "Pedidos",
      path: "/orders",
      icon: <BarChart3 className="w-5 h-5" />,
    },
    {
      label: "Estoque",
      path: "/stock",
      icon: <Package className="w-5 h-5" />,
      businessTypes: ["commerce", "restaurant"],
    },
    {
      label: businessType === "services" ? "Agendamentos" : "PDV",
      path: "/pos",
      icon: <ShoppingCart className="w-5 h-5" />,
    },
    {
      label: "Relatórios",
      path: "/reports",
      icon: <TrendingUp className="w-5 h-5" />,
    },
    {
      label: "Configurações",
      path: "/settings",
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  const filteredNavItems = navItems.filter((item) => {
    if (!item.businessTypes) return true;
    return item.businessTypes.includes(businessType as any);
  });

  const isActive = (path: string) => {
    return location === path || location.startsWith(path + "/");
  };

  return (
    <>
      {/* Mobile Toggle */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="bg-slate-900 text-white hover:bg-slate-800"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </Button>
      </div>

      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex md:w-64 h-screen bg-slate-900 text-white flex-col fixed left-0 top-0">
        {/* Header */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">{appName}</h1>
              <p className="text-xs text-slate-400">
                {businessType && (businessType === "commerce" ? "Comércio" : businessType === "services" ? "Serviços" : "Restaurante")}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {filteredNavItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.path)
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                <div className="relative">{item.icon}</div>
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Sair</span>
          </button>
        </div>
      </aside>

      {/* Sidebar - Mobile */}
      {isOpen && (
        <>
          <aside className="md:hidden fixed left-0 top-0 w-64 h-screen bg-slate-900 text-white flex flex-col z-40">
            {/* Header */}
            <div className="p-6 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="font-bold text-lg leading-tight">{appName}</h1>
                  <p className="text-xs text-slate-400">
                    {businessType && (businessType === "commerce" ? "Comércio" : businessType === "services" ? "Serviços" : "Restaurante")}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {filteredNavItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive(item.path)
                        ? "bg-blue-600 text-white"
                        : "text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    <div className="relative">{item.icon}</div>
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800">
              <button
                onClick={() => {
                  logout();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm font-medium">Sair</span>
              </button>
            </div>
          </aside>

          {/* Mobile Overlay */}
          <div
            className="fixed inset-0 bg-black/50 z-30"
            onClick={() => setIsOpen(false)}
          />
        </>
      )}
    </>
  );
}
