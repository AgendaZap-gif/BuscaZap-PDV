import { PageNav } from "@/components/PageNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Plus, Trash2 } from "lucide-react";
import { useParams } from "wouter";
import AddProductDialog from "@/components/AddProductDialog";
import { useState } from "react";

export default function Order() {
  const { id } = useParams();
  const orderId = parseInt(id || "0");
  const [showAddProduct, setShowAddProduct] = useState(false);

  const { data: order, isLoading } = trpc.orders.getById.useQuery({ orderId });
  const { data: items } = trpc.orderItems.list.useQuery({ orderId });

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  const total = items?.reduce((sum, item) => sum + parseFloat(item.subtotal), 0) || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <PageNav title={`Comanda ${order?.orderNumber} · Mesa ${order?.tableId}`} backPath="/tables">
        <Button onClick={() => setShowAddProduct(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Item
        </Button>
      </PageNav>

      <div className="container py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {items && items.length > 0 ? (
              items.map((item) => (
                <Card key={item.id}>
                  <CardContent className="py-4 flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{item.quantity}x Produto #{item.productId}</div>
                      <div className="text-sm text-muted-foreground">R$ {item.unitPrice}</div>
                      {item.notes && (
                        <div className="text-xs text-muted-foreground mt-1">{item.notes}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-lg font-bold">R$ {item.subtotal}</div>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum item adicionado ainda. Clique em "Adicionar Item" para começar.
              </div>
            )}
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

      <AddProductDialog
        open={showAddProduct}
        onOpenChange={setShowAddProduct}
        orderId={orderId}
      />
    </div>
  );
}
