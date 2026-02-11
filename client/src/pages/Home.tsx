import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getLoginUrl, getSiteSecretariaUrl } from "@/const";
import { ChefHat, CreditCard, LayoutGrid, Package, TrendingUp, UtensilsCrossed, Smartphone, Star, Bike, Users, UserPlus, LogOut } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleEmailLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data?.error) {
        setLoginError(
          data?.error ||
            "Não foi possível fazer login. Verifique seu e-mail e senha."
        );
        return;
      }

      // Recarrega a página para que o hook useAuth detecte a nova sessão
      window.location.reload();
    } catch (error) {
      console.error("[Home] Erro no login por e-mail/senha", error);
      setLoginError("Erro ao conectar ao servidor. Tente novamente.");
    } finally {
      setLoginLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <UtensilsCrossed className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">BuscaZap PDV</CardTitle>
            <CardDescription>Sistema de Ponto de Venda</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={handleEmailLogin}>
              <div className="space-y-1 text-left">
                <label className="text-sm font-medium" htmlFor="email">
                  E-mail
                </label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>

              <div className="space-y-1 text-left">
                <label className="text-sm font-medium" htmlFor="password">
                  Senha
                </label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Senha"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>

              {loginError && (
                <p className="text-sm text-destructive text-left">
                  {loginError}
                </p>
              )}

              <Button
                className="w-full"
                size="lg"
                type="submit"
                disabled={loginLoading}
              >
                {loginLoading ? "Entrando..." : "Entrar com e-mail e senha"}
              </Button>
            </form>

            <div className="flex items-center my-4">
              <div className="flex-1 h-px bg-border" />
              <span className="px-2 text-xs text-muted-foreground">ou</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <Button
              className="w-full"
              size="lg"
              variant="outline"
              onClick={() => (window.location.href = getLoginUrl())}
            >
              Entrar com Google
            </Button>
            <Button
              variant="outline"
              className="w-full mt-3"
              size="lg"
              onClick={() => window.open(getSiteSecretariaUrl(), "_blank", "noopener,noreferrer")}
            >
              Login Secretária – Gerenciar agenda pela web
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-4">
              Use as mesmas credenciais do app BuscaZap
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const modes = [
    {
      title: "Gestão de Mesas",
      description: "Visualizar e gerenciar mesas do restaurante",
      icon: LayoutGrid,
      path: "/tables",
      color: "bg-blue-500",
    },
    {
      title: "Modo Garçom",
      description: "Atender mesas e fazer pedidos",
      icon: UtensilsCrossed,
      path: "/waiter",
      color: "bg-green-500",
    },
    {
      title: "Tela de Cozinha",
      description: "Visualizar pedidos em preparo",
      icon: ChefHat,
      path: "/kitchen",
      color: "bg-orange-500",
    },
    {
      title: "PDV Caixa",
      description: "Realizar pagamentos e fechar contas",
      icon: CreditCard,
      path: "/cashier",
      color: "bg-purple-500",
    },
    {
      title: "Relatórios",
      description: "Dashboard e relatórios de vendas",
      icon: TrendingUp,
      path: "/reports",
      color: "bg-red-500",
    },
    {
      title: "Produtos",
      description: "Gerenciar cardápio e produtos",
      icon: Package,
      path: "/products",
      color: "bg-indigo-500",
    },
    {
      title: "Pedidos BuscaZap",
      description: "Receber e gerenciar pedidos do app",
      icon: Smartphone,
      path: "/buscazap-orders",
      color: "bg-amber-500",
    },
    {
      title: "Estatísticas BuscaZap",
      description: "Análise de desempenho e métricas",
      icon: TrendingUp,
      path: "/buscazap-stats",
      color: "bg-purple-500",
    },
    {
      title: "Avaliações",
      description: "Feedback dos clientes",
      icon: Star,
      path: "/ratings",
      color: "bg-yellow-500",
    },
    {
      title: "Controle de Delivery",
      description: "Gerenciar status online do PediJá",
      icon: Bike,
      path: "/delivery-control",
      color: "bg-green-600",
    },
    {
      title: "Entregadores Próprios",
      description: "Gerenciar entregadores exclusivos",
      icon: Users,
      path: "/manage-drivers",
      color: "bg-blue-600",
    },
    {
      title: "Gestão de Garçons",
      description: "Criar login e senha para garçons usarem no app",
      icon: UserPlus,
      path: "/manage-waiters",
      color: "bg-emerald-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">BuscaZap PDV</h1>
          <p className="text-muted-foreground">
            Bem-vindo, {user?.name || "Usuário"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modes.map((mode) => (
            <Card
              key={mode.path}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => {
                console.log("[Home] Card clicado:", mode.title, "path:", mode.path);
                if ((mode as { externalUrl?: string }).externalUrl) {
                  window.open((mode as { externalUrl: string }).externalUrl, "_blank", "noopener,noreferrer");
                } else {
                  console.log("[Home] Navegando para:", mode.path);
                  setLocation(mode.path);
                }
              }}
            >
              <CardHeader>
                <div className={`w-12 h-12 ${mode.color} rounded-lg flex items-center justify-center mb-4`}>
                  <mode.icon className="w-6 h-6 text-white" />
                </div>
                <CardTitle>{mode.title}</CardTitle>
                <CardDescription>{mode.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        <div className="mt-8 flex gap-3">
          <Button
            variant="outline"
            onClick={() => setLocation("/select-company")}
          >
            Trocar Empresa
          </Button>
          <Button
            variant="outline"
            onClick={() => logout()}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>
    </div>
  );
}
