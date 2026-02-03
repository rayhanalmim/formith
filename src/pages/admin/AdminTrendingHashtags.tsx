import { useLanguage } from '@/contexts/LanguageContext';
import { useTrendingHashtags } from '@/hooks/useTrendingHashtags';
import { Link } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Hash, TrendingUp, MessageSquare, Heart } from 'lucide-react';

export default function AdminTrendingHashtags() {
  const { language } = useLanguage();
  const { data: trendingHashtags, isLoading } = useTrendingHashtags(20);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {language === 'ar' ? 'الهاشتاقات الرائجة' : 'Trending Hashtags'}
        </h1>
        <p className="text-muted-foreground">
          {language === 'ar' 
            ? 'عرض أكثر الهاشتاقات استخدامًا في آخر 7 أيام' 
            : 'View most used hashtags in the last 7 days'}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'ar' ? 'إجمالي الهاشتاقات' : 'Total Hashtags'}
            </CardTitle>
            <Hash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {trendingHashtags?.length || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'ar' ? 'إجمالي المنشورات' : 'Total Posts'}
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {trendingHashtags?.reduce((sum, h) => sum + h.post_count, 0) || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'ar' ? 'إجمالي التفاعل' : 'Total Engagement'}
            </CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {trendingHashtags?.reduce((sum, h) => sum + h.total_engagement, 0) || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hashtags Table */}
      <div className="glass-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">{language === 'ar' ? 'الترتيب' : 'Rank'}</TableHead>
              <TableHead>{language === 'ar' ? 'الهاشتاق' : 'Hashtag'}</TableHead>
              <TableHead className="text-center">
                {language === 'ar' ? 'عدد المنشورات' : 'Post Count'}
              </TableHead>
              <TableHead className="text-center">
                {language === 'ar' ? 'التفاعل' : 'Engagement'}
              </TableHead>
              <TableHead className="text-center">
                {language === 'ar' ? 'النتيجة' : 'Score'}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
                </TableCell>
              </TableRow>
            ) : !trendingHashtags || trendingHashtags.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  {language === 'ar' ? 'لا توجد هاشتاقات' : 'No hashtags found'}
                </TableCell>
              </TableRow>
            ) : (
              trendingHashtags.map((hashtag, index) => {
                const score = hashtag.total_engagement + (hashtag.post_count * 5);
                
                return (
                  <TableRow key={hashtag.hashtag}>
                    <TableCell>
                      <div className="flex items-center justify-center">
                        {index < 3 ? (
                          <Badge 
                            className={
                              index === 0 ? 'bg-yellow-500 text-yellow-950' :
                              index === 1 ? 'bg-gray-400 text-gray-950' :
                              'bg-amber-600 text-amber-950'
                            }
                          >
                            {index + 1}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground font-medium">
                            {index + 1}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link 
                        to={`/hashtag/${hashtag.hashtag}`}
                        className="flex items-center gap-2 hover:text-primary transition-colors"
                      >
                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10">
                          <TrendingUp className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-semibold text-lg">
                          #{hashtag.hashtag}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">
                        {hashtag.post_count} {language === 'ar' ? 'منشور' : 'posts'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">
                        {hashtag.total_engagement}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-bold text-primary">
                        {score}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
