"use client";

import Sidebar from "./Sidebar";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className='flex h-screen bg-gray-50'>
      <Sidebar />

      {/* Main content */}
      <div className='flex-1 flex flex-col overflow-hidden md:ml-0'>
        <main className='flex-1 overflow-y-auto !pt-24 md:pt-0 px-2 md:px-0'>
          {children}
        </main>
      </div>
    </div>
  );
}
