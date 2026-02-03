import { useState, useEffect, useCallback } from 'react';

interface CountdownResult {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  timeRemaining: number;
  formatted: string;
  formattedAr: string;
}

export function usePollCountdown(endsAt: string | null): CountdownResult | null {
  const calculateTimeRemaining = useCallback(() => {
    if (!endsAt) return null;
    
    const endDate = new Date(endsAt);
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();
    
    if (diff <= 0) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isExpired: true,
        timeRemaining: 0,
        formatted: 'Poll ended',
        formattedAr: 'انتهى التصويت',
      };
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    // Format the countdown string - always include seconds for live animation
    let formatted = '';
    let formattedAr = '';
    
    if (days > 0) {
      formatted = `${days}d ${hours}h ${minutes}m ${seconds}s`;
      formattedAr = `${days}ي ${hours}س ${minutes}د ${seconds}ث`;
    } else if (hours > 0) {
      formatted = `${hours}h ${minutes}m ${seconds}s`;
      formattedAr = `${hours}س ${minutes}د ${seconds}ث`;
    } else if (minutes > 0) {
      formatted = `${minutes}m ${seconds}s`;
      formattedAr = `${minutes}د ${seconds}ث`;
    } else {
      formatted = `${seconds}s`;
      formattedAr = `${seconds}ث`;
    }
    
    return {
      days,
      hours,
      minutes,
      seconds,
      isExpired: false,
      timeRemaining: diff,
      formatted,
      formattedAr,
    };
  }, [endsAt]);

  const [countdown, setCountdown] = useState<CountdownResult | null>(calculateTimeRemaining);

  useEffect(() => {
    if (!endsAt) {
      setCountdown(null);
      return;
    }

    // Initial calculation
    setCountdown(calculateTimeRemaining());

    // Update every second
    const interval = setInterval(() => {
      const result = calculateTimeRemaining();
      setCountdown(result);
      
      // Stop interval if expired
      if (result?.isExpired) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endsAt, calculateTimeRemaining]);

  return countdown;
}
