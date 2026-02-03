import { useLanguage } from '@/contexts/LanguageContext';
import { useRoomActivityLogs } from '@/hooks/useRoomActivityLog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  VolumeX, 
  Volume2, 
  Trash2, 
  Shield, 
  ShieldOff, 
  Pin, 
  PinOff,
  Clock,
  User,
  MessageSquare
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

const actionIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  mute: VolumeX,
  unmute: Volume2,
  delete_message: Trash2,
  assign_moderator: Shield,
  remove_moderator: ShieldOff,
  pin_message: Pin,
  unpin_message: PinOff,
};

const actionColors: Record<string, string> = {
  mute: 'bg-amber-500/10 text-amber-500',
  unmute: 'bg-green-500/10 text-green-500',
  delete_message: 'bg-destructive/10 text-destructive',
  assign_moderator: 'bg-emerald-500/10 text-emerald-500',
  remove_moderator: 'bg-orange-500/10 text-orange-500',
  pin_message: 'bg-blue-500/10 text-blue-500',
  unpin_message: 'bg-muted text-muted-foreground',
};

const actionLabels: Record<string, { en: string; ar: string }> = {
  mute: { en: 'Muted User', ar: 'كتم مستخدم' },
  unmute: { en: 'Unmuted User', ar: 'إلغاء كتم مستخدم' },
  delete_message: { en: 'Deleted Message', ar: 'حذف رسالة' },
  assign_moderator: { en: 'Assigned Moderator', ar: 'تعيين مشرف' },
  remove_moderator: { en: 'Removed Moderator', ar: 'إزالة مشرف' },
  pin_message: { en: 'Pinned Message', ar: 'تثبيت رسالة' },
  unpin_message: { en: 'Unpinned Message', ar: 'إلغاء تثبيت رسالة' },
};

export default function AdminRoomActivityLog() {
  const { language } = useLanguage();
  const { data: logs, isLoading } = useRoomActivityLogs(100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {language === 'ar' ? 'سجل نشاط الغرف' : 'Room Activity Log'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'ar' 
              ? 'تتبع إجراءات الإشراف في غرف المحادثة' 
              : 'Track moderation actions in chat rooms'}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5" />
            {language === 'ar' ? 'الإجراءات الأخيرة' : 'Recent Actions'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            {isLoading ? (
              <div className="p-4 space-y-4">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : logs?.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>{language === 'ar' ? 'لا توجد إجراءات حتى الآن' : 'No actions yet'}</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {logs?.map((log) => {
                  const Icon = actionIcons[log.action_type] || Clock;
                  const colorClass = actionColors[log.action_type] || 'bg-muted text-muted-foreground';
                  const label = actionLabels[log.action_type] || { en: log.action_type, ar: log.action_type };
                  
                  const actorName = log.actor?.display_name || log.actor?.username || 'Unknown';
                  const targetName = log.target?.display_name || log.target?.username;
                  const roomName = language === 'ar' 
                    ? (log.room?.name_ar || log.room?.name || 'Unknown')
                    : (log.room?.name || 'Unknown');

                  return (
                    <div key={log.id} className="p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-start gap-3">
                        {/* Actor Avatar */}
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={log.actor?.avatar_url || '/images/default-avatar.png'} />
                          <AvatarFallback>
                            {actorName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          {/* Action Description */}
                          <div className="flex flex-wrap items-center gap-1.5 text-sm">
                            <span className="font-semibold">{actorName}</span>
                            <Badge variant="outline" className={`${colorClass} gap-1`}>
                              <Icon className="h-3 w-3" />
                              {language === 'ar' ? label.ar : label.en}
                            </Badge>
                            {targetName && (
                              <>
                                <span className="text-muted-foreground">
                                  {language === 'ar' ? 'على' : 'on'}
                                </span>
                                <span className="font-medium">{targetName}</span>
                              </>
                            )}
                          </div>

                          {/* Room and Time */}
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              {roomName}
                            </span>
                            <span>•</span>
                            <span>
                              {formatDistanceToNow(new Date(log.created_at), {
                                addSuffix: true,
                                locale: language === 'ar' ? ar : enUS,
                              })}
                            </span>
                          </div>

                          {/* Details */}
                          {log.details && Object.keys(log.details).length > 0 && (
                            <div className="mt-2 p-2 rounded-md bg-muted/50 text-xs">
                              {log.details.message_content && (
                                <p className="text-muted-foreground line-clamp-2">
                                  "{String(log.details.message_content)}"
                                </p>
                              )}
                              {log.details.duration && (
                                <p className="text-muted-foreground">
                                  {language === 'ar' ? 'المدة:' : 'Duration:'} {String(log.details.duration)}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
