import { useState, useRef, useCallback, ReactNode } from 'react';
import { Loader2, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  className?: string;
}

export function PullToRefresh({ onRefresh, children, className }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);

  const threshold = 80;
  const maxPull = 120;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Only activate if at top of scroll
    if (containerRef.current && containerRef.current.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling || isRefreshing) return;

    currentY.current = e.touches[0].clientY;
    const distance = Math.max(0, currentY.current - startY.current);
    
    // Apply resistance
    const resistedDistance = Math.min(distance * 0.5, maxPull);
    setPullDistance(resistedDistance);
  }, [isPulling, isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;
    setIsPulling(false);

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(threshold);
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, isRefreshing, onRefresh, isPulling]);

  const progress = Math.min(pullDistance / threshold, 1);
  const showIndicator = pullDistance > 10 || isRefreshing;

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-auto", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div
        className={cn(
          "absolute left-0 right-0 flex justify-center items-center transition-opacity z-10",
          showIndicator ? "opacity-100" : "opacity-0"
        )}
        style={{
          top: 0,
          height: pullDistance,
          transform: `translateY(-${Math.max(0, threshold - pullDistance)}px)`,
        }}
      >
        <div
          className={cn(
            "flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 backdrop-blur-sm transition-transform",
            isRefreshing && "animate-pulse"
          )}
          style={{
            transform: `rotate(${progress * 180}deg) scale(${0.5 + progress * 0.5})`,
          }}
        >
          {isRefreshing ? (
            <Loader2 className="h-5 w-5 text-primary animate-spin" />
          ) : (
            <ArrowDown className="h-5 w-5 text-primary" />
          )}
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: isPulling ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
}
