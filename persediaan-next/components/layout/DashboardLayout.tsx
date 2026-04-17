'use client';

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Props untuk DashboardLayout component
 */
interface DashboardLayoutProps {
  children: React.ReactNode;
}

/**
 * Komponen DashboardLayout
 * Wrapper untuk semua halaman dashboard yang menyediakan sidebar dan main content area
 *
 * Layout menggunakan dark theme secara default (class dark)
 * Flex layout: sidebar sticky di kiri, main content auto-fill
 * Responsif: sidebar toggle pada mobile, selalu visible pada desktop
 */
export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="dark flex min-h-screen bg-background text-foreground">
      {/* Backdrop overlay untuk mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar responsif */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:static md:block
        `}
      >
        <Sidebar onCloseMobile={() => setSidebarOpen(false)} />
      </div>

      {/* Main content area */}
      <main className="flex-1 overflow-y-auto">
        {/* Header dengan hamburger button untuk mobile */}
        <header className="sticky top-0 z-30 bg-background border-b">
          <div className="flex items-center gap-4 px-4 py-3 md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              aria-label="Buka menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <span className="font-semibold">PERSEDIAAN ATK</span>
          </div>
        </header>

        {/* Content */}
        <div className="p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
