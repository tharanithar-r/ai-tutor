'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Target, 
  TrendingUp, 
  MessageCircle, 
  Zap,
  Award,
  Clock
} from 'lucide-react';
import { getAuthToken } from '@/lib/cookies';

interface ProgressAnalytics {
  summary: {
    total_activities: number;
    active_days: number;
    current_streak: number;
    avg_daily_velocity: number;
    goal_completion_rate: number;
    total_goals: number;
    completed_goals: number;
  };
  activity_breakdown: Record<string, number>;
  daily_velocity: Array<{
    date: string;
    activities_count: number;
  }>;
  goal_progress: Array<{
    id: string;
    title: string;
    status: string;
    progress: number;
    total_milestones: number;
    completed_milestones: number;
    completion_rate: number;
    days_since_created: number;
    is_overdue: boolean;
  }>;
  chat_engagement: {
    total_messages: number;
    active_chat_days: number;
    avg_message_length: number;
  };
  timeframe_days: number;
}

interface ProgressDashboardProps {
  goalId?: string;
  timeframe?: number;
}

export default function ProgressDashboard({ goalId, timeframe = 30 }: ProgressDashboardProps) {
  const [analytics, setAnalytics] = useState<ProgressAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = getAuthToken();
        if (!token) {
          setError('Authentication required');
          return;
        }

        const params = new URLSearchParams({
          timeframe: timeframe.toString()
        });
        
        if (goalId) {
          params.append('goal_id', goalId);
        }

        const response = await fetch(`/api/progress/analytics?${params}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch analytics');
        }

        const data = await response.json();
        setAnalytics(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [goalId, timeframe]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <Card className="col-span-full">
        <CardContent className="flex items-center justify-center h-32">
          <p className="text-gray-500">{error || 'No analytics data available'}</p>
        </CardContent>
      </Card>
    );
  }

  const getActivityTypeIcon = (type: string) => {
    switch (type) {
      case 'milestone_completed':
        return <Award className="h-4 w-4" />;
      case 'chat_message_sent':
        return <MessageCircle className="h-4 w-4" />;
      case 'goal_created':
        return <Target className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.summary.total_activities}</div>
            <p className="text-xs text-muted-foreground">
              Last {analytics.timeframe_days} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.summary.current_streak}</div>
            <p className="text-xs text-muted-foreground">
              Active days in a row
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Velocity</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.summary.avg_daily_velocity}</div>
            <p className="text-xs text-muted-foreground">
              Activities per day
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Goal Completion</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.summary.goal_completion_rate}%</div>
            <p className="text-xs text-muted-foreground">
              {analytics.summary.completed_goals} of {analytics.summary.total_goals} goals
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.entries(analytics.activity_breakdown).map(([type, count]) => (
              <div key={type} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                {getActivityTypeIcon(type)}
                <div>
                  <p className="font-medium text-sm capitalize">
                    {type.replace(/_/g, ' ')}
                  </p>
                  <p className="text-lg font-bold">{count}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Goal Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Goal Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.goal_progress.map((goal) => (
              <div key={goal.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium">{goal.title}</h3>
                    <Badge className={getStatusColor(goal.status)}>
                      {goal.status.replace('_', ' ')}
                    </Badge>
                    {goal.is_overdue && (
                      <Badge variant="destructive" className="text-xs">
                        Overdue
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {goal.days_since_created} days ago
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress: {goal.completion_rate}%</span>
                    <span>{goal.completed_milestones} / {goal.total_milestones} milestones</span>
                  </div>
                  <Progress value={goal.completion_rate} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Chat Engagement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Chat Engagement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {analytics.chat_engagement.total_messages}
              </div>
              <p className="text-sm text-blue-600">Total Messages</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {analytics.chat_engagement.active_chat_days}
              </div>
              <p className="text-sm text-green-600">Active Chat Days</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {analytics.chat_engagement.avg_message_length}
              </div>
              <p className="text-sm text-purple-600">Avg Message Length</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
