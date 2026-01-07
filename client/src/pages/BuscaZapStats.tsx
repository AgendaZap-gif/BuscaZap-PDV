import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, DollarSign, Clock, CheckCircle, XCircle, Package } from "lucide-react";

export default function BuscaZapStats() {
  const [period, setPeriod] = useState<"today" | "week" | "month">("today");

  // Assumindo companyId 1 por enquanto
  const { data: stats, isLoading } = trpc.buscazapStats.getStats.useQuery({
    companyId: 1,
    period,
  });

  const { data: hourlyData } = trpc.buscazapStats.getOrdersByHour.useQuery({
    companyId: 1,
    period,
  });

  const { data: weekdayData } = trpc.buscazapStats.getOrdersByWeekday.useQuery({
    companyId: 1,
  });

  if (isLoading) {
    return (
      <div className="container max-w-7xl py-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Carregando estatísticas...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total de Pedidos",
      value: stats?.totalOrders || 0,
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Taxa de Aceitação",
      value: `${stats?.acceptanceRate || 0}%`,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Faturamento Total",
      value: `R$ ${stats?.totalRevenue.toFixed(2) || "0.00"}`,
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
    {
      title: "Ticket Médio",
      value: `R$ ${stats?.avgOrderValue.toFixed(2) || "0.00"}`,
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Tempo Médio",
      value: `${stats?.avgPrepTime || 0} min`,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: "Pedidos Rejeitados",
      value: stats?.rejectedOrders || 0,
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
  ];

  // Encontrar horário de pico
  const peakHour = hourlyData?.reduce((max, curr) => 
    curr.count > max.count ? curr : max
  , { hour: 0, count: 0 });

  // Encontrar dia mais movimentado
  const peakDay = weekdayData?.reduce((max, curr) =>
    curr.count > max.count ? curr : max
  , { day: "", count: 0 });

  return (
    <div className="container max-w-7xl py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Estatísticas BuscaZap</h1>
          <p className="text-muted-foreground mt-2">
            Análise de desempenho dos pedidos do aplicativo
          </p>
        </div>

        <Select value={period} onValueChange={(value: any) => setPeriod(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Selecione o período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Hoje</SelectItem>
            <SelectItem value="week">Última Semana</SelectItem>
            <SelectItem value="month">Último Mês</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráficos Simplificados */}
      <div className="grid gap-4 md:grid-cols-2 mb-8">
        {/* Horários de Pico */}
        <Card>
          <CardHeader>
            <CardTitle>Horários de Pico</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {hourlyData?.filter(h => h.count > 0).slice(0, 5).map((item) => (
                <div key={item.hour} className="flex items-center justify-between">
                  <span className="text-sm">
                    {item.hour}:00 - {item.hour + 1}:00
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${(item.count / (peakHour?.count || 1)) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{item.count}</span>
                  </div>
                </div>
              ))}
              {hourlyData?.filter(h => h.count > 0).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum pedido no período selecionado
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dias da Semana */}
        <Card>
          <CardHeader>
            <CardTitle>Pedidos por Dia da Semana</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {weekdayData?.map((item) => (
                <div key={item.day} className="flex items-center justify-between">
                  <span className="text-sm w-12">{item.day}</span>
                  <div className="flex items-center gap-2 flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{
                          width: `${(item.count / (peakDay?.count || 1)) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {peakHour && peakHour.count > 0 && (
              <div className="flex items-start gap-2">
                <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium">Horário de Pico</p>
                  <p className="text-sm text-muted-foreground">
                    {peakHour.hour}:00 - {peakHour.hour + 1}:00 com {peakHour.count} pedidos
                  </p>
                </div>
              </div>
            )}

            {peakDay && peakDay.count > 0 && (
              <div className="flex items-start gap-2">
                <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">Dia Mais Movimentado</p>
                  <p className="text-sm text-muted-foreground">
                    {peakDay.day} com {peakDay.count} pedidos
                  </p>
                </div>
              </div>
            )}

            {stats && stats.acceptanceRate < 80 && (
              <div className="flex items-start gap-2">
                <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <p className="font-medium">Taxa de Aceitação Baixa</p>
                  <p className="text-sm text-muted-foreground">
                    Sua taxa de aceitação está em {stats.acceptanceRate}%. Considere revisar os motivos de rejeição.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
