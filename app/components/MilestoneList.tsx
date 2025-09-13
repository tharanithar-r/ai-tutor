'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Calendar, 
  CheckCircle2, 
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Target
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

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

interface MilestoneListProps {
  milestones: Milestone[];
  onMilestoneToggle?: (milestoneId: number, completed: boolean) => void;
  onMilestoneEdit?: (milestone: Milestone) => void;
  showProgress?: boolean;
  compact?: boolean;
}

export default function MilestoneList({ 
  milestones, 
  onMilestoneToggle, 
  onMilestoneEdit,
  showProgress = true,
  compact = false
}: MilestoneListProps) {
  const [expandedMilestones, setExpandedMilestones] = useState<Set<number>>(new Set());

  const completedCount = milestones.filter(m => m.completed).length;
  const totalCount = milestones.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };


  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const toggleExpanded = (milestoneId: number) => {
    const newExpanded = new Set(expandedMilestones);
    if (newExpanded.has(milestoneId)) {
      newExpanded.delete(milestoneId);
    } else {
      newExpanded.add(milestoneId);
    }
    setExpandedMilestones(newExpanded);
  };

  const handleMilestoneToggle = (milestoneId: number, completed: boolean) => {
    if (onMilestoneToggle) {
      onMilestoneToggle(milestoneId, completed);
    }
  };

  const getMilestoneStatus = (milestone: Milestone) => {
    if (milestone.completed) {
      return { status: 'completed', color: 'text-green-600', bgColor: 'bg-green-50' };
    }
    
    if (milestone.due_date) {
      const daysUntil = getDaysUntilDue(milestone.due_date);
      if (daysUntil < 0) {
        return { status: 'overdue', color: 'text-red-600', bgColor: 'bg-red-50' };
      }
      if (daysUntil <= 3) {
        return { status: 'due-soon', color: 'text-amber-600', bgColor: 'bg-amber-50' };
      }
    }
    
    return { status: 'pending', color: 'text-gray-600', bgColor: 'bg-gray-50' };
  };

  if (milestones.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No milestones yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Milestones will appear here once you create a goal
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {showProgress && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5" />
              Milestone Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Overall Progress</span>
                <span className="font-medium">
                  {completedCount}/{totalCount} completed
                </span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
              <div className="text-xs text-gray-500">
                {Math.round(progressPercentage)}% complete
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {milestones.map((milestone) => {
          const { status, color, bgColor } = getMilestoneStatus(milestone);
          const isExpanded = expandedMilestones.has(milestone.id);
          const daysUntilDue = milestone.due_date ? getDaysUntilDue(milestone.due_date) : null;

          return (
            <Card key={milestone.id} className={`transition-all duration-200 ${bgColor} border-l-4 ${
              milestone.completed 
                ? 'border-l-green-500' 
                : status === 'overdue' 
                  ? 'border-l-red-500'
                  : status === 'due-soon'
                    ? 'border-l-amber-500'
                    : 'border-l-gray-300'
            }`}>
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <CardHeader 
                    className="pb-3 cursor-pointer hover:bg-white/50 transition-colors"
                    onClick={() => toggleExpanded(milestone.id)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <div className="pt-1">
                        <Checkbox
                          checked={milestone.completed}
                          onCheckedChange={(checked) => 
                            handleMilestoneToggle(milestone.id, checked as boolean)
                          }
                          onClick={(e) => e.stopPropagation()}
                          className="h-5 w-5"
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <CardTitle className={`text-base font-medium ${
                              milestone.completed ? 'line-through text-gray-500' : color
                            }`}>
                              {milestone.title}
                            </CardTitle>
                            
                            {!compact && (
                              <p className={`text-sm mt-1 ${
                                milestone.completed ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                                {milestone.description}
                              </p>
                            )}

                            {/* Status badges */}
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                #{milestone.milestone_order}
                              </Badge>
                              
                              {milestone.completed && milestone.completed_at && (
                                <Badge variant="outline" className="text-xs text-green-700">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Completed {formatDate(milestone.completed_at)}
                                </Badge>
                              )}
                              
                              {!milestone.completed && milestone.due_date && (
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${
                                    status === 'overdue' 
                                      ? 'text-red-700 border-red-200' 
                                      : status === 'due-soon'
                                        ? 'text-amber-700 border-amber-200'
                                        : 'text-gray-700'
                                  }`}
                                >
                                  {status === 'overdue' && <AlertCircle className="h-3 w-3 mr-1" />}
                                  {status === 'due-soon' && <Clock className="h-3 w-3 mr-1" />}
                                  {status === 'pending' && <Calendar className="h-3 w-3 mr-1" />}
                                  
                                  {status === 'overdue' 
                                    ? `Overdue by ${Math.abs(daysUntilDue!)} days`
                                    : status === 'due-soon'
                                      ? `Due in ${daysUntilDue} days`
                                      : `Due ${formatDate(milestone.due_date)}`
                                  }
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Expand/Collapse Icon */}
                          <div className="flex items-center gap-2 ml-2">
                            {onMilestoneEdit && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onMilestoneEdit(milestone);
                                }}
                                className="h-8 px-2 text-xs"
                              >
                                Edit
                              </Button>
                            )}
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-gray-400" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>

                {!compact && (
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="ml-8 space-y-3 text-sm text-gray-600">
                        {milestone.description && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-1">Description</h4>
                            <p>{milestone.description}</p>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="font-medium text-gray-900">Created:</span>
                            <br />
                            {formatDate(milestone.created_at)}
                          </div>
                          
                          {milestone.due_date && (
                            <div>
                              <span className="font-medium text-gray-900">Due Date:</span>
                              <br />
                              {formatDate(milestone.due_date)}
                            </div>
                          )}
                          
                          {milestone.completed_at && (
                            <div>
                              <span className="font-medium text-gray-900">Completed:</span>
                              <br />
                              {formatDate(milestone.completed_at)}
                            </div>
                          )}
                          
                          {milestone.depends_on_milestone_id && (
                            <div>
                              <span className="font-medium text-gray-900">Depends on:</span>
                              <br />
                              Milestone #{milestone.depends_on_milestone_id}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                )}
              </Collapsible>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
