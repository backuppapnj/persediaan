'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4 p-6">
        <h2 className="text-2xl font-bold">Terjadi Kesalahan</h2>
        <p className="text-muted-foreground">
          Maaf, terjadi kesalahan yang tidak terduga.
        </p>
        <Button onClick={reset}>Coba Lagi</Button>
      </div>
    </div>
  );
}
