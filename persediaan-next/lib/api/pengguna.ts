'use client';

import { api } from '../api';

// Interface untuk data Pengguna
export interface Pengguna {
  id_pengguna: number;
  id_pengguna_encrypted: string;
  nama_lengkap: string;
  email: string;
  username: string;
  id_role: number;
  nama_role: string;
  id_bagian?: number;
  nama_bagian?: string;
  status: 'aktif' | 'nonaktif';
  avatar?: string;
  created_at: string;
  updated_at?: string;
  last_login?: string;
}

// Interface untuk data Role
export interface Role {
  id_role: number;
  nama_role: string;
  deskripsi?: string;
  permissions: string[];
}

// Interface untuk data Bagian/Departemen
export interface Bagian {
  id_bagian: number;
  nama_bagian: string;
  deskripsi?: string;
}

// Interface untuk membuat pengguna baru
export interface CreatePenggunaValues {
  nama_lengkap: string;
  email: string;
  username: string;
  password: string;
  id_role: number;
  id_bagian?: number;
  status: 'aktif' | 'nonaktif';
}

// Interface untuk mengupdate pengguna
export interface UpdatePenggunaValues {
  nama_lengkap?: string;
  email?: string;
  username?: string;
  password?: string;
  id_role?: number;
  id_bagian?: number;
  status?: 'aktif' | 'nonaktif';
}

// Interface untuk response API
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// API client untuk modul pengguna
export const penggunaApi = {
  /**
   * Mengambil daftar semua pengguna
   */
  getAll: async (): Promise<Pengguna[]> => {
    const response = await api.post<ApiResponse<Pengguna[]>>('/pengguna/api/getAll');
    return response.data;
  },

  /**
   * Mengambil detail pengguna berdasarkan ID
   */
  getById: async (id: string): Promise<Pengguna> => {
    const response = await api.post<ApiResponse<Pengguna>>(`/pengguna/api/getById/${id}`);
    return response.data;
  },

  /**
   * Membuat pengguna baru
   */
  create: async (data: CreatePenggunaValues): Promise<Pengguna> => {
    const response = await api.post<ApiResponse<Pengguna>>('/pengguna/api/create', data);
    return response.data;
  },

  /**
   * Mengupdate data pengguna
   */
  update: async (id: string, data: UpdatePenggunaValues): Promise<Pengguna> => {
    const response = await api.post<ApiResponse<Pengguna>>(`/pengguna/api/update/${id}`, data);
    return response.data;
  },

  /**
   * Menghapus pengguna
   */
  delete: async (id: string): Promise<void> => {
    await api.post<ApiResponse<void>>(`/pengguna/api/delete/${id}`);
  },

  /**
   * Mengambil daftar semua role (untuk dropdown)
   */
  getRoles: async (): Promise<Role[]> => {
    const response = await api.post<ApiResponse<Role[]>>('/pengguna/api/getRoles');
    return response.data;
  },

  /**
   * Mengambil daftar semua bagian/departemen (untuk dropdown)
   */
  getBagian: async (): Promise<Bagian[]> => {
    const response = await api.post<ApiResponse<Bagian[]>>('/pengguna/api/getBagian');
    return response.data;
  },
};

// Helper function untuk mendapatkan variant badge berdasarkan status
export function getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'aktif':
      return 'default'; // Green
    case 'nonaktif':
      return 'secondary'; // Gray
    default:
      return 'secondary';
  }
}

// Helper function untuk mendapatkan label status
export function getStatusLabel(status: string): string {
  switch (status) {
    case 'aktif':
      return 'Aktif';
    case 'nonaktif':
      return 'Nonaktif';
    default:
      return status;
  }
}
