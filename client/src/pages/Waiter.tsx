import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Plus } from "lucide-react";
import { useLocation } from "wouter";

export default function Waiter() {
  const [, setLocation] = useLocation();
  const companyId = 1;

  const { data: tables } = trpc.tables.list.useQuery({ companyId });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">Modo Garçom</h1>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {tables?.filter(t => t.status === "occupied").map((table) => (
            <Card key={table.id} className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="py-6 text-center">
                <div className="text-3xl font-bold mb-2">{table.number}</div>
                <Button size="sm" variant="outline" className="w-full">
                  <Plus className="w-3 h-3 mr-1" />
                  Adicionar Item
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
