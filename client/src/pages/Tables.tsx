import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Plus, Users } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Tables() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  // TODO: Get companyId from user context
  const companyId = user?.id || 1;

  const { data: tables, isLoading } = trpc.tables.list.useQuery({ companyId });

  const createOrderMutation = trpc.orders.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Comanda ${data.orderNumber} criada!`);
      setLocation(`/order/${data.id}`);
    },
    onError: (error) => {
      toast.error(`Erro ao criar comanda: ${error.message}`);
    },
  });

  const handleTableClick = async (table: any) => {
    if (table.status === "occupied" && table.currentOrderId) {
      setLocation(`/order/${table.currentOrderId}`);
    } else {
      // Criar nova comanda
      createOrderMutation.mutate({
        companyId,
        type: "dine_in",
        tableId: table.id,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando mesas...</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-50 border-green-200 hover:border-green-400";
      case "occupied":
        return "bg-red-50 border-red-200 hover:border-red-400";
      case "reserved":
        return "bg-yellow-50 border-yellow-200 hover:border-yellow-400";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "available":
        return "Disponível";
      case "occupied":
        return "Ocupada";
      case "reserved":
        return "Reservada";
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Gestão de Mesas</h1>
              <p className="text-sm text-muted-foreground">
                {tables?.length || 0} mesas cadastradas
              </p>
            </div>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nova Mesa
          </Button>
        </div>
      </div>

      <div className="container py-8">
        {!tables || tables.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma mesa cadastrada</h3>
              <p className="text-muted-foreground mb-4">
                Cadastre mesas para começar a gerenciar comandas
              </p>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Cadastrar Primeira Mesa
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {tables.map((table) => (
              <Card
                key={table.id}
                className={`cursor-pointer transition-all table-card ${table.status} ${getStatusColor(table.status)}`}
                onClick={() => handleTableClick(table)}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-center">
                    <div className="text-3xl font-bold mb-1">
                      {table.number}
                    </div>
                    <div className="text-xs font-normal text-muted-foreground">
                      {getStatusText(table.status)}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-center text-xs text-muted-foreground">
                    <Users className="w-3 h-3 mr-1" />
                    {table.capacity} pessoas
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-8 grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-green-500"></div>
                <div>
                  <div className="text-2xl font-bold">
                    {tables?.filter((t) => t.status === "available").length || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Disponíveis</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-red-500"></div>
                <div>
                  <div className="text-2xl font-bold">
                    {tables?.filter((t) => t.status === "occupied").length || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Ocupadas</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                <div>
                  <div className="text-2xl font-bold">
                    {tables?.filter((t) => t.status === "reserved").length || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Reservadas</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
