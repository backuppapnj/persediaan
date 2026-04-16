import { QueryClient } from '@tanstack/react-query';

// Fungsi untuk membuat instance QueryClient dengan konfigurasi default yang optimal
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Konfigurasi caching dan stale time yang baik untuk aplikasi umum
        staleTime: 5 * 60 * 1000, // 5 menit - data dianggap segar selama 5 menit
        gcTime: 15 * 60 * 1000, // 15 menit - data yang tidak digunakan dibersihkan setelah 15 menit
        refetchOnWindowFocus: false, // Tidak refetch otomatis ketika window fokus (bisa diaktifkan jika perlu)
        refetchOnReconnect: true, // Refetch otomatis ketika koneksi internet kembali
        retry: (failureCount, error: unknown) => {
          // Type guard untuk mengecek apakah error memiliki property statusCode
          function isApiError(err: unknown): err is Error & { statusCode: number } {
            return err instanceof Error && 'statusCode' in err && typeof (err as { statusCode: unknown }).statusCode === 'number';
          }

          // Jangan retry untuk error 4xx (client error) kecuali 429 (too many requests)
          if (isApiError(error)) {
            if (error.statusCode >= 400 && error.statusCode < 500 && error.statusCode !== 429) {
              return false;
            }
          }
          // Maksimal 3 kali retry untuk error lainnya
          return failureCount < 3;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
      },
      mutations: {
        // Konfigurasi default untuk mutation
        retry: false, // Tidak retry mutation secara default
      },
    },
  });
}

// Instance singleton untuk digunakan di client side (hanya di browser)
let queryClientSingleton: QueryClient | null = null;

export function getQueryClient() {
  // Untuk SSR/SSG di Next.js, selalu buat instance baru setiap request
  if (typeof window === 'undefined') {
    return createQueryClient();
  }

  // Di browser, gunakan singleton untuk mempertahankan cache
  if (!queryClientSingleton) {
    queryClientSingleton = createQueryClient();
  }

  return queryClientSingleton;
}

export default getQueryClient;