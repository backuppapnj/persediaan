import { api } from '../api';

/**
 * Interface untuk status history permintaan
 */
export interface StatusHistory {
  id: string;
  status: string;
  catatan?: string;
  createdAt: string;
  createdBy: string;
  createdByName?: string;
}

/**
 * Interface untuk data Barang
 */
export interface Barang {
  id: string;
  nama: string;
  kode: string;
  satuan: string;
  stok: number;
}

/**
 * Interface untuk detail permintaan barang
 */
export interface PermintaanDetail {
  id: string;
  barangId: string;
  barang: Barang;
  jumlah: number;
  jumlahDikeluarkan: number;
  keterangan?: string;
}

/**
 * Interface untuk data permintaan barang
 */
export interface Permintaan {
  id: string;
  nomor: string;
  tanggal: string;
  departemen: string;
  keperluan: string;
  keterangan?: string;
  status: 'draft' | 'menunggu_persetujuan' | 'disetujui' | 'dikeluarkan' | 'ditolak';
  details: PermintaanDetail[];
  statusHistory: StatusHistory[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  createdByName: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  dikeluarkanBy?: string;
  dikeluarkanByName?: string;
  dikeluarkanAt?: string;
}

/**
 * Interface untuk response paginated
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Interface untuk form values tambah permintaan
 */
export interface CreatePermintaanValues {
  tanggal: string;
  departemen: string;
  keperluan: string;
  keterangan?: string;
  details: Array<{
    barangId: string;
    jumlah: number;
    keterangan?: string;
  }>;
}

/**
 * Interface untuk approval values
 */
export interface ApprovalValues {
  catatan?: string;
}

/**
 * Interface untuk response API pembelian
 */
interface ApiResponse<T> {
  success?: boolean;
  data: T;
  message?: string;
}

/**
 * API client untuk modul permintaan
 */
export const permintaanApi = {
  /**
   * Mengambil daftar permintaan barang
   */
  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    userId?: string;
  }): Promise<PaginatedResponse<Permintaan>> => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.search) queryParams.append('search', params.search);
      if (params?.startDate) queryParams.append('startDate', params.startDate);
      if (params?.endDate) queryParams.append('endDate', params.endDate);
      if (params?.status) queryParams.append('status', params.status);
      if (params?.userId) queryParams.append('userId', params.userId);

      const response = await api.get<ApiResponse<PaginatedResponse<Permintaan>>>(
        `/permintaan?${queryParams.toString()}`
      );

      // Validasi struktur response
      if (!response.data || typeof response.data !== 'object') {
        throw new Error('Struktur respons tidak valid');
      }

      return response.data;
    } catch (error) {
      console.error('Gagal mengambil daftar permintaan:', error);
      throw error;
    }
  },

  /**
   * Mengambil detail permintaan berdasarkan ID
   */
  getDetail: async (id: string): Promise<Permintaan> => {
    try {
      const response = await api.post<ApiResponse<Permintaan>>('/permintaan/api/getDetail', { id });

      // Validasi struktur response
      if (!response.data || typeof response.data !== 'object') {
        throw new Error('Struktur respons tidak valid');
      }

      return response.data;
    } catch (error) {
      console.error('Gagal mengambil detail permintaan:', error);
      throw error;
    }
  },

  /**
   * Membuat permintaan barang baru
   */
  create: async (values: CreatePermintaanValues): Promise<Permintaan> => {
    try {
      const response = await api.post<ApiResponse<Permintaan>>('/permintaan', values);

      // Validasi struktur response
      if (!response.data || typeof response.data !== 'object') {
        throw new Error('Struktur respons tidak valid');
      }

      return response.data;
    } catch (error) {
      console.error('Gagal membuat permintaan baru:', error);
      throw error;
    }
  },

  /**
   * Menyetujui permintaan
   */
  approve: async (id: string, values: ApprovalValues): Promise<Permintaan> => {
    try {
      const response = await api.post<ApiResponse<Permintaan>>(`/permintaan/${id}/approve`, values);

      // Validasi struktur response
      if (!response.data || typeof response.data !== 'object') {
        throw new Error('Struktur respons tidak valid');
      }

      return response.data;
    } catch (error) {
      console.error('Gagal menyetujui permintaan:', error);
      throw error;
    }
  },

  /**
   * Menolak permintaan
   */
  reject: async (id: string, values: ApprovalValues): Promise<Permintaan> => {
    try {
      const response = await api.post<ApiResponse<Permintaan>>(`/permintaan/${id}/reject`, values);

      // Validasi struktur response
      if (!response.data || typeof response.data !== 'object') {
        throw new Error('Struktur respons tidak valid');
      }

      return response.data;
    } catch (error) {
      console.error('Gagal menolak permintaan:', error);
      throw error;
    }
  },

  /**
   * Mengeluarkan barang permintaan
   */
  issue: async (id: string, values: ApprovalValues): Promise<Permintaan> => {
    try {
      const response = await api.post<ApiResponse<Permintaan>>(`/permintaan/${id}/issue`, values);

      // Validasi struktur response
      if (!response.data || typeof response.data !== 'object') {
        throw new Error('Struktur respons tidak valid');
      }

      return response.data;
    } catch (error) {
      console.error('Gagal mengeluarkan barang permintaan:', error);
      throw error;
    }
  },

  /**
   * Submit permintaan untuk persetujuan (draft -> menunggu_persetujuan)
   */
  submitForApproval: async (id: string): Promise<Permintaan> => {
    try {
      const response = await api.post<ApiResponse<Permintaan>>(`/permintaan/${id}/submit`);

      // Validasi struktur response
      if (!response.data || typeof response.data !== 'object') {
        throw new Error('Struktur respons tidak valid');
      }

      return response.data;
    } catch (error) {
      console.error('Gagal submit permintaan untuk persetujuan:', error);
      throw error;
    }
  },

  /**
   * Mengambil daftar barang (untuk dropdown)
   */
  getBarangs: async (): Promise<Barang[]> => {
    try {
      const response = await api.get<ApiResponse<Barang[]>>('/barang?limit=1000');

      // Validasi struktur response
      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Struktur respons tidak valid: array yang diharapkan');
      }

      return response.data;
    } catch (error) {
      console.error('Gagal mengambil daftar barang:', error);
      throw error;
    }
  },

  /**
   * Mengambil daftar user (untuk dropdown)
   */
  getUsers: async (): Promise<Array<{ id: string; name: string; email: string; avatar?: string }>> => {
    try {
      const response = await api.get<ApiResponse<Array<{ id: string; name: string; email: string; avatar?: string }>>>(
        '/users?limit=1000'
      );

      // Validasi struktur response
      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Struktur respons tidak valid: array yang diharapkan');
      }

      return response.data;
    } catch (error) {
      console.error('Gagal mengambil daftar user:', error);
      throw error;
    }
  },
};

/**
 * Helper function untuk mendapatkan variant badge berdasarkan status
 */
export function getStatusVariant(status: string): 'success' | 'warning' | 'secondary' | 'destructive' {
  switch (status) {
    case 'dikeluarkan':
      return 'success';
    case 'disetujui':
      return 'success';
    case 'draft':
      return 'warning';
    case 'menunggu_persetujuan':
      return 'secondary';
    case 'ditolak':
      return 'destructive';
    default:
      return 'secondary';
  }
}

/**
 * Helper function untuk mendapatkan label status
 */
export function getStatusLabel(status: string): string {
  switch (status) {
    case 'dikeluarkan':
      return 'Dikeluarkan';
    case 'disetujui':
      return 'Disetujui';
    case 'draft':
      return 'Draft';
    case 'menunggu_persetujuan':
      return 'Menunggu Persetujuan';
    case 'ditolak':
      return 'Ditolak';
    default:
      return status;
  }
}
