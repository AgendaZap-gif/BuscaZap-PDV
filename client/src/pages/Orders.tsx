import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ShoppingCart, Plus, Search, Filter, Eye, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendente", color: "bg-yellow-100 text-yellow-800" },
  processing: { label: "Processando", color: "bg-blue-100 text-blue-800" },
  shipped: { label: "Enviado", color: "bg-purple-100 text-purple-800" },
  delivered: { label: "Entregue", color: "bg-green-100 text-green-800" },
  cancelled: { label: "Cancelado", color: "bg-red-100 text-red-800" },
};

export default function Orders() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Fetch orders from tRPC
  const { data: orders = [], isLoading } = trpc.orders.list.useQuery();

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch = order.orderNumber.includes(searchTerm) || order.customerName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = !filterStatus || order.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, filterStatus]);

  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.totalAmount || "0"), 0);
  const pendingCount = orders.filter((o) => o.status === "pending" || o.status === "processing").length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-green-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Carregando pedidos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-3 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Pedidos</h1>
              <p className="text-gray-600">Acompanhe e gerencie seus pedidos</p>
            </div>
          </div>
          <Button className="bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4 mr-2" />
            Novo Pedido
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total de Pedidos</p>
                <p className="text-3xl font-bold text-gray-900">{totalOrders}</p>
              </div>
              <ShoppingCart className="w-12 h-12 text-green-100" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Receita Total</p>
                <p className="text-3xl font-bold text-gray-900">R$ {totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg" />
            </div>
          </Card>
          <Card className="p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pendentes</p>
                <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg" />
            </div>
          </Card>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar por número ou cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Todos os status</option>
                <option value="pending">Pendente</option>
                <option value="processing">Processando</option>
                <option value="shipped">Enviado</option>
                <option value="delivered">Entregue</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabela de Pedidos */}
        <Card className="p-6">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum pedido encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Pedido</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Cliente</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Data</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Total</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredOrders.map((order) => {
                    const statusInfo = statusConfig[order.status || "pending"] || { label: order.status || "pending", color: "bg-gray-100 text-gray-800" };
                    return (
                      <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{order.orderNumber}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{order.customerName}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{new Date(order.createdAt).toLocaleDateString("pt-BR")}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">R$ {parseFloat(order.totalAmount).toFixed(2)}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setLocation(`/order/${order.id}`)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
