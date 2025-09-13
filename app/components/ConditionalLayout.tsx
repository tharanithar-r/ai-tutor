'use client';

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  
  // Routes that should NOT have the sidebar
  const publicRoutes = ['/login', '/register', '/verify-email'];
  
  // Check if current route should have sidebar
  const shouldShowSidebar = !publicRoutes.includes(pathname);

  if (!shouldShowSidebar) {
    // Public pages - no sidebar
    return <>{children}</>;
  }

  // Authenticated pages - with sidebar
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
