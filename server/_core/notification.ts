/**
 * Push Notifications - DISABLED
 * 
 * This module was previously using Manus Forge API.
 * To re-enable, integrate with Firebase Cloud Messaging, OneSignal, or similar service.
 * 
 * Original backup: notification.ts.backup
 */

export interface NotificationPayload {
  title: string;
  content: string;
  userId?: string;
}

export async function sendNotification(
  payload: NotificationPayload
): Promise<void> {
  throw new Error("Push notifications are disabled. Please integrate with Firebase Cloud Messaging or similar service.");
}

export async function notifyOwner(
  payload: { title: string; content: string }
): Promise<boolean> {
  console.warn("[Notification] notifyOwner is disabled. Notification not sent:", payload);
  return false;
}
