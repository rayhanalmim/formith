import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link, useParams, useLocation } from 'react-router-dom';
import { useCategories } from '@/hooks/useCategories';
import { usePublicRooms } from '@/hooks/useRooms';
import {
  MessageSquare,
  Cpu,
  Gamepad2,
  Heart,
  Newspaper,
  Hash,
  ChevronDown,
  Volume2,
  Users,
  Loader2,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Icon mapping for categories
const categoryIcons: Record<string, React.ElementType> = {
  general: MessageSquare,
  tech: Cpu,
  gaming: Gamepad2,
  lifestyle: Heart,
  news: Newspaper,
};

export function CategoriesSidebar() {
  const { t, language } = useLanguage();
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const { data: categories, isLoading } = useCategories();
  const { data: rooms, isLoading: loadingRooms } = usePublicRooms();
  const [categoriesOpen, setCategoriesOpen] = useState(true);
  const [roomsOpen, setRoomsOpen] = useState(true);

  const isRoomsPage = location.pathname.startsWith('/rooms');

  return (
    <aside className="hidden lg:flex flex-col w-60 h-[calc(100vh-4rem)] fixed top-16 start-0 bg-sidebar border-e border-sidebar-border overflow-hidden">
      <div className="flex-1 overflow-y-auto discord-scrollbar p-3 space-y-4">
        {/* Categories Section */}
        <div>
          <button
            onClick={() => setCategoriesOpen(!categoriesOpen)}
            className="flex items-center justify-between w-full px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
          >
            <span>{t('categories.title')}</span>
            <ChevronDown
              className={cn(
                'h-3 w-3 transition-transform duration-200',
                !categoriesOpen && 'rotate-[-90deg] rtl:rotate-[90deg]'
              )}
            />
          </button>

          {categoriesOpen && (
            <nav className="mt-1 space-y-0.5">
              {isLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : categories && categories.length > 0 ? (
                categories.map((category) => {
                  const Icon = categoryIcons[category.slug] || Hash;
                  const isActive = slug === category.slug;
                  return (
                    <Link
                      key={category.id}
                      to={`/category/${category.slug}`}
                      className={cn(
                        'flex items-center gap-3 px-2 py-2 rounded-lg text-sm transition-all duration-200',
                        'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                        'group relative',
                        isActive && 'bg-sidebar-accent text-sidebar-primary'
                      )}
                    >
                      <div className={cn(
                        'flex items-center justify-center w-6 h-6 rounded transition-colors',
                        isActive ? 'bg-primary/20' : 'bg-muted/50 group-hover:bg-primary/20'
                      )}>
                        <Hash className={cn(
                          'h-3.5 w-3.5 transition-colors',
                          isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'
                        )} />
                      </div>
                      <span className="flex-1 truncate">
                        {language === 'ar' ? category.name_ar : category.name_en}
                      </span>
                      <span className="text-xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                        {category.posts_count || 0}
                      </span>
                    </Link>
                  );
                })
              ) : null}
            </nav>
          )}
        </div>

        {/* Rooms Section */}
        <div>
          <button
            onClick={() => setRoomsOpen(!roomsOpen)}
            className="flex items-center justify-between w-full px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
          >
            <span>{t('rooms.title')}</span>
            <ChevronDown
              className={cn(
                'h-3 w-3 transition-transform duration-200',
                !roomsOpen && 'rotate-[-90deg] rtl:rotate-[90deg]'
              )}
            />
          </button>

          {roomsOpen && (
            <nav className="mt-1 space-y-0.5">
              {/* View All Rooms Link */}
              <Link
                to="/rooms"
                className={cn(
                  'flex items-center gap-3 px-2 py-2 rounded-lg text-sm transition-all duration-200',
                  'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  'group relative',
                  isRoomsPage && 'bg-sidebar-accent text-sidebar-primary'
                )}
              >
                <div className={cn(
                  'flex items-center justify-center w-6 h-6 rounded transition-colors',
                  isRoomsPage ? 'bg-primary/20' : 'bg-muted/50 group-hover:bg-primary/20'
                )}>
                  <Plus className={cn(
                    'h-3.5 w-3.5 transition-colors',
                    isRoomsPage ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'
                  )} />
                </div>
                <span className="flex-1 truncate">
                  {language === 'ar' ? 'جميع الغرف' : 'All Rooms'}
                </span>
              </Link>

              {loadingRooms ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : rooms && rooms.length > 0 ? (
                rooms.map((room) => {
                  const roomName = language === 'ar' ? (room.name_ar || room.name) : room.name;
                  return (
                    <Link
                      key={room.id}
                      to={`/rooms/${room.slug || room.id}`}
                      className={cn(
                        'flex items-center gap-3 px-2 py-2 rounded-lg text-sm transition-all duration-200',
                        'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                        'group relative'
                      )}
                    >
                      <div className="flex items-center justify-center w-6 h-6 rounded bg-muted/50 group-hover:bg-primary/20 transition-colors">
                        <MessageSquare className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
                      </div>
                      <span className="flex-1 truncate">{roomName}</span>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        {room.members_count || 0}
                      </div>
                    </Link>
                  );
                })
              ) : (
                <p className="text-xs text-muted-foreground text-center py-2">
                  {language === 'ar' ? 'لا توجد غرف' : 'No rooms yet'}
                </p>
              )}
            </nav>
          )}
        </div>
      </div>

      {/* Voice Rooms Coming Soon Banner */}
      <div className="p-3 border-t border-sidebar-border">
        <div className="glass-card p-3 text-center">
          <Volume2 className="h-6 w-6 mx-auto mb-2 text-secondary" />
          <p className="text-xs text-muted-foreground">
            {t('rooms.voiceComingSoon')}
          </p>
        </div>
      </div>
    </aside>
  );
}
