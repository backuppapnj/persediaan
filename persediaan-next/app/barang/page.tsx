'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/useDebounce';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { api } from '@/lib/api';
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
  Edit,
  Trash2,
  X,
  Loader2,
  AlertTriangle,
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
import { TableSkeleton, FormSkeleton } from '@/components/ui/skeleton';

// Schema validasi Zod untuk form barang
const barangSchema = z.object({
  nama: z.string().min(2, 'Nama barang minimal 2 karakter'),
  kode: z.string().min(1, 'Kode barang tidak boleh kosong'),
  kategori: z.string().min(1, 'Kategori tidak boleh kosong'),
  stok: z.number().min(0, 'Stok tidak boleh negatif'),
  harga: z.number().min(0, 'Harga tidak boleh negatif'),
  satuan: z.string().min(1, 'Satuan tidak boleh kosong'),
});

type BarangFormValues = z.infer<typeof barangSchema>;

// Interface untuk data Barang
interface Barang {
  id: string;
  nama: string;
  kode: string;
  kategori: string;
  stok: number;
  harga: number;
  satuan: string;
  createdAt: string;
  updatedAt: string;
}

// Interface untuk response API
interface BarangResponse {
  data: Barang[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Fungsi untuk mendapatkan variant badge berdasarkan stok
function getStokVariant(stok: number) {
  if (stok === 0) return 'destructive';
  if (stok < 10) return 'warning';
  return 'success';
}

// Fungsi untuk mendapatkan label status stok
function getStokLabel(stok: number) {
  if (stok === 0) return 'Habis';
  if (stok < 10) return 'Menipis';
  return 'Tersedia';
}

// Fungsi untuk mengambil data barang dari API
async function fetchBarangs(page: number, limit: number, search?: string): Promise<BarangResponse> {
  const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
  const response = await api.get<BarangResponse>(`/barang?page=${page}&limit=${limit}${searchParam}`);
  return response;
}

// Komponen Form Barang (untuk tambah dan edit)
function BarangForm({
  defaultValues,
  onSubmit,
  isSubmitting,
}: {
  defaultValues?: Partial<BarangFormValues>;
  onSubmit: (values: BarangFormValues) => void;
  isSubmitting: boolean;
}) {
  const form = useForm<BarangFormValues>({
    resolver: zodResolver(barangSchema),
    defaultValues: {
      nama: '',
      kode: '',
      kategori: '',
      stok: 0,
      harga: 0,
      satuan: 'pcs',
      ...defaultValues,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="kode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kode Barang</FormLabel>
                <FormControl>
                  <Input placeholder="BRG001" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="nama"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nama Barang</FormLabel>
                <FormControl>
                  <Input placeholder="Nama barang" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="kategori"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kategori</FormLabel>
              <FormControl>
                <Input placeholder="Kategori barang" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="stok"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stok</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="satuan"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Satuan</FormLabel>
                <FormControl>
                  <Input placeholder="pcs" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="harga"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Harga (Rp)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="0"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Menyimpan...' : 'Simpan Barang'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

// Komponen Dialog Konfirmasi Hapus
function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
  barangName,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
  barangName: string;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Konfirmasi Hapus
          </DialogTitle>
          <DialogDescription>
            Apakah Anda yakin ingin menghapus barang <strong>"{barangName}"</strong>? Tindakan ini tidak dapat dibatalkan.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-3 mt-4">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Batal
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isDeleting} className="flex-1">
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isDeleting ? 'Menghapus...' : 'Hapus'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Komponen utama halaman Barang
export default function BarangPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedBarang, setSelectedBarang] = useState<Barang | null>(null);
  const limit = 10;

  // Reset page when debounced search changes
  useEffect(() => {
    if (search !== '') {
      setPage(1);
    }
  }, [search]);

  // Query untuk mengambil data barang
  const { data, isPending, error, refetch } = useQuery({
    queryKey: ['barangs', page, debouncedSearch],
    queryFn: () => fetchBarangs(page, limit, debouncedSearch),
    staleTime: 5 * 60 * 1000,
  });

  // Mutation untuk menambah barang baru
  const addMutation = useMutation({
    mutationFn: async (values: BarangFormValues) => {
      return await api.post<Barang>('/barang', values);
    },
    onMutate: async (newBarang) => {
      await queryClient.cancelQueries({ queryKey: ['barangs', page, search] });
      const previousData = queryClient.getQueryData<BarangResponse>(['barangs', page, search]);

      // Optimistically add new barang to the cache
      if (previousData) {
        const optimisticBarang: Barang = {
          ...newBarang,
          id: `temp-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        queryClient.setQueryData(['barangs', page, search], {
          ...previousData,
          data: [optimisticBarang, ...previousData.data],
          total: previousData.total + 1,
        });
      }
      return { previousData };
    },
    onSuccess: () => {
      toast.success('Barang berhasil ditambahkan!');
    },
    onError: (err, _, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['barangs', page, search], context.previousData);
      }
      toast.error('Gagal menambahkan barang. Silakan coba lagi.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['barangs', page, search] });
      setIsAddDialogOpen(false);
    },
  });

  // Mutation untuk mengedit barang
  const editMutation = useMutation({
    mutationFn: async (values: BarangFormValues & { id: string }) => {
      const { id, ...data } = values;
      return await api.put<Barang>(`/barang/${id}`, data);
    },
    onMutate: async (updatedBarang) => {
      await queryClient.cancelQueries({ queryKey: ['barangs', page, search] });
      const previousData = queryClient.getQueryData<BarangResponse>(['barangs', page, search]);
      if (previousData) {
        queryClient.setQueryData(['barangs', page, search], {
          ...previousData,
          data: previousData.data.map((item) =>
            item.id === updatedBarang.id ? { ...item, ...updatedBarang } : item
          ),
        });
      }
      return { previousData };
    },
    onSuccess: () => {
      toast.success('Barang berhasil diperbarui!');
    },
    onError: (err, _, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['barangs', page, search], context.previousData);
      }
      toast.error('Gagal memperbarui barang. Silakan coba lagi.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['barangs', page, search] });
      setIsEditDialogOpen(false);
      setSelectedBarang(null);
    },
  });

  // Mutation untuk menghapus barang
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await api.delete(`/barang/${id}`);
    },
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: ['barangs', page, search] });
      const previousData = queryClient.getQueryData<BarangResponse>(['barangs', page, search]);
      if (previousData) {
        queryClient.setQueryData(['barangs', page, search], {
          ...previousData,
          data: previousData.data.filter((item) => item.id !== deletedId),
          total: previousData.total - 1,
        });
      }
      return { previousData };
    },
    onSuccess: () => {
      toast.success('Barang berhasil dihapus!');
    },
    onError: (err, _, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['barangs', page, search], context.previousData);
      }
      toast.error('Gagal menghapus barang. Silakan coba lagi.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['barangs', page, search] });
      setIsDeleteDialogOpen(false);
      setSelectedBarang(null);
    },
  });

  // Definisi kolom untuk Data Table
  const columns: ColumnDef<Barang>[] = [
    {
      accessorKey: 'kode',
      header: 'Kode',
      cell: ({ row }: { row: Row<Barang> }) => (
        <div className="font-mono text-sm font-medium">{row.getValue('kode')}</div>
      ),
    },
    {
      accessorKey: 'nama',
      header: 'Nama Barang',
      cell: ({ row }: { row: Row<Barang> }) => (
        <div className="font-medium">{row.getValue('nama')}</div>
      ),
    },
    {
      accessorKey: 'kategori',
      header: 'Kategori',
    },
    {
      accessorKey: 'stok',
      header: 'Stok',
      cell: ({ row }: { row: Row<Barang> }) => {
        const stok = row.getValue('stok') as number;
        return (
          <div className="flex items-center gap-2">
            <span>{stok.toLocaleString('id-ID')}</span>
            <Badge variant={getStokVariant(stok)}>{getStokLabel(stok)}</Badge>
          </div>
        );
      },
    },
    {
      accessorKey: 'harga',
      header: 'Harga',
      cell: ({ row }: { row: Row<Barang> }) => {
        const harga = row.getValue('harga') as number;
        return <span>Rp {harga.toLocaleString('id-ID')}</span>;
      },
    },
    {
      accessorKey: 'satuan',
      header: 'Satuan',
    },
    {
      id: 'actions',
      header: 'Aksi',
      cell: ({ row }: { row: Row<Barang> }) => {
        const barang = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedBarang(barang);
                setIsEditDialogOpen(true);
              }}
              className="h-8 w-8 p-0"
              aria-label={`Edit barang ${barang.nama}`}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedBarang(barang);
                setIsDeleteDialogOpen(true);
              }}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              aria-label={`Hapus barang ${barang.nama}`}
            >
              <Trash2 className="h-4 w-4" />
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

  // Handler submit form tambah
  const handleAddSubmit = (values: BarangFormValues) => {
    addMutation.mutate(values);
  };

  // Handler submit form edit
  const handleEditSubmit = (values: BarangFormValues) => {
    if (selectedBarang) {
      editMutation.mutate({ ...values, id: selectedBarang.id });
    }
  };

  // Handler konfirmasi hapus
  const handleDeleteConfirm = () => {
    if (selectedBarang) {
      deleteMutation.mutate(selectedBarang.id);
    }
  };

  // Tampilkan error jika terjadi kesalahan
  if (error) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-[80vh]">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-red-600">Terjadi Kesalahan</CardTitle>
              <CardDescription>
                Gagal memuat data barang. Silakan coba lagi nanti.
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
            <h2 className="text-3xl font-bold tracking-tight">Manajemen Barang</h2>
            <p className="text-muted-foreground">
              Kelola seluruh data barang yang tersedia di gudang.
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 transition-all duration-300 hover:scale-105">
                <Plus className="h-4 w-4" />
                Tambah Barang
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Tambah Barang Baru</DialogTitle>
                <DialogDescription>
                  Masukkan data barang baru yang akan ditambahkan ke sistem.
                </DialogDescription>
              </DialogHeader>
              {addMutation.isPending ? (
                <FormSkeleton />
              ) : (
                <BarangForm onSubmit={handleAddSubmit} isSubmitting={addMutation.isPending} />
              )}
            </DialogContent>
          </Dialog>
        </div>

        {/* Card utama dengan tabel */}
        <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg">
          <CardHeader>
            <CardTitle>Daftar Barang</CardTitle>
            <CardDescription>
              Total {data?.total || 0} barang terdaftar di sistem.
            </CardDescription>
            {/* Search bar */}
            <div className="flex items-center gap-2 mt-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari barang..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                />
              </div>
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
                      {table.getHeaderGroups().map((headerGroup: HeaderGroup<Barang>) => (
                        <TableRow key={headerGroup.id}>
                          {headerGroup.headers.map((header: Header<Barang, unknown>) => (
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
                        table.getRowModel().rows.map((row: Row<Barang>) => (
                          <TableRow
                            key={row.id}
                            className="transition-colors hover:bg-muted/50"
                          >
                            {row.getVisibleCells().map((cell: Cell<Barang, unknown>) => (
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
                              <p>Belum ada barang</p>
                              <p className="text-sm">Tambahkan barang pertama Anda.</p>
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

        {/* Dialog Edit */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Barang</DialogTitle>
              <DialogDescription>
                Ubah data barang yang sudah terdaftar di sistem.
              </DialogDescription>
            </DialogHeader>
            {editMutation.isPending ? (
              <FormSkeleton />
            ) : selectedBarang ? (
              <BarangForm
                defaultValues={{
                  nama: selectedBarang.nama,
                  kode: selectedBarang.kode,
                  kategori: selectedBarang.kategori,
                  stok: selectedBarang.stok,
                  harga: selectedBarang.harga,
                  satuan: selectedBarang.satuan,
                }}
                onSubmit={handleEditSubmit}
                isSubmitting={editMutation.isPending}
              />
            ) : null}
          </DialogContent>
        </Dialog>

        {/* Dialog Hapus */}
        <DeleteConfirmDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => {
            setIsDeleteDialogOpen(false);
            setSelectedBarang(null);
          }}
          onConfirm={handleDeleteConfirm}
          isDeleting={deleteMutation.isPending}
          barangName={selectedBarang?.nama || ''}
        />
      </div>
    </ProtectedRoute>
  );
}
