'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import api from '@/lib/api';

// Tipe data untuk user
interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

// Tipe data untuk auth context
interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

// Buat context dengan nilai default null
const AuthContext = createContext<AuthContextType | null>(null);

// Provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Fungsi untuk cek apakah token masih valid saat aplikasi dimuat
  const checkAuth = useCallback(async () => {
    // Pengecekan window sebelum mengakses localStorage
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      // Cek validitas token dengan memanggil API /auth/me
      const response = await api.get<{ user: User }>('/auth/me');
      setUser(response.user);
    } catch (error) {
      // Jika token invalid atau expired, hapus dari localStorage
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Jalankan checkAuth saat component pertama kali dimuat
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Fungsi login
  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);

    try {
      const response = await api.post<{ token: string; user: User }>('/auth/process_login', {
        email,
        password
      });

      // Simpan token di localStorage hanya jika window tersedia
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', response.token);
      }
      setUser(response.user);

      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Login gagal';
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Fungsi logout
  const logout = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    setUser(null);
  }, []);

  // Memoize context value untuk menghindari re-render yang tidak perlu
  const value = useMemo(() => ({
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    checkAuth
  }), [user, loading, login, logout, checkAuth]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook untuk mengakses auth context
export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
