import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { getSellerByUserId } from "../db";

interface NotificationPayload {
  id: string;
  type: "order" | "payment" | "status_change" | "stock_alert";
  title: string;
  message: string;
  data?: Record<string, any>;
  createdAt: Date;
  read: boolean;
}

export function setupSocketIO(httpServer: HTTPServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === "production" 
        ? process.env.VITE_FRONTEND_URL 
        : ["http://localhost:5173", "http://localhost:3000"],
      credentials: true,
    },
  });

  // Store active connections per seller
  const sellerConnections = new Map<number, Set<string>>();
  const userSessions = new Map<string, { userId: string; sellerId?: number }>();

  io.on("connection", (socket: Socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    // Authenticate and join seller room
    socket.on("authenticate", async (data: { userId: string; token?: string }) => {
      try {
        // In production, validate the token here
        userSessions.set(socket.id, { userId: data.userId });
        
        // Get seller info
        const userId = parseInt(data.userId, 10);
        const seller = await getSellerByUserId(userId);
        if (seller) {
          userSessions.set(socket.id, { userId: data.userId, sellerId: seller.id });
          
          // Add to seller's connection set
          if (!sellerConnections.has(seller.id)) {
            sellerConnections.set(seller.id, new Set());
          }
          sellerConnections.get(seller.id)!.add(socket.id);
          
          // Join seller-specific room
          socket.join(`seller:${seller.id}`);
          console.log(`[Socket.io] User ${data.userId} authenticated for seller ${seller.id}`);
          
          socket.emit("authenticated", { success: true, sellerId: seller.id });
        }
      } catch (error) {
        console.error("[Socket.io] Authentication error:", error);
        socket.emit("authenticated", { success: false, error: "Authentication failed" });
      }
    });

    // Listen for disconnect
    socket.on("disconnect", () => {
      const session = userSessions.get(socket.id);
      if (session?.sellerId) {
        const connections = sellerConnections.get(session.sellerId);
        if (connections) {
          connections.delete(socket.id);
          if (connections.size === 0) {
            sellerConnections.delete(session.sellerId);
          }
        }
      }
      userSessions.delete(socket.id);
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });

    // Handle errors
    socket.on("error", (error) => {
      console.error(`[Socket.io] Socket error for ${socket.id}:`, error);
    });
  });

  return {
    io,
    // Helper function to emit notifications to a seller
    notifySellerNewOrder: (sellerId: number, notification: NotificationPayload) => {
      io.to(`seller:${sellerId}`).emit("notification", notification);
    },
    // Helper function to emit status change
    notifySellerStatusChange: (sellerId: number, orderId: number, newStatus: string) => {
      const notification: NotificationPayload = {
        id: `order-${orderId}-${Date.now()}`,
        type: "status_change",
        title: "Status do Pedido Atualizado",
        message: `Pedido #${orderId} mudou para ${newStatus}`,
        data: { orderId, newStatus },
        createdAt: new Date(),
        read: false,
      };
      io.to(`seller:${sellerId}`).emit("notification", notification);
    },
    // Helper function to emit payment notification
    notifySellerPayment: (sellerId: number, orderId: number, amount: number) => {
      const notification: NotificationPayload = {
        id: `payment-${orderId}-${Date.now()}`,
        type: "payment",
        title: "Pagamento Recebido",
        message: `Pagamento de R$ ${amount.toFixed(2)} recebido para pedido #${orderId}`,
        data: { orderId, amount },
        createdAt: new Date(),
        read: false,
      };
      io.to(`seller:${sellerId}`).emit("notification", notification);
    },
    // Helper function to emit stock alert
    notifySellerStockAlert: (sellerId: number, productName: string, quantity: number) => {
      const notification: NotificationPayload = {
        id: `stock-${productName}-${Date.now()}`,
        type: "stock_alert",
        title: "Alerta de Estoque",
        message: `${productName} está com apenas ${quantity} unidades em estoque`,
        data: { productName, quantity },
        createdAt: new Date(),
        read: false,
      };
      io.to(`seller:${sellerId}`).emit("notification", notification);
    },
  };
}

export type SocketIOInstance = ReturnType<typeof setupSocketIO>;
