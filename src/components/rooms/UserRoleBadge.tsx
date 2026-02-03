import { Shield, Crown, Star, ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/hooks/useUserRole';

// Combined role type that includes both site-level and room-level roles
export type CombinedRole = UserRole | 'room_moderator' | null | undefined;

interface UserRoleBadgeProps {
  role: CombinedRole;
  roomRole?: string | null; // Room-level role from room_members table
  size?: 'sm' | 'md';
}

export function UserRoleBadge({ role, roomRole, size = 'sm' }: UserRoleBadgeProps) {
  const { language } = useLanguage();

  // Determine which role to display - prioritize site-level roles over room-level
  const effectiveRole = role && role !== 'user'
    ? role 
    : (roomRole === 'moderator' || roomRole === 'room_moderator' ? 'room_moderator' : null);

  if (!effectiveRole) return null;

  const config = {
    admin: {
      icon: Crown,
      label: language === 'ar' ? 'مدير' : 'Admin',
      className: 'text-amber-500',
    },
    manager: {
      icon: Star,
      label: language === 'ar' ? 'مشرف عام' : 'Manager',
      className: 'text-violet-500',
    },
    moderator: {
      icon: Shield,
      label: language === 'ar' ? 'مشرف' : 'Moderator',
      className: 'text-emerald-500',
    },
    room_moderator: {
      icon: ShieldCheck,
      label: language === 'ar' ? 'مشرف الغرفة' : 'Room Mod',
      className: 'text-cyan-500',
    },
  };

  const roleConfig = config[effectiveRole as keyof typeof config];
  if (!roleConfig) return null;

  const Icon = roleConfig.icon;
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Icon className={cn(iconSize, roleConfig.className, 'flex-shrink-0')} />
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {roleConfig.label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
