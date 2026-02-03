import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Circle, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export type UserStatus = 'online' | 'offline' | 'busy';

interface StatusSelectorProps {
  currentStatus: UserStatus;
  onStatusChange?: (status: UserStatus) => void;
  size?: 'sm' | 'md';
}

const statusConfig: Record<UserStatus, { label: string; labelAr: string; color: string }> = {
  online: { label: 'Online', labelAr: 'متصل', color: 'bg-success' },
  offline: { label: 'Offline', labelAr: 'غير متصل', color: 'bg-muted-foreground' },
  busy: { label: 'Busy', labelAr: 'مشغول', color: 'bg-destructive' },
};

export function StatusSelector({ currentStatus, onStatusChange, size = 'md' }: StatusSelectorProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (newStatus: UserStatus) => {
    if (!user || newStatus === currentStatus) return;
    
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          status: newStatus,
          last_seen_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;
      
      onStatusChange?.(newStatus);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      
      toast.success(
        language === 'ar' 
          ? `تم تغيير الحالة إلى ${statusConfig[newStatus].labelAr}` 
          : `Status changed to ${statusConfig[newStatus].label}`
      );
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error(language === 'ar' ? 'فشل تحديث الحالة' : 'Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  const config = statusConfig[currentStatus];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size={size === 'sm' ? 'sm' : 'default'}
          disabled={isUpdating}
          className="gap-2"
        >
          <Circle className={cn('h-2.5 w-2.5 fill-current', config.color, 'text-transparent')} />
          <span className={size === 'sm' ? 'text-xs' : 'text-sm'}>
            {language === 'ar' ? config.labelAr : config.label}
          </span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {(Object.keys(statusConfig) as UserStatus[]).map((status) => (
          <DropdownMenuItem
            key={status}
            onClick={() => handleStatusChange(status)}
            className={cn(
              'flex items-center gap-2 cursor-pointer',
              status === currentStatus && 'bg-muted'
            )}
          >
            <Circle 
              className={cn(
                'h-2.5 w-2.5 fill-current', 
                statusConfig[status].color,
                'text-transparent'
              )} 
            />
            <span>
              {language === 'ar' ? statusConfig[status].labelAr : statusConfig[status].label}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Status indicator dot component
interface StatusIndicatorProps {
  status: UserStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-2 w-2',
  md: 'h-2.5 w-2.5',
  lg: 'h-3 w-3',
};

export function StatusIndicator({ status, size = 'md', className }: StatusIndicatorProps) {
  const config = statusConfig[status];
  
  return (
    <span
      className={cn(
        'absolute rounded-full ring-2 ring-background',
        config.color,
        sizeClasses[size],
        className
      )}
      title={config.label}
    />
  );
}
