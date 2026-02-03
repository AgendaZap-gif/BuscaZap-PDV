import { useState } from "react";
import { PageNav } from "@/components/PageNav";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, TrendingDown, TrendingUp, X } from "lucide-react";

export default function CashierPage() {
  const { toast } = useToast();
  const [openingAmount, setOpeningAmount] = useState("");
  const [movementAmount, setMovementAmount] = useState("");
  const [movementReason, setMovementReason] = useState("");
  const [movementType, setMovementType] = useState<"withdrawal" | "deposit">("withdrawal");
  const [isOpenDialogOpen, setIsOpenDialogOpen] = useState(false);
  const [isMovementDialogOpen, setIsMovementDialogOpen] = useState(false);
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);

  const utils = trpc.useUtils();

  // Buscar caixa ativo
  const { data: activeRegister, isLoading } = trpc.cashRegister.getActive.useQuery(
    { companyId: 1 }, // TODO: pegar companyId do contexto
    { refetchInterval: 5000 }
  );

  // Buscar resumo do caixa
  const { data: summary } = trpc.cashRegister.getSummary.useQuery(
    { registerId: activeRegister?.id || 0 },
    { enabled: !!activeRegister }
  );

  // Mutations
  const openRegisterMutation = trpc.cashRegister.open.useMutation({
    onSuccess: () => {
      toast({ title: "Caixa aberto com sucesso!" });
      setIsOpenDialogOpen(false);
      setOpeningAmount("");
      utils.cashRegister.getActive.invalidate();
    },
    onError: (error) => {
      toast({ title: "Erro ao abrir caixa", description: error.message, variant: "destructive" });
    },
  });

  const addMovementMutation = trpc.cashMovements.add.useMutation({
    onSuccess: () => {
      toast({ title: "Movimentação registrada com sucesso!" });
      setIsMovementDialogOpen(false);
      setMovementAmount("");
      setMovementReason("");
      utils.cashRegister.getSummary.invalidate();
    },
    onError: (error) => {
      toast({ title: "Erro ao registrar movimentação", description: error.message, variant: "destructive" });
    },
  });

  const closeRegisterMutation = trpc.cashRegister.close.useMutation({
    onSuccess: () => {
      toast({ title: "Caixa fechado com sucesso!" });
      setIsCloseDialogOpen(false);
      utils.cashRegister.getActive.invalidate();
    },
    onError: (error) => {
      toast({ title: "Erro ao fechar caixa", description: error.message, variant: "destructive" });
    },
  });

  const handleOpenRegister = () => {
    if (!openingAmount) {
      toast({ title: "Informe o valor de abertura", variant: "destructive" });
      return;
    }
    openRegisterMutation.mutate({
      companyId: 1, // TODO: pegar do contexto
      openingAmount,
    });
  };

  const handleAddMovement = () => {
    if (!movementAmount || !movementReason) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }
    addMovementMutation.mutate({
      cashRegisterId: activeRegister!.id,
      type: movementType,
      amount: movementAmount,
      reason: movementReason,
    });
  };

  const handleCloseRegister = () => {
    if (!summary) return;

    closeRegisterMutation.mutate({
      registerId: activeRegister!.id,
      closingAmount: summary.expectedAmount.toString(),
      expectedAmount: summary.expectedAmount.toString(),
      difference: "0",
    });
  };

  if (isLoading) {
    return (
      <>
        <PageNav title="PDV Caixa" backPath="/" />
        <div className="container mx-auto p-6">
          <p>Carregando...</p>
        </div>
      </>
    );
  }

  if (!activeRegister) {
    return (
      <>
        <PageNav title="PDV Caixa" backPath="/" />
        <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Caixa Fechado</CardTitle>
            <CardDescription>Abra o caixa para começar a trabalhar</CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={isOpenDialogOpen} onOpenChange={setIsOpenDialogOpen}>
              <DialogTrigger asChild>
                <Button>Abrir Caixa</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Abrir Caixa</DialogTitle>
                  <DialogDescription>Informe o valor inicial em dinheiro no caixa</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="openingAmount">Valor de Abertura (R$)</Label>
                    <Input
                      id="openingAmount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={openingAmount}
                      onChange={(e) => setOpeningAmount(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleOpenRegister} className="w-full" disabled={openRegisterMutation.isPending}>
                    {openRegisterMutation.isPending ? "Abrindo..." : "Abrir Caixa"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <PageNav title="PDV Caixa" backPath="/" />
      <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Caixa</h2>
        <Dialog open={isCloseDialogOpen} onOpenChange={setIsCloseDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive">
              <X className="mr-2 h-4 w-4" />
              Fechar Caixa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Fechar Caixa</DialogTitle>
              <DialogDescription>Confira os valores antes de fechar</DialogDescription>
            </DialogHeader>
            {summary && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Abertura</Label>
                    <p className="text-2xl font-bold">R$ {parseFloat(activeRegister.openingAmount).toFixed(2)}</p>
                  </div>
                  <div>
                    <Label>Total de Vendas</Label>
                    <p className="text-2xl font-bold text-green-600">R$ {summary.totalSales.toFixed(2)}</p>
                  </div>
                  <div>
                    <Label>Reforços</Label>
                    <p className="text-2xl font-bold text-blue-600">R$ {summary.totalDeposits.toFixed(2)}</p>
                  </div>
                  <div>
                    <Label>Sangrias</Label>
                    <p className="text-2xl font-bold text-red-600">R$ {summary.totalWithdrawals.toFixed(2)}</p>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <Label>Valor Esperado</Label>
                  <p className="text-3xl font-bold">R$ {summary.expectedAmount.toFixed(2)}</p>
                </div>
                <Button onClick={handleCloseRegister} className="w-full" disabled={closeRegisterMutation.isPending}>
                  {closeRegisterMutation.isPending ? "Fechando..." : "Confirmar Fechamento"}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abertura</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {parseFloat(activeRegister.openingAmount).toFixed(2)}</div>
          </CardContent>
        </Card>

        {summary && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">R$ {summary.totalSales.toFixed(2)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Valor Esperado</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R$ {summary.expectedAmount.toFixed(2)}</div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Movimentações</CardTitle>
            <CardDescription>Sangrias e reforços de caixa</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Dialog open={isMovementDialogOpen} onOpenChange={setIsMovementDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  Registrar Movimentação
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nova Movimentação</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select value={movementType} onValueChange={(v: "withdrawal" | "deposit") => setMovementType(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="withdrawal">Sangria (Retirada)</SelectItem>
                        <SelectItem value="deposit">Reforço (Depósito)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="movementAmount">Valor (R$)</Label>
                    <Input
                      id="movementAmount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={movementAmount}
                      onChange={(e) => setMovementAmount(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="movementReason">Motivo</Label>
                    <Textarea
                      id="movementReason"
                      placeholder="Ex: Troco para o caixa"
                      value={movementReason}
                      onChange={(e) => setMovementReason(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleAddMovement} className="w-full" disabled={addMovementMutation.isPending}>
                    {addMovementMutation.isPending ? "Registrando..." : "Registrar"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {summary?.movements && summary.movements.length > 0 && (
              <div className="space-y-2">
                {summary.movements.map((movement) => (
                  <div key={movement.id} className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-2">
                      {movement.type === "withdrawal" ? (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      ) : (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{movement.reason}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(movement.createdAt).toLocaleString("pt-BR")}
                        </p>
                      </div>
                    </div>
                    <p className={`font-bold ${movement.type === "withdrawal" ? "text-red-600" : "text-green-600"}`}>
                      {movement.type === "withdrawal" ? "-" : "+"}R$ {parseFloat(movement.amount).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vendas por Meio de Pagamento</CardTitle>
            <CardDescription>Resumo das vendas no período</CardDescription>
          </CardHeader>
          <CardContent>
            {summary?.paymentsByMethod && summary.paymentsByMethod.length > 0 ? (
              <div className="space-y-2">
                {summary.paymentsByMethod.map((method: any) => (
                  <div key={method.paymentMethodId} className="flex items-center justify-between border-b pb-2">
                    <p className="text-sm font-medium">{method.paymentMethodName}</p>
                    <p className="font-bold">R$ {method.total.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma venda registrada ainda</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
}
