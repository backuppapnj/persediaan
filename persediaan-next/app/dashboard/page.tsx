'use client';

import { useQuery } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { Package, Warehouse, Truck, Clock, TrendingUp, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

// Fungsi helper dipindahkan ke luar komponen untuk menghindari re-render
// Fungsi untuk mendapatkan variant badge berdasarkan status
export function getStatusVariant(status: string) {
  switch (status) {
    case 'pending':
      return 'warning';
    case 'disetujui':
      return 'success';
    case 'ditolak':
      return 'destructive';
    default:
      return 'default';
  }
}

// Fungsi untuk mendapatkan label status dalam Bahasa Indonesia
export function getStatusLabel(status: string) {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'disetujui':
      return 'Disetujui';
    case 'ditolak':
      return 'Ditolak';
    default:
      return status;
  }
}

// Fungsi untuk mendapatkan label jenis transaksi
export function getJenisLabel(jenis: string) {
  switch (jenis) {
    case 'masuk':
      return 'Barang Masuk';
    case 'keluar':
      return 'Barang Keluar';
    case 'permintaan':
      return 'Permintaan';
    default:
      return jenis;
  }
}

// Interface untuk tipe data statistik
interface DashboardStats {
  totalBarang: number;
  totalStok: number;
  barangMasukBulanIni: number;
  permintaanPending: number;
  trendTotalBarang?: number;
  trendTotalStok?: number;
  trendBarangMasuk?: number;
}

// Interface untuk data grafik stok 7 hari terakhir
interface StockTrendData {
  date: string;
  stok: number;
  stokMasuk: number;
  stokKeluar: number;
}

// Interface untuk data transaksi terakhir
interface RecentTransaction {
  id: string;
  jenis: 'masuk' | 'keluar' | 'permintaan';
  barang: string;
  jumlah: number;
  tanggal: string;
  status: 'pending' | 'disetujui' | 'ditolak';
}

// Interface untuk response API dashboard
interface DashboardResponse {
  stats: DashboardStats;
  stockTrend: StockTrendData[];
  recentTransactions: RecentTransaction[];
}

// Komponen Skeleton Loader untuk loading state
function StatCardSkeleton() {
  return (
    <div className="animate-pulse">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="h-4 w-24 bg-gray-200 rounded"></div>
          <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
        </CardHeader>
        <CardContent>
          <div className="h-8 w-16 bg-gray-200 rounded mb-2"></div>
          <div className="h-3 w-32 bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <Card className="col-span-4">
      <CardHeader>
        <div className="h-5 w-40 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 w-64 bg-gray-200 rounded"></div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] bg-gray-100 rounded animate-pulse"></div>
      </CardContent>
    </Card>
  );
}

