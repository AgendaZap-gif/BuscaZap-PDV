import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, DollarSign, TrendingDown, PieChart as PieChartIcon, Download, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Reports() {
  const [period, setPeriod] = useState("monthly");

  // Fetch transactions from tRPC
  const { data: transactions = [], isLoading } = trpc.reports.transactions.useQuery();

  // Process data based on transactions
  const processedData = useMemo(() => {
    if (!transactions.length) {
      return {
        revenueData: [],
        totalRevenue: 0,
        totalExpenses: 0,
        netProfit: 0,
        profitMargin: "0",
        transactionCount: 0,
        averageTicket: 0,
        activeCustomers: 0,
      };
    }

    // Group transactions by type and calculate totals
    const sales = transactions.filter((t) => t.type === "sale").reduce((sum, t) => sum + parseFloat(t.amount || "0"), 0);
    const refunds = transactions.filter((t) => t.type === "refund").reduce((sum, t) => sum + parseFloat(t.amount || "0"), 0);
    const commissions = transactions.filter((t) => t.type === "commission").reduce((sum, t) => sum + parseFloat(t.amount || "0"), 0);

    const totalRevenue = sales;
    const totalExpenses = refunds + commissions;
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(2) : "0";

    // Create monthly revenue data (last 6 months)
    const monthlyData: Record<string, { month: string; revenue: number; expenses: number }> = {};
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"];
    months.forEach((month) => {
      monthlyData[month] = { month, revenue: 0, expenses: 0 };
    });

    transactions.forEach((t) => {
      const date = new Date(t.createdAt);
      const monthIndex = date.getMonth();
      const month = months[monthIndex];
      if (month && monthlyData[month]) {
        if (t.type === "sale") {
          monthlyData[month].revenue += parseFloat(t.amount || "0");
        } else {
          monthlyData[month].expenses += parseFloat(t.amount || "0");
        }
      }
    });

    const revenueData = Object.values(monthlyData).filter((d) => d.revenue > 0 || d.expenses > 0);

    return {
      revenueData,
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin,
      transactionCount: transactions.length,
      averageTicket: transactions.length > 0 ? (totalRevenue / transactions.length).toFixed(2) : "0",
      activeCustomers: transactions.length,
    };
  }, [transactions]);

  // Category distribution (simulated from transactions)
  const categoryData = [
    { name: "Vendas", value: 60, fill: "#10b981" },
    { name: "Reembolsos", value: 25, fill: "#ef4444" },
    { name: "Comissões", value: 15, fill: "#f59e0b" },
  ];

  // Cash flow data (last 7 days)
  const cashFlowData = useMemo(() => {
    const days: Array<{ day: string; entrada: number; saída: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStr = String(date.getDate()).padStart(2, "0");
      days.push({ day: dayStr, entrada: 0, saída: 0 });
    }

    transactions.forEach((t) => {
      const date = new Date(t.createdAt);
      const dayStr = String(date.getDate()).padStart(2, "0");
      const dayData = days.find((d) => d.day === dayStr);
      if (dayData) {
        if (t.type === "sale") {
          dayData.entrada += parseFloat(t.amount || "0");
        } else {
          dayData.saída += parseFloat(t.amount || "0");
        }
      }
    });

    return days;
  }, [transactions]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Carregando relatórios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Relatórios Financeiros</h1>
            <p className="text-gray-600">Análise completa de receitas, despesas e lucratividade</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>

        {/* Período */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Período:</span>
            <div className="flex gap-2">
              <Button
                variant={period === "daily" ? "default" : "outline"}
                size="sm"
                onClick={() => setPeriod("daily")}
              >
                Diário
              </Button>
              <Button
                variant={period === "weekly" ? "default" : "outline"}
                size="sm"
                onClick={() => setPeriod("weekly")}
              >
                Semanal
              </Button>
              <Button
                variant={period === "monthly" ? "default" : "outline"}
                size="sm"
                onClick={() => setPeriod("monthly")}
              >
                Mensal
              </Button>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Receita Total</p>
                <p className="text-3xl font-bold text-gray-900">R$ {processedData.totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              <TrendingUp className="w-12 h-12 text-green-100" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Despesas Total</p>
                <p className="text-3xl font-bold text-gray-900">R$ {processedData.totalExpenses.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              <TrendingDown className="w-12 h-12 text-red-100" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Lucro Líquido</p>
                <p className="text-3xl font-bold text-green-600">R$ {processedData.netProfit.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              <DollarSign className="w-12 h-12 text-green-100" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Margem de Lucro</p>
                <p className="text-3xl font-bold text-blue-600">{processedData.profitMargin}%</p>
              </div>
              <PieChartIcon className="w-12 h-12 text-blue-100" />
            </div>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Receita vs Despesas */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Receita vs Despesas</h2>
            {processedData.revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={processedData.revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => `R$ ${typeof value === 'number' ? value.toFixed(2) : value}`} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#10b981" name="Receita" />
                  <Bar dataKey="expenses" fill="#ef4444" name="Despesas" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                Sem dados disponíveis
              </div>
            )}
          </Card>

          {/* Distribuição por Tipo */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Distribuição por Tipo</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Cash Flow */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Fluxo de Caixa - Últimos 7 Dias</h2>
          {cashFlowData.some((d) => d.entrada > 0 || d.saída > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={cashFlowData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip formatter={(value: any) => `R$ ${typeof value === 'number' ? value.toFixed(2) : value}`} />
                <Legend />
                <Line type="monotone" dataKey="entrada" stroke="#10b981" strokeWidth={2} name="Entrada" />
                <Line type="monotone" dataKey="saída" stroke="#ef4444" strokeWidth={2} name="Saída" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              Sem dados disponíveis
            </div>
          )}
        </Card>

        {/* Resumo Financeiro */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <h3 className="text-sm font-semibold text-gray-600 mb-4">Ticket Médio</h3>
            <p className="text-3xl font-bold text-gray-900">R$ {typeof processedData.averageTicket === 'string' ? parseFloat(processedData.averageTicket).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : processedData.averageTicket.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p className="text-xs text-gray-500 mt-2">Baseado em {processedData.transactionCount} transações</p>
          </Card>
          <Card className="p-6">
            <h3 className="text-sm font-semibold text-gray-600 mb-4">Número de Transações</h3>
            <p className="text-3xl font-bold text-gray-900">{processedData.transactionCount}</p>
            <p className="text-xs text-gray-500 mt-2">Total de movimentações</p>
          </Card>
          <Card className="p-6">
            <h3 className="text-sm font-semibold text-gray-600 mb-4">Clientes Ativos</h3>
            <p className="text-3xl font-bold text-gray-900">{processedData.activeCustomers}</p>
            <p className="text-xs text-gray-500 mt-2">Clientes com transações</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
