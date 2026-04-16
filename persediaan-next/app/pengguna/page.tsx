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
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  Loader2,
  AlertTriangle,
  KeyRound,
  UserCheck,
  Shield,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { TableSkeleton, FormSkeleton } from '@/components/ui/skeleton';

// Schema validasi Zod untuk form pengguna
const penggunaSchema = z.object({
  nama: z.string().min(2, 'Nama minimal 2 karakter'),
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter').optional(),
  role: z.enum(['admin', 'approver', 'warehouse', 'user'], {
    required_error: 'Role harus dipilih',
  }),
  status: z.boolean().default(true),
});

type PenggunaFormValues = z.infer<typeof penggunaSchema>;

// Interface untuk data Pengguna
interface Pengguna {
  id: string;
  nama: string;
  email: string;
  role: 'admin' | 'approver' | 'warehouse' | 'user';
  status: boolean;
  createdAt: string;
  updatedAt: string;
}

// Interface untuk response API
interface PenggunaResponse {
  data: Pengguna[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Konstanta role
const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrator',
  approver: 'Approver',
  warehouse: 'Warehouse',
  user: 'User',
};

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-800 border-purple-200',
  approver: 'bg-blue-100 text-blue-800 border-blue-200',
  warehouse: 'bg-orange-100 text-orange-800 border-orange-200',
  user: 'bg-gray-100 text-gray-800 border-gray-200',
};

