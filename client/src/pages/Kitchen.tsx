import { PageNav } from "@/components/PageNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Check } from "lucide-react";

export default function Kitchen() {
  const companyId = 1;

  const { data: orders } = trpc.orders.list.useQuery({ companyId, status: "open" });

  return (
    <div className="min-h-screen bg-gray-50">
      <PageNav title="Tela de Cozinha" backPath="/" />
      <div className="container py-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders?.map((order) => (
            <Card key={order.id} className="kitchen-card pending">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{order.orderNumber}</span>
                  <span className="text-sm font-normal">Mesa {order.tableId}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <div className="text-sm">2x Hambúrguer</div>
                  <div className="text-sm">1x Batata Frita</div>
                </div>
                <Button className="w-full">
                  <Check className="w-4 h-4 mr-2" />
                  Marcar como Pronto
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
