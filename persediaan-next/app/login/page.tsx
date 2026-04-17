'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';

// Import komponen shadcn/ui
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Import icon dari lucide-react
import { Loader2, LogIn, Mail, Lock } from 'lucide-react';

// Schema validasi Zod
const loginSchema = z.object({
  email: z.string().email('Format email tidak valid').min(1, 'Email wajib diisi'),
  password: z.string().min(6, 'Password minimal 6 karakter').max(100, 'Password terlalu panjang'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, loading: authLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Inisialisasi form dengan zodResolver
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onBlur',
  });

  // Auto-focus ke input email saat halaman dimuat
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      // Tunggu sebentar agar DOM benar-benar terinisialisasi
      const timer = setTimeout(() => {
        const emailInput = document.querySelector('input[name="email"]') as HTMLInputElement;
        if (emailInput) {
          emailInput.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [authLoading, isAuthenticated]);

  // Redirect ke dashboard jika sudah terautentikasi (hindari race condition double redirect)
  const hasRedirected = useRef(false);
  useEffect(() => {
    if (isAuthenticated && !authLoading && !hasRedirected.current) {
      hasRedirected.current = true;
      router.push('/dashboard');
    }
  }, [isAuthenticated, authLoading, router]);

  // Handler submit form
  const onSubmit = async (data: LoginFormValues) => {
    setError(null);
    setSuccess(false);
    setIsLoggingIn(true);

    try {
      const loginResult = await login(data.email, data.password);

      if (loginResult.success) {
        setSuccess(true);
        // Redirect setelah login berhasil
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      } else {
        setError(loginResult.error || 'Login gagal, silakan coba lagi');
      }
    } catch (err) {
      setError('Terjadi kesalahan sistem, silakan coba lagi nanti');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Jika sedang memeriksa auth, tampilkan loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
          <p className="text-white text-sm">Memuat...</p>
        </div>
      </div>
    );
  }

  // Jika sudah login, jangan render apa-apa (useEffect akan redirect)
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Animasi fade-in */}
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
          <Card className="border-slate-700/50 bg-slate-800/80 backdrop-blur-xl shadow-2xl">
            <CardHeader className="space-y-1 text-center pb-8">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/25">
                <LogIn className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-white">Selamat Datang Kembali</CardTitle>
              <CardDescription className="text-slate-400">
                Masukkan email dan password Anda untuk mengakses sistem
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  {/* Alert error */}
                  {error && (
                    <div className="animate-in shake">
                      <Alert role="alert" variant="destructive" className="bg-red-500/10 border-red-500/50 text-red-400">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    </div>
                  )}

                  {/* Alert success */}
                  {success && (
                    <div className="animate-in fade-in">
                      <Alert role="alert" className="bg-green-500/10 border-green-500/50 text-green-400">
                        <AlertDescription>Login berhasil! Mengalihkan ke dashboard...</AlertDescription>
                      </Alert>
                    </div>
                  )}

                  {/* Field Email */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-200">Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <Input
                              {...field}
                              id="email"
                              name="email"
                              type="email"
                              placeholder="nama@perusahaan.com"
                              className="pl-10 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20 transition-all"
                              disabled={isLoggingIn || success}
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  {/* Field Password */}
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-200">Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <Input
                              {...field}
                              id="password"
                              name="password"
                              type="password"
                              placeholder="Masukkan password"
                              className="pl-10 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20 transition-all"
                              disabled={isLoggingIn || success}
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                {/* Tombol Login */}
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold py-2.5 transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 disabled:opacity-70 disabled:cursor-not-allowed"
                  disabled={isLoggingIn || success}
                >
                  {isLoggingIn ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Memproses...
                    </>
                  ) : success ? (
                    'Login Berhasil!'
                  ) : (
                    'Masuk'
                  )}
                </Button>
                </form>
              </Form>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 pt-2">
              <div className="text-center text-sm text-slate-500">
                <p>Sistem Persediaan &copy; {new Date().getFullYear()}</p>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
