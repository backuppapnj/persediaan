import { useAuthContext } from '@/providers/AuthProvider';

// Custom hook untuk mengakses auth context dengan nama yang lebih singkat
export function useAuth() {
  return useAuthContext();
}
