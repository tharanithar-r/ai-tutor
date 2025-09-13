"use client";

import { useEffect, useState } from "react";
import ChatInterface from "../components/ChatInterface";
import { Badge } from "@/components/ui/badge";
import {
  Target,
  Bot,
} from "lucide-react";
import { getAuthToken } from "@/lib/cookies";
import ProtectedRoute from '../components/ProtectedRoute';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Goal {
  id: number;
  title: string;
  description: string;
  category: string;
  status: string;
  progress: number;
  target_date: string;
  created_at: string;
}

export default function ChatPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<string>("");

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const token = getAuthToken();
        if (!token) {
          console.log("No auth token found");
          return;
        }

        const response = await fetch("/api/goals", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();
        console.log("Goals API response:", data);

        if (data.success && Array.isArray(data.data)) {
          setGoals(data.data);
        } else if (Array.isArray(data.goals)) {
          setGoals(data.goals);
        } else {
          console.warn("Unexpected goals API response structure:", data);
          setGoals([]);
        }
      } catch (error) {
        console.error("Error fetching goals:", error);
        setGoals([]);
      }
    };

    fetchGoals();
  }, []);

  return (
    <ProtectedRoute>
      {() => (
        <div className="flex flex-col h-screen p-6">
          {/* Goal Selection Header */}
          <div className="mb-6 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Bot className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">AI Tutor</h1>
                  <p className="text-sm text-gray-500">Your personalized learning assistant</p>
                </div>
              </div>
              
              {/* Goal Selection */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Current Goal:</span>
                </div>
                <Select value={selectedGoal} onValueChange={setSelectedGoal}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Select a learning goal" />
                  </SelectTrigger>
                  <SelectContent>
                    {goals.map((goal) => (
                      <SelectItem key={goal.id} value={goal.id.toString()}>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {goal.category}
                          </Badge>
                          <span className="truncate">{goal.title}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Chat Interface */}
          <div className="flex-1 min-h-0">
            <ChatInterface 
              goalId={selectedGoal ? parseInt(selectedGoal) : undefined}
              className="h-full"
            />
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
