'use client';

import { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { usePurchaseRequests, useMarkAsPurchased } from '@/hooks/usePembelian';
import { PembelianTable } from '@/components/pembelian/PembelianTable';
import { PurchaseRequest } from '@/lib/api/pembelian';
import { toast } from 'sonner';

/**
 * Halaman Proses Pembelian
 * Menampilkan daftar permintaan pembelian yang perlu diproses
 * dengan tombol untuk menandai sebagai sudah dibeli
 */
export default function ProsesPembelianPage() {
  const { data, isPending, error, refetch } = usePurchaseRequests();
  const markAsPurchasedMutation = useMarkAsPurchased();
  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null);

  // Handler untuk menandai sebagai sudah dibeli
  const handleMarkAsPurchased = () => {
    if (selectedRequest) {
      markAsPurchasedMutation.mutate(selectedRequest.id_permintaan_encrypted, {
        onSuccess: () => {
          toast.success('Permintaan berhasil ditandai sebagai sudah dibeli!');
          setSelectedRequest(null);
        },
        onError: (error) => {
          toast.error(error.message || 'Gagal menandai sebagai sudah dibeli.');
        },
      });
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex-1 space-y-6 p-8 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Proses Pembelian</h2>
            <p className="text-muted-foreground">
              Kelola permintaan pembelian dan tandai sebagai sudah dibeli.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-full">
              <ShoppingCart className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>

        {/* Tabel Pembelian */}
        <PembelianTable
          data={data || []}
          isLoading={isPending}
          error={error as Error | null}
          onRefetch={refetch}
          onMarkAsPurchased={(id) => {
            const request = data?.find(r => r.id_permintaan_encrypted === id);
            if (request) {
              setSelectedRequest(request);
            }
          }}
          isMarkingAsPurchased={markAsPurchasedMutation.isPending}
          selectedRequest={selectedRequest}
          onConfirmMarkAsPurchased={handleMarkAsPurchased}
          onCancelMarkAsPurchased={() => setSelectedRequest(null)}
          onSelectRequest={setSelectedRequest}
        />
      </div>
    </ProtectedRoute>
  );
}
