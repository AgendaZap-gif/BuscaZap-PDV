import { Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";

let io: SocketIOServer | null = null;

export function initializeWebSocket(httpServer: HTTPServer) {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
    path: "/socket.io/",
  });

  io.on("connection", (socket) => {
    console.log(`[WebSocket] Client connected: ${socket.id}`);

    // Cliente se junta a uma sala específica da empresa
    socket.on("join-company", (companyId: number) => {
      const room = `company-${companyId}`;
      socket.join(room);
      console.log(`[WebSocket] Client ${socket.id} joined room: ${room}`);
    });

    // Cliente se junta a uma sala específica de pedido (para chat)
    socket.on("join-order", (orderId: number) => {
      const room = `order-${orderId}`;
      socket.join(room);
      console.log(`[WebSocket] Client ${socket.id} joined room: ${room}`);
    });

    socket.on("disconnect", () => {
      console.log(`[WebSocket] Client disconnected: ${socket.id}`);
    });
  });

  console.log("[WebSocket] Server initialized");
  return io;
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error("WebSocket not initialized. Call initializeWebSocket first.");
  }
  return io;
}

// Emitir evento de novo pedido para uma empresa específica
export function emitNewOrder(companyId: number, order: any) {
  if (!io) return;
  const room = `company-${companyId}`;
  io.to(room).emit("new-order", order);
  console.log(`[WebSocket] Emitted new-order to room: ${room}`);
}

// Emitir evento de atualização de status de pedido
export function emitOrderStatusUpdate(companyId: number, orderId: number, status: string) {
  if (!io) return;
  const room = `company-${companyId}`;
  io.to(room).emit("order-status-update", { orderId, status });
  console.log(`[WebSocket] Emitted order-status-update to room: ${room}`);
}

// Emitir evento de pedido atualizado (ex.: novo item adicionado pelo garçom no app)
export function emitOrderUpdated(companyId: number, orderId: number) {
  if (!io) return;
  const room = `company-${companyId}`;
  io.to(room).emit("order-updated", { orderId });
  console.log(`[WebSocket] Emitted order-updated to room: ${room}`);
}

// Emitir evento de nova mensagem de chat
export function emitNewChatMessage(orderId: number, message: any) {
  if (!io) return;
  const room = `order-${orderId}`;
  io.to(room).emit("new-chat-message", message);
  console.log(`[WebSocket] Emitted new-chat-message to room: ${room}`);
}

// Emitir evento de nova avaliação
export function emitNewRating(companyId: number, rating: any) {
  if (!io) return;
  const room = `company-${companyId}`;
  io.to(room).emit("new-rating", rating);
  console.log(`[WebSocket] Emitted new-rating to room: ${room}`);
}
