import { ReactNode } from 'react';
import { Header } from './Header';
import { CategoriesSidebar } from './CategoriesSidebar';
import { TrendingSidebar } from './TrendingSidebar';
import { BottomNav } from './BottomNav';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <CategoriesSidebar />
      <TrendingSidebar />
      
      {/* Main Content Area - Responsive padding */}
      <main className="pt-16 lg:ps-60 xl:pe-72 min-h-screen pb-20 lg:pb-0">
        <div className="w-full max-w-3xl mx-auto py-4 sm:py-6 px-3 sm:px-4">
          {children}
        </div>
      </main>
      
      {/* Bottom Navigation for Mobile */}
      <BottomNav />
    </div>
  );
}
