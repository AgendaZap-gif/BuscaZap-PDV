import { useEffect, useRef } from "react";

/**
 * Hook para notificação sonora de novos pedidos
 * Toca um som quando o número de pedidos aumenta
 */
export function useOrderNotification(orderCount: number) {
  const previousCountRef = useRef(orderCount);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // Criar AudioContext se não existir
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    // Verificar se o número de pedidos aumentou
    if (orderCount > previousCountRef.current && previousCountRef.current > 0) {
      playNotificationSound();
    }

    previousCountRef.current = orderCount;
  }, [orderCount]);

  const playNotificationSound = () => {
    if (!audioContextRef.current) return;

    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Configurar som (beep duplo)
    oscillator.frequency.value = 800; // Frequência em Hz
    gainNode.gain.value = 0.3; // Volume

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.1);

    // Segundo beep
    const oscillator2 = ctx.createOscillator();
    const gainNode2 = ctx.createGain();
    
    oscillator2.connect(gainNode2);
    gainNode2.connect(ctx.destination);
    
    oscillator2.frequency.value = 1000;
    gainNode2.gain.value = 0.3;
    
    oscillator2.start(ctx.currentTime + 0.15);
    oscillator2.stop(ctx.currentTime + 0.25);
  };

  return { playNotificationSound };
}
