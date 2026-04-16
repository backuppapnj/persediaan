import React from 'react';
import { Sidebar } from './Sidebar';

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
 */
export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="dark flex min-h-screen bg-background text-foreground">
      {/* Sidebar sticky di kiri */}
      <Sidebar />

      {/* Main content area auto-fill sisa ruang */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
