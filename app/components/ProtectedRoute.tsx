"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthToken } from "@/lib/cookies";

interface User {
  id: number;
  email: string;
  name?: string;
}

interface ProtectedRouteProps {
  children: React.ReactNode | ((user: User) => React.ReactNode);
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const verifyAuth = async () => {
      const token = getAuthToken();

      if (!token) {
        setIsLoading(false);
        router.push("/login");
        return;
      }

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
          setIsLoading(false);
        } else {
          const errorData = await response.json();
          setIsLoading(false);
          router.push("/login");
        }
      } catch (error) {
        setIsLoading(false);
        router.push("/login");
      }
    };

    verifyAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center flex-col gap-4'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500'></div>
        <p className='text-gray-600'>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className='min-h-screen flex items-center justify-center flex-col gap-4'>
        <div className='text-center'>
          <h2 className='text-xl font-semibold text-gray-800 mb-2'>
            Authentication Required
          </h2>
          <p className='text-gray-600'>Please log in to access this page.</p>
        </div>
      </div>
    );
  }

  return <>{typeof children === "function" ? children(user) : children}</>;
}
