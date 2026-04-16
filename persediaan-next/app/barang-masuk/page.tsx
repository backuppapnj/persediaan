'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { api } from '@/lib/api';
import { useDebounce } from '@/hooks/useDebounce';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type HeaderGroup,
  type Header,
  type Row,
  type Cell,
} from '@tanstack/react-table';
import {
  Package,
  Plus,
  Search,
  Eye,
  Printer,
  X,
  Loader2,
  AlertTriangle,
  Trash2,
  Calendar,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TableSkeleton, FormSkeleton } from '@/components/ui/skeleton';

// Schema untuk detail barang dalam transaksi
const detailBarangSchema = z.object({
  barangId: z.string().min(1, 'Pilih barang'),
  jumlah: z.number().min(1, 'Jumlah minimal 1'),
  harga: z.number().min(0, 'Harga tidak boleh negatif'),
  subtotal: z.number().min(0, 'Subtotal tidak boleh negatif'),
});

// Schema validasi Zod untuk form transaksi barang masuk
const barangMasukSchema = z.object({
  tanggal: z.string().min(1, 'Tanggal tidak boleh kosong'),
  supplier: z.string().min(2, 'Nama supplier minimal 2 karakter'),
  nota: z.string().min(1, 'Nomor nota tidak boleh kosong'),
  keterangan: z.string().optional(),
  details: z.array(detailBarangSchema).min(1, 'Minimal harus ada satu barang'),
});

type BarangMasukFormValues = z.infer<typeof barangMasukSchema>;
type DetailBarangFormValues = z.infer<typeof detailBarangSchema>;

// Interface untuk data Barang (untuk dropdown)
interface Barang {
  id: string;
  nama: string;
  kode: string;
  satuan: string;
  harga: number;
}

// Interface untuk detail transaksi
interface TransaksiDetail {
  id: string;
  barangId: string;
  barang: Barang;
  jumlah: number;
  harga: number;
  subtotal: number;
}

