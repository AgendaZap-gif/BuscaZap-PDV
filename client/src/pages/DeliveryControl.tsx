import { useState, useEffect } from 'react';
import { PageNav } from '@/components/PageNav';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Wifi, WifiOff, TrendingUp, Clock, DollarSign } from 'lucide-react';

export default function DeliveryControl() {
  const { toast } = useToast();
  const [companyId, setCompanyId] = useState<number>(1); // TODO: Pegar do contexto de autenticação

  const { data: settings, isLoading, refetch } = trpc.delivery.getSettings.useQuery(
    { companyId },
    { refetchInterval: 5000 } // Atualizar a cada 5 segundos
  );

  const toggleMutation = trpc.delivery.toggleOnlineStatus.useMutation({
    onSuccess: (data) => {
      toast({
        title: data.isOnline ? '✅ Online para Pedidos' : '⚠️ Offline para Pedidos',
        description: data.isOnline 
          ? 'Sua empresa está recebendo pedidos no PediJá'
          : 'Sua empresa não está recebendo novos pedidos',
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: 'Erro ao alterar status',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const activateMutation = trpc.delivery.activateOnPedija.useMutation({
    onSuccess: () => {
      toast({
        title: '🚀 Ativado no PediJá',
        description: 'Sua empresa foi ativada no sistema de delivery',
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: 'Erro ao ativar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleToggle = async () => {
    if (!settings) return;
    
    await toggleMutation.mutateAsync({
      companyId,
      isOnline: !settings.isOnlineForOrders,
    });
  };

  const handleActivate = async () => {
    await activateMutation.mutateAsync({ companyId });
  };

  if (isLoading) {
    return (
      <>
        <PageNav title="Controle de Delivery" backPath="/" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </>
    );
  }

  // Se não está ativo no PediJá, mostrar tela de ativação
  if (!settings?.isOnPedija) {
    return (
      <>
        <PageNav title="Controle de Delivery" backPath="/" />
        <div className="container mx-auto p-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Ativar no PediJá</CardTitle>
            <CardDescription>
              Comece a receber pedidos de delivery pelo aplicativo BuscaZap
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg space-y-4">
              <h3 className="font-semibold text-lg">🚀 Benefícios do PediJá</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Aumente suas vendas com pedidos de delivery</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Alcance mais clientes na sua região</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Controle total via PDV (ativar/desativar quando quiser)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Status online independente do horário de funcionamento</span>
                </li>
              </ul>
            </div>

            <Button 
              onClick={handleActivate}
              disabled={activateMutation.isPending}
              size="lg"
              className="w-full"
            >
              {activateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Ativando...
                </>
              ) : (
                'Ativar no PediJá'
              )}
            </Button>
          </CardContent>
        </Card>
        </div>
      </>
    );
  }

  // Tela principal de controle
  const isOnline = settings.isOnlineForOrders;

  return (
    <>
      <PageNav title="Controle de Delivery" backPath="/" />
      <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Status PediJá</h2>
          <p className="text-muted-foreground">Gerencie o status online do PediJá</p>
        </div>
        <Badge variant={isOnline ? 'default' : 'secondary'} className="text-lg px-4 py-2">
          {isOnline ? (
            <>
              <Wifi className="mr-2 h-5 w-5" />
              ONLINE
            </>
          ) : (
            <>
              <WifiOff className="mr-2 h-5 w-5" />
              OFFLINE
            </>
          )}
        </Badge>
      </div>

      {/* Toggle Principal */}
      <Card className="border-2">
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">
                {isOnline ? 'Recebendo Pedidos' : 'Pausado para Pedidos'}
              </h2>
              <p className="text-muted-foreground">
                {isOnline 
                  ? 'Sua empresa está visível e aceitando pedidos no PediJá'
                  : 'Sua empresa não está recebendo novos pedidos no momento'
                }
              </p>
            </div>
            <Switch
              checked={isOnline}
              onCheckedChange={handleToggle}
              disabled={toggleMutation.isPending}
              className="scale-150"
            />
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status Atual</CardTitle>
            {isOnline ? (
              <Wifi className="h-4 w-4 text-green-600" />
            ) : (
              <WifiOff className="h-4 w-4 text-gray-400" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isOnline ? 'Online' : 'Offline'}
            </div>
            <p className="text-xs text-muted-foreground">
              {isOnline ? 'Aceitando pedidos' : 'Não aceitando pedidos'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Online Hoje</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              Disponível em breve
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos Hoje</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              Disponível em breve
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Informações Adicionais */}
      <Card>
        <CardHeader>
          <CardTitle>Dicas para Maximizar Vendas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 p-2 rounded">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold">Horários de Pico</h4>
              <p className="text-sm text-muted-foreground">
                Fique online durante almoço (11h-14h) e jantar (18h-22h) para mais pedidos
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="bg-green-100 p-2 rounded">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h4 className="font-semibold">Responda Rápido</h4>
              <p className="text-sm text-muted-foreground">
                Aceite pedidos em até 2 minutos para melhorar sua avaliação
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="bg-purple-100 p-2 rounded">
              <DollarSign className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h4 className="font-semibold">Entregadores Próprios</h4>
              <p className="text-sm text-muted-foreground">
                Contrate entregadores exclusivos para ter mais controle sobre as entregas
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </>
  );
}
