'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Plus, Search, Loader2, AlertTriangle, Shield, Filter } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { PenggunaTable } from '@/components/pengguna/PenggunaTable';
import {
  usePenggunaList,
  useCreatePengguna,
  useUpdatePengguna,
  useDeletePengguna,
  useRoles,
  useBagian,
} from '@/hooks/usePengguna';
import type { Pengguna, CreatePenggunaValues, UpdatePenggunaValues } from '@/lib/api/pengguna';

// Schema validasi Zod untuk form pengguna
const penggunaSchema = z.object({
  nama_lengkap: z.string().min(2, 'Nama minimal 2 karakter'),
  email: z.string().email('Email tidak valid'),
  username: z.string().min(3, 'Username minimal 3 karakter'),
  password: z.string().min(6, 'Password minimal 6 karakter').optional(),
  id_role: z.coerce.number({ required_error: 'Role harus dipilih' }),
  id_bagian: z.coerce.number().optional(),
  status: z.enum(['aktif', 'nonaktif'], { required_error: 'Status harus dipilih' }),
});

type PenggunaFormValues = z.infer<typeof penggunaSchema>;

// Komponen Form Pengguna (untuk tambah dan edit)
function PenggunaForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  isEdit = false,
  roles,
  bagian,
}: {
  defaultValues?: Partial<PenggunaFormValues>;
  onSubmit: (values: PenggunaFormValues) => void;
  isSubmitting: boolean;
  isEdit?: boolean;
  roles: Array<{ id_role: number; nama_role: string }>;
  bagian: Array<{ id_bagian: number; nama_bagian: string }>;
}) {
  const form = useForm<PenggunaFormValues>({
    resolver: zodResolver(penggunaSchema),
    defaultValues: {
      nama_lengkap: '',
      email: '',
      username: '',
      password: '',
      id_role: undefined,
      id_bagian: undefined,
      status: 'aktif',
      ...defaultValues,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nama_lengkap"
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
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="Username untuk login" {...field} />
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
                <FormLabel>Password</FormLabel>
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
          name="id_role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id_role} value={role.id_role.toString()}>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <span>{role.nama_role}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="id_bagian"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bagian/Departemen</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih bagian (opsional)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="">Tidak ada</SelectItem>
                  {bagian.map((bag) => (
                    <SelectItem key={bag.id_bagian} value={bag.id_bagian.toString()}>
                      {bag.nama_bagian}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
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
                  checked={field.value === 'aktif'}
                  onCheckedChange={(checked) => field.onChange(checked ? 'aktif' : 'nonaktif')}
                />
              </FormControl>
            </FormItem>
          )}
        />
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

// Komponen utama halaman Pengguna
export default function PenggunaPage() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedPengguna, setSelectedPengguna] = useState<Pengguna | null>(null);

  // Query hooks
  const { data: penggunaList, isLoading: isLoadingPengguna } = usePenggunaList();
  const { data: roles, isLoading: isLoadingRoles } = useRoles();
  const { data: bagian, isLoading: isLoadingBagian } = useBagian();

  // Mutation hooks
  const createMutation = useCreatePengguna();
  const updateMutation = useUpdatePengguna();
  const deleteMutation = useDeletePengguna();

  // Filter data berdasarkan search
  const filteredData = penggunaList?.filter((pengguna) =>
    pengguna.nama_lengkap.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    pengguna.email.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    pengguna.username.toLowerCase().includes(debouncedSearch.toLowerCase())
  ) || [];

  // Handler submit form tambah
  const handleAddSubmit = (values: PenggunaFormValues) => {
    createMutation.mutate(values as CreatePenggunaValues, {
      onSuccess: () => {
        setIsAddDialogOpen(false);
      },
    });
  };

  // Handler submit form edit
  const handleEditSubmit = (values: PenggunaFormValues) => {
    if (selectedPengguna) {
      updateMutation.mutate(
        { id: selectedPengguna.id_pengguna_encrypted, data: values as UpdatePenggunaValues },
        {
          onSuccess: () => {
            setIsEditDialogOpen(false);
            setSelectedPengguna(null);
          },
        }
      );
    }
  };

  // Handler konfirmasi hapus
  const handleDeleteConfirm = () => {
    if (selectedPengguna) {
      deleteMutation.mutate(selectedPengguna.id_pengguna_encrypted, {
        onSuccess: () => {
          setIsDeleteDialogOpen(false);
          setSelectedPengguna(null);
        },
      });
    }
  };

  // Handler actions
  const handleView = (pengguna: Pengguna) => {
    setSelectedPengguna(pengguna);
    setIsViewDialogOpen(true);
  };

  const handleEdit = (pengguna: Pengguna) => {
    setSelectedPengguna(pengguna);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (pengguna: Pengguna) => {
    setSelectedPengguna(pengguna);
    setIsDeleteDialogOpen(true);
  };

  // Tampilkan loading saat memuat data awal
  if (isLoadingPengguna || isLoadingRoles || isLoadingBagian) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Memuat data pengguna...</p>
          </div>
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
              {createMutation.isPending ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <PenggunaForm
                  onSubmit={handleAddSubmit}
                  isSubmitting={createMutation.isPending}
                  roles={roles || []}
                  bagian={bagian || []}
                />
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
                Total {filteredData.length} pengguna terdaftar di sistem.
              </CardDescription>
              {/* Search bar */}
              <div className="flex items-center gap-3 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Cari pengguna..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                    aria-label="Cari pengguna"
                  />
                </div>
                <Filter className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <PenggunaTable
                data={filteredData}
                isLoading={false}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
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
            {updateMutation.isPending ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : selectedPengguna ? (
              <PenggunaForm
                defaultValues={{
                  nama_lengkap: selectedPengguna.nama_lengkap,
                  email: selectedPengguna.email,
                  username: selectedPengguna.username,
                  id_role: selectedPengguna.id_role,
                  id_bagian: selectedPengguna.id_bagian,
                  status: selectedPengguna.status,
                  password: '',
                }}
                onSubmit={handleEditSubmit}
                isSubmitting={updateMutation.isPending}
                isEdit
                roles={roles || []}
                bagian={bagian || []}
              />
            ) : null}
          </DialogContent>
        </Dialog>

        {/* Dialog View Detail */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Detail Pengguna</DialogTitle>
              <DialogDescription>
                Informasi lengkap pengguna
              </DialogDescription>
            </DialogHeader>
            {selectedPengguna && (
              <div className="space-y-4">
                <div className="flex items-center gap-4 pb-4 border-b">
                  <div className="h-16 w-16 rounded-full bg-slate-900 flex items-center justify-center text-white text-xl font-semibold">
                    {selectedPengguna.nama_lengkap
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .substring(0, 2)
                      .toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{selectedPengguna.nama_lengkap}</h3>
                    <p className="text-sm text-muted-foreground">{selectedPengguna.email}</p>
                  </div>
                </div>
                <div className="grid gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Username:</span>
                    <span className="font-medium">{selectedPengguna.username}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Role:</span>
                    <Badge variant="outline">{selectedPengguna.nama_role}</Badge>
                  </div>
                  {selectedPengguna.nama_bagian && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bagian:</span>
                      <span className="font-medium">{selectedPengguna.nama_bagian}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge
                      variant={selectedPengguna.status === 'aktif' ? 'default' : 'secondary'}
                      className={selectedPengguna.status === 'aktif' ? 'bg-green-500' : ''}
                    >
                      {selectedPengguna.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Terdaftar:</span>
                    <span className="font-medium">
                      {new Date(selectedPengguna.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  {selectedPengguna.last_login && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Terakhir Login:</span>
                      <span className="font-medium">
                        {new Date(selectedPengguna.last_login).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
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
          penggunaName={selectedPengguna?.nama_lengkap || ''}
        />
      </div>
    </ProtectedRoute>
  );
}
