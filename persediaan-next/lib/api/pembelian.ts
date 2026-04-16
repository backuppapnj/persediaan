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
    const response = await api.post<ApiResponse<PurchaseRequest[]>>('/pembelian/api/getPurchaseRequests');
    return response.data;
  },

  /**
   * Menandai permintaan pembelian sebagai sudah dibeli
   */
  markAsPurchased: async (id: string): Promise<ApiResponse<null>> => {
    return await api.post<ApiResponse<null>>('/pembelian/api/markAsPurchased', { id });
  },
};
