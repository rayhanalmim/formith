import { cn } from '@/lib/utils';

interface OnlineIndicatorProps {
  isOnline: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-2 w-2',
  md: 'h-2.5 w-2.5',
  lg: 'h-3 w-3',
};

export function OnlineIndicator({ isOnline, size = 'md', className }: OnlineIndicatorProps) {
  if (!isOnline) return null;
  
  return (
    <span
      className={cn(
        'absolute rounded-full ring-2 ring-background bg-success',
        sizeClasses[size],
        className
      )}
      title="Online"
    />
  );
}