// Fungsi untuk mendapatkan inisial nama
function getInitials(nama: string): string {
  return nama
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Fungsi untuk mendapatkan warna avatar berdasarkan role
function getAvatarColor(role: string): string {
  const colors: Record<string, string> = {
    admin: 'bg-purple-500',
    approver: 'bg-blue-500',
    warehouse: 'bg-orange-500',
    user: 'bg-gray-500',
  };
  return colors[role] || 'bg-gray-500';
}

// Fungsi untuk mengambil data pengguna dari API
async function fetchPengguna(
  page: number,
  limit: number,
  search?: string,
  roleFilter?: string,
  statusFilter?: string
): Promise<PenggunaResponse> {
  const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
  const roleParam = roleFilter && roleFilter !== 'all' ? `&role=${encodeURIComponent(roleFilter)}` : '';
  const statusParam = statusFilter && statusFilter !== 'all' ? `&status=${statusFilter}` : '';
  const response = await api.get<PenggunaResponse>(
    `/pengguna?page=${page}&limit=${limit}${searchParam}${roleParam}${statusParam}`
  );
  return response;
}

// Komponen Form Pengguna (untuk tambah dan edit)
function PenggunaForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  isEdit = false,
}: {
  defaultValues?: Partial<PenggunaFormValues>;
  onSubmit: (values: PenggunaFormValues) => void;
  isSubmitting: boolean;
  isEdit?: boolean;
}) {
  const form = useForm<PenggunaFormValues>({
    resolver: zodResolver(penggunaSchema),
    defaultValues: {
      nama: '',
      email: '',
      password: '',
      role: 'user',
      status: true,
      ...defaultValues,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nama"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Lengkap</FormLabel>
              <FormControl>
                <Input placeholder="Nama lengkap pengguna" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="email@contoh.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {!isEdit && (
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password {isEdit && '(Kosongkan jika tidak diubah)'}</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Minimal 6 karakter" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-purple-500" />
                      <span>Administrator</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="approver">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-blue-500" />
                      <span>Approver</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="warehouse">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-orange-500" />
                      <span>Warehouse</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="user">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span>User</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        {isEdit && (
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Status Aktif</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Aktifkan atau nonaktifkan pengguna ini
                  </p>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        )}
        <DialogFooter>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Menyimpan...' : isEdit ? 'Perbarui Pengguna' : 'Tambah Pengguna'}
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
  penggunaName,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
  penggunaName: string;
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
            Apakah Anda yakin ingin menghapus pengguna <strong>&quot;{penggunaName}&quot;</strong>? Tindakan ini tidak dapat dibatalkan.
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

// Komponen Dialog Reset Password
function ResetPasswordDialog({
  isOpen,
  onClose,
  onConfirm,
  isResetting,
  penggunaName,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isResetting: boolean;
  penggunaName: string;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <KeyRound className="h-5 w-5" />
            Reset Password
          </DialogTitle>
          <DialogDescription>
            Reset password untuk pengguna <strong>&quot;{penggunaName}&quot;</strong>? Password akan diatur ulang ke default.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-3 mt-4">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Batal
          </Button>
          <Button variant="default" onClick={onConfirm} disabled={isResetting} className="flex-1 bg-amber-600 hover:bg-amber-700">
            {isResetting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isResetting ? 'Mereset...' : 'Reset Password'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Komponen utama halaman Pengguna
export default function PenggunaPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [selectedPengguna, setSelectedPengguna] = useState<Pengguna | null>(null);
  const limit = 10;

  // Reset page when search changes
  useEffect(() => {
    if (search !== '') {
      setPage(1);
    }
  }, [search]);

  // Query untuk mengambil data pengguna
  const { data, isPending, error, refetch } = useQuery({
    queryKey: ['pengguna', page, debouncedSearch, roleFilter, statusFilter],
    queryFn: () => fetchPengguna(page, limit, debouncedSearch, roleFilter, statusFilter),
    staleTime: 5 * 60 * 1000,
  });

  // Mutation untuk menambah pengguna baru
  const addMutation = useMutation({
    mutationFn: async (values: PenggunaFormValues) => {
      return await api.post<Pengguna>('/pengguna', values);
    },
    onMutate: async (newPengguna) => {
      await queryClient.cancelQueries({ queryKey: ['pengguna', page, search, roleFilter, statusFilter] });
      const previousData = queryClient.getQueryData<PenggunaResponse>([
        'pengguna',
        page,
        search,
        roleFilter,
        statusFilter,
      ]);

      // Optimistically add new pengguna to the cache
      if (previousData) {
        const optimisticPengguna: Pengguna = {
          ...newPengguna,
          id: `temp-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        queryClient.setQueryData(
          ['pengguna', page, search, roleFilter, statusFilter],
          {
            ...previousData,
            data: [optimisticPengguna, ...previousData.data],
            total: previousData.total + 1,
          }
        );
      }
      return { previousData };
    },
    onSuccess: () => {
      toast.success('Pengguna berhasil ditambahkan!');
    },
    onError: (err, _, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          ['pengguna', page, search, roleFilter, statusFilter],
          context.previousData
        );
      }
      toast.error('Gagal menambahkan pengguna. Silakan coba lagi.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ['pengguna', page, search, roleFilter, statusFilter],
      });
      setIsAddDialogOpen(false);
    },
  });

  // Mutation untuk mengedit pengguna
  const editMutation = useMutation({
    mutationFn: async (values: PenggunaFormValues & { id: string }) => {
      const { id, ...data } = values;
      return await api.put<Pengguna>(`/pengguna/${id}`, data);
    },
    onMutate: async (updatedPengguna) => {
      await queryClient.cancelQueries({
        queryKey: ['pengguna', page, search, roleFilter, statusFilter],
      });
      const previousData = queryClient.getQueryData<PenggunaResponse>([
        'pengguna',
        page,
        search,
        roleFilter,
        statusFilter,
      ]);
      if (previousData) {
        queryClient.setQueryData(
          ['pengguna', page, search, roleFilter, statusFilter],
          {
            ...previousData,
            data: previousData.data.map((item) =>
              item.id === updatedPengguna.id ? { ...item, ...updatedPengguna } : item
            ),
          }
        );
      }
      return { previousData };
    },
    onSuccess: () => {
      toast.success('Pengguna berhasil diperbarui!');
    },
    onError: (err, _, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          ['pengguna', page, search, roleFilter, statusFilter],
          context.previousData
        );
      }
      toast.error('Gagal memperbarui pengguna. Silakan coba lagi.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ['pengguna', page, search, roleFilter, statusFilter],
      });
      setIsEditDialogOpen(false);
      setSelectedPengguna(null);
    },
  });

  // Mutation untuk menghapus pengguna
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await api.delete(`/pengguna/${id}`);
    },
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({
        queryKey: ['pengguna', page, search, roleFilter, statusFilter],
      });
      const previousData = queryClient.getQueryData<PenggunaResponse>([
        'pengguna',
        page,
        search,
        roleFilter,
        statusFilter,
      ]);
      if (previousData) {
        queryClient.setQueryData(
          ['pengguna', page, search, roleFilter, statusFilter],
          {
            ...previousData,
            data: previousData.data.filter((item) => item.id !== deletedId),
            total: previousData.total - 1,
          }
        );
      }
      return { previousData };
    },
    onSuccess: () => {
      toast.success('Pengguna berhasil dihapus!');
    },
    onError: (err, _, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          ['pengguna', page, search, roleFilter, statusFilter],
          context.previousData
        );
      }
      toast.error('Gagal menghapus pengguna. Silakan coba lagi.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ['pengguna', page, search, roleFilter, statusFilter],
      });
      setIsDeleteDialogOpen(false);
      setSelectedPengguna(null);
    },
  });

  // Mutation untuk reset password
  const resetPasswordMutation = useMutation({
    mutationFn: async (id: string) => {
      return await api.post<{ message: string }>(`/pengguna/${id}/reset-password`, {});
    },
    onSuccess: () => {
      toast.success('Password berhasil direset ke default!');
    },
    onError: () => {
      toast.error('Gagal mereset password. Silakan coba lagi.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['pengguna', page, search, roleFilter, statusFilter] });
      setIsResetPasswordDialogOpen(false);
      setSelectedPengguna(null);
    },
  });

  // Mutation untuk toggle status pengguna
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: boolean }) => {
      return await api.put<Pengguna>(`/pengguna/${id}`, { status });
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({
        queryKey: ['pengguna', page, search, roleFilter, statusFilter],
      });
      const previousData = queryClient.getQueryData<PenggunaResponse>([
        'pengguna',
        page,
        search,
        roleFilter,
        statusFilter,
      ]);
      if (previousData) {
        queryClient.setQueryData(
          ['pengguna', page, search, roleFilter, statusFilter],
          {
            ...previousData,
            data: previousData.data.map((item) =>
              item.id === id ? { ...item, status } : item
            ),
          }
        );
      }
      return { previousData };
    },
    onSuccess: (_, { status }) => {
      toast.success(status ? 'Pengguna berhasil diaktifkan!' : 'Pengguna berhasil dinonaktifkan!');
    },
    onError: (err, _, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          ['pengguna', page, search, roleFilter, statusFilter],
          context.previousData
        );
      }
      toast.error('Gagal mengubah status pengguna. Silakan coba lagi.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ['pengguna', page, search, roleFilter, statusFilter],
      });
    },
  });

  // Definisi kolom untuk Data Table
  const columns: ColumnDef<Pengguna>[] = [
      {
        accessorKey: 'nama',
        header: 'Pengguna',
        cell: ({ row }: { row: Row<Pengguna> }) => {
          const pengguna = row.original;
          return (
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className={getAvatarColor(pengguna.role)}>
                  {getInitials(pengguna.nama)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{pengguna.nama}</p>
                <p className="text-sm text-muted-foreground">{pengguna.email}</p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'role',
        header: 'Role',
        cell: ({ row }: { row: Row<Pengguna> }) => {
          const role = row.getValue('role') as string;
          return (
            <Badge className={ROLE_COLORS[role]} variant="outline">
              {ROLE_LABELS[role]}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }: { row: Row<Pengguna> }) => {
          const status = row.getValue('status') as boolean;
          return (
            <Badge
              variant={status ? 'default' : 'destructive'}
              className={status ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100' : 'bg-red-100 text-red-800 border-red-200 hover:bg-red-100'}
            >
              {status ? 'Aktif' : 'Nonaktif'}
            </Badge>
          );
        },
      },
      {
        id: 'actions',
        header: 'Aksi',
        cell: ({ row }: { row: Row<Pengguna> }) => {
          const pengguna = row.original;
          return (
            <div className="flex items-center gap-1">
              {/* Toggle Status Switch */}
              <div className="flex items-center gap-2 mr-2">
                <Switch
                  checked={pengguna.status}
                  onCheckedChange={(checked) => {
                    toggleStatusMutation.mutate({ id: pengguna.id, status: checked });
                  }}
                  aria-label={pengguna.status ? 'Nonaktifkan pengguna' : 'Aktifkan pengguna'}
                />
              </div>
              {/* Reset Password Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedPengguna(pengguna);
                  setIsResetPasswordDialogOpen(true);
                }}
                className="h-8 w-8 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                aria-label="Reset password"
              >
                <KeyRound className="h-4 w-4" />
              </Button>
              {/* Edit Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedPengguna(pengguna);
                  setIsEditDialogOpen(true);
                }}
                className="h-8 w-8 p-0"
                aria-label="Edit pengguna"
              >
                <Edit className="h-4 w-4" />
              </Button>
              {/* Delete Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedPengguna(pengguna);
                  setIsDeleteDialogOpen(true);
                }}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                aria-label="Hapus pengguna"
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
  const handleAddSubmit = (values: PenggunaFormValues) => {
    addMutation.mutate(values);
  };

  // Handler submit form edit
  const handleEditSubmit = (values: PenggunaFormValues) => {
    if (selectedPengguna) {
      editMutation.mutate({ ...values, id: selectedPengguna.id });
    }
  };

  // Handler konfirmasi hapus
  const handleDeleteConfirm = () => {
    if (selectedPengguna) {
      deleteMutation.mutate(selectedPengguna.id);
    }
  };

  // Handler reset password
  const handleResetPassword = () => {
    if (selectedPengguna) {
      resetPasswordMutation.mutate(selectedPengguna.id);
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
                Gagal memuat data pengguna. Silakan coba lagi nanti.
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
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Manajemen Pengguna</h2>
            <p className="text-muted-foreground">
              Kelola seluruh pengguna dan hak akses sistem.
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 transition-all duration-300 hover:scale-105">
                <Plus className="h-4 w-4" />
                Tambah Pengguna
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Tambah Pengguna Baru</DialogTitle>
                <DialogDescription>
                  Masukkan data pengguna baru yang akan ditambahkan ke sistem.
                </DialogDescription>
              </DialogHeader>
              {addMutation.isPending ? (
                <FormSkeleton />
              ) : (
                <PenggunaForm onSubmit={handleAddSubmit} isSubmitting={addMutation.isPending} />
              )}
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Card utama dengan tabel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
        <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg">
          <CardHeader>
            <CardTitle>Daftar Pengguna</CardTitle>
            <CardDescription>
              Total {data?.total || 0} pengguna terdaftar di sistem.
            </CardDescription>
            {/* Filter dan Search bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-4">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari pengguna..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                  aria-label="Cari pengguna"
                />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select
                  value={roleFilter}
                  onValueChange={(value) => {
                    setRoleFilter(value);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-[150px]">
                    <SelectValue placeholder="Filter Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Role</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="approver">Approver</SelectItem>
                    <SelectItem value="warehouse">Warehouse</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={statusFilter}
                  onValueChange={(value) => {
                    setStatusFilter(value);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <SelectValue placeholder="Filter Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="true">Aktif</SelectItem>
                    <SelectItem value="false">Nonaktif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              {isPending ? (
                <motion.div
                  key="skeleton"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <TableSkeleton />
                </motion.div>
              ) : (
                <motion.div
                  key="table"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        {table.getHeaderGroups().map((headerGroup: HeaderGroup<Pengguna>) => (
                          <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header: Header<Pengguna, unknown>) => (
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
                          table.getRowModel().rows.map((row: Row<Pengguna>) => (
                            <TableRow
                              key={row.id}
                              className="transition-colors hover:bg-muted/50"
                            >
                              {row.getVisibleCells().map((cell: Cell<Pengguna, unknown>) => (
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
                                <Users className="h-8 w-8 mb-2 opacity-50" />
                                <p>Belum ada pengguna</p>
                                <p className="text-sm">Tambahkan pengguna pertama Anda.</p>
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
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
        </motion.div>

        {/* Dialog Edit */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Pengguna</DialogTitle>
              <DialogDescription>
                Ubah data pengguna yang sudah terdaftar di sistem.
              </DialogDescription>
            </DialogHeader>
            {editMutation.isPending ? (
              <FormSkeleton />
            ) : selectedPengguna ? (
              <PenggunaForm
                defaultValues={{
                  nama: selectedPengguna.nama,
                  email: selectedPengguna.email,
                  role: selectedPengguna.role,
                  status: selectedPengguna.status,
                  password: '',
                }}
                onSubmit={handleEditSubmit}
                isSubmitting={editMutation.isPending}
                isEdit
              />
            ) : null}
          </DialogContent>
        </Dialog>

        {/* Dialog Hapus */}
        <DeleteConfirmDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => {
            setIsDeleteDialogOpen(false);
            setSelectedPengguna(null);
          }}
          onConfirm={handleDeleteConfirm}
          isDeleting={deleteMutation.isPending}
          penggunaName={selectedPengguna?.nama || ''}
        />

        {/* Dialog Reset Password */}
        <ResetPasswordDialog
          isOpen={isResetPasswordDialogOpen}
          onClose={() => {
            setIsResetPasswordDialogOpen(false);
            setSelectedPengguna(null);
          }}
          onConfirm={handleResetPassword}
          isResetting={resetPasswordMutation.isPending}
          penggunaName={selectedPengguna?.nama || ''}
        />
      </div>
    </ProtectedRoute>
  );
}
