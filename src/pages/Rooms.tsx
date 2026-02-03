import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { usePublicRooms } from '@/hooks/useRooms';
import { RoomCard } from '@/components/rooms/RoomCard';
import { CreateRoomDialog } from '@/components/rooms/CreateRoomDialog';
import { RoomInvitesNotification } from '@/components/rooms/RoomInvitesNotification';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { MessageSquare, Sparkles, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function RoomsPage() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { data: userRole } = useUserRole();
  const { data: rooms, isLoading } = usePublicRooms();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Only admins and managers can create rooms
  const canCreateRoom = userRole === 'admin' || userRole === 'manager';

  // Filter rooms based on search query
  const filteredRooms = useMemo(() => {
    if (!rooms) return [];
    if (!searchQuery.trim()) return rooms;
    
    const query = searchQuery.toLowerCase();
    return rooms.filter(room => 
      room.name.toLowerCase().includes(query) ||
      room.name_ar?.toLowerCase().includes(query) ||
      room.description?.toLowerCase().includes(query) ||
      room.description_ar?.toLowerCase().includes(query)
    );
  }, [rooms, searchQuery]);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Room Invites Notification */}
        {user && <RoomInvitesNotification />}

        {/* Header */}
        <div className="relative overflow-hidden glass-card p-6 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
          {/* Decorative elements */}
          <div className="absolute top-0 end-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 start-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/25">
                  <MessageSquare className="h-7 w-7 text-primary-foreground" />
                </div>
                <div className="absolute -top-1 -end-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-background animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                    {language === 'ar' ? 'غرف الدردشة' : 'Chat Rooms'}
                  </h1>
                  <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                </div>
                <p className="text-muted-foreground mt-1">
                  {language === 'ar' 
                    ? 'انضم للمحادثات الجماعية مع المجتمع' 
                    : 'Join group conversations with the community'}
                </p>
              </div>
            </div>

            {user && canCreateRoom && <CreateRoomDialog />}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute start-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'ar' ? 'ابحث عن غرفة...' : 'Search rooms...'}
            className="ps-11 pe-10 py-5 rounded-xl bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary/50"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute end-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Rooms Grid */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-40 w-full rounded-2xl" />
            ))}
          </div>
        ) : filteredRooms.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
            {filteredRooms.map((room, index) => (
              <div 
                key={room.id} 
                className="animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <RoomCard room={room} />
              </div>
            ))}
          </div>
        ) : searchQuery ? (
          <div className="glass-card p-12 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
              <Search className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {language === 'ar' ? 'لم يتم العثور على غرف' : 'No rooms found'}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              {language === 'ar' 
                ? `لا توجد غرف مطابقة لـ "${searchQuery}"` 
                : `No rooms matching "${searchQuery}"`}
            </p>
            <Button variant="outline" onClick={() => setSearchQuery('')}>
              {language === 'ar' ? 'مسح البحث' : 'Clear search'}
            </Button>
          </div>
        ) : (
          <div className="glass-card p-12 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
              <MessageSquare className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {language === 'ar' ? 'لا توجد غرف بعد' : 'No rooms yet'}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              {language === 'ar' 
                ? 'كن أول من ينشئ غرفة دردشة!' 
                : 'Be the first to create a chat room!'}
            </p>
            {user && canCreateRoom && <CreateRoomDialog />}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
