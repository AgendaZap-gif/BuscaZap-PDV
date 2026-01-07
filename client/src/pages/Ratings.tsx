import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, TrendingUp, MessageSquare } from "lucide-react";

export default function Ratings() {
  // Assumindo companyId 1 por enquanto
  const { data: stats, isLoading: statsLoading } = trpc.ratings.getStats.useQuery({
    companyId: 1,
  });

  const { data: ratings, isLoading: ratingsLoading } = trpc.ratings.getByCompany.useQuery({
    companyId: 1,
    limit: 20,
  });

  if (statsLoading || ratingsLoading) {
    return (
      <div className="container max-w-7xl py-8">
        <p className="text-center text-muted-foreground">Carregando avaliações...</p>
      </div>
    );
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="container max-w-7xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Avaliações dos Clientes</h1>
        <p className="text-muted-foreground mt-2">
          Feedback dos pedidos do BuscaZap
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Média Geral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="text-4xl font-bold">
                {stats?.averageRating.toFixed(1) || "0.0"}
              </div>
              <div className="flex flex-col">
                {renderStars(Math.round(stats?.averageRating || 0))}
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.totalRatings || 0} avaliações
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Distribuição
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = stats?.distribution[star as 1 | 2 | 3 | 4 | 5] || 0;
                const percentage =
                  stats && stats.totalRatings > 0
                    ? (count / stats.totalRatings) * 100
                    : 0;

                return (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-xs w-8">{star} ★</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-xs w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats && stats.averageRating >= 4.5 && (
                <div className="flex items-start gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Excelente!</p>
                    <p className="text-xs text-muted-foreground">
                      Sua avaliação está ótima
                    </p>
                  </div>
                </div>
              )}

              {stats && stats.averageRating < 4.0 && (
                <div className="flex items-start gap-2">
                  <MessageSquare className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Atenção</p>
                    <p className="text-xs text-muted-foreground">
                      Revise os comentários
                    </p>
                  </div>
                </div>
              )}

              {stats && stats.totalRatings < 10 && (
                <div className="flex items-start gap-2">
                  <Star className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Poucas avaliações</p>
                    <p className="text-xs text-muted-foreground">
                      Incentive clientes a avaliar
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Avaliações */}
      <Card>
        <CardHeader>
          <CardTitle>Avaliações Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {ratings && ratings.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma avaliação ainda
            </p>
          )}

          <div className="space-y-4">
            {ratings?.map((rating) => (
              <div
                key={rating.id}
                className="border-b last:border-0 pb-4 last:pb-0"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium">{rating.customerName}</p>
                    <p className="text-sm text-muted-foreground">
                      Pedido #{rating.orderNumber}
                    </p>
                  </div>
                  <div className="text-right">
                    {renderStars(rating.rating)}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(rating.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>

                {rating.comment && (
                  <p className="text-sm text-muted-foreground mt-2 bg-gray-50 p-3 rounded-lg">
                    "{rating.comment}"
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
