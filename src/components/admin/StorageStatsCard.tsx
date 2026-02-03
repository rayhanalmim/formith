import { useLanguage } from '@/contexts/LanguageContext';
import { useStorageStats } from '@/hooks/useStorageStats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { HardDrive, Image, Video, Mic, Users, MessageSquare, FolderOpen, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

const folderConfig: Record<string, { icon: React.ElementType; labelEn: string; labelAr: string; color: string }> = {
  avatars: { icon: Users, labelEn: 'Avatars', labelAr: 'الصور الشخصية', color: 'text-info' },
  covers: { icon: Image, labelEn: 'Cover Images', labelAr: 'صور الغلاف', color: 'text-secondary' },
  posts: { icon: FolderOpen, labelEn: 'Post Media', labelAr: 'وسائط المنشورات', color: 'text-success' },
  rooms: { icon: MessageSquare, labelEn: 'Room Media', labelAr: 'وسائط الغرف', color: 'text-warning' },
  messages: { icon: Mic, labelEn: 'DM Media', labelAr: 'وسائط الرسائل', color: 'text-primary' },
};

export function StorageStatsCard() {
  const { language } = useLanguage();
  const { data, isLoading, error, refetch, isFetching } = useStorageStats();

  if (error) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-destructive" />
            {language === 'ar' ? 'إحصائيات التخزين' : 'Storage Statistics'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive text-sm">
            {language === 'ar' ? 'فشل في تحميل الإحصائيات' : 'Failed to load statistics'}
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()} 
            className="mt-2"
          >
            <RefreshCw className="h-4 w-4 me-2" />
            {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <HardDrive className="h-5 w-5 text-primary" />
          {language === 'ar' ? 'إحصائيات التخزين' : 'Storage Statistics'}
        </CardTitle>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => refetch()} 
          disabled={isFetching}
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-2 w-full" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        ) : data ? (
          <>
            {/* Total Storage */}
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/20">
                    <HardDrive className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {language === 'ar' ? 'إجمالي التخزين' : 'Total Storage'}
                    </p>
                    <p className="text-2xl font-bold">{data.formattedTotal}</p>
                  </div>
                </div>
                <div className="text-end">
                  <p className="text-xs text-muted-foreground">
                    {language === 'ar' ? 'عدد الملفات' : 'Total Files'}
                  </p>
                  <p className="text-lg font-semibold">
                    {data.stats.reduce((sum, s) => sum + s.fileCount, 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Individual Folders */}
            <div className="space-y-3">
              {data.stats.map((stat) => {
                const config = folderConfig[stat.folder] || { 
                  icon: FolderOpen, 
                  labelEn: stat.folder, 
                  labelAr: stat.folder,
                  color: 'text-muted-foreground'
                };
                const Icon = config.icon;
                const percentage = data.totalSize > 0 
                  ? (stat.totalSize / data.totalSize) * 100 
                  : 0;

                return (
                  <div key={stat.folder} className="flex items-center gap-3">
                    <div className={`p-2 rounded-full bg-muted ${config.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium truncate">
                          {language === 'ar' ? config.labelAr : config.labelEn}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {stat.formattedSize}
                        </p>
                      </div>
                      <Progress value={percentage} className="h-1.5" />
                      <p className="text-xs text-muted-foreground mt-1">
                        {stat.fileCount.toLocaleString()} {language === 'ar' ? 'ملف' : 'files'}
                        {' • '}
                        {percentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Last Updated */}
            <p className="text-xs text-muted-foreground text-center pt-2 border-t">
              {language === 'ar' ? 'آخر تحديث: ' : 'Last updated: '}
              {new Date(data.lastUpdated).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')}
            </p>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
