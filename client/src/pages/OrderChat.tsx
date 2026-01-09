import { useState, useEffect, useRef } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useWebSocket } from "@/hooks/useWebSocket";

export default function OrderChat() {
  const params = useParams<{ orderId: string }>();
  const orderId = parseInt(params.orderId || "0");
  const [, setLocation] = useLocation();
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();

  // Buscar mensagens
  const { data: messages, isLoading } = trpc.chat.getMessages.useQuery(
    { orderId },
    { refetchInterval: false } // Desabilitar polling, usar WebSocket
  );

  // WebSocket para receber novas mensagens em tempo real
  useWebSocket({
    orderId,
    onNewChatMessage: (newMessage) => {
      console.log('[WebSocket] Nova mensagem recebida:', newMessage);
      // Invalidar query para atualizar lista de mensagens
      utils.chat.getMessages.invalidate({ orderId });
      // Marcar como lida se for mensagem do cliente
      if (newMessage.senderType === 'customer') {
        markAsReadMutation.mutate({
          orderId,
          senderType: 'business',
        });
      }
    },
  });

  // Mutation para enviar mensagem
  const sendMutation = trpc.chat.sendMessage.useMutation({
    onSuccess: () => {
      setMessage("");
      utils.chat.getMessages.invalidate({ orderId });
      // Marcar mensagens do cliente como lidas
      markAsReadMutation.mutate({
        orderId,
        senderType: "business",
      });
    },
  });

  // Mutation para marcar como lidas
  const markAsReadMutation = trpc.chat.markAsRead.useMutation();

  // Scroll automático para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Marcar mensagens como lidas ao abrir
  useEffect(() => {
    if (orderId) {
      markAsReadMutation.mutate({
        orderId,
        senderType: "business",
      });
    }
  }, [orderId]);

  const handleSend = () => {
    if (!message.trim()) return;

    sendMutation.mutate({
      orderId,
      senderId: 1, // TODO: Pegar do contexto do usuário
      senderType: "business",
      message: message.trim(),
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isLoading) {
    return (
      <div className="container max-w-2xl py-8">
        <p className="text-center text-muted-foreground">Carregando chat...</p>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-4 h-screen flex flex-col">
      {/* Header */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/buscazap-orders")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle>Chat - Pedido #{orderId}</CardTitle>
          </div>
        </CardHeader>
      </Card>

      {/* Mensagens */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages && messages.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma mensagem ainda. Inicie a conversa!
            </p>
          )}

          {messages?.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.senderType === "business" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  msg.senderType === "business"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-900"
                }`}
              >
                <p className="text-sm">{msg.message}</p>
                <p
                  className={`text-xs mt-1 ${
                    msg.senderType === "business"
                      ? "text-blue-100"
                      : "text-gray-500"
                  }`}
                >
                  {new Date(msg.createdAt).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </CardContent>

        {/* Input de mensagem */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              placeholder="Digite sua mensagem..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={sendMutation.isPending}
            />
            <Button
              onClick={handleSend}
              disabled={!message.trim() || sendMutation.isPending}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {/* Mensagens rápidas */}
          <div className="flex gap-2 mt-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMessage("Qual é o seu endereço completo?")}
            >
              Endereço
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMessage("Precisa de troco?")}
            >
              Troco
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMessage("Seu pedido está pronto!")}
            >
              Pronto
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
