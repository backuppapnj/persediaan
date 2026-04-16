'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string | string[];
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  // Fungsi helper untuk cek role (hanya satu kali implementasi)
  const hasRequiredRole = (): boolean => {
    if (!requiredRole || !user) return true;
    return Array.isArray(requiredRole)
      ? requiredRole.includes(user.role)
      : user.role === requiredRole;
  };

  useEffect(() => {
    // Jika masih loading, tunggu dulu
    if (loading) return;

    // Jika tidak terautentikasi, redirect ke halaman login
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Jika ada requirement role, cek apakah user memiliki role yang sesuai
    if (!hasRequiredRole()) {
      // Jika tidak memiliki role yang sesuai, redirect ke halaman utama atau 403
      router.push('/unauthorized');
      return;
    }
  }, [isAuthenticated, loading, user, requiredRole, router]);

  // Tampilkan loading state saat mengecek autentikasi
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Jika tidak terautentikasi atau tidak punya role, tampilkan null sementara (sambil redirect)
  if (!isAuthenticated || !hasRequiredRole()) {
    return null;
  }

  // Jika semua cek lulus, tampilkan children
  return <>{children}</>;
}
