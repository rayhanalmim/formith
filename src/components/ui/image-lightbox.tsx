import { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface ImageLightboxProps {
  images: { url: string; alt?: string }[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

export function ImageLightbox({ 
  images, 
  initialIndex = 0, 
  isOpen, 
  onClose 
}: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const lastTouchDistance = useRef<number | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Reset state when opening or changing image
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      resetTransforms();
    }
  }, [isOpen, initialIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, currentIndex, images.length]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    resetTransforms();
  }, [images.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    resetTransforms();
  }, [images.length]);

  const resetTransforms = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    lastTouchDistance.current = null;
  };

  // Double click/tap to zoom
  const handleDoubleClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (scale > 1) {
      resetTransforms();
    } else {
      setScale(2);
    }
  };

  // Mouse drag for panning when zoomed
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    const newScale = Math.min(Math.max(scale + delta, 1), 4);
    
    if (newScale <= 1) {
      resetTransforms();
    } else {
      setScale(newScale);
    }
  };

  // Touch handlers for pinch-to-zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const distance = getTouchDistance(e.touches);
      lastTouchDistance.current = distance;
    } else if (e.touches.length === 1 && scale > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastTouchDistance.current !== null) {
      e.preventDefault();
      const distance = getTouchDistance(e.touches);
      const delta = (distance - lastTouchDistance.current) / 100;
      const newScale = Math.min(Math.max(scale + delta, 1), 4);
      
      if (newScale <= 1) {
        resetTransforms();
      } else {
        setScale(newScale);
      }
      lastTouchDistance.current = distance;
    } else if (e.touches.length === 1 && isDragging && scale > 1) {
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      });
    }
  };

  const handleTouchEnd = () => {
    lastTouchDistance.current = null;
    setIsDragging(false);
  };

  const getTouchDistance = (touches: React.TouchList) => {
    return Math.hypot(
      touches[0].clientX - touches[1].clientX,
      touches[0].clientY - touches[1].clientY
    );
  };

  if (!isOpen) return null;

  const currentImage = images[currentIndex];
  const showNavigation = images.length > 1;

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/95 animate-fade-in flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 z-10 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white"
        onClick={onClose}
      >
        <X className="h-5 w-5" />
      </Button>

      {/* Image counter */}
      {showNavigation && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 text-white/80 text-sm font-medium">
          {currentIndex + 1} / {images.length}
        </div>
      )}

      {/* Previous button */}
      {showNavigation && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white/10 hover:bg-white/20 text-white"
          onClick={(e) => {
            e.stopPropagation();
            goToPrevious();
          }}
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
      )}

      {/* Next button */}
      {showNavigation && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white/10 hover:bg-white/20 text-white"
          onClick={(e) => {
            e.stopPropagation();
            goToNext();
          }}
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      )}

      {/* Image container */}
      <div 
        className="flex items-center justify-center w-full h-full p-4 sm:p-8"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img
          ref={imageRef}
          src={currentImage.url}
          alt={currentImage.alt || ''}
          className={cn(
            'max-w-full max-h-full object-contain select-none transition-transform duration-150',
            isDragging ? 'cursor-grabbing' : scale > 1 ? 'cursor-grab' : 'cursor-default'
          )}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            touchAction: 'none',
          }}
          onDoubleClick={handleDoubleClick}
          draggable={false}
        />
      </div>

      {/* Thumbnail navigation */}
      {showNavigation && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-black/50 rounded-lg p-2 max-w-[90vw] overflow-x-auto">
          {images.map((image, index) => (
            <button
              key={index}
              className={cn(
                'w-10 h-10 sm:w-12 sm:h-12 rounded-md overflow-hidden flex-shrink-0 border-2 transition-all',
                index === currentIndex 
                  ? 'border-white ring-1 ring-white/50' 
                  : 'border-transparent opacity-60 hover:opacity-100'
              )}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(index);
                resetTransforms();
              }}
            >
              <img
                src={image.url}
                alt=""
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
