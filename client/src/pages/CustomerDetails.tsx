import { useState } from "react";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Mail, Phone, MapPin, MessageCircle, TrendingUp, ShoppingBag, DollarSign, Calendar } from "lucide-react";

// Mock data for customer details
const mockCustomer = {
  id: 1,
  name: "João Silva",
  email: "joao@example.com",
  phone: "(11) 98765-4321",
  city: "São Paulo",
  state: "SP",
  address: "Rua das Flores, 123",
  createdAt: new Date("2024-01-15"),
  totalOrders: 12,
  totalSpent: 3500.00,
  averageTicket: 291.67,
  lastOrder: new Date("2026-03-28"),
};

const mockOrders = [
  {
    id: 1,
    orderNumber: "#ORD-001",
    date: new Date("2026-03-28"),
    total: 450.00,
    status: "delivered",
    items: 3,
  },
  {
    id: 2,
    orderNumber: "#ORD-002",
    date: new Date("2026-03-20"),
    total: 320.00,
    status: "delivered",
    items: 2,
  },
  {
    id: 3,
    orderNumber: "#ORD-003",
    date: new Date("2026-03-10"),
    total: 280.00,
    status: "delivered",
    items: 4,
  },
  {
    id: 4,
    orderNumber: "#ORD-004",
    date: new Date("2026-02-28"),
    total: 520.00,
    status: "delivered",
    items: 5,
  },
];

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendente", color: "bg-yellow-100 text-yellow-800" },
  processing: { label: "Processando", color: "bg-blue-100 text-blue-800" },
  shipped: { label: "Enviado", color: "bg-purple-100 text-purple-800" },
  delivered: { label: "Entregue", color: "bg-green-100 text-green-800" },
  cancelled: { label: "Cancelado", color: "bg-red-100 text-red-800" },
};

export default function CustomerDetails() {
  const [, params] = useRoute("/customer/:id");
  const [showWhatsApp, setShowWhatsApp] = useState(false);

  const handleWhatsAppMessage = () => {
    const message = `Olá ${mockCustomer.name}, tudo bem? Gostaria de oferecer uma promoção especial para você!`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/55${mockCustomer.phone.replace(/\D/g, "")}?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleEmailMessage = () => {
    const subject = `Promoção Especial para ${mockCustomer.name}`;
    const body = `Olá ${mockCustomer.name},\n\nGostaria de oferecer uma promoção especial para você!\n\nAtenciosamente`;
    const mailtoUrl = `mailto:${mockCustomer.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header com botão voltar */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="sm" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{mockCustomer.name}</h1>
            <p className="text-gray-600">Cliente desde {mockCustomer.createdAt.toLocaleDateString("pt-BR")}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Informações de Contato */}
          <Card className="p-6 lg:col-span-1">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informações de Contato</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="text-sm font-medium text-gray-900">{mockCustomer.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Telefone</p>
                  <p className="text-sm font-medium text-gray-900">{mockCustomer.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-sm text-gray-600">Localização</p>
                  <p className="text-sm font-medium text-gray-900">{mockCustomer.city}, {mockCustomer.state}</p>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-200 space-y-2">
                <Button
                  onClick={handleWhatsAppMessage}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  size="sm"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  WhatsApp
                </Button>
                <Button
                  onClick={handleEmailMessage}
                  variant="outline"
                  className="w-full"
                  size="sm"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </Button>
              </div>
            </div>
          </Card>

          {/* Análise de Compras */}
          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total de Pedidos</p>
                  <p className="text-3xl font-bold text-gray-900">{mockCustomer.totalOrders}</p>
                </div>
                <ShoppingBag className="w-12 h-12 text-blue-100" />
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Gasto</p>
                  <p className="text-3xl font-bold text-gray-900">R$ {mockCustomer.totalSpent.toFixed(2)}</p>
                </div>
                <DollarSign className="w-12 h-12 text-green-100" />
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Ticket Médio</p>
                  <p className="text-3xl font-bold text-gray-900">R$ {mockCustomer.averageTicket.toFixed(2)}</p>
                </div>
                <TrendingUp className="w-12 h-12 text-purple-100" />
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Último Pedido</p>
                  <p className="text-sm font-medium text-gray-900">{mockCustomer.lastOrder.toLocaleDateString("pt-BR")}</p>
                </div>
                <Calendar className="w-12 h-12 text-orange-100" />
              </div>
            </Card>
          </div>
        </div>

        {/* Histórico de Pedidos */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Histórico de Pedidos</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Pedido</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Data</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Itens</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Total</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {mockOrders.map((order) => {
                  const statusInfo = statusConfig[order.status] || { label: order.status, color: "bg-gray-100 text-gray-800" };
                  return (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{order.orderNumber}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{order.date.toLocaleDateString("pt-BR")}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{order.items} item(ns)</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">R$ {order.total.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
