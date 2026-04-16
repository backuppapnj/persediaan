// hooks/useBarang.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface Barang {
  id_barang: string;
  kode_barang: string;
  nama_barang: string;
  jenis_barang: string;
  id_kategori: number;
  id_satuan: number;
  stok_umum: number;
  stok_perkara: number;
  stok_total: number;
  nama_kategori: string;
  nama_satuan: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateBarangPayload {
  kode_barang: string;
  nama_barang: string;
  jenis_barang: string;
  id_kategori: number;
  id_satuan: number;
}

export interface UpdateBarangPayload extends Partial<CreateBarangPayload> {}

export function useBarang() {
  return useQuery<Barang[]>({
    queryKey: ['barang'],
    queryFn: async () => {
      const response = await api.get<{ data: Barang[] }>('/barang/index');
      return response.data;
    },
  });
}

export function useBarangById(id: string) {
  return useQuery<Barang>({
    queryKey: ['barang', id],
    queryFn: async () => {
      const response = await api.get<{ data: Barang }>(`/barang/show?id=${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useKategori() {
  return useQuery({
    queryKey: ['barang', 'kategori'],
    queryFn: async () => {
      const response = await api.get<{ data: { id_kategori: number; nama_kategori: string }[] }>('/barang/kategori');
      return response.data;
    },
  });
}

export function useSatuan() {
  return useQuery({
    queryKey: ['barang', 'satuan'],
    queryFn: async () => {
      const response = await api.get<{ data: { id_satuan: number; nama_satuan: string }[] }>('/barang/satuan');
      return response.data;
    },
  });
}

export function useCreateBarang() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateBarangPayload) => {
      const response = await api.post<{ success: boolean; message: string }>('/barang/store', data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['barang'] });
    },
  });
}

export function useUpdateBarang() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateBarangPayload }) => {
      const response = await api.post<{ success: boolean; message: string }>(`/barang/update?id=${id}`, data);
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['barang'] });
      queryClient.invalidateQueries({ queryKey: ['barang', variables.id] });
    },
  });
}

export function useDeleteBarang() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post<{ success: boolean; message: string }>(`/barang/destroy?id=${id}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['barang'] });
    },
  });
}
