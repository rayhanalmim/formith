import { useLanguage } from '@/contexts/LanguageContext';
import { useStoryAnalytics, type StoryViewer } from '@/hooks/useStoryAnalytics';
import { getAvatarUrl } from '@/lib/default-images';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { Eye, Users, Clock, TrendingUp, BadgeCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from 'recharts';

interface StoryAnalyticsSheetProps {
  storyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StoryAnalyticsSheet({ storyId, open, onOpenChange }: StoryAnalyticsSheetProps) {
  const { language } = useLanguage();
  const { data: analytics, isLoading } = useStoryAnalytics(storyId);
  const isRTL = language === 'ar';

  const formatHour = (hour: number | null) => {
    if (hour === null) return '-';
    const period = hour >= 12 ? (isRTL ? 'م' : 'PM') : (isRTL ? 'ص' : 'AM');
    const displayHour = hour % 12 || 12;
    return `${displayHour}:00 ${period}`;
  };

  const chartConfig = {
    views: {
      label: isRTL ? 'المشاهدات' : 'Views',
      color: 'hsl(var(--primary))',
    },
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-xl z-[99999]">
        <SheetHeader className="text-start">
          <SheetTitle>
            {isRTL ? 'تحليلات القصة' : 'Story Analytics'}
          </SheetTitle>
        </SheetHeader>

        {isLoading ? (
          <div className="space-y-4 mt-6">
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
        ) : analytics ? (
          <ScrollArea className="h-[calc(85vh-80px)] mt-4">
            <div className="space-y-6 pb-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-3 gap-3">
                <StatCard
                  icon={<Eye className="h-4 w-4" />}
                  label={isRTL ? 'المشاهدات' : 'Views'}
                  value={analytics.totalViews}
                  color="bg-primary/10 text-primary"
                />
                <StatCard
                  icon={<Users className="h-4 w-4" />}
                  label={isRTL ? 'المشاهدين' : 'Viewers'}
                  value={analytics.uniqueViewers}
                  color="bg-blue-500/10 text-blue-500"
                />
                <StatCard
                  icon={<Clock className="h-4 w-4" />}
                  label={isRTL ? 'ذروة النشاط' : 'Peak Hour'}
                  value={formatHour(analytics.peakHour)}
                  color="bg-amber-500/10 text-amber-500"
                  isText
                />
              </div>

              {/* View Trends Chart */}
              <div className="bg-card rounded-xl border p-4">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-medium">
                    {isRTL ? 'اتجاهات المشاهدة' : 'View Trends'}
                  </h3>
                </div>
                
                {analytics.viewTrends.length > 0 ? (
                  <ChartContainer config={chartConfig} className="h-40 w-full">
                    <AreaChart data={analytics.viewTrends}>
                      <defs>
                        <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(date) => format(new Date(date), 'dd', { locale: isRTL ? ar : enUS })}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <YAxis 
                        hide 
                        domain={[0, 'auto']}
                      />
                      <ChartTooltip 
                        content={<ChartTooltipContent />}
                        labelFormatter={(date) => format(new Date(date), 'MMM dd', { locale: isRTL ? ar : enUS })}
                      />
                      <Area
                        type="monotone"
                        dataKey="views"
                        stroke="hsl(var(--primary))"
                        fill="url(#viewsGradient)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ChartContainer>
                ) : (
                  <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">
                    {isRTL ? 'لا توجد بيانات كافية' : 'Not enough data'}
                  </div>
                )}
              </div>

              {/* Viewers List */}
              <div className="bg-card rounded-xl border">
                <div className="flex items-center gap-2 p-4 border-b">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-medium">
                    {isRTL ? 'المشاهدون' : 'Viewers'} ({analytics.viewers.length})
                  </h3>
                </div>
                
                {analytics.viewers.length > 0 ? (
                  <div className="divide-y">
                    {analytics.viewers.slice(0, 20).map((viewer) => (
                      <ViewerItem key={viewer.id} viewer={viewer} language={language} />
                    ))}
                    {analytics.viewers.length > 20 && (
                      <div className="p-3 text-center text-sm text-muted-foreground">
                        {isRTL 
                          ? `+${analytics.viewers.length - 20} مشاهد آخر`
                          : `+${analytics.viewers.length - 20} more viewers`}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    {isRTL ? 'لا يوجد مشاهدون حتى الآن' : 'No viewers yet'}
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  isText?: boolean;
}

function StatCard({ icon, label, value, color, isText }: StatCardProps) {
  return (
    <div className="bg-card rounded-xl border p-3">
      <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center mb-2`}>
        {icon}
      </div>
      <p className={`font-semibold ${isText ? 'text-base' : 'text-xl'}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

interface ViewerItemProps {
  viewer: StoryViewer;
  language: string;
}

function ViewerItem({ viewer, language }: ViewerItemProps) {
  const profile = viewer.profile;
  const displayName = language === 'ar' 
    ? (profile?.display_name_ar || profile?.display_name) 
    : profile?.display_name;
  
  const timeAgo = format(new Date(viewer.viewed_at), 'MMM dd, HH:mm', {
    locale: language === 'ar' ? ar : enUS,
  });

  return (
    <Link
      to={`/profile/${profile?.username || viewer.viewer_id}`}
      className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors"
    >
      <img
        src={getAvatarUrl(profile?.avatar_url)}
        alt={displayName || ''}
        className="w-10 h-10 rounded-full object-cover"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="font-medium text-sm truncate">{displayName || 'User'}</span>
          {profile?.is_verified && (
            <BadgeCheck className="h-3.5 w-3.5 text-[#1D9BF0] flex-shrink-0" />
          )}
        </div>
        <p className="text-xs text-muted-foreground">@{profile?.username || 'user'}</p>
      </div>
      <span className="text-xs text-muted-foreground">{timeAgo}</span>
    </Link>
  );
}
