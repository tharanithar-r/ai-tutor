"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Calendar,
  Target,
  Clock,
  CheckCircle2,
  Circle,
  MoreHorizontal,
  Edit,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  milestones: Milestone[];
}

interface GoalCardProps {
  goal: Goal;
  onEdit?: (goal: Goal) => void;
  onDelete?: (goalId: number) => void;
  onStatusChange?: (goalId: number, status: Goal["status"]) => void;
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

export default function GoalCard({
  goal,
  onEdit,
  onDelete,
  onStatusChange,
}: GoalCardProps) {
  const completedMilestones = goal.milestones.filter((m) => m.completed).length;
  const totalMilestones = goal.milestones.length;
  const progressPercentage =
    totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getNextMilestone = () => {
    return goal.milestones.find((m) => !m.completed);
  };

  const nextMilestone = getNextMilestone();

  return (
    <Card className='h-full hover:shadow-md transition-shadow duration-200 flex flex-col'>
      <CardHeader className='pb-3'>
        <div className='flex items-start justify-between'>
          <div className='flex-1 min-w-0'>
            <CardTitle className='text-lg font-semibold text-gray-900 truncate'>
              {goal.title}
            </CardTitle>
            <div className='flex items-center gap-2 mt-2'>
              <Badge variant='outline' className={statusColors[goal.status]}>
                {goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
              </Badge>
              <Badge
                variant='secondary'
                className={difficultyColors[goal.difficulty_level]}
              >
                {goal.difficulty_level}
              </Badge>
              {goal.category && (
                <Badge variant='outline' className='text-xs'>
                  {goal.category}
                </Badge>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
                <MoreHorizontal className='h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(goal)}>
                  <Edit className='mr-2 h-4 w-4' />
                  Edit Goal
                </DropdownMenuItem>
              )}
              {onStatusChange && (
                <>
                  <DropdownMenuItem
                    onClick={() => onStatusChange(goal.id, "active")}
                  >
                    <Target className='mr-2 h-4 w-4' />
                    Mark Active
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onStatusChange(goal.id, "completed")}
                  >
                    <CheckCircle2 className='mr-2 h-4 w-4' />
                    Mark Completed
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onStatusChange(goal.id, "paused")}
                  >
                    <Circle className='mr-2 h-4 w-4' />
                    Pause Goal
                  </DropdownMenuItem>
                </>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(goal.id)}
                  className='text-red-600 focus:text-red-600'
                >
                  <Trash2 className='mr-2 h-4 w-4' />
                  Delete Goal
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className='flex-1 flex flex-col justify-between'>
        <div className='space-y-4'>
          {/* Description */}
          <p className='text-sm text-gray-600 line-clamp-2 min-h-[2.5rem]'>
            {goal.description}
          </p>

          {/* Progress */}
          <div className='space-y-2'>
            <div className='flex items-center justify-between text-sm'>
              <span className='text-gray-600'>Progress</span>
              <span className='font-medium'>
                {completedMilestones}/{totalMilestones} milestones
              </span>
            </div>
            <Progress value={progressPercentage} className='h-2' />
            <div className='text-xs text-gray-500'>
              {Math.round(progressPercentage)}% complete
            </div>
          </div>

          {/* Next Milestone */}
          <div className='min-h-[4rem]'>
            {nextMilestone ? (
              <div className='bg-blue-50 rounded-lg p-3 border border-blue-100'>
                <div className='flex items-start gap-2'>
                  <Target className='h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0' />
                  <div className='min-w-0 flex-1'>
                    <p className='text-sm font-medium text-blue-900'>
                      Next: {nextMilestone.title}
                    </p>
                    {nextMilestone.due_date && (
                      <p className='text-xs text-blue-600 mt-1'>
                        Due: {formatDate(nextMilestone.due_date)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className='bg-gray-50 rounded-lg p-3 border border-gray-100'>
                <div className='flex items-center gap-2'>
                  <CheckCircle2 className='h-4 w-4 text-green-600' />
                  <p className='text-sm text-gray-600'>
                    All milestones completed!
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className='space-y-4'>
          {/* Goal Metadata */}
          <div className='flex items-center justify-between text-xs text-gray-500 pt-2 border-t'>
            <div className='flex items-center gap-4'>
              <div className='flex items-center gap-1'>
                <Clock className='h-3 w-3' />
                <span>{goal.estimated_duration_weeks}w</span>
              </div>
              <div className='flex items-center gap-1'>
                <Calendar className='h-3 w-3' />
                <span>Created {formatDate(goal.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons - Footer */}
          <div className='flex gap-2'>
            <Button asChild variant='default' size='sm' className='flex-1'>
              <Link href={`/goals/${goal.id}`}>View Details</Link>
            </Button>
            {goal.status === "active" && nextMilestone && (
              <Button asChild variant='outline' size='sm' className='flex-1'>
                <Link href={`/goals/${goal.id}#milestone-${nextMilestone.id}`}>
                  Continue
                </Link>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
