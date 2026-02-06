/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin, usePendingPostsCount, usePendingReportsCount } from '@/hooks/useAdmin';
import { useRealtimeReports } from '@/hooks/useRealtimeReports';
import { 
  Users, 
  FileText, 
  FolderOpen, 
  Flag, 
  LayoutDashboard,
  ArrowLeft,
  Shield,
  Image,
  Mail,
  Server,
  MessageSquare,
  Clock,
  Hash,
  Activity,
  Database,
  HardDrive
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const adminNavItems = [
  { 
    id: 'overview', 
    path: '/admin', 
    icon: LayoutDashboard, 
    label_en: 'Overview', 
    label_ar: 'نظرة عامة' 
  },
  { 
    id: 'pending', 
    path: '/admin/pending', 
    icon: Clock, 
    label_en: 'Pending Posts', 
    label_ar: 'المنشورات المعلقة',
    showBadge: true
  },
  { 
    id: 'users', 
    path: '/admin/users', 
    icon: Users, 
    label_en: 'Users', 
    label_ar: 'المستخدمين' 
  },
  { 
    id: 'posts', 
    path: '/admin/posts', 
    icon: FileText, 
    label_en: 'Posts', 
    label_ar: 'المنشورات' 
  },
  { 
    id: 'categories', 
    path: '/admin/categories', 
    icon: FolderOpen, 
    label_en: 'Categories', 
    label_ar: 'الأقسام' 
  },
  { 
    id: 'rooms', 
    path: '/admin/rooms', 
    icon: MessageSquare, 
    label_en: 'Chat Rooms', 
    label_ar: 'غرف المحادثة' 
  },
  { 
    id: 'reports', 
    path: '/admin/reports', 
    icon: Flag, 
    label_en: 'Reports', 
    label_ar: 'البلاغات',
    showReportsBadge: true
  },
  { 
    id: 'banners', 
    path: '/admin/banners', 
    icon: Image, 
    label_en: 'Banners', 
    label_ar: 'البانرات' 
  },
  { 
    id: 'emails', 
    path: '/admin/emails', 
    icon: Mail, 
    label_en: 'Email Templates', 
    label_ar: 'قوالب البريد' 
  },
  { 
    id: 'smtp', 
    path: '/admin/smtp', 
    icon: Server, 
    label_en: 'SMTP Settings', 
    label_ar: 'إعدادات SMTP' 
  },
  { 
    id: 'hashtags', 
    path: '/admin/hashtags', 
    icon: Hash, 
    label_en: 'Trending Hashtags', 
    label_ar: 'الهاشتاقات الرائجة' 
  },
  { 
    id: 'room-activity', 
    path: '/admin/room-activity', 
    icon: Activity, 
    label_en: 'Room Activity Log', 
    label_ar: 'سجل نشاط الغرف' 
  },
  // { 
  //   id: 'file-migration', 
  //   path: '/admin/file-migration', 
  //   icon: HardDrive, 
  //   label_en: 'File Migration', 
  //   label_ar: 'ترحيل الملفات' 
  // },
  // { 
  //   id: 'database-migration', 
  //   path: '/admin/database-migration', 
  //   icon: Database, 
  //   label_en: 'Database Migration', 
  //   label_ar: 'ترحيل قاعدة البيانات' 
  // },
];

export default function AdminDashboard() {
  const { language } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: pendingCount } = usePendingPostsCount();
  const { data: reportsCount } = usePendingReportsCount();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Subscribe to realtime report updates across all admin pages
  useRealtimeReports();
  
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);
  
  useEffect(() => {
    if (!adminLoading && isAdmin === false) {
      navigate('/');
    }
  }, [isAdmin, adminLoading, navigate]);
  
  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground">
            {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }
  
  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Sidebar */}
      <aside className="w-64 border-e border-border bg-card/50 flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="font-bold text-lg gradient-text">
              {language === 'ar' ? 'لوحة الإدارة' : 'Admin Panel'}
            </h1>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {adminNavItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path !== '/admin' && location.pathname.startsWith(item.path));
            
            return (
              <Link
                key={item.id}
                to={item.path}
                className={cn(
                  'flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors',
                  isActive 
                    ? 'bg-primary/20 text-primary' 
                    : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">
                    {language === 'ar' ? item.label_ar : item.label_en}
                  </span>
                </div>
                {item.showBadge && pendingCount && pendingCount > 0 ? (
                  <Badge variant="destructive" className="min-w-5 h-5 flex items-center justify-center p-0 text-xs">
                    {pendingCount > 99 ? '99+' : pendingCount}
                  </Badge>
                ) : null}
                {(item as any).showReportsBadge && reportsCount && reportsCount > 0 ? (
                  <Badge variant="destructive" className="min-w-5 h-5 flex items-center justify-center p-0 text-xs">
                    {reportsCount > 99 ? '99+' : reportsCount}
                  </Badge>
                ) : null}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-border">
          <Link to="/">
            <Button variant="outline" className="w-full gap-2">
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
              {language === 'ar' ? 'العودة للموقع' : 'Back to Site'}
            </Button>
          </Link>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
