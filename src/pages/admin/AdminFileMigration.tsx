import { useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFileMigration } from '@/hooks/useFileMigration';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  RefreshCw, 
  Play, 
  CheckCircle, 
  XCircle, 
  Image, 
  ImageIcon,
  FileImage,
  MessageSquare,
  Mail,
  Loader2,
  Database,
  Cloud
} from 'lucide-react';
import { cn } from '@/lib/utils';

const folderConfig = {
  avatars: { 
    icon: Image, 
    label_en: 'Avatars', 
    label_ar: 'الصور الشخصية',
    description_en: 'User profile pictures',
    description_ar: 'صور الملف الشخصي للمستخدمين'
  },
  covers: { 
    icon: ImageIcon, 
    label_en: 'Covers', 
    label_ar: 'صور الغلاف',
    description_en: 'Profile cover images',
    description_ar: 'صور غلاف الملف الشخصي'
  },
  posts: { 
    icon: FileImage, 
    label_en: 'Posts', 
    label_ar: 'المنشورات',
    description_en: 'Post media attachments',
    description_ar: 'مرفقات وسائط المنشورات'
  },
  rooms: { 
    icon: MessageSquare, 
    label_en: 'Rooms', 
    label_ar: 'الغرف',
    description_en: 'Chat room media',
    description_ar: 'وسائط غرف المحادثة'
  },
  messages: { 
    icon: Mail, 
    label_en: 'Messages', 
    label_ar: 'الرسائل',
    description_en: 'Direct message media',
    description_ar: 'وسائط الرسائل المباشرة'
  },
};

export default function AdminFileMigration() {
  const { language } = useLanguage();
  const {
    isLoading,
    isMigrating,
    stats,
    results,
    mediaUrls,
    currentFolder,
    progress,
    fetchMediaUrls,
    migrateFolder,
    migrateAll,
  } = useFileMigration();

  useEffect(() => {
    fetchMediaUrls();
  }, [fetchMediaUrls]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold gradient-text">
            {language === 'ar' ? 'ترحيل الملفات' : 'File Migration'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {language === 'ar' 
              ? 'ترحيل الملفات من Supabase إلى DigitalOcean Spaces' 
              : 'Migrate files from Supabase Storage to DigitalOcean Spaces'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => fetchMediaUrls()}
            disabled={isLoading || isMigrating}
          >
            <RefreshCw className={cn("h-4 w-4 me-2", isLoading && "animate-spin")} />
            {language === 'ar' ? 'تحديث' : 'Refresh'}
          </Button>
          <Button
            onClick={() => migrateAll()}
            disabled={isLoading || isMigrating || stats.pending === 0}
          >
            {isMigrating ? (
              <Loader2 className="h-4 w-4 me-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 me-2" />
            )}
            {language === 'ar' ? 'ترحيل الكل' : 'Migrate All'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Database className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'إجمالي الملفات' : 'Total Files'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Cloud className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'قيد الانتظار' : 'Pending'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.migrated}</p>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'تم الترحيل' : 'Migrated'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.failed}</p>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'فشل' : 'Failed'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      {isMigrating && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {language === 'ar' ? 'جاري ترحيل' : 'Migrating'} {folderConfig[currentFolder as keyof typeof folderConfig]?.[language === 'ar' ? 'label_ar' : 'label_en'] || currentFolder}...
                </span>
                <span className="text-sm text-muted-foreground">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Folder Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(Object.keys(folderConfig) as Array<keyof typeof folderConfig>).map((folder) => {
          const config = folderConfig[folder];
          const Icon = config.icon;
          const count = mediaUrls[folder]?.length || 0;
          const isCurrentlyMigrating = isMigrating && currentFolder === folder;

          return (
            <Card key={folder} className={cn(isCurrentlyMigrating && "ring-2 ring-primary")}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {language === 'ar' ? config.label_ar : config.label_en}
                      </CardTitle>
                      <CardDescription>
                        {language === 'ar' ? config.description_ar : config.description_en}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={count > 0 ? "secondary" : "outline"}>
                    {count} {language === 'ar' ? 'ملف' : 'files'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full"
                  variant={count > 0 ? "default" : "outline"}
                  disabled={isLoading || isMigrating || count === 0}
                  onClick={() => migrateFolder(folder)}
                >
                  {isCurrentlyMigrating ? (
                    <>
                      <Loader2 className="h-4 w-4 me-2 animate-spin" />
                      {language === 'ar' ? 'جاري الترحيل...' : 'Migrating...'}
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 me-2" />
                      {language === 'ar' ? 'بدء الترحيل' : 'Start Migration'}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Results Log */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              {language === 'ar' ? 'سجل الترحيل' : 'Migration Log'}
            </CardTitle>
            <CardDescription>
              {language === 'ar' 
                ? `${results.filter(r => r.success).length} ناجح، ${results.filter(r => !r.success).length} فاشل`
                : `${results.filter(r => r.success).length} succeeded, ${results.filter(r => !r.success).length} failed`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {results.map((result, index) => (
                  <div 
                    key={index}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg text-sm",
                      result.success ? "bg-green-500/5" : "bg-red-500/5"
                    )}
                  >
                    {result.success ? (
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-muted-foreground">
                        {result.originalUrl.split('/').pop()}
                      </p>
                      {result.success ? (
                        <p className="truncate text-xs text-green-600 dark:text-green-400">
                          → {result.newUrl.split('/').slice(-2).join('/')}
                        </p>
                      ) : (
                        <p className="text-xs text-red-600 dark:text-red-400">
                          {result.error}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
