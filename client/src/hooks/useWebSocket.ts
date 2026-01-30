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

/** URL base da API (mesmo origin em dev/prod quando PDV e API estão juntos) */
function getSocketUrl(): string {
  if (typeof window === "undefined") return "";
  const url = import.meta.env.VITE_API_URL ?? window.location.origin;
  return url;
}

export function useWebSocket(options: UseWebSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const optsRef = useRef(options);
  optsRef.current = options;

  useEffect(() => {
    const url = getSocketUrl();
    const socket = io(url || undefined, {
      path: "/socket.io/",
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[WebSocket] Connected:", socket.id);
      const { companyId, orderId } = optsRef.current;
      if (companyId) socket.emit("join-company", companyId);
      if (orderId) socket.emit("join-order", orderId);
    });

    socket.on("disconnect", () => {
      console.log("[WebSocket] Disconnected");
    });

    socket.on("new-order", (order: any) => {
      optsRef.current.onNewOrder?.(order);
    });
    socket.on("order-status-update", (data: { orderId: number; status: string }) => {
      optsRef.current.onOrderStatusUpdate?.(data);
    });
    socket.on("new-chat-message", (message: any) => {
      optsRef.current.onNewChatMessage?.(message);
    });
    socket.on("new-rating", (rating: any) => {
      optsRef.current.onNewRating?.(rating);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [options.companyId, options.orderId]);

  return socketRef.current;
}
