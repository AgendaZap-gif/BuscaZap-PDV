import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Download, Clock, CheckCircle, Truck, Package } from "lucide-react";

// Mock data for order details
const mockOrderDetails = {
  id: 1,
  orderNumber: "#ORD-001",
  customerName: "João Silva",
  customerEmail: "joao@example.com",
  customerPhone: "(11) 98765-4321",
  date: new Date("2026-03-28"),
  total: 450.00,
  status: "delivered",
  items: [
    { id: 1, name: "Produto A", quantity: 2, price: 150.00, subtotal: 300.00 },
    { id: 2, name: "Produto B", quantity: 1, price: 150.00, subtotal: 150.00 },
  ],
  timeline: [
    { status: "pending", label: "Pedido Criado", date: new Date("2026-03-28 08:00"), completed: true },
    { status: "processing", label: "Processando", date: new Date("2026-03-28 09:30"), completed: true },
    { status: "shipped", label: "Enviado", date: new Date("2026-03-29 14:00"), completed: true },
    { status: "delivered", label: "Entregue", date: new Date("2026-03-30 16:45"), completed: true },
  ],
  shippingAddress: "Rua das Flores, 123 - São Paulo, SP",
  trackingNumber: "BR123456789",
};

const statusConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  pending: { label: "Pendente", icon: <Clock className="w-5 h-5" />, color: "text-yellow-600" },
  processing: { label: "Processando", icon: <Package className="w-5 h-5" />, color: "text-blue-600" },
  shipped: { label: "Enviado", icon: <Truck className="w-5 h-5" />, color: "text-purple-600" },
  delivered: { label: "Entregue", icon: <CheckCircle className="w-5 h-5" />, color: "text-green-600" },
};

export default function OrderDetails() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/order/:id");
  const orderId = params?.id;

  const order = mockOrderDetails;
  const statusInfo = statusConfig[order.status] || { label: order.status, icon: null, color: "text-gray-600" };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/orders")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{order.orderNumber}</h1>
            <p className="text-gray-600">Detalhes do pedido</p>
          </div>
        </div>

        {/* Status Card */}
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Status Atual</p>
              <div className="flex items-center gap-2">
                <span className={statusInfo.color}>{statusInfo.icon}</span>
                <p className="text-2xl font-bold text-gray-900">{statusInfo.label}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 mb-1">Data do Pedido</p>
              <p className="text-2xl font-bold text-gray-900">{order.date.toLocaleDateString("pt-BR")}</p>
            </div>
          </div>
        </Card>

        {/* Timeline */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Histórico do Pedido</h2>
          <div className="space-y-6">
            {order.timeline.map((event, index) => {
              const eventStatus = statusConfig[event.status] || { label: event.label, icon: null, color: "text-gray-600" };
              return (
                <div key={index} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`p-2 rounded-full ${event.completed ? "bg-green-100" : "bg-gray-100"}`}>
                      <span className={event.completed ? "text-green-600" : "text-gray-400"}>{eventStatus.icon}</span>
                    </div>
                    {index < order.timeline.length - 1 && (
                      <div className={`w-1 h-12 ${event.completed ? "bg-green-200" : "bg-gray-200"}`} />
                    )}
                  </div>
                  <div className="pt-2">
                    <p className="font-semibold text-gray-900">{event.label}</p>
                    <p className="text-sm text-gray-600">{event.date.toLocaleString("pt-BR")}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Itens do Pedido */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Itens do Pedido</h2>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between pb-4 border-b border-gray-200 last:border-0">
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-600">Quantidade: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">R$ {item.subtotal.toFixed(2)}</p>
                      <p className="text-sm text-gray-600">R$ {item.price.toFixed(2)} un.</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Resumo */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumo</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-gray-900">R$ {order.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Frete</span>
                <span className="font-medium text-gray-900">Grátis</span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="text-xl font-bold text-green-600">R$ {order.total.toFixed(2)}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Informações de Entrega */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Endereço de Entrega</h2>
            <p className="text-gray-600 mb-4">{order.shippingAddress}</p>
            <div className="space-y-2">
              <p className="text-sm"><span className="font-medium text-gray-900">Rastreamento:</span> {order.trackingNumber}</p>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informações do Cliente</h2>
            <div className="space-y-2">
              <p className="text-sm"><span className="font-medium text-gray-900">Nome:</span> {order.customerName}</p>
              <p className="text-sm"><span className="font-medium text-gray-900">Email:</span> {order.customerEmail}</p>
              <p className="text-sm"><span className="font-medium text-gray-900">Telefone:</span> {order.customerPhone}</p>
            </div>
          </Card>
        </div>

        {/* Ações */}
        <div className="flex gap-4 mt-8">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Download className="w-4 h-4 mr-2" />
            Baixar Nota Fiscal
          </Button>
          <Button variant="outline">
            Enviar Mensagem
          </Button>
        </div>
      </div>
    </div>
  );
}
