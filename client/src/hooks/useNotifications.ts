import { useEffect, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/_core/hooks/useAuth";

export interface Notification {
  id: string;
  type: "order" | "payment" | "status_change" | "stock_alert";
  title: string;
  message: string;
  data?: Record<string, any>;
  createdAt: Date;
  read: boolean;
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Initialize Socket.io connection
  useEffect(() => {
    if (!user?.id) return;

    const socketUrl = window.location.origin;
    const newSocket = io(socketUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    // Connection events
    newSocket.on("connect", () => {
      console.log("[Notifications] Socket connected");
      setIsConnected(true);
      // Authenticate with the server
      newSocket.emit("authenticate", { userId: user.id });
    });

    newSocket.on("disconnect", () => {
      console.log("[Notifications] Socket disconnected");
      setIsConnected(false);
    });

    newSocket.on("authenticated", (data: { success: boolean; error?: string }) => {
      if (data.success) {
        console.log("[Notifications] Authenticated successfully");
      } else {
        console.error("[Notifications] Authentication failed:", data.error);
      }
    });

    // Listen for notifications
    newSocket.on("notification", (notification: Notification) => {
      console.log("[Notifications] Received notification:", notification);
      setNotifications((prev) => [
        { ...notification, createdAt: new Date(notification.createdAt) },
        ...prev,
      ]);
    });

    newSocket.on("error", (error) => {
      console.error("[Notifications] Socket error:", error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user?.id]);

  // Mark notification as read
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
  }, []);

  // Dismiss notification
  const dismissNotification = useCallback((notificationId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Get unread count
  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    dismissNotification,
    clearAll,
  };
}
