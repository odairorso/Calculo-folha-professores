import { useState } from 'react';
import { AppSidebar } from '@/components/AppSidebar';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <main className="flex-1 overflow-y-auto">
        <div className="md:hidden sticky top-0 z-20 bg-background/95 backdrop-blur border-b p-2">
          <button
            onClick={() => setMobileOpen(true)}
            className="inline-flex items-center justify-center rounded-md border px-3 py-2"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
        <div className="w-full p-3 sm:p-4 md:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
