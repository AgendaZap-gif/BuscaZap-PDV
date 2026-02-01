import { getCompanyAuth } from "./AdminLogin";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { BarChart3, MessageSquare, Users, ShoppingCart } from "lucide-react";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const auth = getCompanyAuth();
  const companyId = auth?.companyId ?? 0;

  useEffect(() => {
    if (!auth) setLocation("/admin/login");
  }, [auth, setLocation]);

  const { data, isLoading } = trpc.admin.getMetrics.useQuery(
    { companyId, period: "week" },
    { enabled: companyId > 0 }
  );

  if (!auth) return null;
  if (isLoading || !data) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Carregando métricas...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">Dashboard</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Conversas</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.conversationsStarted}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Leads quentes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.hotLeads}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pedidos</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.ordersCreated}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taxa conversão</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.conversionRate}%</p>
          </CardContent>
        </Card>
      </div>
      {data.byDate.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Conversas e pedidos por dia</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data.byDate}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="conversations" name="Conversas" stroke="hsl(var(--primary))" />
                <Line type="monotone" dataKey="orders" name="Pedidos" stroke="hsl(var(--chart-2))" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
