import { useEffect } from "react";
import { useLocation } from "wouter";
import { getCompanyAuth } from "./AdminLogin";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle2,
  XCircle,
  Zap,
  Image,
  MessageCircle,
  MapPin,
  Instagram,
  BookOpen,
  Megaphone,
  Bot,
  FileText,
  TrendingUp,
  Bell,
  BarChart3,
  Phone,
} from "lucide-react";

// Mapeamento de ícones por slug
const UPSELL_ICONS: Record<string, React.ReactNode> = {
  logo_card: <Image className="h-6 w-6" />,
  imagem_perfil: <Image className="h-6 w-6" />,
  whatsapp: <Phone className="h-6 w-6" />,
  localizacao: <MapPin className="h-6 w-6" />,
  instagram: <Instagram className="h-6 w-6" />,
  catalogo: <BookOpen className="h-6 w-6" />,
  banner_home: <Megaphone className="h-6 w-6" />,
  chat_ai: <Bot className="h-6 w-6" />,
  orcamento: <FileText className="h-6 w-6" />,
  destaque_busca: <TrendingUp className="h-6 w-6" />,
  notificacoes: <Bell className="h-6 w-6" />,
  relatorios: <BarChart3 className="h-6 w-6" />,
};

// Cores de destaque por categoria
const UPSELL_COLORS: Record<string, string> = {
  logo_card: "bg-blue-50 border-blue-200",
  imagem_perfil: "bg-purple-50 border-purple-200",
  whatsapp: "bg-green-50 border-green-200",
  localizacao: "bg-orange-50 border-orange-200",
  instagram: "bg-pink-50 border-pink-200",
  catalogo: "bg-yellow-50 border-yellow-200",
  banner_home: "bg-red-50 border-red-200",
  chat_ai: "bg-indigo-50 border-indigo-200",
  orcamento: "bg-teal-50 border-teal-200",
  destaque_busca: "bg-amber-50 border-amber-200",
  notificacoes: "bg-cyan-50 border-cyan-200",
  relatorios: "bg-slate-50 border-slate-200",
};

type UpsellItem = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  priceMonthly: string;
  isActive: boolean;
  sortOrder: number;
  contracted: boolean;
};

export default function AdminPlanos() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const auth = getCompanyAuth();
  const companyId = auth?.companyId ?? 0;

  useEffect(() => {
    if (!auth) setLocation("/admin/login");
  }, [auth, setLocation]);

  const { data: upsells, isLoading, refetch } = trpc.upsells.list.useQuery(
    { companyId },
    { enabled: companyId > 0 }
  );

  const activateMutation = trpc.upsells.activate.useMutation({
    onSuccess: () => {
      toast({ title: "Funcionalidade ativada!", description: "A função foi liberada para sua empresa." });
      refetch();
    },
    onError: (e) => toast({ title: "Erro ao ativar", description: e.message, variant: "destructive" }),
  });

  const cancelMutation = trpc.upsells.cancel.useMutation({
    onSuccess: () => {
      toast({ title: "Funcionalidade cancelada", description: "A função foi desativada." });
      refetch();
    },
    onError: (e) => toast({ title: "Erro ao cancelar", description: e.message, variant: "destructive" }),
  });

  if (!auth) return null;

  const contracted = upsells?.filter((u) => u.contracted) ?? [];
  const available = upsells?.filter((u) => !u.contracted) ?? [];

  const totalMonthly = contracted.reduce((sum, u) => sum + parseFloat(u.priceMonthly || "0"), 0);

  return (
    <div className="p-6 space-y-8 max-w-5xl">
      {/* Cabeçalho */}
      <div>
        <h2 className="text-2xl font-bold">Planos e Funcionalidades</h2>
        <p className="text-muted-foreground mt-1">
          Contrate as funcionalidades que sua empresa precisa. Cada função é liberada imediatamente após a contratação.
        </p>
      </div>

      {/* Resumo do plano atual */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Plano atual</p>
              <p className="text-xl font-bold text-primary">Plano Básico + Add-ons</p>
              <p className="text-sm text-muted-foreground mt-1">
                {contracted.length} {contracted.length === 1 ? "funcionalidade contratada" : "funcionalidades contratadas"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total mensal em add-ons</p>
              <p className="text-3xl font-bold text-primary">
                R$ {totalMonthly.toFixed(2).replace(".", ",")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Funcionalidades contratadas */}
      {contracted.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Funcionalidades Ativas
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {contracted.map((item) => (
              <Card key={item.slug} className={`border-2 ${UPSELL_COLORS[item.slug] ?? "bg-green-50 border-green-200"}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="text-green-700">
                        {UPSELL_ICONS[item.slug] ?? <Zap className="h-6 w-6" />}
                      </div>
                      <div>
                        <CardTitle className="text-sm font-semibold">{item.name}</CardTitle>
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 mt-1">
                          Ativo
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-3">{item.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-green-700">
                      R$ {parseFloat(item.priceMonthly).toFixed(2).replace(".", ",")}/mês
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 text-xs h-7"
                      onClick={() => cancelMutation.mutate({ companyId, slug: item.slug })}
                      disabled={cancelMutation.isPending}
                    >
                      <XCircle className="h-3 w-3 mr-1" />
                      Cancelar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Funcionalidades disponíveis */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Zap className="h-5 w-5 text-amber-500" />
          Funcionalidades Disponíveis
        </h3>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4" />
                </CardHeader>
                <CardContent>
                  <div className="h-3 bg-muted rounded w-full mb-2" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : available.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <p className="font-semibold">Você contratou todas as funcionalidades!</p>
              <p className="text-sm text-muted-foreground mt-1">Sua empresa está com o perfil completo.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {available.map((item) => (
              <Card key={item.slug} className="border hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className="text-muted-foreground">
                      {UPSELL_ICONS[item.slug] ?? <Zap className="h-6 w-6" />}
                    </div>
                    <CardTitle className="text-sm font-semibold">{item.name}</CardTitle>
                  </div>
                  <CardDescription className="text-xs mt-1">{item.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mt-2">
                    <div>
                      <span className="text-lg font-bold text-foreground">
                        R$ {parseFloat(item.priceMonthly).toFixed(2).replace(".", ",")}
                      </span>
                      <span className="text-xs text-muted-foreground">/mês</span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() =>
                        activateMutation.mutate({
                          companyId,
                          slug: item.slug,
                          pricePaid: parseFloat(item.priceMonthly),
                        })
                      }
                      disabled={activateMutation.isPending}
                      className="text-xs"
                    >
                      <Zap className="h-3 w-3 mr-1" />
                      Contratar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Nota sobre pagamento */}
      <Card className="bg-muted/30">
        <CardContent className="pt-4 pb-4">
          <p className="text-xs text-muted-foreground text-center">
            As funcionalidades são liberadas imediatamente após a contratação. O faturamento é realizado mensalmente.
            Para dúvidas sobre pagamento, entre em contato com o suporte.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
