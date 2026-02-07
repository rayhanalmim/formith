import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useMessages as useMessagesContext } from '@/contexts/MessagesContext';
import { useCurrentUserProfile } from '@/hooks/useProfile';
import { useUnreadMessageCount } from '@/hooks/useMessages';
import { useIsAdmin } from '@/hooks/useAdmin';
import { useUserRole } from '@/hooks/useUserRole';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import { MessagesSheet } from '@/components/messages/MessagesSheet';
import { ThemeSwitcher } from './ThemeSwitcher';
import { MobileMenu } from './MobileMenu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Search,
  MessageCircle,
  Menu,
  Globe,
  Plus,
  User,
  LogIn,
  LogOut,
  Settings,
  Bookmark,
  Shield,
  Crown,
} from 'lucide-react';
import logo from '@/assets/tahweel-logo.png';
import { getAvatarUrl } from '@/lib/default-images';

export function Header() {
  const { language, setLanguage, t } = useLanguage();
  const { user, loading: authLoading, signOut } = useAuth();
  const { data: profile } = useCurrentUserProfile();
  const { data: unreadCount } = useUnreadMessageCount();
  const { data: isAdmin } = useIsAdmin();
  const { data: userRole } = useUserRole();
  const navigate = useNavigate();

  const getRoleBadge = () => {
    if (!userRole || userRole === 'user') return null;
    
    const roleConfig: Record<string, { label: string; labelAr: string; className: string; icon: typeof Shield }> = {
      admin: { 
        label: 'Admin', 
        labelAr: 'مسؤول', 
        className: 'bg-destructive/10 text-destructive border-destructive/20',
        icon: Shield
      },
      manager: { 
        label: 'Manager', 
        labelAr: 'مدير', 
        className: 'bg-primary/10 text-primary border-primary/20',
        icon: Crown
      },
      moderator: { 
        label: 'Moderator', 
        labelAr: 'مشرف', 
        className: 'bg-secondary/50 text-secondary-foreground border-secondary',
        icon: Shield
      },
    };
    
    const config = roleConfig[userRole];
    if (!config) return null;
    
    const Icon = config.icon;
    return (
      <Badge variant="outline" className={`gap-1 ${config.className}`}>
        <Icon className="h-3 w-3" />
        {language === 'ar' ? config.labelAr : config.label}
      </Badge>
    );
  };
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { isOpen: messagesOpen, openMessages, closeMessages } = useMessagesContext();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Keyboard shortcut for search (Cmd/Ctrl + K)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-border bg-background/80 backdrop-blur-glass">
        <div className="flex h-full items-center justify-between px-3 sm:px-4 lg:px-6">
          {/* Logo & Mobile Menu */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            
            <Link to="/" className="flex items-center gap-2 hover-scale">
              <img src={logo} alt="Tahweel" className="h-8 sm:h-10 w-auto" />
            </Link>
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-md mx-4 lg:mx-8">
            <button
              onClick={() => setSearchOpen(true)}
              className="relative w-full flex items-center"
            >
              <div className="relative w-full">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  readOnly
                  placeholder={t('common.search')}
                  className="w-full ps-10 pe-16 bg-muted/50 border-border cursor-pointer hover:bg-muted/70 transition-colors"
                />
                <kbd className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </div>
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 sm:gap-2 lg:gap-3">
            {/* Search - Mobile */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden h-9 w-9"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-5 w-5" />
            </Button>

            {authLoading ? null : user ? (
              <>
                {/* New Post - Desktop Only */}
                <Button 
                  className="hidden sm:flex gap-2 neon-glow"
                  onClick={() => {
                    navigate('/');
                    setTimeout(() => {
                      const textarea = document.querySelector('[data-create-post-input]') as HTMLTextAreaElement;
                      if (textarea) {
                        textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        textarea.focus();
                      }
                    }, 100);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden lg:inline">{t('forum.newPost')}</span>
                </Button>

                {/* Notifications */}
                <NotificationBell />

                {/* Messages */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="relative h-9 w-9"
                  onClick={openMessages}
                >
                  <MessageCircle className="h-5 w-5" />
                  {unreadCount && unreadCount > 0 ? (
                    <span className="absolute -top-0.5 -end-0.5 h-4 w-4 rounded-full bg-secondary text-[10px] font-bold flex items-center justify-center text-secondary-foreground">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  ) : null}
                </Button>
              </>
            ) : null}

            {/* Theme Switcher */}
            <ThemeSwitcher />

            {/* Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Globe className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass-card min-w-[120px]">
                <DropdownMenuItem
                  onClick={() => setLanguage('ar')}
                  className={`cursor-pointer ${language === 'ar' ? 'bg-primary/20 text-primary' : ''}`}
                >
                  🇸🇦 العربية
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setLanguage('en')}
                  className={`cursor-pointer ${language === 'en' ? 'bg-primary/20 text-primary' : ''}`}
                >
                  🇺🇸 English
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Profile / Auth */}
            {authLoading ? (
              <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
                    <img
                      src={getAvatarUrl(profile?.avatar_url)}
                      alt="Profile"
                      className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-muted ring-2 ring-primary/20 object-cover"
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="glass-card min-w-[200px]">
                  {/* Role Badge */}
                  {getRoleBadge() && (
                    <>
                      <div className="px-2 py-1.5 flex justify-center">
                        {getRoleBadge()}
                      </div>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem 
                    className="cursor-pointer"
                    onClick={() => profile?.username && navigate(`/profile/${profile.username}`)}
                  >
                    <User className="h-4 w-4 me-2" />
                    {t('nav.profile')}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="cursor-pointer"
                    onClick={() => navigate('/bookmarks')}
                  >
                    <Bookmark className="h-4 w-4 me-2" />
                    {language === 'ar' ? 'المحفوظات' : 'Bookmarks'}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="cursor-pointer"
                    onClick={() => navigate('/settings')}
                  >
                    <Settings className="h-4 w-4 me-2" />
                    {t('nav.settings')}
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="cursor-pointer text-primary font-medium"
                        onClick={() => navigate('/admin')}
                      >
                        <Shield className="h-4 w-4 me-2" />
                        {language === 'ar' ? 'لوحة التحكم' : 'Admin Dashboard'}
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="cursor-pointer text-destructive"
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-4 w-4 me-2" />
                    {t('nav.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/auth">
                <Button variant="outline" size="sm" className="gap-2 h-9">
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('nav.login')}</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <MobileMenu open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} />

      {/* Global Search Dialog */}
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />

      {/* Messages Sheet */}
      <MessagesSheet open={messagesOpen} onOpenChange={(open) => open ? openMessages() : closeMessages()} />
    </>
  );
}
