import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";

export default function Order() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const orderId = parseInt(id || "0");

  const { data: order, isLoading } = trpc.orders.getById.useQuery({ orderId });
  const { data: items } = trpc.orderItems.list.useQuery({ orderId });

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  const total = items?.reduce((sum, item) => sum + parseFloat(item.subtotal), 0) || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/tables")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Comanda {order?.orderNumber}</h1>
              <p className="text-sm text-muted-foreground">Mesa {order?.tableId}</p>
            </div>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Item
          </Button>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {items?.map((item) => (
              <Card key={item.id}>
                <CardContent className="py-4 flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{item.quantity}x Produto</div>
                    <div className="text-sm text-muted-foreground">R$ {item.unitPrice}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-lg font-bold">R$ {item.subtotal}</div>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Resumo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>R$ {total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>R$ {total.toFixed(2)}</span>
                </div>
                <Button className="w-full" size="lg">Fechar Conta</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
