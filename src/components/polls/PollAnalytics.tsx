/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Users, TrendingUp, Clock, User, BadgeCheck } from 'lucide-react';
import { getAvatarUrl } from '@/lib/default-images';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { Link } from 'react-router-dom';

interface PollAnalyticsProps {
  pollId: string;
  question: string;
}

interface VoterData {
  user_id: string;
  option_id: string;
  option_text: string;
  voted_at: string;
  profile: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    is_verified: boolean;
  };
}

interface OptionStats {
  option_id: string;
  text: string;
  emoji: string | null;
  votes_count: number;
  percentage: number;
  voters: VoterData[];
}

export function PollAnalytics({ pollId, question }: PollAnalyticsProps) {
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['poll-analytics', pollId],
    queryFn: async () => {
      // Fetch poll analytics via Node.js API
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:9000/api'}/polls/${pollId}/analytics`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${api.getToken()}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch poll analytics');
      }

      const data = await response.json();

      // Process the analytics data
      const options = data.data?.options || [];
      const votes = data.data?.votes || [];
      const profiles = data.data?.profiles || {};

      // Calculate total votes
      const totalVotes = options.reduce((sum: number, opt: any) => sum + (opt.votes_count || 0), 0);

      // Build option stats with voters
      const optionStats: OptionStats[] = options.map((opt: any) => {
        const optionVotes = votes.filter((v: any) => v.option_id === opt.id);
        const voters: VoterData[] = optionVotes.map((v: any) => ({
          user_id: v.user_id,
          option_id: v.option_id,
          option_text: opt.text,
          voted_at: v.created_at,
          profile: profiles[v.user_id] || {
            username: 'unknown',
            display_name: null,
            avatar_url: null,
            is_verified: false,
          },
        }));

        return {
          option_id: opt.id,
          text: opt.text,
          emoji: opt.emoji,
          votes_count: opt.votes_count || 0,
          percentage: totalVotes > 0 ? Math.round(((opt.votes_count || 0) / totalVotes) * 100) : 0,
          voters,
        };
      });

      // Get voting timeline (group by hour for last 24h, then by day)
      const now = new Date();
      const voteTimes = votes.map((v: any) => new Date(v.created_at));

      // Group by time periods
      const last24h = voteTimes.filter((t: Date) => now.getTime() - t.getTime() < 24 * 60 * 60 * 1000).length;
      const last7d = voteTimes.filter((t: Date) => now.getTime() - t.getTime() < 7 * 24 * 60 * 60 * 1000).length;

      return {
        totalVotes,
        uniqueVoters: data.data?.uniqueVoters || new Set(votes.map((v: any) => v.user_id)).size,
        optionStats,
        recentActivity: {
          last24h,
          last7d,
        },
        allVoters: votes.map((v: any) => {
          const option = options.find((o: any) => o.id === v.option_id);
          return {
            user_id: v.user_id,
            option_id: v.option_id,
            option_text: option?.text || '',
            voted_at: v.created_at,
            profile: profiles[v.user_id] || {
              username: 'unknown',
              display_name: null,
              avatar_url: null,
              is_verified: false,
            },
          };
        }),
      };
    },
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5">
          <BarChart3 className="h-3.5 w-3.5" />
          {language === 'ar' ? 'التحليلات' : 'Analytics'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            {language === 'ar' ? 'تحليلات التصويت' : 'Poll Analytics'}
          </DialogTitle>
          <p className="text-sm text-muted-foreground truncate">{question}</p>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : analytics ? (
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-primary">{analytics.totalVotes}</div>
                <div className="text-xs text-muted-foreground">
                  {language === 'ar' ? 'إجمالي الأصوات' : 'Total Votes'}
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-primary">{analytics.uniqueVoters}</div>
                <div className="text-xs text-muted-foreground">
                  {language === 'ar' ? 'مصوتين' : 'Voters'}
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-primary">{analytics.recentActivity.last24h}</div>
                <div className="text-xs text-muted-foreground">
                  {language === 'ar' ? 'آخر 24 ساعة' : 'Last 24h'}
                </div>
              </div>
            </div>

            <Tabs defaultValue="breakdown" className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="breakdown" className="text-xs">
                  <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
                  {language === 'ar' ? 'التوزيع' : 'Breakdown'}
                </TabsTrigger>
                <TabsTrigger value="voters" className="text-xs">
                  <Users className="h-3.5 w-3.5 mr-1.5" />
                  {language === 'ar' ? 'المصوتون' : 'Voters'}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="breakdown" className="flex-1 overflow-auto mt-3">
                <div className="space-y-3">
                  {analytics.optionStats.map((option) => (
                    <div key={option.option_id} className="bg-muted/30 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {option.emoji && <span>{option.emoji}</span>}
                          <span className="font-medium text-sm">{option.text}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {option.votes_count} ({option.percentage}%)
                        </Badge>
                      </div>

                      {/* Progress bar */}
                      <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${option.percentage}%` }}
                        />
                      </div>

                      {/* Voter avatars */}
                      {option.voters.length > 0 && (
                        <div className="flex items-center gap-1">
                          <div className="flex -space-x-2">
                            {option.voters.slice(0, 5).map((voter) => (
                              <Link
                                key={voter.user_id}
                                to={`/profile/${voter.profile.username}`}
                                className="relative"
                              >
                                <Avatar className="h-6 w-6 border-2 border-background">
                                  <AvatarImage src={getAvatarUrl(voter.profile.avatar_url)} />
                                  <AvatarFallback className="text-[10px]">
                                    {(voter.profile.display_name || voter.profile.username || '?')[0]}
                                  </AvatarFallback>
                                </Avatar>
                              </Link>
                            ))}
                          </div>
                          {option.voters.length > 5 && (
                            <span className="text-xs text-muted-foreground ml-1">
                              +{option.voters.length - 5}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="voters" className="flex-1 overflow-auto mt-3">
                {analytics.allVoters.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Users className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm">
                      {language === 'ar' ? 'لا يوجد مصوتين بعد' : 'No voters yet'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {analytics.allVoters.map((voter, idx) => (
                      <Link
                        key={`${voter.user_id}-${idx}`}
                        to={`/profile/${voter.profile.username}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={getAvatarUrl(voter.profile.avatar_url)} />
                          <AvatarFallback>
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-sm truncate">
                              {voter.profile.display_name || voter.profile.username}
                            </span>
                            {voter.profile.is_verified && (
                              <BadgeCheck className="h-3.5 w-3.5 verified-badge shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="truncate">{voter.option_text}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1 shrink-0">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(voter.voted_at), {
                                addSuffix: true,
                                locale: language === 'ar' ? ar : enUS,
                              })}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
