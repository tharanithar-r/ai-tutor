"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import MilestoneList from "../../components/MilestoneList";
import {
  ArrowLeft,
  Calendar,
  Target,
  Clock,
  CheckCircle2,
  BarChart3,
  Brain,
  Edit,
  Trash2,
  Play,
  Pause,
  Archive,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { getAuthToken } from "@/lib/cookies";

interface Milestone {
  id: number;
  goal_id: number;
  title: string;
  description: string;
  milestone_order: number;
  due_date?: string;
  completed: boolean;
  completed_at?: string;
  depends_on_milestone_id?: number;
  created_at: string;
  updated_at: string;
}

interface Goal {
  id: number;
  user_id: number;
  title: string;
  description: string;
  category?: string;
  difficulty_level: "beginner" | "intermediate" | "advanced";
  estimated_duration_weeks: number;
  timeline: Record<string, unknown>;
  ai_analysis: Record<string, unknown>;
  status: "active" | "completed" | "paused" | "archived";
  created_at: string;
  updated_at: string;
}

interface ProgressMetrics {
  completion_rate: number;
  learning_velocity: number;
  streak_days: number;
  total_time_spent_hours: number;
  milestones_completed: number;
}

interface CheckIn {
  id: number;
  frequency: string;
  assessment_data: Record<string, unknown>;
  notes: string;
  mood_rating: number;
  confidence_rating: number;
  last_check_in: string;
  next_check_in: string;
}

interface GoalDetailData {
  goal: Goal;
  milestones: Milestone[];
  progressMetrics?: ProgressMetrics;
  recentCheckIns: CheckIn[];
}

const statusColors = {
  active: "bg-green-100 text-green-800 border-green-200",
  completed: "bg-blue-100 text-blue-800 border-blue-200",
  paused: "bg-yellow-100 text-yellow-800 border-yellow-200",
  archived: "bg-gray-100 text-gray-800 border-gray-200",
};

const difficultyColors = {
  beginner: "bg-emerald-100 text-emerald-800",
  intermediate: "bg-amber-100 text-amber-800",
  advanced: "bg-red-100 text-red-800",
};

export default function GoalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const goalId = params?.id as string;

  const [goalData, setGoalData] = useState<GoalDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchGoalData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/goals/${goalId}`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch goal details");
      }

      const data = await response.json();
      setGoalData(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (goalId) {
      fetchGoalData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goalId]);

  const handleMilestoneToggle = async (
    milestoneId: number,
    completed: boolean
  ) => {
    try {
      setUpdating(true);
      const response = await fetch(`/api/goals/${goalId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({
          milestoneId,
          completed,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update milestone");
      }

      // Refresh goal data
      await fetchGoalData();
    } catch (err) {
      console.error("Error updating milestone:", err);
      alert("Failed to update milestone. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  const handleStatusChange = async (newStatus: Goal["status"]) => {
    try {
      setUpdating(true);
      const response = await fetch(`/api/goals/${goalId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update goal status");
      }

      // Refresh goal data
      await fetchGoalData();
    } catch (err) {
      console.error("Error updating goal status:", err);
      alert("Failed to update goal status. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteGoal = async () => {
    try {
      setUpdating(true);
      const response = await fetch(`/api/goals/${goalId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete goal");
      }

      router.push("/goals");
    } catch (err) {
      console.error("Error deleting goal:", err);
      alert("Failed to delete goal. Please try again.");
      setUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 py-8'>
        <div className='max-w-4xl mx-auto px-4'>
          <div className='animate-pulse space-y-6'>
            <div className='h-8 bg-gray-200 rounded w-1/3'></div>
            <div className='h-64 bg-gray-200 rounded'></div>
            <div className='h-96 bg-gray-200 rounded'></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !goalData) {
    return (
      <div className='min-h-screen bg-gray-50 py-8'>
        <div className='max-w-4xl mx-auto px-4'>
          <Card>
            <CardContent className='py-8 text-center'>
              <p className='text-red-600 mb-4'>{error || "Goal not found"}</p>
              <Button asChild>
                <Link href='/goals'>Back to Goals</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { goal, milestones, progressMetrics } = goalData;
  const completedMilestones = milestones.filter((m) => m.completed).length;
  const totalMilestones = milestones.length;
  const progressPercentage =
    totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-4xl mx-auto px-4 space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <Button variant='ghost' asChild>
            <Link href='/goals' className='flex items-center gap-2'>
              <ArrowLeft className='h-4 w-4' />
              Back to Goals
            </Link>
          </Button>

          <div className='flex items-center gap-2'>
            <Button variant='outline' size='sm'>
              <Edit className='h-4 w-4 mr-2' />
              Edit Goal
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant='outline'
                  size='sm'
                  className='text-red-600 hover:text-red-700'
                >
                  <Trash2 className='h-4 w-4 mr-2' />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Goal</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete &ldquo;{goal.title}&rdquo;?
                    This action cannot be undone and will also delete all
                    associated milestones and progress data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteGoal}
                    disabled={updating}
                  >
                    Delete Goal
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Goal Overview */}
        <Card>
          <CardHeader>
            <div className='flex items-start justify-between'>
              <div className='flex-1'>
                <CardTitle className='text-2xl font-bold text-gray-900 mb-3'>
                  {goal.title}
                </CardTitle>
                <div className='flex items-center gap-2 mb-4'>
                  <Badge
                    variant='outline'
                    className={statusColors[goal.status]}
                  >
                    {goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
                  </Badge>
                  <Badge
                    variant='secondary'
                    className={difficultyColors[goal.difficulty_level]}
                  >
                    {goal.difficulty_level}
                  </Badge>
                  {goal.category && (
                    <Badge variant='outline'>{goal.category}</Badge>
                  )}
                </div>
                <p className='text-gray-600 leading-relaxed'>
                  {goal.description}
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className='space-y-6'>
            {/* Progress Overview */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div className='bg-blue-50 rounded-lg p-4'>
                <div className='flex items-center gap-2 mb-2'>
                  <Target className='h-5 w-5 text-blue-600' />
                  <span className='font-medium text-blue-900'>Progress</span>
                </div>
                <div className='space-y-2'>
                  <Progress value={progressPercentage} className='h-2' />
                  <p className='text-sm text-blue-700'>
                    {completedMilestones}/{totalMilestones} milestones (
                    {Math.round(progressPercentage)}%)
                  </p>
                </div>
              </div>

              <div className='bg-green-50 rounded-lg p-4'>
                <div className='flex items-center gap-2 mb-2'>
                  <Clock className='h-5 w-5 text-green-600' />
                  <span className='font-medium text-green-900'>Duration</span>
                </div>
                <p className='text-2xl font-bold text-green-700'>
                  {goal.estimated_duration_weeks}
                </p>
                <p className='text-sm text-green-600'>weeks estimated</p>
              </div>

              <div className='bg-purple-50 rounded-lg p-4'>
                <div className='flex items-center gap-2 mb-2'>
                  <Calendar className='h-5 w-5 text-purple-600' />
                  <span className='font-medium text-purple-900'>Created</span>
                </div>
                <p className='text-sm text-purple-700'>
                  {formatDate(goal.created_at)}
                </p>
              </div>
            </div>

            {/* Status Actions */}
            <div className='flex items-center gap-2 pt-4 border-t'>
              <span className='text-sm font-medium text-gray-700 mr-2'>
                Quick Actions:
              </span>

              {goal.status !== "active" && (
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => handleStatusChange("active")}
                  disabled={updating}
                >
                  <Play className='h-4 w-4 mr-1' />
                  Activate
                </Button>
              )}

              {goal.status === "active" && (
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => handleStatusChange("paused")}
                  disabled={updating}
                >
                  <Pause className='h-4 w-4 mr-1' />
                  Pause
                </Button>
              )}

              {goal.status !== "completed" && progressPercentage === 100 && (
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => handleStatusChange("completed")}
                  disabled={updating}
                >
                  <CheckCircle2 className='h-4 w-4 mr-1' />
                  Mark Complete
                </Button>
              )}

              {goal.status !== "archived" && (
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => handleStatusChange("archived")}
                  disabled={updating}
                >
                  <Archive className='h-4 w-4 mr-1' />
                  Archive
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Milestones */}
        <div>
          <h2 className='text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2'>
            <Target className='h-5 w-5' />
            Milestones
          </h2>
          <MilestoneList
            milestones={milestones}
            onMilestoneToggle={handleMilestoneToggle}
            showProgress={false}
          />
        </div>

        {/* Progress Metrics */}
        {progressMetrics && (
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <BarChart3 className='h-5 w-5' />
                Progress Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                <div className='text-center'>
                  <p className='text-2xl font-bold text-blue-600'>
                    {Math.round(progressMetrics.completion_rate)}%
                  </p>
                  <p className='text-sm text-gray-600'>Completion Rate</p>
                </div>
                <div className='text-center'>
                  <p className='text-2xl font-bold text-green-600'>
                    {progressMetrics.streak_days}
                  </p>
                  <p className='text-sm text-gray-600'>Day Streak</p>
                </div>
                <div className='text-center'>
                  <p className='text-2xl font-bold text-purple-600'>
                    {Math.round(progressMetrics.total_time_spent_hours)}h
                  </p>
                  <p className='text-sm text-gray-600'>Time Spent</p>
                </div>
                <div className='text-center'>
                  <p className='text-2xl font-bold text-amber-600'>
                    {progressMetrics.milestones_completed}
                  </p>
                  <p className='text-sm text-gray-600'>Milestones Done</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Analysis */}
        {goal.ai_analysis && Object.keys(goal.ai_analysis).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Brain className='h-5 w-5' />
                AI Analysis & Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='prose prose-sm max-w-none'>
                <p className='text-gray-600'>
                  AI-powered insights and recommendations for this goal will be
                  displayed here.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
