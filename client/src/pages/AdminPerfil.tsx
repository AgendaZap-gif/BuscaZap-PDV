/**
 * AdminPerfil.tsx — Perfil da empresa no painel admin
 *
 * Cada seção do perfil é controlada por um upsell.
 * Se o upsell não estiver ativo, a seção exibe um card de upgrade.
 */
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { getCompanyAuth } from "./AdminLogin";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Lock,
  Zap,
  Image,
  Phone,
  MapPin,
  Instagram,
  BookOpen,
  Megaphone,
  Bot,
  FileText,
  TrendingUp,
  Bell,
  BarChart3,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";

// Mapeamento slug → ícone e cor
const FEATURE_META: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  logo_card:      { icon: <Image className="h-5 w-5" />,       color: "text-blue-600",   label: "Logo no Card" },
  imagem_perfil:  { icon: <Image className="h-5 w-5" />,       color: "text-purple-600", label: "Imagem no Perfil" },
  whatsapp:       { icon: <Phone className="h-5 w-5" />,       color: "text-green-600",  label: "Botão WhatsApp" },
  localizacao:    { icon: <MapPin className="h-5 w-5" />,      color: "text-orange-600", label: "Localização no Mapa" },
  instagram:      { icon: <Instagram className="h-5 w-5" />,   color: "text-pink-600",   label: "Feed do Instagram" },
  catalogo:       { icon: <BookOpen className="h-5 w-5" />,    color: "text-yellow-600", label: "Catálogo de Produtos" },
  banner_home:    { icon: <Megaphone className="h-5 w-5" />,   color: "text-red-600",    label: "Banner na Home" },
  chat_ai:        { icon: <Bot className="h-5 w-5" />,         color: "text-indigo-600", label: "Chat com IA" },
  orcamento:      { icon: <FileText className="h-5 w-5" />,    color: "text-teal-600",   label: "Orçamento Online" },
  destaque_busca: { icon: <TrendingUp className="h-5 w-5" />,  color: "text-amber-600",  label: "Destaque na Busca" },
  notificacoes:   { icon: <Bell className="h-5 w-5" />,        color: "text-cyan-600",   label: "Notificações Push" },
  relatorios:     { icon: <BarChart3 className="h-5 w-5" />,   color: "text-slate-600",  label: "Relatórios Avançados" },
};

/** Card de bloqueio para funcionalidades não contratadas */
function LockedFeature({ slug, onUpgrade }: { slug: string; onUpgrade: () => void }) {
  const meta = FEATURE_META[slug];
  return (
    <Card className="border-dashed border-2 border-muted bg-muted/20">
      <CardContent className="pt-6 pb-5 flex flex-col items-center text-center gap-3">
        <div className="p-3 rounded-full bg-muted">
          <Lock className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <p className="font-semibold text-sm">{meta?.label ?? slug}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Esta funcionalidade não está contratada.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={onUpgrade} className="gap-1 text-xs">
          <Zap className="h-3 w-3" />
          Contratar agora
        </Button>
      </CardContent>
    </Card>
  );
}

