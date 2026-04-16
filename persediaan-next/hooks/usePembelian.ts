'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pembelianApi, PurchaseRequest } from '@/lib/api/pembelian';

/**
 * Hook untuk mengambil daftar permintaan pembelian
 */
export function usePurchaseRequests() {
  return useQuery<PurchaseRequest[]>({
    queryKey: ['pembelian', 'requests'],
    queryFn: pembelianApi.getPurchaseRequests,
    staleTime: 5 * 60 * 1000, // Data dianggap segar selama 5 menit
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook untuk menandai permintaan sebagai sudah dibeli
 */
export function useMarkAsPurchased() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: pembelianApi.markAsPurchased,
    onSuccess: () => {
      // Invalidate query untuk memuat ulang data terbaru
      queryClient.invalidateQueries({ queryKey: ['pembelian', 'requests'] });
    },
  });
}
