'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  permintaanApi,
  Permintaan,
  PaginatedResponse,
  CreatePermintaanValues,
  ApprovalValues,
  Barang,
  PaginatedResponse as PaginatedResponseT,
} from '@/lib/api/permintaan';

/**
 * Hook untuk mengambil daftar permintaan dengan filter dan pagination
 */
export function usePermintaanList(params?: {
  page?: number;
  limit?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  userId?: string;
}) {
  return useQuery<PaginatedResponse<Permintaan>>({
    queryKey: ['permintaan', 'list', params],
    queryFn: () => permintaanApi.getAll(params),
    staleTime: 5 * 60 * 1000, // Data dianggap segar selama 5 menit
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook untuk mengambil detail permintaan berdasarkan ID
 */
export function usePermintaanDetail(id: string) {
  return useQuery<Permintaan>({
    queryKey: ['permintaan', 'detail', id],
    queryFn: () => permintaanApi.getDetail(id),
    staleTime: 5 * 60 * 1000,
    enabled: !!id, // Hanya jalankan query jika ID tersedia
  });
}

/**
 * Hook untuk membuat permintaan baru
 */
export function useCreatePermintaan(params?: {
  page?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  userId?: string;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: permintaanApi.create,
    onSuccess: () => {
      toast.success('Permintaan barang berhasil ditambahkan!');
      // Invalidate query untuk memuat ulang data terbaru
      queryClient.invalidateQueries({ queryKey: ['permintaan', 'list'] });
    },
    onError: () => {
      toast.error('Gagal menambahkan permintaan. Silakan coba lagi.');
    },
  });
}

/**
 * Hook untuk menyetujui permintaan
 */
export function useApprovePermintaan(params?: {
  page?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  userId?: string;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: ApprovalValues }) =>
      permintaanApi.approve(id, values),
    onSuccess: () => {
      toast.success('Permintaan barang berhasil disetujui!');
      queryClient.invalidateQueries({ queryKey: ['permintaan', 'list'] });
    },
    onError: () => {
      toast.error('Gagal menyetujui permintaan. Silakan coba lagi.');
    },
  });
}

/**
 * Hook untuk menolak permintaan
 */
export function useRejectPermintaan(params?: {
  page?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  userId?: string;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: ApprovalValues }) =>
      permintaanApi.reject(id, values),
    onSuccess: () => {
      toast.success('Permintaan barang telah ditolak.');
      queryClient.invalidateQueries({ queryKey: ['permintaan', 'list'] });
    },
    onError: () => {
      toast.error('Gagal menolak permintaan. Silakan coba lagi.');
    },
  });
}

/**
 * Hook untuk mengeluarkan barang permintaan
 */
export function useIssuePermintaan(params?: {
  page?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  userId?: string;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: ApprovalValues }) =>
      permintaanApi.issue(id, values),
    onSuccess: () => {
      toast.success('Barang permintaan berhasil dikeluarkan!');
      queryClient.invalidateQueries({ queryKey: ['permintaan', 'list'] });
    },
    onError: () => {
      toast.error('Gagal mengeluarkan barang. Silakan coba lagi.');
    },
  });
}

/**
 * Hook untuk submit permintaan untuk persetujuan
 */
export function useSubmitForApproval(params?: {
  page?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  userId?: string;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => permintaanApi.submitForApproval(id),
    onSuccess: () => {
      toast.success('Permintaan barang telah dikirim untuk persetujuan!');
      queryClient.invalidateQueries({ queryKey: ['permintaan', 'list'] });
    },
    onError: () => {
      toast.error('Gagal mengirim permintaan. Silakan coba lagi.');
    },
  });
}

/**
 * Hook untuk mengambil daftar barang (untuk dropdown)
 */
export function useBarangs() {
  return useQuery<Barang[]>({
    queryKey: ['barangs-list'],
    queryFn: permintaanApi.getBarangs,
    staleTime: 10 * 60 * 1000, // Data dianggap segar selama 10 menit
  });
}

/**
 * Hook untuk mengambil daftar user (untuk dropdown)
 */
export function useUsers() {
  return useQuery<Array<{ id: string; name: string; email: string; avatar?: string }>>({
    queryKey: ['users-list'],
    query: permintaanApi.getUsers,
    staleTime: 10 * 60 * 1000, // Data dianggap segar selama 10 menit
  });
}