export default function AdminPerfil() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const auth = getCompanyAuth();
  const companyId = auth?.companyId ?? 0;

  useEffect(() => {
    if (!auth) setLocation("/admin/login");
  }, [auth, setLocation]);

  // Dados do perfil
  const [whatsapp, setWhatsapp] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [localizacao, setLocalizacao] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [descricao, setDescricao] = useState("");

  // Carregar upsells da empresa
  const { data: upsells } = trpc.upsells.list.useQuery(
    { companyId },
    { enabled: companyId > 0 }
  );

  const hasFeature = (slug: string) =>
    upsells?.find((u) => u.slug === slug)?.contracted ?? false;

  const goToPlanos = () => setLocation("/admin/planos");

  if (!auth) return null;

  return (
    <div className="p-6 space-y-8 max-w-3xl">
      {/* Cabeçalho */}
      <div>
        <h2 className="text-2xl font-bold">Perfil da Empresa</h2>
        <p className="text-muted-foreground mt-1">
          Configure as informações que aparecem no app BuscaZap. Cada seção requer a contratação da funcionalidade correspondente.
        </p>
      </div>

      {/* Informações básicas (sempre disponíveis) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            Informações Básicas
            <Badge variant="secondary" className="text-xs">Incluído</Badge>
          </CardTitle>
          <CardDescription>Nome, descrição e categoria da empresa</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-sm font-medium">Descrição da empresa</label>
            <Textarea
              placeholder="Descreva sua empresa, produtos e diferenciais..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={3}
              className="mt-1"
            />
          </div>
          <Button size="sm" onClick={() => toast({ title: "Salvo!", description: "Informações básicas atualizadas." })}>
            Salvar
          </Button>
        </CardContent>
      </Card>

      {/* Logo no Card */}
      {hasFeature("logo_card") ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span className={FEATURE_META.logo_card.color}>{FEATURE_META.logo_card.icon}</span>
              Logo no Card
              <Badge className="text-xs bg-green-100 text-green-800">Ativo</Badge>
            </CardTitle>
            <CardDescription>Sua logo aparece no card de busca do app</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium">URL da logo</label>
              <Input
                placeholder="https://..."
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button size="sm" onClick={() => toast({ title: "Salvo!", description: "Logo atualizada." })}>
              Salvar
            </Button>
          </CardContent>
        </Card>
      ) : (
        <LockedFeature slug="logo_card" onUpgrade={goToPlanos} />
      )}

      {/* Imagem no Perfil */}
      {hasFeature("imagem_perfil") ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span className={FEATURE_META.imagem_perfil.color}>{FEATURE_META.imagem_perfil.icon}</span>
              Imagem / Banner do Perfil
              <Badge className="text-xs bg-green-100 text-green-800">Ativo</Badge>
            </CardTitle>
            <CardDescription>Foto ou banner de capa na página de perfil</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium">URL da imagem de capa</label>
              <Input
                placeholder="https://..."
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button size="sm" onClick={() => toast({ title: "Salvo!", description: "Imagem de capa atualizada." })}>
              Salvar
            </Button>
          </CardContent>
        </Card>
      ) : (
        <LockedFeature slug="imagem_perfil" onUpgrade={goToPlanos} />
      )}

      {/* WhatsApp */}
      {hasFeature("whatsapp") ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span className={FEATURE_META.whatsapp.color}>{FEATURE_META.whatsapp.icon}</span>
              Botão WhatsApp
              <Badge className="text-xs bg-green-100 text-green-800">Ativo</Badge>
            </CardTitle>
            <CardDescription>Clientes podem te contatar diretamente pelo WhatsApp</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium">Número do WhatsApp (com DDD)</label>
              <Input
                placeholder="65 99999-9999"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button size="sm" onClick={() => toast({ title: "Salvo!", description: "WhatsApp atualizado." })}>
              Salvar
            </Button>
          </CardContent>
        </Card>
      ) : (
        <LockedFeature slug="whatsapp" onUpgrade={goToPlanos} />
      )}

      {/* Localização */}
      {hasFeature("localizacao") ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span className={FEATURE_META.localizacao.color}>{FEATURE_META.localizacao.icon}</span>
              Localização no Mapa
              <Badge className="text-xs bg-green-100 text-green-800">Ativo</Badge>
            </CardTitle>
            <CardDescription>Sua empresa aparece no mapa interativo do app</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium">Endereço completo</label>
              <Input
                placeholder="Rua, número, bairro, cidade - UF"
                value={localizacao}
                onChange={(e) => setLocalizacao(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button size="sm" onClick={() => toast({ title: "Salvo!", description: "Endereço atualizado." })}>
              Salvar
            </Button>
          </CardContent>
        </Card>
      ) : (
        <LockedFeature slug="localizacao" onUpgrade={goToPlanos} />
      )}

      {/* Instagram */}
      {hasFeature("instagram") ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span className={FEATURE_META.instagram.color}>{FEATURE_META.instagram.icon}</span>
              Feed do Instagram
              <Badge className="text-xs bg-green-100 text-green-800">Ativo</Badge>
            </CardTitle>
            <CardDescription>Posts recentes do Instagram aparecem no perfil da empresa</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium">Usuário do Instagram</label>
              <Input
                placeholder="@suaempresa"
                value={instagramHandle}
                onChange={(e) => setInstagramHandle(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button size="sm" onClick={() => toast({ title: "Salvo!", description: "Instagram atualizado." })}>
              Salvar
            </Button>
          </CardContent>
        </Card>
      ) : (
        <LockedFeature slug="instagram" onUpgrade={goToPlanos} />
      )}

      {/* Catálogo */}
      {hasFeature("catalogo") ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span className={FEATURE_META.catalogo.color}>{FEATURE_META.catalogo.icon}</span>
              Catálogo de Produtos
              <Badge className="text-xs bg-green-100 text-green-800">Ativo</Badge>
            </CardTitle>
            <CardDescription>Gerencie produtos, fotos e preços no perfil da empresa</CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="sm" variant="outline" className="gap-1" onClick={() => setLocation("/products")}>
              <ExternalLink className="h-3 w-3" />
              Gerenciar Catálogo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <LockedFeature slug="catalogo" onUpgrade={goToPlanos} />
      )}

      {/* Banner na Home */}
      {hasFeature("banner_home") ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span className={FEATURE_META.banner_home.color}>{FEATURE_META.banner_home.icon}</span>
              Banner na Home
              <Badge className="text-xs bg-green-100 text-green-800">Ativo</Badge>
            </CardTitle>
            <CardDescription>Seu banner aparece na tela inicial do app (alta visibilidade)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium">URL do banner (1200×400px recomendado)</label>
              <Input
                placeholder="https://..."
                className="mt-1"
              />
            </div>
            <Button size="sm" onClick={() => toast({ title: "Salvo!", description: "Banner atualizado." })}>
              Salvar
            </Button>
          </CardContent>
        </Card>
      ) : (
        <LockedFeature slug="banner_home" onUpgrade={goToPlanos} />
      )}

      {/* Chat com IA */}
      {hasFeature("chat_ai") ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span className={FEATURE_META.chat_ai.color}>{FEATURE_META.chat_ai.icon}</span>
              Chat com IA
              <Badge className="text-xs bg-green-100 text-green-800">Ativo</Badge>
            </CardTitle>
            <CardDescription>Assistente virtual responde clientes 24h automaticamente</CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="sm" variant="outline" className="gap-1" onClick={() => setLocation("/admin/training")}>
              <ExternalLink className="h-3 w-3" />
              Configurar Assistente IA
            </Button>
          </CardContent>
        </Card>
      ) : (
        <LockedFeature slug="chat_ai" onUpgrade={goToPlanos} />
      )}

      {/* Orçamento Online */}
      {hasFeature("orcamento") ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span className={FEATURE_META.orcamento.color}>{FEATURE_META.orcamento.icon}</span>
              Orçamento Online
              <Badge className="text-xs bg-green-100 text-green-800">Ativo</Badge>
            </CardTitle>
            <CardDescription>Clientes podem solicitar orçamentos pelo app</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Orçamentos recebidos aparecem em <strong>Leads</strong> no painel.
            </p>
            <Button size="sm" variant="outline" className="gap-1 mt-3" onClick={() => setLocation("/admin/leads")}>
              <ExternalLink className="h-3 w-3" />
              Ver Orçamentos Recebidos
            </Button>
          </CardContent>
        </Card>
      ) : (
        <LockedFeature slug="orcamento" onUpgrade={goToPlanos} />
      )}

      {/* Destaque na Busca */}
      {hasFeature("destaque_busca") ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span className={FEATURE_META.destaque_busca.color}>{FEATURE_META.destaque_busca.icon}</span>
              Destaque na Busca
              <Badge className="text-xs bg-green-100 text-green-800">Ativo</Badge>
            </CardTitle>
            <CardDescription>Sua empresa aparece no topo dos resultados de busca</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Sua empresa já está destacada nos resultados de busca do app. Nenhuma configuração adicional necessária.
            </p>
          </CardContent>
        </Card>
      ) : (
        <LockedFeature slug="destaque_busca" onUpgrade={goToPlanos} />
      )}

      {/* Notificações Push */}
      {hasFeature("notificacoes") ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span className={FEATURE_META.notificacoes.color}>{FEATURE_META.notificacoes.icon}</span>
              Notificações Push
              <Badge className="text-xs bg-green-100 text-green-800">Ativo</Badge>
            </CardTitle>
            <CardDescription>Envie notificações para clientes que seguem sua empresa</CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="sm" variant="outline" className="gap-1" onClick={() => setLocation("/admin/promotions")}>
              <ExternalLink className="h-3 w-3" />
              Enviar Promoção / Notificação
            </Button>
          </CardContent>
        </Card>
      ) : (
        <LockedFeature slug="notificacoes" onUpgrade={goToPlanos} />
      )}

      {/* Relatórios Avançados */}
      {hasFeature("relatorios") ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span className={FEATURE_META.relatorios.color}>{FEATURE_META.relatorios.icon}</span>
              Relatórios Avançados
              <Badge className="text-xs bg-green-100 text-green-800">Ativo</Badge>
            </CardTitle>
            <CardDescription>Métricas de visitas, cliques e conversões</CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="sm" variant="outline" className="gap-1" onClick={() => setLocation("/admin")}>
              <ExternalLink className="h-3 w-3" />
              Ver Dashboard Completo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <LockedFeature slug="relatorios" onUpgrade={goToPlanos} />
      )}
    </div>
  );
}
