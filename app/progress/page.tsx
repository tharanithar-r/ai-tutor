"use client";

import { useState } from "react";
import ProtectedRoute from "../components/ProtectedRoute";
import ProgressDashboard from "../components/ProgressDashboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BarChart3, Calendar, Filter } from "lucide-react";
import Link from "next/link";

export default function ProgressPage() {
  const [timeframe, setTimeframe] = useState(30);
  const [selectedGoalId, setSelectedGoalId] = useState<string>("");

  return (
    <ProtectedRoute>
      <main className='min-h-[calc(100vh-64px)] bg-gray-50 py-8 px-4 sm:px-6 lg:px-8'>
        <div className='max-w-7xl mx-auto'>
          {/* Header */}
          <div className='flex items-center justify-between mb-8'>
            <div className='flex items-center gap-4'>
              <div>
                <h1 className='text-3xl font-bold text-gray-900 flex items-center gap-3'>
                  <BarChart3 className='h-8 w-8 text-blue-600' />
                  Progress & Analytics
                </h1>
                <p className='text-lg text-gray-600 mt-1'>
                  Track your learning journey and achievements
                </p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <Card className='mb-8'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-lg'>
                <Filter className='h-5 w-5' />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='flex flex-wrap items-center gap-4'>
                <div className='flex items-center gap-2'>
                  <Calendar className='h-4 w-4 text-gray-500' />
                  <label className='text-sm font-medium'>Timeframe:</label>
                  <Select
                    value={timeframe.toString()}
                    onValueChange={(value) => setTimeframe(parseInt(value))}
                  >
                    <SelectTrigger className='w-32'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='7'>Last 7 days</SelectItem>
                      <SelectItem value='30'>Last 30 days</SelectItem>
                      <SelectItem value='90'>Last 3 months</SelectItem>
                      <SelectItem value='365'>Last year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className='flex items-center gap-2'>
                  <label className='text-sm font-medium'>Goal:</label>
                  <Select
                    value={selectedGoalId}
                    onValueChange={setSelectedGoalId}
                  >
                    <SelectTrigger className='w-48'>
                      <SelectValue placeholder='All goals' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All goals</SelectItem>
                      {/* Goals will be populated dynamically */}
                    </SelectContent>
                  </Select>
                </div>

                {(selectedGoalId || timeframe !== 30) && (
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => {
                      setSelectedGoalId("");
                      setTimeframe(30);
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Progress Dashboard */}
          <ProgressDashboard
            goalId={selectedGoalId || undefined}
            timeframe={timeframe}
          />

          {/* Quick Actions */}
          <div className='mt-8 flex gap-4 flex-wrap'>
            <Button asChild>
              <Link href='/goals'>Manage Goals</Link>
            </Button>
            <Button variant='outline' asChild>
              <Link href='/chat'>Chat with AI Tutor</Link>
            </Button>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
