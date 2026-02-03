import { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DraggableEmojiProps {
  emoji: string;
  initialPosition?: { x: number; y: number };
  containerRef: React.RefObject<HTMLDivElement>;
  onPositionChange: (position: { x: number; y: number }) => void;
  onRemove: () => void;
}

export function DraggableEmoji({
  emoji,
  initialPosition = { x: 50, y: 30 },
  containerRef,
  onPositionChange,
  onRemove,
}: DraggableEmojiProps) {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [isSelected, setIsSelected] = useState(true);
  const emojiRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number; posX: number; posY: number } | null>(null);

  // Handle mouse/touch drag
  const handleDragStart = (clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    
    setIsDragging(true);
    setIsSelected(true);
    
    dragStartRef.current = {
      x: clientX,
      y: clientY,
      posX: position.x,
      posY: position.y,
    };
  };

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!isDragging || !dragStartRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    
    const deltaX = clientX - dragStartRef.current.x;
    const deltaY = clientY - dragStartRef.current.y;
    
    // Convert pixel movement to percentage
    const deltaXPercent = (deltaX / rect.width) * 100;
    const deltaYPercent = (deltaY / rect.height) * 100;
    
    // Calculate new position with bounds
    const newX = Math.max(10, Math.min(90, dragStartRef.current.posX + deltaXPercent));
    const newY = Math.max(10, Math.min(90, dragStartRef.current.posY + deltaYPercent));
    
    setPosition({ x: newX, y: newY });
  };

  const handleDragEnd = () => {
    if (isDragging) {
      setIsDragging(false);
      onPositionChange(position);
    }
    dragStartRef.current = null;
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleDragStart(e.clientX, e.clientY);
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    const touch = e.touches[0];
    handleDragStart(touch.clientX, touch.clientY);
  };

  // Global move and end handlers
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragStartRef.current || !containerRef.current) return;

      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;
      
      const deltaXPercent = (deltaX / rect.width) * 100;
      const deltaYPercent = (deltaY / rect.height) * 100;
      
      const newX = Math.max(10, Math.min(90, dragStartRef.current.posX + deltaXPercent));
      const newY = Math.max(10, Math.min(90, dragStartRef.current.posY + deltaYPercent));
      
      setPosition({ x: newX, y: newY });
    };

    const onMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        onPositionChange(position);
      }
      dragStartRef.current = null;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging || !dragStartRef.current || !containerRef.current) return;
      e.preventDefault();
      const touch = e.touches[0];
      
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      
      const deltaX = touch.clientX - dragStartRef.current.x;
      const deltaY = touch.clientY - dragStartRef.current.y;
      
      const deltaXPercent = (deltaX / rect.width) * 100;
      const deltaYPercent = (deltaY / rect.height) * 100;
      
      const newX = Math.max(10, Math.min(90, dragStartRef.current.posX + deltaXPercent));
      const newY = Math.max(10, Math.min(90, dragStartRef.current.posY + deltaYPercent));
      
      setPosition({ x: newX, y: newY });
    };

    const onTouchEnd = () => {
      if (isDragging) {
        setIsDragging(false);
        onPositionChange(position);
      }
      dragStartRef.current = null;
    };

    if (isDragging) {
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      document.addEventListener('touchmove', onTouchMove, { passive: false });
      document.addEventListener('touchend', onTouchEnd);
    }

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging, position, containerRef, onPositionChange]);

  // Deselect when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setIsSelected(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      ref={emojiRef}
      className={cn(
        "absolute cursor-move select-none touch-none z-30 transition-transform",
        isDragging && "scale-110",
        isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-transparent rounded-full"
      )}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: 'translate(-50%, -50%)',
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onClick={(e) => {
        e.stopPropagation();
        setIsSelected(true);
      }}
    >
      {/* Emoji container with white circle background */}
      <div className="relative">
        <div className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center">
          <span className="text-4xl">{emoji}</span>
        </div>
        
        {/* Remove button - only show when selected */}
        {isSelected && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
