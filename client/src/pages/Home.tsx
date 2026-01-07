import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { ChefHat, CreditCard, LayoutGrid, Package, TrendingUp, UtensilsCrossed, Smartphone, Star } from "lucide-react";
import { useLocation } from "wouter";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

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
            <Button
              className="w-full"
              size="lg"
              onClick={() => (window.location.href = getLoginUrl())}
            >
              Fazer Login
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
              onClick={() => setLocation(mode.path)}
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

        <div className="mt-8">
          <Button
            variant="outline"
            onClick={() => setLocation("/select-company")}
          >
            Trocar Empresa
          </Button>
        </div>
      </div>
    </div>
  );
}
