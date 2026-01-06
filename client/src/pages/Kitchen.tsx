import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Check } from "lucide-react";
import { useLocation } from "wouter";

export default function Kitchen() {
  const [, setLocation] = useLocation();
  const companyId = 1;

  const { data: orders } = trpc.orders.list.useQuery({ companyId, status: "open" });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">Tela de Cozinha</h1>
        </div>
      </div>

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
