import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

interface UseWebSocketOptions {
  companyId?: number;
  orderId?: number;
  onNewOrder?: (order: any) => void;
  onOrderStatusUpdate?: (data: { orderId: number; status: string }) => void;
  onNewChatMessage?: (message: any) => void;
  onNewRating?: (rating: any) => void;
}

export function useWebSocket(options: UseWebSocketOptions) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Conectar ao WebSocket
    const socket = io({
      path: "/socket.io/",
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[WebSocket] Connected:", socket.id);

      // Entrar na sala da empresa se companyId fornecido
      if (options.companyId) {
        socket.emit("join-company", options.companyId);
      }

      // Entrar na sala do pedido se orderId fornecido
      if (options.orderId) {
        socket.emit("join-order", options.orderId);
      }
    });

    socket.on("disconnect", () => {
      console.log("[WebSocket] Disconnected");
    });

    // Registrar listeners de eventos
    if (options.onNewOrder) {
      socket.on("new-order", options.onNewOrder);
    }

    if (options.onOrderStatusUpdate) {
      socket.on("order-status-update", options.onOrderStatusUpdate);
    }

    if (options.onNewChatMessage) {
      socket.on("new-chat-message", options.onNewChatMessage);
    }

    if (options.onNewRating) {
      socket.on("new-rating", options.onNewRating);
    }

    // Cleanup ao desmontar
    return () => {
      socket.disconnect();
    };
  }, [options.companyId, options.orderId]);

  return socketRef.current;
}
