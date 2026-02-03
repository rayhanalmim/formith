import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface FloatingEmoji {
  id: number;
  emoji: string;
  x: number;
  delay: number;
  duration: number;
  scale: number;
}

interface FloatingEmojiReactionProps {
  emoji: string;
  isAnimating: boolean;
  onAnimationComplete: () => void;
}

export function FloatingEmojiReaction({ 
  emoji, 
  isAnimating, 
  onAnimationComplete 
}: FloatingEmojiReactionProps) {
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);

  const generateEmojis = useCallback(() => {
    const newEmojis: FloatingEmoji[] = [];
    const count = 15 + Math.floor(Math.random() * 10); // 15-25 emojis
    
    for (let i = 0; i < count; i++) {
      newEmojis.push({
        id: Date.now() + i,
        emoji,
        x: 10 + Math.random() * 80, // Random x position (10-90%)
        delay: Math.random() * 0.5, // Random delay 0-0.5s
        duration: 1.5 + Math.random() * 1, // Duration 1.5-2.5s
        scale: 0.6 + Math.random() * 0.8, // Scale 0.6-1.4
      });
    }
    
    return newEmojis;
  }, [emoji]);

  useEffect(() => {
    if (isAnimating) {
      const emojis = generateEmojis();
      setFloatingEmojis(emojis);
      
      // Clear emojis after animation completes
      const maxDuration = Math.max(...emojis.map(e => (e.delay + e.duration) * 1000));
      const timer = setTimeout(() => {
        setFloatingEmojis([]);
        onAnimationComplete();
      }, maxDuration + 100);
      
      return () => clearTimeout(timer);
    }
  }, [isAnimating, generateEmojis, onAnimationComplete]);

  if (!isAnimating && floatingEmojis.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-40">
      {floatingEmojis.map((item) => (
        <div
          key={item.id}
          className="absolute animate-float-up"
          style={{
            left: `${item.x}%`,
            bottom: '-50px',
            animationDelay: `${item.delay}s`,
            animationDuration: `${item.duration}s`,
            transform: `scale(${item.scale})`,
            fontSize: '2.5rem',
          }}
        >
          {item.emoji}
        </div>
      ))}
      
      <style>{`
        @keyframes float-up {
          0% {
            transform: translateY(0) scale(var(--scale, 1)) rotate(0deg);
            opacity: 1;
          }
          20% {
            opacity: 1;
          }
          80% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(-100vh) scale(var(--scale, 1)) rotate(20deg);
            opacity: 0;
          }
        }
        
        .animate-float-up {
          animation: float-up ease-out forwards;
        }
      `}</style>
    </div>
  );
}

interface TappableEmojiButtonProps {
  emoji: string;
  position: { x: number; y: number };
  onTap: () => void;
}

export function TappableEmojiButton({ emoji, position, onTap }: TappableEmojiButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = () => {
    setIsPressed(true);
    onTap();
    setTimeout(() => setIsPressed(false), 200);
  };

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        handleClick();
      }}
      onTouchEnd={(e) => {
        e.stopPropagation();
      }}
      className={cn(
        "absolute z-30 transition-all duration-200 cursor-pointer",
        "hover:scale-110 active:scale-95",
        isPressed && "scale-125"
      )}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div className="w-16 h-16 rounded-full bg-white shadow-xl flex items-center justify-center ring-2 ring-white/50">
        <span className="text-4xl">{emoji}</span>
      </div>
    </button>
  );
}
