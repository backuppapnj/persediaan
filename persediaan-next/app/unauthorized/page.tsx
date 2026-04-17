'use client';

import { ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

/**
 * Halaman Unauthorized
 * Ditampilkan ketika user mencoba mengakses halaman/resource yang tidak memiliki izin
 */
export default function UnauthorizedPage() {
  return (
    <DashboardLayout>
      <div className="flex items-center justify-center min-h-[80vh]">
        <Card className="w-full max-w-md border-destructive/50 shadow-lg">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
              <ShieldX className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Akses Ditolak</CardTitle>
            <CardDescription>
              Anda tidak memiliki izin untuk mengakses halaman ini.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Jika Anda merasa ini adalah kesalahan, silakan hubungi administrator sistem.
            </p>
            <Button
              onClick={() => window.history.back()}
              className="w-full"
              variant="default"
            >
              Kembali ke Halaman Sebelumnya
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