// Interface untuk transaksi barang masuk
interface BarangMasuk {
  id: string;
  nomor: string;
  tanggal: string;
  supplier: string;
  nota: string;
  keterangan?: string;
  status: 'draft' | 'selesai' | 'batal';
  total: number;
  details: TransaksiDetail[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// Interface untuk response API
interface BarangMasukResponse {
  data: BarangMasuk[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Interface untuk response list barang
interface BarangListResponse {
  data: Barang[];
}

// Fungsi untuk mendapatkan variant badge berdasarkan status
function getStatusVariant(status: string) {
  switch (status) {
    case 'selesai':
      return 'success';
    case 'draft':
      return 'warning';
    case 'batal':
      return 'destructive';
    default:
      return 'secondary';
  }
}

// Fungsi untuk mendapatkan label status
function getStatusLabel(status: string) {
  switch (status) {
    case 'selesai':
      return 'Selesai';
    case 'draft':
      return 'Draft';
    case 'batal':
      return 'Batal';
    default:
      return status;
  }
}

// Komponen untuk menambah detail barang dalam form
function DetailBarangItem({
  index,
  barangList,
  detail,
  onUpdate,
  onRemove,
  disabled,
}: {
  index: number;
  barangList: Barang[];
  detail: DetailBarangFormValues;
  onUpdate: (index: number, field: keyof DetailBarangFormValues, value: string | number) => void;
  onRemove: (index: number) => void;
  disabled: boolean;
}) {
  const selectedBarang = barangList.find(b => b.id === detail.barangId);

  return (
    <div className="grid grid-cols-12 gap-2 items-end p-3 border rounded-lg bg-muted/30">
      <div className="col-span-3">
        <Label>Barang</Label>
        <Select
          value={detail.barangId}
          onValueChange={(value) => {
            const barang = barangList.find(b => b.id === value);
            if (barang) {
              onUpdate(index, 'barangId', value);
              onUpdate(index, 'harga', barang.harga);
              onUpdate(index, 'subtotal', barang.harga * detail.jumlah);
            }
          }}
          disabled={disabled}
        >
          <SelectTrigger className="w-full mt-1">
            <SelectValue placeholder="Pilih barang" />
          </SelectTrigger>
          <SelectContent>
            {barangList.map((barang) => (
              <SelectItem key={barang.id} value={barang.id}>
                {barang.kode} - {barang.nama}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="col-span-2">
        <Label>Jumlah</Label>
        <Input
          type="number"
          className="mt-1"
          value={detail.jumlah}
          onChange={(e) => {
            const jumlah = Number(e.target.value);
            onUpdate(index, 'jumlah', jumlah);
            onUpdate(index, 'subtotal', detail.harga * jumlah);
          }}
          disabled={disabled}
          min={1}
        />
      </div>
      <div className="col-span-2">
        <Label>Satuan</Label>
        <Input
          className="mt-1"
          value={selectedBarang?.satuan || ''}
          disabled
        />
      </div>
      <div className="col-span-2">
        <Label>Harga (Rp)</Label>
        <Input
          type="number"
          className="mt-1"
          value={detail.harga}
          onChange={(e) => {
            const harga = Number(e.target.value);
            onUpdate(index, 'harga', harga);
            onUpdate(index, 'subtotal', harga * detail.jumlah);
          }}
          disabled={disabled}
          min={0}
        />
      </div>
      <div className="col-span-2">
        <Label>Subtotal (Rp)</Label>
        <Input
          className="mt-1 font-medium"
          value={detail.subtotal.toLocaleString('id-ID')}
          disabled
        />
      </div>
      <div className="col-span-1">
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={() => onRemove(index)}
          disabled={disabled}
          className="mt-1"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Komponen Form Barang Masuk
function BarangMasukForm({
  onSubmit,
  isSubmitting,
  barangList,
}: {
  onSubmit: (values: BarangMasukFormValues) => void;
  isSubmitting: boolean;
  barangList: Barang[];
}) {
  const [details, setDetails] = useState<DetailBarangFormValues[]>([
    { barangId: '', jumlah: 1, harga: 0, subtotal: 0 }
  ]);

  const form = useForm<Omit<BarangMasukFormValues, 'details'>>({
    resolver: zodResolver(barangMasukSchema.omit({ details: true })),
    defaultValues: {
      tanggal: new Date().toISOString().split('T')[0],
      supplier: '',
      nota: '',
      keterangan: '',
    },
  });

  const addDetail = () => {
    setDetails([...details, { barangId: '', jumlah: 1, harga: 0, subtotal: 0 }]);
  };

  const updateDetail = (index: number, field: keyof DetailBarangFormValues, value: string | number) => {
    const newDetails = [...details];
    // Pastikan nilai selalu number untuk menghindari NaN
    const numValue = typeof value === 'number' ? value : Number(value) || 0;
    newDetails[index] = { ...newDetails[index], [field]: numValue };
    // Recalculate subtotal dengan aman
    const current = newDetails[index];
    newDetails[index].subtotal = (current.jumlah || 0) * (current.harga || 0);
    setDetails(newDetails);
  };

  const removeDetail = (index: number) => {
    if (details.length > 1) {
      setDetails(details.filter((_, i) => i !== index));
    } else {
      toast.warning('Tidak dapat menghapus item terakhir, minimal harus ada satu barang');
    }
  };

  const total = details.reduce((sum, d) => sum + d.subtotal, 0);

  const handleSubmit = form.handleSubmit((values) => {
    // Validasi details
    const validDetails = details.filter(d => d.barangId && d.jumlah > 0);
    if (validDetails.length === 0) {
      toast.error('Minimal harus ada satu barang yang valid');
      return;
    }
    onSubmit({ ...values, details: validDetails });
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="tanggal"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Tanggal
                </FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="nota"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nomor Nota</FormLabel>
                <FormControl>
                  <Input placeholder="NOTA/001/2024" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="supplier"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Supplier
              </FormLabel>
              <FormControl>
                <Input placeholder="Nama supplier" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="keterangan"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Keterangan (Opsional)</FormLabel>
              <FormControl>
                <Input placeholder="Catatan tambahan" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Detail Barang */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Detail Barang</h4>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={addDetail}
              disabled={isSubmitting}
            >
              <Plus className="h-4 w-4 mr-1" />
              Tambah Barang
            </Button>
          </div>

          {details.map((detail, index) => (
            <DetailBarangItem
              key={index}
              index={index}
              barangList={barangList}
              detail={detail}
              onUpdate={updateDetail}
              onRemove={removeDetail}
              disabled={isSubmitting}
            />
          ))}

          <div className="flex justify-end p-3 border-t">
            <div className="text-lg font-bold">
              Total: Rp {total.toLocaleString('id-ID')}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Menyimpan...' : 'Simpan Transaksi'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

// Dialog untuk melihat detail transaksi
function DetailDialog({
  isOpen,
  onClose,
  transaksi,
}: {
  isOpen: boolean;
  onClose: () => void;
  transaksi: BarangMasuk | null;
}) {
  if (!transaksi) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Detail Transaksi Barang Masuk</DialogTitle>
            <Button variant="ghost" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-1" />
              Cetak
            </Button>
          </div>
          <DialogDescription>
            Nomor Transaksi: {transaksi.nomor}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Info Header */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Tanggal</p>
              <p className="font-medium">{new Date(transaksi.tanggal).toLocaleDateString('id-ID')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Supplier</p>
              <p className="font-medium">{transaksi.supplier}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Nomor Nota</p>
              <p className="font-medium">{transaksi.nota}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={getStatusVariant(transaksi.status)}>
                {getStatusLabel(transaksi.status)}
              </Badge>
            </div>
          </div>

          {/* Detail Barang Table */}
          <div>
            <h4 className="font-semibold mb-3">Daftar Barang</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">Kode</TableHead>
                  <TableHead scope="col">Nama Barang</TableHead>
                  <TableHead scope="col" className="text-right">Jumlah</TableHead>
                  <TableHead scope="col" className="text-right">Harga</TableHead>
                  <TableHead scope="col" className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transaksi.details.map((detail) => (
                  <TableRow key={detail.id}>
                    <TableCell>{detail.barang.kode}</TableCell>
                    <TableCell>{detail.barang.nama}</TableCell>
                    <TableCell className="text-right">{detail.jumlah} {detail.barang.satuan}</TableCell>
                    <TableCell className="text-right">Rp {detail.harga.toLocaleString('id-ID')}</TableCell>
                    <TableCell className="text-right">Rp {detail.subtotal.toLocaleString('id-ID')}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={4} className="text-right font-bold">Total</TableCell>
                  <TableCell className="text-right font-bold">Rp {transaksi.total.toLocaleString('id-ID')}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {transaksi.keterangan && (
            <div>
              <p className="text-sm text-muted-foreground">Keterangan</p>
              <p>{transaksi.keterangan}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Fungsi untuk mengambil data transaksi barang masuk dari API
async function fetchBarangMasuk(
  page: number,
  limit: number,
  search?: string,
  startDate?: string,
  endDate?: string,
  supplier?: string
): Promise<BarangMasukResponse> {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  if (search) params.append('search', search);
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  if (supplier) params.append('supplier', supplier);

  const response = await api.get<BarangMasukResponse>(`/barang-masuk?${params.toString()}`);
  return response;
}

// Fungsi untuk mengambil daftar barang untuk dropdown
async function fetchBarangs(): Promise<BarangListResponse> {
  const response = await api.get<BarangListResponse>('/barang?limit=1000');
  return response;
}

// Komponen utama halaman Barang Masuk
export default function BarangMasukPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedTransaksi, setSelectedTransaksi] = useState<BarangMasuk | null>(null);
  const limit = 10;

  // Reset page when search changes
  useEffect(() => {
    if (search !== '') {
      setPage(1);
    }
  }, [search]);

  // Query untuk mengambil data barang masuk
  const { data, isPending, error, refetch } = useQuery({
    queryKey: ['barang-masuk', page, debouncedSearch, startDate, endDate, supplierFilter],
    queryFn: () => fetchBarangMasuk(page, limit, debouncedSearch, startDate, endDate, supplierFilter),
    staleTime: 5 * 60 * 1000,
  });

  // Query untuk mengambil daftar barang
  const { data: barangListData } = useQuery({
    queryKey: ['barangs-list'],
    queryFn: fetchBarangs,
    staleTime: 10 * 60 * 1000,
  });

  // Mutation untuk menambah transaksi baru
  const addMutation = useMutation({
    mutationFn: async (values: BarangMasukFormValues) => {
      return await api.post<BarangMasuk>('/barang-masuk', values);
    },
    onMutate: async (newTransaksi) => {
      await queryClient.cancelQueries({ queryKey: ['barang-masuk', page, search, startDate, endDate, supplierFilter] });
      const previousData = queryClient.getQueryData<BarangMasukResponse>(['barang-masuk', page, search, startDate, endDate, supplierFilter]);

      if (previousData) {
        const total = newTransaksi.details.reduce((sum, d) => sum + (d.subtotal || 0), 0);
        // Handle case ketika barangListData belum terload (masih undefined)
        const barangList = barangListData?.data || [];
        const optimisticTransaksi: BarangMasuk = {
          ...newTransaksi,
          id: `temp-${Date.now()}`,
          nomor: `BM-${Date.now()}`,
          status: 'draft',
          total,
          details: newTransaksi.details.map((d, i) => ({
            ...d,
            id: `temp-detail-${i}`,
            barang: barangList.find(b => b.id === d.barangId) || {
              id: d.barangId,
              nama: 'Loading...',
              kode: '-',
              satuan: '-',
              harga: d.harga || 0
            },
          })),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'current-user',
        };
        queryClient.setQueryData(['barang-masuk', page, search, startDate, endDate, supplierFilter], {
          ...previousData,
          data: [optimisticTransaksi, ...previousData.data],
          total: previousData.total + 1,
        });
      }
      return { previousData };
    },
    onSuccess: () => {
      toast.success('Transaksi barang masuk berhasil ditambahkan!');
    },
    onError: (err, _, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['barang-masuk', page, search, startDate, endDate, supplierFilter], context.previousData);
      }
      toast.error('Gagal menambahkan transaksi. Silakan coba lagi.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['barang-masuk', page, search, startDate, endDate, supplierFilter] });
      setIsAddDialogOpen(false);
    },
  });

  // Handler submit form tambah
  const handleAddSubmit = (values: BarangMasukFormValues) => {
    addMutation.mutate(values);
  };

  // Definisi kolom untuk Data Table
  const columns: ColumnDef<BarangMasuk>[] = [
    {
      accessorKey: 'nomor',
      header: 'Nomor',
      cell: ({ row }) => (
        <div className="font-mono text-sm font-medium">{row.getValue('nomor')}</div>
      ),
    },
    {
      accessorKey: 'tanggal',
      header: 'Tanggal',
      cell: ({ row }) => {
        const tanggal = row.getValue('tanggal') as string;
        return <span>{new Date(tanggal).toLocaleDateString('id-ID')}</span>;
      },
    },
    {
      accessorKey: 'supplier',
      header: 'Supplier',
    },
    {
      accessorKey: 'nota',
      header: 'Nomor Nota',
    },
    {
      accessorKey: 'total',
      header: 'Total',
      cell: ({ row }) => {
        const total = row.getValue('total') as number;
        return <span>Rp {total.toLocaleString('id-ID')}</span>;
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        return (
          <Badge variant={getStatusVariant(status)}>
            {getStatusLabel(status)}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: 'Aksi',
      cell: ({ row }) => {
        const transaksi = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedTransaksi(transaksi);
                setIsDetailDialogOpen(true);
              }}
              className="h-8 w-8 p-0"
              aria-label={`Lihat detail ${transaksi.nomor}`}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                // Fungsi cetak
                setSelectedTransaksi(transaksi);
                setTimeout(() => window.print(), 100);
              }}
              className="h-8 w-8 p-0"
              aria-label={`Cetak ${transaksi.nomor}`}
            >
              <Printer className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  // Setup React Table
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data: data?.data || [],
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
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
                Gagal memuat data transaksi barang masuk. Silakan coba lagi nanti.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {error instanceof Error ? error.message : 'Kesalahan tidak diketahui'}
              </p>
              <Button onClick={() => refetch()} className="w-full">
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Barang Masuk</h2>
            <p className="text-muted-foreground">
              Kelola transaksi penerimaan barang dari supplier.
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 transition-all duration-300 hover:scale-105">
                <Plus className="h-4 w-4" />
                Tambah Transaksi
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Tambah Transaksi Barang Masuk Baru</DialogTitle>
                <DialogDescription>
                  Masukkan data transaksi penerimaan barang dari supplier.
                </DialogDescription>
              </DialogHeader>
              {addMutation.isPending ? (
                <FormSkeleton />
              ) : (
                <BarangMasukForm
                  onSubmit={handleAddSubmit}
                  isSubmitting={addMutation.isPending}
                  barangList={barangListData?.data || []}
                />
              )}
            </DialogContent>
          </Dialog>
        </div>

        {/* Card utama dengan tabel */}
        <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg">
          <CardHeader>
            <CardTitle>Daftar Transaksi Barang Masuk</CardTitle>
            <CardDescription>
              Total {data?.total || 0} transaksi tercatat di sistem.
            </CardDescription>
            {/* Filter dan Search */}
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari transaksi..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPage(1);
                  }}
                  className="w-auto"
                  placeholder="Tanggal mulai"
                />
                <span className="text-muted-foreground">s/d</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPage(1);
                  }}
                  className="w-auto"
                  placeholder="Tanggal akhir"
                />
              </div>
              <Input
                placeholder="Filter supplier..."
                value={supplierFilter}
                onChange={(e) => {
                  setSupplierFilter(e.target.value);
                  setPage(1);
                }}
                className="w-auto min-w-[150px]"
              />
              {(search || startDate || endDate || supplierFilter) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearch('');
                    setStartDate('');
                    setEndDate('');
                    setSupplierFilter('');
                    setPage(1);
                  }}
                >
                  <X className="h-4 w-4 mr-1" />
                  Reset
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isPending ? (
              <TableSkeleton />
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      {table.getHeaderGroups().map((headerGroup: HeaderGroup<BarangMasuk>) => (
                        <TableRow key={headerGroup.id}>
                          {headerGroup.headers.map((header: Header<BarangMasuk, unknown>) => (
                            <TableHead key={header.id} scope="col">
                              {header.isPlaceholder
                                ? null
                                : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                            </TableHead>
                          ))}
                        </TableRow>
                      ))}
                    </TableHeader>
                    <TableBody>
                      {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row: Row<BarangMasuk>) => (
                          <TableRow
                            key={row.id}
                            className="transition-colors hover:bg-muted/50"
                          >
                            {row.getVisibleCells().map((cell: Cell<BarangMasuk, unknown>) => (
                              <TableCell key={cell.id}>
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext()
                                )}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={columns.length}
                            className="h-24 text-center"
                          >
                            <div className="flex flex-col items-center justify-center text-muted-foreground">
                              <Package className="h-8 w-8 mb-2 opacity-50" />
                              <p>Belum ada transaksi barang masuk</p>
                              <p className="text-sm">Tambahkan transaksi pertama Anda.</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between space-x-2 py-4">
                  <div className="text-sm text-muted-foreground">
                    Halaman {page} dari {data?.totalPages || 1}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                    >
                      Sebelumnya
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={data ? page >= data.totalPages : true}
                    >
                      Selanjutnya
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Dialog Detail */}
        <DetailDialog
          isOpen={isDetailDialogOpen}
          onClose={() => {
            setIsDetailDialogOpen(false);
            setSelectedTransaksi(null);
          }}
          transaksi={selectedTransaksi}
        />
      </div>
    </ProtectedRoute>
  );
}
