import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Package, AlertTriangle, TrendingDown, Plus, Search, Filter, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Stock() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Fetch stock from tRPC
  const { data: stockItems = [], isLoading } = trpc.stock.list.useQuery();

  const filteredItems = useMemo(() => {
    return stockItems.filter((item) => {
      const matchesSearch = item.productName.toLowerCase().includes(searchTerm.toLowerCase()) || item.productSku.includes(searchTerm);
      
      // Determine status based on quantity vs minThreshold
      let status = "ok";
      if (item.quantity <= 0) status = "critical";
      else if (item.quantity < (item.minThreshold || 5)) status = "warning";
      
      const matchesStatus = !filterStatus || status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [stockItems, searchTerm, filterStatus]);

  const getStatus = (item: typeof stockItems[0]) => {
    if (item.quantity <= 0) return "critical";
    if (item.quantity < (item.minThreshold || 5)) return "warning";
    return "ok";
  };

  const criticalCount = stockItems.filter((item) => getStatus(item) === "critical").length;
  const warningCount = stockItems.filter((item) => getStatus(item) === "warning").length;
  const totalValue = stockItems.reduce((sum, item) => sum + (item.quantity * parseFloat(item.productPrice || "0")), 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "critical":
        return "bg-red-100 text-red-800";
      case "warning":
        return "bg-yellow-100 text-yellow-800";
      case "ok":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "critical":
        return "Crítico";
      case "warning":
        return "Aviso";
      case "ok":
        return "OK";
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Carregando estoque...</p>
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
            <div className="bg-purple-100 p-3 rounded-lg">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Estoque</h1>
              <p className="text-gray-600">Gerencie seu inventário e receba alertas de reposição</p>
            </div>
          </div>
          <Button className="bg-purple-600 hover:bg-purple-700">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Produto
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total de Produtos</p>
                <p className="text-3xl font-bold text-gray-900">{stockItems.length}</p>
              </div>
              <Package className="w-12 h-12 text-purple-100" />
            </div>
          </Card>
          <Card className="p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Crítico</p>
                <p className="text-3xl font-bold text-red-600">{criticalCount}</p>
              </div>
              <AlertTriangle className="w-12 h-12 text-red-100" />
            </div>
          </Card>
          <Card className="p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Aviso</p>
                <p className="text-3xl font-bold text-yellow-600">{warningCount}</p>
              </div>
              <TrendingDown className="w-12 h-12 text-yellow-100" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Valor Total</p>
                <p className="text-2xl font-bold text-gray-900">R$ {totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg" />
            </div>
          </Card>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome ou SKU..."
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
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Todos os status</option>
                <option value="critical">Crítico</option>
                <option value="warning">Aviso</option>
                <option value="ok">OK</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tabela de Estoque */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Produtos em Estoque</h2>
              {filteredItems.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum produto encontrado</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Produto</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">SKU</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Quantidade</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Mínimo</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredItems.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.productName}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{item.productSku}</td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900">{item.quantity}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{item.minThreshold || 5}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(getStatus(item))}`}>
                              {getStatusLabel(getStatus(item))}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>

          {/* Resumo */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumo do Estoque</h2>
            <div className="space-y-4">
              <div className="pb-4 border-b border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Total de Produtos</p>
                <p className="text-2xl font-bold text-gray-900">{stockItems.length}</p>
              </div>
              <div className="pb-4 border-b border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Produtos Críticos</p>
                <p className="text-2xl font-bold text-red-600">{criticalCount}</p>
              </div>
              <div className="pb-4 border-b border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Produtos em Aviso</p>
                <p className="text-2xl font-bold text-yellow-600">{warningCount}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Valor Total do Estoque</p>
                <p className="text-2xl font-bold text-green-600">R$ {totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
