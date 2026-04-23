import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Users, Plus, Search, Filter, Eye, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Customers() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");

  // Fetch customers from tRPC
  const { data: customers = [], isLoading } = trpc.crm.customers.list.useQuery();

  const filteredCustomers = useMemo(() => {
    let filtered = customers.filter((customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (customer.city?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
    );

    // Sort
    if (sortBy === "name") {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "totalSpent") {
      filtered.sort((a, b) => {
        const aSpent = parseFloat(a.totalSpent || "0");
        const bSpent = parseFloat(b.totalSpent || "0");
        return bSpent - aSpent;
      });
    } else if (sortBy === "createdAt") {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return filtered;
  }, [customers, searchTerm, sortBy]);

  const totalCustomers = customers.length;
  const totalSpent = customers.reduce((sum, c) => sum + parseFloat(c.totalSpent || "0"), 0);
  const averageSpent = totalCustomers > 0 ? (totalSpent / totalCustomers).toFixed(2) : "0";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Carregando clientes...</p>
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
            <div className="bg-blue-100 p-3 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">CRM - Clientes</h1>
              <p className="text-gray-600">Gerencie seus clientes e histórico de compras</p>
            </div>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Novo Cliente
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total de Clientes</p>
                <p className="text-3xl font-bold text-gray-900">{totalCustomers}</p>
              </div>
              <Users className="w-12 h-12 text-blue-100" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Gasto</p>
                <p className="text-3xl font-bold text-gray-900">R$ {totalSpent.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Gasto Médio</p>
                <p className="text-3xl font-bold text-gray-900">R$ {parseFloat(averageSpent).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg" />
            </div>
          </Card>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome, email ou cidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="name">Ordenar por Nome</option>
                <option value="totalSpent">Ordenar por Gasto</option>
                <option value="createdAt">Ordenar por Data</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabela de Clientes */}
        <Card className="p-6">
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum cliente encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Nome</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Cidade</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Pedidos</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Total Gasto</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Cadastro</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{customer.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{customer.email || "-"}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{customer.city || "-"}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">{customer.totalOrders || 0}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">R$ {parseFloat(customer.totalSpent || "0").toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{new Date(customer.createdAt).toLocaleDateString("pt-BR")}</td>
                      <td className="px-6 py-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setLocation(`/customer/${customer.id}`)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
