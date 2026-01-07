import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Package, Phone, MapPin, Clock, CheckCircle, XCircle } from "lucide-react";
import { useOrderNotification } from "@/hooks/use-order-notification";

export default function BuscaZapOrders() {
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const utils = trpc.useUtils();

  // Assumindo companyId 1 por enquanto - em produção virá do contexto do usuário
  const { data: orders, isLoading } = trpc.buscazapIntegration.listOrders.useQuery(
    { companyId: 1 },
    { refetchInterval: 5000 } // Polling a cada 5 segundos
  );

  // Notificação sonora para novos pedidos
  const pendingCount = orders?.filter(o => o.status === "open").length || 0;
  useOrderNotification(pendingCount);

  const acceptMutation = trpc.buscazapIntegration.acceptOrder.useMutation({
    onSuccess: () => {
      toast({
        title: "Pedido Aceito",
        description: "O pedido foi aceito e enviado para a cozinha.",
      });
      utils.buscazapIntegration.listOrders.invalidate();
      setSelectedOrder(null);
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const rejectMutation = trpc.buscazapIntegration.rejectOrder.useMutation({
    onSuccess: () => {
      toast({
        title: "Pedido Rejeitado",
        description: "O pedido foi rejeitado e o cliente será notificado.",
      });
      utils.buscazapIntegration.listOrders.invalidate();
      setShowRejectDialog(false);
      setSelectedOrder(null);
      setRejectReason("");
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = trpc.buscazapIntegration.updateStatus.useMutation({
    onSuccess: () => {
      toast({
        title: "Status Atualizado",
        description: "O status do pedido foi atualizado com sucesso.",
      });
      utils.buscazapIntegration.listOrders.invalidate();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAccept = (orderId: number) => {
    acceptMutation.mutate({ orderId });
  };

  const handleReject = () => {
    if (!selectedOrder) return;
    rejectMutation.mutate({
      orderId: selectedOrder.id,
      reason: rejectReason,
    });
  };

  const handleUpdateStatus = (orderId: number, status: "preparing" | "ready" | "closed") => {
    updateStatusMutation.mutate({ orderId, status });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      open: { label: "Novo", variant: "default" },
      sent_to_kitchen: { label: "Na Cozinha", variant: "secondary" },
      preparing: { label: "Preparando", variant: "secondary" },
      ready: { label: "Pronto", variant: "outline" },
      closed: { label: "Finalizado", variant: "outline" },
      cancelled: { label: "Cancelado", variant: "destructive" },
    };
    const config = statusMap[status] || { label: status, variant: "default" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="container max-w-7xl py-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Carregando pedidos...</p>
        </div>
      </div>
    );
  }

  const pendingOrders = orders?.filter(o => o.status === "open") || [];
  const activeOrders = orders?.filter(o => ["sent_to_kitchen", "preparing", "ready"].includes(o.status)) || [];

  return (
    <div className="container max-w-7xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Pedidos BuscaZap</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie pedidos recebidos do aplicativo BuscaZap
        </p>
      </div>

      {/* Novos Pedidos */}
      {pendingOrders.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Package className="h-5 w-5" />
            Novos Pedidos
            <Badge variant="destructive" className="ml-2">{pendingOrders.length}</Badge>
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pendingOrders.map((order) => (
              <Card key={order.id} className="border-orange-500 border-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{order.orderNumber}</CardTitle>
                    {getStatusBadge(order.status)}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {new Date(order.createdAt).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{order.customerName}</p>
                        <p className="text-sm text-muted-foreground">{order.customerPhone}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <Package className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Valor Total</p>
                        <p className="text-lg font-bold text-green-600">
                          R$ {parseFloat(order.total).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {order.notes && (
                      <div className="p-2 bg-muted rounded text-sm">
                        <p className="font-medium">Observações:</p>
                        <p>{order.notes}</p>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => handleAccept(order.id)}
                        disabled={acceptMutation.isPending}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Aceitar
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowRejectDialog(true);
                        }}
                        disabled={rejectMutation.isPending}
                        variant="destructive"
                        className="flex-1"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Rejeitar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Pedidos em Andamento */}
      {activeOrders.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Em Andamento
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeOrders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{order.orderNumber}</CardTitle>
                    {getStatusBadge(order.status)}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {new Date(order.createdAt).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{order.customerName}</p>
                        <p className="text-sm text-muted-foreground">{order.customerPhone}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Package className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Valor Total</p>
                        <p className="text-lg font-bold text-green-600">
                          R$ {parseFloat(order.total).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 pt-2">
                      {order.status === "sent_to_kitchen" && (
                        <Button
                          onClick={() => handleUpdateStatus(order.id, "preparing")}
                          disabled={updateStatusMutation.isPending}
                          className="w-full"
                        >
                          Marcar como Preparando
                        </Button>
                      )}
                      {order.status === "preparing" && (
                        <Button
                          onClick={() => handleUpdateStatus(order.id, "ready")}
                          disabled={updateStatusMutation.isPending}
                          className="w-full"
                        >
                          Marcar como Pronto
                        </Button>
                      )}
                      {order.status === "ready" && (
                        <Button
                          onClick={() => handleUpdateStatus(order.id, "closed")}
                          disabled={updateStatusMutation.isPending}
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          Finalizar Pedido
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Mensagem quando não há pedidos */}
      {pendingOrders.length === 0 && activeOrders.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Nenhum pedido no momento</p>
            <p className="text-sm text-muted-foreground">
              Novos pedidos do BuscaZap aparecerão aqui automaticamente
            </p>
          </CardContent>
        </Card>
      )}

      {/* Dialog de Rejeição */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Pedido</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição. O cliente será notificado.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Ex: Produto em falta, restaurante fechando, etc."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectReason("");
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectReason.trim() || rejectMutation.isPending}
            >
              Rejeitar Pedido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
