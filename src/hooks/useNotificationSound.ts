/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useRef } from 'react';

// Web Audio API notification sound generator
export function useNotificationSound() {
  const audioContextRef = useRef<AudioContext | null>(null);
  
  const playNotificationSound = useCallback(() => {
    try {
      // Create audio context lazily (required for user gesture policy)
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioContextRef.current;
      
      // Resume context if suspended (browsers require user interaction)
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      
      // Create oscillator for a pleasant notification sound
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      // Pleasant two-tone notification
      oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5
      oscillator.frequency.setValueAtTime(1046.5, ctx.currentTime + 0.1); // C6
      
      oscillator.type = 'sine';
      
      // Fade in and out
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.3);
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  }, []);
  
  const playMessageSound = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioContextRef.current;
      
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      
      // Softer message sound
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      oscillator.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
      
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.03);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.2);
    } catch (error) {
      console.warn('Could not play message sound:', error);
    }
  }, []);
  
  return { playNotificationSound, playMessageSound };
}
