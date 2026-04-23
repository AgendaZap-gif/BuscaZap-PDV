import { useNotifications } from "@/hooks/useNotifications";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Trash2, CheckCircle2, AlertCircle, DollarSign, Package, Loader2 } from "lucide-react";

const notificationTypeConfig = {
  order: {
    icon: <AlertCircle className="w-5 h-5" />,
    color: "bg-blue-100 text-blue-800",
    bgColor: "bg-blue-50",
  },
  payment: {
    icon: <DollarSign className="w-5 h-5" />,
    color: "bg-green-100 text-green-800",
    bgColor: "bg-green-50",
  },
  status_change: {
    icon: <CheckCircle2 className="w-5 h-5" />,
    color: "bg-purple-100 text-purple-800",
    bgColor: "bg-purple-50",
  },
  stock_alert: {
    icon: <Package className="w-5 h-5" />,
    color: "bg-yellow-100 text-yellow-800",
    bgColor: "bg-yellow-50",
  },
};

export default function Notifications() {
  const { notifications, unreadCount, isConnected, markAsRead, dismissNotification, clearAll } = useNotifications();

  const unreadNotifications = notifications.filter((n) => !n.read);
  const readNotifications = notifications.filter((n) => n.read);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Bell className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notificações</h1>
              <p className="text-gray-600">
                {isConnected ? (
                  <span className="text-green-600">🟢 Conectado em tempo real</span>
                ) : (
                  <span className="text-red-600">🔴 Desconectado</span>
                )}
              </p>
            </div>
          </div>
          {notifications.length > 0 && (
            <Button variant="outline" onClick={clearAll} className="text-red-600 hover:text-red-700">
              <Trash2 className="w-4 h-4 mr-2" />
              Limpar Tudo
            </Button>
          )}
        </div>

        {/* Unread Count */}
        {unreadCount > 0 && (
          <Card className="p-4 mb-6 bg-blue-50 border-blue-200">
            <p className="text-sm text-blue-800">
              Você tem <strong>{unreadCount}</strong> notificação{unreadCount !== 1 ? "s" : ""} não lida{unreadCount !== 1 ? "s" : ""}
            </p>
          </Card>
        )}

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <Card className="p-12 text-center">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">Nenhuma notificação</p>
            <p className="text-sm text-gray-400">Você receberá notificações sobre pedidos, pagamentos e alertas de estoque aqui</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Unread Notifications */}
            {unreadNotifications.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-700 mb-3">Não Lidas</h2>
                <div className="space-y-3">
                  {unreadNotifications.map((notification) => {
                    const config = notificationTypeConfig[notification.type];
                    return (
                      <Card
                        key={notification.id}
                        className={`p-4 border-l-4 border-blue-500 ${config.bgColor} hover:shadow-md transition-shadow`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4 flex-1">
                            <div className={`p-2 rounded-lg ${config.color} mt-1`}>{config.icon}</div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                              <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                              <p className="text-xs text-gray-500 mt-2">
                                {new Date(notification.createdAt).toLocaleString("pt-BR")}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => dismissNotification(notification.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Read Notifications */}
            {readNotifications.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-700 mb-3">Lidas</h2>
                <div className="space-y-3">
                  {readNotifications.map((notification) => {
                    const config = notificationTypeConfig[notification.type];
                    return (
                      <Card key={notification.id} className="p-4 opacity-60 hover:opacity-100 transition-opacity">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4 flex-1">
                            <div className={`p-2 rounded-lg ${config.color}`}>{config.icon}</div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                              <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                              <p className="text-xs text-gray-500 mt-2">
                                {new Date(notification.createdAt).toLocaleString("pt-BR")}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => dismissNotification(notification.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