function TableSkeleton() {
  return (
    <Card className="col-span-4">
      <CardHeader>
        <div className="h-5 w-48 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 w-56 bg-gray-200 rounded"></div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded animate-pulse"></div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Komponen StatCard untuk menampilkan statistik dengan animasi counter
function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  description: string;
  trend?: number;
}) {
  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="p-2 bg-primary/10 rounded-full">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-1">
          {value.toLocaleString('id-ID')}
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend !== undefined && (
          <div className="flex items-center mt-2 text-xs text-green-600">
            <TrendingUp className="h-3 w-3 mr-1" />
            <span>{trend}% dari bulan lalu</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Fungsi untuk mengambil data dashboard dari API
async function fetchDashboardData(): Promise<DashboardResponse> {
  const response = await api.get<DashboardResponse>('/dashboard/stats');
  return response;
}

// Komponen utama halaman Dashboard
export default function DashboardPage() {
  const { user } = useAuth();

  // Menggunakan useQuery dari TanStack Query untuk mengambil data
  const { data, isPending, error, refetch } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: fetchDashboardData,
    staleTime: 5 * 60 * 1000, // Data dianggap segar selama 5 menit
    refetchOnWindowFocus: true,
  });

  // Tampilkan error jika terjadi kesalahan
  if (error) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-[80vh]">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-red-600">Terjadi Kesalahan</CardTitle>
              <CardDescription>
                Gagal memuat data dashboard. Silakan coba lagi nanti.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {error instanceof Error ? error.message : 'Kesalahan tidak diketahui'}
              </p>
              <Button onClick={() => refetch()} className="w-full">
                <RotateCcw className="h-4 w-4 mr-2" />
                Coba Lagi
              </Button>
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="flex-1 space-y-6 p-8 pt-6">
        {/* Header Dashboard */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            <p className="text-muted-foreground">
              Selamat datang kembali, {user?.name || 'Pengguna'}! Berikut ringkasan persediaan Anda.
            </p>
          </div>
        </div>

        {/* Grid Statistik Utama */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {isPending ? (
            // Tampilkan skeleton saat loading
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            // Tampilkan data statistik
            <>
              <StatCard
                title="Total Barang"
                value={data?.stats.totalBarang || 0}
                icon={Package}
                description="Jumlah jenis barang yang terdaftar"
                trend={data?.stats.trendTotalBarang}
              />
              <StatCard
                title="Total Stok"
                value={data?.stats.totalStok || 0}
                icon={Warehouse}
                description="Total seluruh unit stok di gudang"
                trend={data?.stats.trendTotalStok}
              />
              <StatCard
                title="Barang Masuk Bulan Ini"
                value={data?.stats.barangMasukBulanIni || 0}
                icon={Truck}
                description="Unit barang masuk bulan ini"
                trend={data?.stats.trendBarangMasuk}
              />
              <StatCard
                title="Permintaan Pending"
                value={data?.stats.permintaanPending || 0}
                icon={Clock}
                description="Permintaan yang menunggu persetujuan"
              />
            </>
          )}
        </div>

        {/* Grafik Trend Stok */}
        {isPending ? (
          <ChartSkeleton />
        ) : (
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Trend Stok 7 Hari Terakhir</CardTitle>
              <CardDescription>
                Pergerakan stok masuk, stok keluar, dan total stok selama seminggu terakhir
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div aria-label="Grafik trend stok 7 hari terakhir yang menampilkan pergerakan stok masuk, stok keluar, dan total stok">
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={data?.stockTrend || []} margin={{ left: 20, right: 20, top: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                      className="text-xs"
                    />
                    <YAxis tickLine={false} axisLine={false} tickMargin={10} className="text-xs" />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="stok"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Total Stok"
                    />
                    <Line
                      type="monotone"
                      dataKey="stokMasuk"
                      stroke="#22c55e"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Stok Masuk"
                    />
                    <Line
                      type="monotone"
                      dataKey="stokKeluar"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Stok Keluar"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabel Transaksi Terakhir */}
        {isPending ? (
          <TableSkeleton />
        ) : (
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Transaksi Terakhir</CardTitle>
              <CardDescription>
                10 transaksi terbaru yang terjadi pada sistem
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table aria-label="Tabel berisi daftar 10 transaksi terbaru yang terjadi pada sistem">
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Transaksi</TableHead>
                    <TableHead>Jenis</TableHead>
                    <TableHead>Nama Barang</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data?.recentTransactions || []).length > 0 ? (
                    (data?.recentTransactions || []).map((transaction) => (
                      <TableRow key={transaction.id} className="transition-colors hover:bg-muted/50">
                        <TableCell className="font-mono text-xs font-medium">
                          {transaction.id}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{getJenisLabel(transaction.jenis)}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{transaction.barang}</TableCell>
                        <TableCell className="text-right">
                          {transaction.jumlah.toLocaleString('id-ID')}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {transaction.tanggal}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(transaction.status)}>
                            {getStatusLabel(transaction.status)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <Package className="h-8 w-8 mb-2 opacity-50" />
                          <p>Belum ada transaksi</p>
                          <p className="text-sm">Transaksi akan muncul di sini setelah terjadi aktivitas</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </ProtectedRoute>
  );
}
