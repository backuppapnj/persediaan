'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  penggunaApi,
  Pengguna,
  CreatePenggunaValues,
  UpdatePenggunaValues,
} from '@/lib/api/pengguna';

/**
 * Hook untuk mengambil daftar semua pengguna
 */
export function usePenggunaList() {
  return useQuery<Pengguna[]>({
    queryKey: ['pengguna', 'list'],
    queryFn: () => penggunaApi.getAll(),
    staleTime: 5 * 60 * 1000, // Data dianggap segar selama 5 menit
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook untuk mengambil detail pengguna berdasarkan ID
 */
export function usePenggunaDetail(id: string) {
  return useQuery<Pengguna>({
    queryKey: ['pengguna', 'detail', id],
    queryFn: () => penggunaApi.getById(id),
    staleTime: 5 * 60 * 1000,
    enabled: !!id, // Hanya jalankan query jika ID tersedia
  });
}

/**
 * Hook untuk membuat pengguna baru
 */
export function useCreatePengguna() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePenggunaValues) => penggunaApi.create(data),
    onSuccess: () => {
      toast.success('Pengguna berhasil ditambahkan!');
      // Invalidate query untuk memuat ulang data terbaru
      queryClient.invalidateQueries({ queryKey: ['pengguna', 'list'] });
    },
    onError: () => {
      toast.error('Gagal menambahkan pengguna. Silakan coba lagi.');
    },
  });
}

/**
 * Hook untuk mengupdate data pengguna
 */
export function useUpdatePengguna() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePenggunaValues }) =>
      penggunaApi.update(id, data),
    onSuccess: (_, variables) => {
      toast.success('Data pengguna berhasil diperbarui!');
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['pengguna', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['pengguna', 'detail', variables.id] });
    },
    onError: () => {
      toast.error('Gagal memperbarui data pengguna. Silakan coba lagi.');
    },
  });
}

/**
 * Hook untuk menghapus pengguna
 */
export function useDeletePengguna() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => penggunaApi.delete(id),
    onSuccess: () => {
      toast.success('Pengguna berhasil dihapus!');
      // Invalidate query untuk memuat ulang data terbaru
      queryClient.invalidateQueries({ queryKey: ['pengguna', 'list'] });
    },
    onError: () => {
      toast.error('Gagal menghapus pengguna. Silakan coba lagi.');
    },
  });
}

/**
 * Hook untuk mengambil daftar role (untuk dropdown)
 */
export function useRoles() {
  return useQuery({
    queryKey: ['roles', 'list'],
    queryFn: () => penggunaApi.getRoles(),
    staleTime: 10 * 60 * 1000, // Data dianggap segar selama 10 menit
  });
}

/**
 * Hook untuk mengambil daftar bagian/departemen (untuk dropdown)
 */
export function useBagian() {
  return useQuery({
    queryKey: ['bagian', 'list'],
    queryFn: () => penggunaApi.getBagian(),
    staleTime: 10 * 60 * 1000, // Data dianggap segar selama 10 menit
  });
}
