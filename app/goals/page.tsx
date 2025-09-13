"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import GoalCard from "../components/GoalCard";
import {
  Plus,
  Target,
  TrendingUp,
  Brain,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { getAuthToken } from "@/lib/cookies";
import ProtectedRoute from "../components/ProtectedRoute";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  milestones?: Milestone[];
}

interface GoalFormData {
  title: string;
  description: string;
  category: string;
  difficulty_level: "beginner" | "intermediate" | "advanced";
  estimated_duration_weeks: number;
}

const initialFormData: GoalFormData = {
  title: "",
  description: "",
  category: "",
  difficulty_level: "beginner",
  estimated_duration_weeks: 4,
};

function GoalsPageContent() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState<GoalFormData>(initialFormData);
  const [isCreating, setIsCreating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/goals", {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch goals");
      }

      const data = await response.json();
      setGoals(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async () => {
    try {
      setIsCreating(true);
      setIsAnalyzing(true);

      // First, analyze the goal with AI
      const analysisResponse = await fetch("/api/goals/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          difficulty_level: formData.difficulty_level,
          estimated_duration_weeks: formData.estimated_duration_weeks,
        }),
      });

      if (!analysisResponse.ok) {
        throw new Error("Failed to analyze goal");
      }

      const analysisData = await analysisResponse.json();
      setIsAnalyzing(false);

      // Create the goal with AI analysis
      const createResponse = await fetch("/api/goals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({
          ...formData,
          ai_analysis: analysisData.data,
        }),
      });

      if (!createResponse.ok) {
        throw new Error("Failed to create goal");
      }

      // Reset form and close dialog
      setFormData(initialFormData);
      setIsCreateDialogOpen(false);

      // Refresh goals list
      await fetchGoals();
    } catch (err) {
      console.error("Error creating goal:", err);
      alert("Failed to create goal. Please try again.");
    } finally {
      setIsCreating(false);
      setIsAnalyzing(false);
    }
  };

  const handleDeleteGoal = async (goalId: number) => {
    try {
      const response = await fetch(`/api/goals/${goalId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete goal");
      }

      // Refresh goals list
      await fetchGoals();
    } catch (err) {
      console.error("Error deleting goal:", err);
      alert("Failed to delete goal. Please try again.");
    }
  };

  // Filter and search goals
  const filteredGoals = goals.filter((goal) => {
    const matchesSearch =
      goal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      goal.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || goal.status === filterStatus;
    const matchesCategory =
      filterCategory === "all" || goal.category === filterCategory;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Get unique categories for filter
  const categories = Array.from(
    new Set(goals.map((goal) => goal.category).filter(Boolean))
  );

  // Calculate stats
  const stats = {
    total: goals.length,
    active: goals.filter((g) => g.status === "active").length,
    completed: goals.filter((g) => g.status === "completed").length,
    paused: goals.filter((g) => g.status === "paused").length,
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50'>
        <div className='max-w-6xl mx-auto px-4'>
          <div className='animate-pulse space-y-6'>
            <div className='h-8 bg-gray-200 rounded w-1/3'></div>
            <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className='h-24 bg-gray-200 rounded'></div>
              ))}
            </div>
            <div className='h-96 bg-gray-200 rounded'></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50  pt-16 md:pt-5'>
      <div className='max-w-6xl mx-auto px-4 md:px-4 space-y-6'>
        {/* Header */}
        <div className='flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>
              Your Learning Goals
            </h1>
            <p className='text-gray-600 mt-2'>
              Track your progress and achieve your learning objectives
            </p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className='flex items-center gap-2 flex-shrink-0'>
                <Plus className='h-4 w-4' />
                Create New Goal
              </Button>
            </DialogTrigger>
            <DialogContent className='max-w-2xl'>
              <DialogHeader>
                <DialogTitle className='flex items-center gap-2'>
                  <Target className='h-5 w-5' />
                  Create New Learning Goal
                </DialogTitle>
                <DialogDescription>
                  Define your learning objective and let AI help you create a
                  structured plan with milestones.
                </DialogDescription>
              </DialogHeader>

              <div className='space-y-4 py-4'>
                <div className='space-y-2'>
                  <Label htmlFor='title'>Goal Title</Label>
                  <Input
                    id='title'
                    placeholder='e.g., Learn React Development'
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='description'>Description</Label>
                  <Textarea
                    id='description'
                    placeholder="Describe what you want to achieve and why it's important to you..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                  />
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='category'>Category</Label>
                    <Input
                      id='category'
                      placeholder='e.g., Programming, Design'
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='difficulty'>Difficulty Level</Label>
                    <Select
                      value={formData.difficulty_level}
                      onValueChange={(
                        value: "beginner" | "intermediate" | "advanced"
                      ) =>
                        setFormData({ ...formData, difficulty_level: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='beginner'>Beginner</SelectItem>
                        <SelectItem value='intermediate'>
                          Intermediate
                        </SelectItem>
                        <SelectItem value='advanced'>Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='duration'>Estimated Duration (weeks)</Label>
                  <Input
                    id='duration'
                    type='number'
                    min='1'
                    max='52'
                    value={formData.estimated_duration_weeks}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        estimated_duration_weeks: parseInt(e.target.value) || 4,
                      })
                    }
                  />
                </div>

                {isAnalyzing && (
                  <div className='flex items-center gap-2 text-blue-600 bg-blue-50 p-3 rounded-lg'>
                    <Brain className='h-4 w-4 animate-pulse' />
                    <span className='text-sm'>
                      AI is analyzing your goal and creating milestones...
                    </span>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant='outline'
                  onClick={() => setIsCreateDialogOpen(false)}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateGoal}
                  disabled={
                    isCreating || !formData.title || !formData.description
                  }
                >
                  {isCreating ? "Creating..." : "Create Goal"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          <Card>
            <CardContent className='p-4'>
              <div className='flex items-center gap-3'>
                <div className='p-2 bg-blue-100 rounded-lg'>
                  <Target className='h-5 w-5 text-blue-600' />
                </div>
                <div>
                  <p className='text-2xl font-bold text-gray-900'>
                    {stats.total}
                  </p>
                  <p className='text-sm text-gray-600'>Total Goals</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-4'>
              <div className='flex items-center gap-3'>
                <div className='p-2 bg-green-100 rounded-lg'>
                  <TrendingUp className='h-5 w-5 text-green-600' />
                </div>
                <div>
                  <p className='text-2xl font-bold text-gray-900'>
                    {stats.active}
                  </p>
                  <p className='text-sm text-gray-600'>Active</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-4'>
              <div className='flex items-center gap-3'>
                <div className='p-2 bg-emerald-100 rounded-lg'>
                  <CheckCircle2 className='h-5 w-5 text-emerald-600' />
                </div>
                <div>
                  <p className='text-2xl font-bold text-gray-900'>
                    {stats.completed}
                  </p>
                  <p className='text-sm text-gray-600'>Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-4'>
              <div className='flex items-center gap-3'>
                <div className='p-2 bg-amber-100 rounded-lg'>
                  <Clock className='h-5 w-5 text-amber-600' />
                </div>
                <div>
                  <p className='text-2xl font-bold text-gray-900'>
                    {stats.paused}
                  </p>
                  <p className='text-sm text-gray-600'>Paused</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className='p-4'>
            <div className='flex flex-col md:flex-row gap-4'>
              <div className='flex-1'>
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                  <Input
                    placeholder='Search goals...'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className='pl-10'
                  />
                </div>
              </div>

              <div className='flex gap-2'>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className='w-32'>
                    <SelectValue placeholder='Status' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Status</SelectItem>
                    <SelectItem value='active'>Active</SelectItem>
                    <SelectItem value='completed'>Completed</SelectItem>
                    <SelectItem value='paused'>Paused</SelectItem>
                    <SelectItem value='archived'>Archived</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filterCategory}
                  onValueChange={setFilterCategory}
                >
                  <SelectTrigger className='w-32'>
                    <SelectValue placeholder='Category' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category!}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Goals List */}
        {error && (
          <Card>
            <CardContent className='py-8 text-center'>
              <AlertCircle className='h-12 w-12 text-red-400 mx-auto mb-4' />
              <p className='text-red-600 mb-4'>{error}</p>
              <Button onClick={fetchGoals}>Try Again</Button>
            </CardContent>
          </Card>
        )}

        {!error && filteredGoals.length === 0 && !loading && (
          <Card>
            <CardContent className='py-12 text-center'>
              <Target className='h-16 w-16 text-gray-400 mx-auto mb-4' />
              <h3 className='text-lg font-medium text-gray-900 mb-2'>
                {goals.length === 0
                  ? "No goals yet"
                  : "No goals match your filters"}
              </h3>
              <p className='text-gray-600 mb-6'>
                {goals.length === 0
                  ? "Create your first learning goal to get started on your journey!"
                  : "Try adjusting your search or filter criteria."}
              </p>
              {goals.length === 0 && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className='h-4 w-4 mr-2' />
                  Create Your First Goal
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {!error && filteredGoals.length > 0 && (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {filteredGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={{
                  ...goal,
                  milestones: goal.milestones || [],
                }}
                onDelete={() => handleDeleteGoal(goal.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function GoalsPage() {
  return (
    <ProtectedRoute>
      <GoalsPageContent />
    </ProtectedRoute>
  );
}
