"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getAuthToken } from "@/lib/cookies";
import ProtectedRoute from "../components/ProtectedRoute";

interface User {
  id: string;
  email: string;
  name: string;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const verifyAuth = async () => {
      const token = getAuthToken();

      if (!token) return;

      try {
        const response = await fetch("/api/auth/verify", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error("Auth verification failed:", error);
      }
    };

    verifyAuth();
  }, []);

  return (
    <ProtectedRoute>
      <div className='px-4 md:px-8 pt-16 md:pt-5'>
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>Dashboard</h1>
          <p className='text-lg text-gray-600'>
            Welcome back, {user?.name || user?.email}!
          </p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          <Card className='hover:-translate-y-1 transition-transform duration-200 shadow-sm'>
            <CardHeader>
              <CardTitle className='text-gray-800'>Your Goals</CardTitle>
              <CardDescription>Manage your learning objectives</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push("/goals")} className='w-full'>
                View Goals
              </Button>
            </CardContent>
          </Card>

          <Card className='hover:-translate-y-1 transition-transform duration-200 shadow-sm'>
            <CardHeader>
              <CardTitle className='text-gray-800'>Progress Tracking</CardTitle>
              <CardDescription>Monitor your learning journey</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => router.push("/progress")}
                className='w-full'
              >
                View Progress
              </Button>
            </CardContent>
          </Card>

          <Card className='hover:-translate-y-1 transition-transform duration-200 shadow-sm'>
            <CardHeader>
              <CardTitle className='text-gray-800'>AI Tutor</CardTitle>
              <CardDescription>
                Get personalized learning support
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push("/chat")} className='w-full'>
                Chat with Tutor
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
