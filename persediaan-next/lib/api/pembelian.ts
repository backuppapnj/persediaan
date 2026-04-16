import { api } from '../api';

// Interface untuk response API purchase requests
export interface PurchaseRequest {
  id_permintaan: number;
  id_permintaan_encrypted: string;
  nama_pemohon: string;
  jumlah_item: number;
  nama_items: string;
  status_permintaan: string;
  tanggal_permintaan: string;
}

// Interface untuk response API
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// API client untuk modul pembelian
export const pembelianApi = {
  /**
   * Mengambil daftar permintaan pembelian yang perlu diproses
   */
  getPurchaseRequests: async (): Promise<PurchaseRequest[]> => {
    try {
      const response = await api.post<ApiResponse<PurchaseRequest[]>>('/pembelian/api/getPurchaseRequests');
      // Validasi struktur response
      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Struktur respons tidak valid: array yang diharapkan');
      }
      return response.data;
    } catch (error) {
      console.error('Gagal mengambil permintaan pembelian:', error);
      throw error;
    }
  },

  /**
   * Menandai permintaan pembelian sebagai sudah dibeli
   */
  markAsPurchased: async (id: string): Promise<ApiResponse<null>> => {
    try {
      const response = await api.post<ApiResponse<null>>('/pembelian/api/markAsPurchased', { id });
      // Validasi struktur response
      if (!response.data || typeof response.data !== 'object') {
        throw new Error('Struktur respons tidak valid');
      }
      return response.data;
    } catch (error) {
      console.error('Gagal menandai sebagai sudah dibeli:', error);
      throw error;
    }
  },
};
