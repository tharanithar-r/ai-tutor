"use client";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getAuthToken, removeAuthToken } from "@/lib/cookies";
import Link from "next/link";
import {
  Home,
  Target,
  MessageCircle,
  BarChart3,
  Settings,
  LogOut,
  User,
  Menu,
  X,
} from "lucide-react";

interface User {
  id: number;
  email: string;
  name?: string;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  current?: boolean;
}

export default function Sidebar() {
  const [user, setUser] = useState<User | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const navigation: NavItem[] = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Goals", href: "/goals", icon: Target },
    { name: "AI Tutor", href: "/chat", icon: MessageCircle },
    { name: "Progress", href: "/progress", icon: BarChart3 },
  ];

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

  const logout = () => {
    removeAuthToken();
    setUser(null);
    router.push("/login");
  };

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  return (
    <>
      {/* Mobile Header */}
      <div className='md:hidden fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b'>
        <div className='flex items-center justify-between px-4 py-3'>
          <div className='flex items-center'>
            <div className='w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center'>
              <MessageCircle className='w-5 h-5 text-white' />
            </div>
            <h1 className='ml-3 text-xl font-bold text-gray-900'>AI Tutor</h1>
          </div>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className='p-2'
          >
            {isMobileMenuOpen ? (
              <X className='h-6 w-6' />
            ) : (
              <Menu className='h-6 w-6' />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className='md:hidden fixed inset-0 z-40 bg-black bg-opacity-50' onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Mobile Sidebar */}
      <div className={`md:hidden fixed top-0 left-0 z-50 w-64 h-full bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className='flex flex-col h-full pt-16'>
          {/* Navigation */}
          <div className='flex-1 flex flex-col overflow-y-auto'>
            <nav className='flex-1 px-4 pb-4 space-y-1'>
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`
                      group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150
                      ${
                        isActive
                          ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }
                    `}
                  >
                    <Icon
                      className={`
                        mr-3 h-5 w-5 flex-shrink-0
                        ${
                          isActive
                            ? "text-blue-700"
                            : "text-gray-400 group-hover:text-gray-500"
                        }
                      `}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Mobile User Profile Section */}
            <div className='flex-shrink-0 border-t border-gray-200 p-4'>
              {user ? (
                <div className='space-y-3'>
                  <div className='flex items-center'>
                    <Avatar className='h-8 w-8'>
                      <AvatarFallback className='bg-blue-100 text-blue-700 text-sm font-medium'>
                        {getInitials(user.name, user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className='ml-3 flex-1 min-w-0'>
                      <p className='text-sm font-medium text-gray-900 truncate'>
                        {user.name || "User"}
                      </p>
                      <p className='text-xs text-gray-500 truncate'>
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='w-full justify-start text-gray-600 hover:text-gray-900'
                    >
                      <Settings className='mr-2 h-4 w-4' />
                      Settings
                    </Button>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => {
                        logout();
                        setIsMobileMenuOpen(false);
                      }}
                      className='w-full justify-start text-gray-600 hover:text-red-600'
                    >
                      <LogOut className='mr-2 h-4 w-4' />
                      Sign out
                    </Button>
                  </div>
                </div>
              ) : (
                <div className='space-y-2'>
                  <Link href='/login' onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant='outline' size='sm' className='w-full'>
                      Sign in
                    </Button>
                  </Link>
                  <Link href='/register' onClick={() => setIsMobileMenuOpen(false)}>
                    <Button size='sm' className='w-full'>
                      Register
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className='hidden md:flex md:w-64 md:flex-col'>
        <div className='flex flex-col flex-grow pt-5 bg-white shadow-lg'>
          {/* Logo */}
          <div className='flex items-center flex-shrink-0 px-6 pb-4'>
            <div className='flex items-center'>
              <div className='w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center'>
                <MessageCircle className='w-5 h-5 text-white' />
              </div>
              <h1 className='ml-3 text-xl font-bold text-gray-900'>AI Tutor</h1>
            </div>
          </div>

          {/* Navigation */}
          <div className='flex-1 flex flex-col overflow-y-auto'>
            <nav className='flex-1 px-4 pb-4 space-y-1'>
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`
                      group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150
                      ${
                        isActive
                          ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }
                    `}
                  >
                    <Icon
                      className={`
                        mr-3 h-5 w-5 flex-shrink-0
                        ${
                          isActive
                            ? "text-blue-700"
                            : "text-gray-400 group-hover:text-gray-500"
                        }
                      `}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* User Profile Section */}
            <div className='flex-shrink-0 border-t border-gray-200 p-4'>
              {user ? (
                <div className='space-y-3'>
                  <div className='flex items-center'>
                    <Avatar className='h-8 w-8'>
                      <AvatarFallback className='bg-blue-100 text-blue-700 text-sm font-medium'>
                        {getInitials(user.name, user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className='ml-3 flex-1 min-w-0'>
                      <p className='text-sm font-medium text-gray-900 truncate'>
                        {user.name || "User"}
                      </p>
                      <p className='text-xs text-gray-500 truncate'>
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <div className='flex space-x-2'>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='flex-1 justify-start text-gray-600 hover:text-gray-900'
                    >
                      <Settings className='mr-2 h-4 w-4' />
                      Settings
                    </Button>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={logout}
                      className='flex-1 justify-start text-gray-600 hover:text-red-600'
                    >
                      <LogOut className='mr-2 h-4 w-4' />
                      Sign out
                    </Button>
                  </div>
                </div>
              ) : (
                <div className='space-y-2'>
                  <Link href='/login'>
                    <Button variant='outline' size='sm' className='w-full'>
                      Sign in
                    </Button>
                  </Link>
                  <Link href='/register'>
                    <Button size='sm' className='w-full'>
                      Register
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
