import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminUsers, useAdminPosts, useAdminCategories, useAdminReports } from '@/hooks/useAdmin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, FolderOpen, Flag, Clock } from 'lucide-react';
import { StorageStatsCard } from '@/components/admin/StorageStatsCard';
import { getAvatarUrl } from '@/lib/default-images';

export default function AdminOverview() {
  const { language } = useLanguage();
  const { data: users } = useAdminUsers();
  const { data: postsData } = useAdminPosts();
  const { data: categories } = useAdminCategories();
  const { data: reports } = useAdminReports();
  
  const pendingReports = reports?.filter(r => r.status === 'pending') || [];
  const pendingPosts = postsData?.posts?.filter(p => !p.is_approved) || [];

  const stats = [
    {
      title: language === 'ar' ? 'المستخدمين' : 'Users',
      value: users?.length || 0,
      icon: Users,
      color: 'text-info',
      bgColor: 'bg-info/10',
    },
    {
      title: language === 'ar' ? 'المنشورات' : 'Posts',
      value: postsData?.totalCount || 0,
      icon: FileText,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: language === 'ar' ? 'الأقسام' : 'Categories',
      value: categories?.length || 0,
      icon: FolderOpen,
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
    },
    {
      title: language === 'ar' ? 'البلاغات المعلقة' : 'Pending Reports',
      value: pendingReports.length,
      icon: Flag,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {language === 'ar' ? 'نظرة عامة' : 'Overview'}
        </h1>
        <p className="text-muted-foreground">
          {language === 'ar' 
            ? 'ملخص إحصائيات المنتدى' 
            : 'Summary of forum statistics'}
        </p>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Storage Stats */}
      <StorageStatsCard />
      
      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Posts */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-warning" />
              {language === 'ar' ? 'منشورات تنتظر الموافقة' : 'Posts Pending Approval'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingPosts.length > 0 ? (
              <div className="space-y-3">
                {pendingPosts.slice(0, 5).map((post) => (
                  <div key={post.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <img
                      src={getAvatarUrl(post.profiles?.avatar_url)}
                      alt=""
                      className="h-8 w-8 rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {post.profiles?.display_name || post.profiles?.username}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {post.content.substring(0, 50)}...
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                {language === 'ar' ? 'لا توجد منشورات معلقة' : 'No pending posts'}
              </p>
            )}
          </CardContent>
        </Card>
        
        {/* Recent Reports */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-destructive" />
              {language === 'ar' ? 'البلاغات الأخيرة' : 'Recent Reports'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingReports.length > 0 ? (
              <div className="space-y-3">
                {pendingReports.slice(0, 5).map((report) => {
                  const post = (report as any).post;
                  const postOwner = post?.owner;
                  const ownerDisplayName = language === 'ar' 
                    ? (postOwner?.display_name_ar || postOwner?.display_name || postOwner?.username)
                    : (postOwner?.display_name || postOwner?.username);
                  
                  return (
                    <div key={report.id} className="p-3 rounded-lg bg-muted/50 space-y-2">
                      {/* Report reason */}
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-full bg-destructive/10 shrink-0">
                          <Flag className="h-4 w-4 text-destructive" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {report.reason}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {language === 'ar' ? 'من: ' : 'By: '}
                            {(report as any).reporter?.display_name || (report as any).reporter?.username || 'Unknown'}
                          </p>
                        </div>
                      </div>
                      
                      {/* Post content preview */}
                      {post && (
                        <div className="ms-11 p-2 rounded bg-background/50 border">
                          <p className="text-xs text-muted-foreground truncate">
                            {post.content?.substring(0, 80)}...
                          </p>
                          {postOwner && (
                            <div className="flex items-center gap-2 mt-2">
                              <img
                                src={getAvatarUrl(postOwner.avatar_url)}
                                alt=""
                                className="h-5 w-5 rounded-full"
                              />
                              <span className="text-xs font-medium">{ownerDisplayName}</span>
                              <span className="text-xs text-muted-foreground">@{postOwner.username}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                {language === 'ar' ? 'لا توجد بلاغات معلقة' : 'No pending reports'}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
