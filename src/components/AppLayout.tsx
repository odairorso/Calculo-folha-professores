import { AppSidebar } from '@/components/AppSidebar';
import { Outlet } from 'react-router-dom';

export function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
