import { NavLink, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useMessages as useMessagesContext } from '@/contexts/MessagesContext';
import { useCurrentUserProfile } from '@/hooks/useProfile';
import { Home, Bookmark, MessageCircle, Users, User, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MessagesSheet } from '@/components/messages/MessagesSheet';

export function BottomNav() {
  const { language } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const { data: profile } = useCurrentUserProfile();
  const location = useLocation();
  const { isOpen: messagesOpen, openMessages, closeMessages } = useMessagesContext();

  // Don't show on admin pages or auth pages
  if (location.pathname.startsWith('/admin') || location.pathname === '/auth') {
    return null;
  }

  const navItems = [
    {
      to: '/',
      icon: Home,
      label: language === 'ar' ? 'الرئيسية' : 'Home',
      requiresAuth: false,
    },
    {
      to: '/rooms',
      icon: Users,
      label: language === 'ar' ? 'الغرف' : 'Rooms',
      requiresAuth: false,
    },
    {
      to: '/bookmarks',
      icon: Bookmark,
      label: language === 'ar' ? 'المحفوظات' : 'Saved',
      requiresAuth: true,
    },
    {
      action: openMessages,
      icon: MessageCircle,
      label: language === 'ar' ? 'الرسائل' : 'Messages',
      requiresAuth: true,
    },
    {
      to: authLoading ? '#' : (user && profile?.username ? `/profile/${profile.username}` : '/auth'),
      icon: authLoading ? User : (user ? User : LogIn),
      label: authLoading 
        ? '...'
        : user 
          ? (language === 'ar' ? 'الملف' : 'Profile')
          : (language === 'ar' ? 'دخول' : 'Login'),
      requiresAuth: false,
    },
  ];

  return (
    <>
      <nav className="fixed bottom-0 inset-x-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border lg:hidden safe-area-pb">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            
            // Skip auth-required items for non-logged-in users
            if (item.requiresAuth && !user) {
              return null;
            }
            
            // If it's an action button (like messages)
            if (item.action) {
              return (
                <button
                  key={index}
                  onClick={item.action}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[64px]",
                    "text-muted-foreground hover:text-foreground transition-colors"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </button>
              );
            }
            
            // Regular nav link
            const isActive = location.pathname === item.to || 
              (item.to !== '/' && location.pathname.startsWith(item.to));
            
            return (
              <NavLink
                key={index}
                to={item.to}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[64px]",
                  "transition-colors",
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive && "text-primary")} />
                <span className={cn(
                  "text-[10px] font-medium",
                  isActive && "text-primary"
                )}>
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </div>
      </nav>
      
      <MessagesSheet open={messagesOpen} onOpenChange={(open) => open ? openMessages() : closeMessages()} />
    </>
  );
}
