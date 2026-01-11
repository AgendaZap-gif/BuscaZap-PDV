import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus, Trash2, DollarSign, Users, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function ManageDrivers() {
  const { toast } = useToast();
  const [companyId] = useState<number>(1); // TODO: Pegar do contexto
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [driverId, setDriverId] = useState('');
  const [isPricingDialogOpen, setIsPricingDialogOpen] = useState(false);
  const [newPrice, setNewPrice] = useState('49.00');

  const { data: settings, refetch: refetchSettings } = trpc.delivery.getSettings.useQuery({ companyId });
  const { data: drivers, isLoading, refetch } = trpc.delivery.getDrivers.useQuery(
    { companyId },
    { enabled: settings?.hasOwnDrivers === true }
  );

  const addDriverMutation = trpc.delivery.addDriver.useMutation({
    onSuccess: () => {
      toast({
        title: '✅ Entregador Adicionado',
        description: 'Entregador foi vinculado à sua empresa com sucesso',
      });
      setIsAddDialogOpen(false);
      setDriverId('');
      refetch();
    },
    onError: (error) => {
      toast({
        title: 'Erro ao adicionar entregador',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const removeDriverMutation = trpc.delivery.removeDriver.useMutation({
    onSuccess: () => {
      toast({
        title: '✅ Entregador Removido',
        description: 'Entregador foi desvinculado da sua empresa',
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: 'Erro ao remover entregador',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const enableDriversMutation = trpc.delivery.enableOwnDrivers.useMutation({
    onSuccess: () => {
      toast({
        title: '🎉 Entregadores Próprios Ativados',
        description: 'Agora você pode adicionar entregadores exclusivos',
      });
      refetchSettings();
    },
    onError: (error) => {
      toast({
        title: 'Erro ao ativar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleAddDriver = async () => {
    if (!driverId) {
      toast({
        title: 'ID obrigatório',
        description: 'Digite o ID do entregador',
        variant: 'destructive',
      });
      return;
    }

    await addDriverMutation.mutateAsync({
      companyId,
      driverId: parseInt(driverId),
    });
  };

  const handleRemoveDriver = async (driverId: number) => {
    if (!confirm('Tem certeza que deseja remover este entregador?')) return;
    
    await removeDriverMutation.mutateAsync({
      companyId,
      driverId,
    });
  };

  const handleEnableDrivers = async (maxDrivers: number) => {
    await enableDriversMutation.mutateAsync({
      companyId,
      maxDrivers,
    });
  };

  // Se não tem permissão para entregadores próprios
  if (!settings?.hasOwnDrivers) {
    return (
      <div className="container mx-auto p-6 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Entregadores Próprios</CardTitle>
            <CardDescription>
              Tenha entregadores exclusivos para sua empresa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Funcionalidade Não Ativada</AlertTitle>
              <AlertDescription>
                Entre em contato com o administrador para contratar o addon de entregadores próprios
              </AlertDescription>
            </Alert>

            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Planos Disponíveis
              </h3>
              <div className="space-y-3">
                <div className="bg-white p-4 rounded-lg border-2 border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-lg">Básico</h4>
                    <Badge variant="default">R$ 49/mês</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Ideal para começar com entregas próprias
                  </p>
                  <ul className="space-y-1 text-sm">
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      Até 3 entregadores
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      Controle total via PDV
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      Estatísticas de entregas
                    </li>
                  </ul>
                </div>

                <div className="bg-white p-4 rounded-lg border-2 border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-lg">Profissional</h4>
                    <Badge variant="default">R$ 99/mês</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Para empresas em crescimento
                  </p>
                  <ul className="space-y-1 text-sm">
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      Até 10 entregadores
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      Relatórios avançados
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      Suporte prioritário
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={() => handleEnableDrivers(3)} className="flex-1">
                Contratar Básico (R$ 49/mês)
              </Button>
              <Button onClick={() => handleEnableDrivers(10)} variant="outline" className="flex-1">
                Contratar Profissional (R$ 99/mês)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Tela principal de gerenciamento
  const activeDrivers = drivers?.filter(d => d.isActive) || [];
  const maxDrivers = settings?.maxDrivers || 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Entregadores Próprios</h1>
          <p className="text-muted-foreground">Gerencie seus entregadores exclusivos</p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          <Users className="mr-2 h-5 w-5" />
          {activeDrivers.length} / {maxDrivers}
        </Badge>
      </div>

      {/* Botão Adicionar */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">Adicionar Novo Entregador</h3>
              <p className="text-sm text-muted-foreground">
                Vincule um entregador à sua empresa ({activeDrivers.length}/{maxDrivers} vagas usadas)
              </p>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={activeDrivers.length >= maxDrivers}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Adicionar Entregador
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Entregador</DialogTitle>
                  <DialogDescription>
                    Digite o ID do usuário que será entregador da sua empresa
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="driverId">ID do Entregador</Label>
                    <Input
                      id="driverId"
                      type="number"
                      placeholder="Ex: 123"
                      value={driverId}
                      onChange={(e) => setDriverId(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAddDriver} disabled={addDriverMutation.isPending}>
                    {addDriverMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adicionando...
                      </>
                    ) : (
                      'Adicionar'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Entregadores */}
      <Card>
        <CardHeader>
          <CardTitle>Entregadores Ativos</CardTitle>
          <CardDescription>
            Lista de entregadores vinculados à sua empresa
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : activeDrivers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum entregador cadastrado ainda
            </div>
          ) : (
            <div className="space-y-3">
              {activeDrivers.map((driver) => (
                <div
                  key={driver.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/10 p-3 rounded-full">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{driver.driverName || 'Sem nome'}</h4>
                      <p className="text-sm text-muted-foreground">
                        {driver.driverEmail || 'Sem email'} • ID: {driver.driverId}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemoveDriver(driver.driverId)}
                    disabled={removeDriverMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informações do Plano */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Plano</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
            <div>
              <h4 className="font-semibold">Plano Atual</h4>
              <p className="text-sm text-muted-foreground">
                Até {maxDrivers} entregadores
              </p>
            </div>
            <Badge variant="default" className="text-lg px-4 py-2">
              R$ {maxDrivers <= 3 ? '49' : maxDrivers <= 10 ? '99' : '199'}/mês
            </Badge>
          </div>
          
          <Alert>
            <DollarSign className="h-4 w-4" />
            <AlertTitle>Upgrade Disponível</AlertTitle>
            <AlertDescription>
              Entre em contato com o administrador para aumentar o limite de entregadores
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
