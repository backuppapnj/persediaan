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
import { useAuth } from '@/hooks/useAuth';
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
  Calendar,
  Building2,
  Check,
  XCircle,
  Clock,
  History,
  Truck,
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
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { TableSkeleton, FormSkeleton } from '@/components/ui/skeleton';

// Schema untuk detail barang dalam permintaan
const detailBarangSchema = z.object({
  barangId: z.string().min(1, 'Pilih barang'),
  jumlah: z.number().min(1, 'Jumlah minimal 1'),
  keterangan: z.string().optional(),
});

// Schema untuk status history
const statusHistorySchema = z.object({
  id: z.string(),
  status: z.string(),
  catatan: z.string().optional(),
  createdAt: z.string(),
  createdBy: z.string(),
  createdByName: z.string().optional(),
});

// Schema validasi Zod untuk form permintaan
const permintaanSchema = z.object({
  tanggal: z.string().min(1, 'Tanggal tidak boleh kosong'),
  departemen: z.string().min(2, 'Nama departemen minimal 2 karakter'),
  keperluan: z.string().min(5, 'Keperluan minimal 5 karakter'),
  keterangan: z.string().optional(),
  details: z.array(detailBarangSchema).min(1, 'Minimal harus ada satu barang'),
});

// Schema untuk approval
const approvalSchema = z.object({
  catatan: z.string().optional(),
});

type PermintaanFormValues = z.infer<typeof permintaanSchema>;
type DetailBarangFormValues = z.infer<typeof detailBarangSchema>;
type ApprovalFormValues = z.infer<typeof approvalSchema>;
type StatusHistory = z.infer<typeof statusHistorySchema>;

// Interface untuk data Barang (untuk dropdown)
interface Barang {
  id: string;
  nama: string;
  kode: string;
  satuan: string;
  stok: number;
}

// Interface untuk User
interface UserData {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

// Interface untuk detail permintaan
interface PermintaanDetail {
  id: string;
  barangId: string;
  barang: Barang;
  jumlah: number;
  jumlahDikeluarkan: number;
  keterangan?: string;
}

// Interface untuk permintaan
interface Permintaan {
  id: string;
  nomor: string;
  tanggal: string;
  departemen: string;
  keperluan: string;
  keterangan?: string;
  status: 'draft' | 'menunggu_persetujuan' | 'disetujui' | 'dikeluarkan' | 'ditolak';
  details: PermintaanDetail[];
  statusHistory: StatusHistory[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  createdByName: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  dikeluarkanBy?: string;
  dikeluarkanByName?: string;
  dikeluarkanAt?: string;
}

// Interface untuk response API
interface PermintaanResponse {
  data: Permintaan[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Interface untuk response list barang
interface BarangListResponse {
  data: Barang[];
}

// Interface untuk response list user
interface UserListResponse {
  data: UserData[];
}

// Fungsi untuk mendapatkan variant badge berdasarkan status
function getStatusVariant(status: string) {
  switch (status) {
    case 'dikeluarkan':
      return 'success';
    case 'disetujui':
      return 'success';
    case 'draft':
      return 'warning';
    case 'menunggu_persetujuan':
      return 'secondary';
    case 'ditolak':
      return 'destructive';
    default:
      return 'secondary';
  }
}

// Fungsi untuk mendapatkan label status
function getStatusLabel(status: string) {
  switch (status) {
    case 'dikeluarkan':
      return 'Dikeluarkan';
    case 'disetujui':
      return 'Disetujui';
    case 'draft':
      return 'Draft';
    case 'menunggu_persetujuan':
      return 'Menunggu Persetujuan';
    case 'ditolak':
      return 'Ditolak';
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
      <div className="col-span-4">
        <Label>Barang</Label>
        <Select
          value={detail.barangId}
          onValueChange={(value) => {
            onUpdate(index, 'barangId', value);
          }}
          disabled={disabled}
        >
          <SelectTrigger className="w-full mt-1">
            <SelectValue placeholder="Pilih barang" />
          </SelectTrigger>
          <SelectContent>
            {barangList.map((barang) => (
              <SelectItem key={barang.id} value={barang.id}>
                {barang.kode} - {barang.nama} (Stok: {barang.stok})
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
          }}
          disabled={disabled}
          min={1}
        />
      </div>
      <div className="col-span-1">
        <Label>Satuan</Label>
        <Input
          className="mt-1"
          value={selectedBarang?.satuan || ''}
          disabled
        />
      </div>
      <div className="col-span-3">
        <Label>Keterangan</Label>
        <Input
          className="mt-1"
          value={detail.keterangan || ''}
          onChange={(e) => onUpdate(index, 'keterangan', e.target.value)}
          disabled={disabled}
          placeholder="Opsional"
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

// Komponen Form Tambah Permintaan
function PermintaanForm({
  onSubmit,
  isSubmitting,
  barangList,
}: {
  onSubmit: (values: PermintaanFormValues) => void;
  isSubmitting: boolean;
  barangList: Barang[];
}) {
  const [details, setDetails] = useState<DetailBarangFormValues[]>([
    { barangId: '', jumlah: 1, keterangan: '' }
  ]);

  const form = useForm<Omit<PermintaanFormValues, 'details'>>({
    resolver: zodResolver(permintaanSchema.omit({ details: true })),
    defaultValues: {
      tanggal: new Date().toISOString().split('T')[0],
      departemen: '',
      keperluan: '',
      keterangan: '',
    },
  });

  const addDetail = () => {
    setDetails([...details, { barangId: '', jumlah: 1, keterangan: '' }]);
  };

  const updateDetail = (index: number, field: keyof DetailBarangFormValues, value: string | number) => {
    // Cek duplicate jika field yang diupdate adalah barangId
    if (field === 'barangId') {
      const isDuplicate = details.some((d, i) => i !== index && d.barangId === value);
      if (isDuplicate && value !== '') {
        toast.warning('Barang ini sudah ada dalam daftar');
        return;
      }
    }

    const newDetails = [...details];
    newDetails[index] = { ...newDetails[index], [field]: value };
    setDetails(newDetails);
  };

  const removeDetail = (index: number) => {
    if (details.length > 1) {
      setDetails(details.filter((_, i) => i !== index));
    } else {
      toast.warning('Tidak dapat menghapus item terakhir, minimal harus ada satu barang');
    }
  };

  const handleSubmit = form.handleSubmit((values) => {
    const validDetails = details.filter(d => d.barangId && d.jumlah > 0);

    // Cek duplicate barangId
    const barangIds = validDetails.map(d => d.barangId);
    const hasDuplicate = new Set(barangIds).size !== barangIds.length;
    if (hasDuplicate) {
      toast.error('Terdapat barang yang sama dalam daftar, silakan hapus duplikat');
      return;
    }

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
            name="departemen"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Departemen
                </FormLabel>
                <FormControl>
                  <Input placeholder="Nama departemen" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="keperluan"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Keperluan</FormLabel>
              <FormControl>
                <Textarea placeholder="Keperluan pengambilan barang" {...field} />
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
              <FormLabel>Keterangan Tambahan (Opsional)</FormLabel>
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
        </div>

        <DialogFooter>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Menyimpan...' : 'Simpan Permintaan'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

// Form untuk Approval
function ApprovalForm({
  onSubmit,
  isSubmitting,
  action,
}: {
  onSubmit: (values: ApprovalFormValues) => void;
  isSubmitting: boolean;
  action: 'approve' | 'reject' | 'issue';
}) {
  const form = useForm<ApprovalFormValues>({
    resolver: zodResolver(approvalSchema),
    defaultValues: {
      catatan: '',
    },
  });

  const getButtonText = () => {
    switch (action) {
      case 'approve': return 'Setujui Permintaan';
      case 'reject': return 'Tolak Permintaan';
      case 'issue': return 'Keluarkan Barang';
      default: return 'Proses';
    }
  };

  const getVariant = () => {
    switch (action) {
      case 'approve': return 'default';
      case 'reject': return 'destructive';
      case 'issue': return 'default';
      default: return 'default';
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="catatan"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Catatan (Opsional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Tambahkan catatan" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button
            type="submit"
            disabled={isSubmitting}
            variant={getVariant()}
            className="w-full"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Memproses...' : getButtonText()}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

// Dialog untuk melihat detail permintaan
function DetailDialog({
  isOpen,
  onClose,
  permintaan,
  userList,
}: {
  isOpen: boolean;
  onClose: () => void;
  permintaan: Permintaan | null;
  userList: UserData[];
}) {
  if (!permintaan) return null;

  const handlePrint = () => {
    window.print();
  };

  const getUserById = (userId: string) => {
    return userList.find(u => u.id === userId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Detail Permintaan Barang</DialogTitle>
            <Button variant="ghost" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-1" />
              Cetak
            </Button>
          </div>
          <DialogDescription>
            Nomor Permintaan: {permintaan.nomor}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Info Header */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Tanggal</p>
              <p className="font-medium">{new Date(permintaan.tanggal).toLocaleDateString('id-ID')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Departemen</p>
              <p className="font-medium">{permintaan.departemen}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Keperluan</p>
              <p className="font-medium">{permintaan.keperluan}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Dibuat Oleh</p>
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={getUserById(permintaan.createdBy)?.avatar} />
                  <AvatarFallback>{permintaan.createdByName?.charAt(0) || '?'}</AvatarFallback>
                </Avatar>
                <span className="font-medium">{permintaan.createdByName}</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={getStatusVariant(permintaan.status)}>
                {getStatusLabel(permintaan.status)}
              </Badge>
            </div>
            {permintaan.approvedBy && (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Disetujui Oleh</p>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={getUserById(permintaan.approvedBy)?.avatar} />
                      <AvatarFallback>{permintaan.approvedByName?.charAt(0) || '?'}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{permintaan.approvedByName}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tanggal Persetujuan</p>
                  <p className="font-medium">{permintaan.approvedAt ? new Date(permintaan.approvedAt).toLocaleDateString('id-ID') : '-'}</p>
                </div>
              </>
            )}
            {permintaan.dikeluarkanBy && (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Dikeluarkan Oleh</p>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={getUserById(permintaan.dikeluarkanBy)?.avatar} />
                      <AvatarFallback>{permintaan.dikeluarkanByName?.charAt(0) || '?'}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{permintaan.dikeluarkanByName}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tanggal Pengeluaran</p>
                  <p className="font-medium">{permintaan.dikeluarkanAt ? new Date(permintaan.dikeluarkanAt).toLocaleDateString('id-ID') : '-'}</p>
                </div>
              </>
            )}
          </div>

          {/* Detail Barang Table */}
          <div>
            <h4 className="font-semibold mb-3">Daftar Barang</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">Kode</TableHead>
                  <TableHead scope="col">Nama Barang</TableHead>
                  <TableHead scope="col" className="text-right">Jumlah Diminta</TableHead>
                  <TableHead scope="col" className="text-right">Jumlah Dikeluarkan</TableHead>
                  <TableHead scope="col">Satuan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {permintaan.details.map((detail) => (
                  <TableRow key={detail.id}>
                    <TableCell>{detail.barang.kode}</TableCell>
                    <TableCell>{detail.barang.nama}</TableCell>
                    <TableCell className="text-right">{detail.jumlah}</TableCell>
                    <TableCell className="text-right">{detail.jumlahDikeluarkan}</TableCell>
                    <TableCell>{detail.barang.satuan}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Status History */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <History className="h-4 w-4" />
              Riwayat Status
            </h4>
            <ScrollArea className="h-48 rounded-md border">
              <div className="p-4 space-y-4">
                {permintaan.statusHistory.map((history, index) => (
                  <div key={history.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`rounded-full p-1 ${
                        history.status === 'disetujui' ? 'bg-green-100' :
                        history.status === 'dikeluarkan' ? 'bg-blue-100' :
                        history.status === 'ditolak' ? 'bg-red-100' :
                        history.status === 'menunggu' ? 'bg-yellow-100' : 'bg-gray-100'
                      }`}>
                        {history.status === 'disetujui' ? <Check className="h-3 w-3 text-green-600" /> :
                         history.status === 'dikeluarkan' ? <Truck className="h-3 w-3 text-blue-600" /> :
                         history.status === 'ditolak' ? <XCircle className="h-3 w-3 text-red-600" /> :
                         history.status === 'menunggu' ? <Clock className="h-3 w-3 text-yellow-600" /> :
                         <Clock className="h-3 w-3 text-gray-600" />}
                      </div>
                      {index < permintaan.statusHistory.length - 1 && (
                        <div className="w-0.5 h-full bg-gray-200 mt-1"></div>
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{getStatusLabel(history.status)}</p>
                        <span className="text-sm text-muted-foreground">
                          {new Date(history.createdAt).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">Oleh: {history.createdByName}</p>
                      {history.catatan && (
                        <p className="text-sm mt-1 italic">"{history.catatan}"</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {permintaan.keterangan && (
            <div>
              <p className="text-sm text-muted-foreground">Keterangan</p>
              <p>{permintaan.keterangan}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Dialog untuk Approval
function ApprovalDialog({
  isOpen,
  onClose,
  permintaan,
  onSubmit,
  isSubmitting,
  action,
}: {
  isOpen: boolean;
  onClose: () => void;
  permintaan: Permintaan | null;
  onSubmit: (values: ApprovalFormValues) => void;
  isSubmitting: boolean;
  action: 'approve' | 'reject' | 'issue';
}) {
  if (!permintaan) return null;

  const getTitle = () => {
    switch (action) {
      case 'approve': return 'Setujui Permintaan Barang';
      case 'reject': return 'Tolak Permintaan Barang';
      case 'issue': return 'Keluarkan Barang Permintaan';
      default: return 'Proses Permintaan';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>
            Permintaan: {permintaan.nomor} - {permintaan.departemen}
          </DialogDescription>
        </DialogHeader>
        <ApprovalForm
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          action={action}
        />
      </DialogContent>
    </Dialog>
  );
}

// Fungsi untuk mengambil data permintaan dari API
async function fetchPermintaan(
  page: number,
  limit: number,
  search?: string,
  startDate?: string,
  endDate?: string,
  status?: string,
  userId?: string
): Promise<PermintaanResponse> {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  if (search) params.append('search', search);
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  if (status) params.append('status', status);
  if (userId) params.append('userId', userId);

  const response = await api.get<PermintaanResponse>(`/permintaan?${params.toString()}`);
  return response;
}

// Fungsi untuk mengambil daftar barang untuk dropdown
async function fetchBarangs(): Promise<BarangListResponse> {
  const response = await api.get<BarangListResponse>('/barang?limit=1000');
  return response;
}

// Fungsi untuk mengambil daftar user
async function fetchUsers(): Promise<UserListResponse> {
  const response = await api.get<UserListResponse>('/users?limit=1000');
  return response;
}

// Komponen utama halaman Permintaan
export default function PermintaanPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isIssueDialogOpen, setIsIssueDialogOpen] = useState(false);
  const [selectedPermintaan, setSelectedPermintaan] = useState<Permintaan | null>(null);
  const limit = 10;

  // Reset page when search changes
  useEffect(() => {
    if (search !== '') {
      setPage(1);
    }
  }, [search]);

  // Query untuk mengambil data permintaan
  const { data, isPending, error, refetch } = useQuery({
    queryKey: ['permintaan', page, debouncedSearch, startDate, endDate, statusFilter, userFilter],
    queryFn: () => fetchPermintaan(page, limit, debouncedSearch, startDate, endDate, statusFilter, userFilter),
    staleTime: 5 * 60 * 1000,
  });

  // Query untuk mengambil daftar barang
  const { data: barangListData } = useQuery({
    queryKey: ['barangs-list'],
    queryFn: fetchBarangs,
    staleTime: 10 * 60 * 1000,
  });

  // Query untuk mengambil daftar user
  const { data: userListData } = useQuery({
    queryKey: ['users-list'],
    queryFn: fetchUsers,
    staleTime: 10 * 60 * 1000,
  });

  // Mutation untuk menambah permintaan baru
  const addMutation = useMutation({
    mutationFn: async (values: PermintaanFormValues) => {
      return await api.post<Permintaan>('/permintaan', values);
    },
    onMutate: async (newPermintaan) => {
      await queryClient.cancelQueries({ queryKey: ['permintaan', page, search, startDate, endDate, statusFilter, userFilter] });
      const previousData = queryClient.getQueryData<PermintaanResponse>(['permintaan', page, search, startDate, endDate, statusFilter, userFilter]);

      if (previousData) {
        const barangList = barangListData?.data || [];
        const optimisticPermintaan: Permintaan = {
          ...newPermintaan,
          id: `temp-${Date.now()}`,
          nomor: `PR-${Date.now()}`,
          status: 'draft',
          details: newPermintaan.details.map((d, i) => ({
            ...d,
            id: `temp-detail-${i}`,
            jumlahDikeluarkan: 0,
            barang: barangList.find(b => b.id === d.barangId) || {
              id: d.barangId,
              nama: 'Loading...',
              kode: '-',
              satuan: '-',
              stok: 0
            },
          })),
          statusHistory: [{
            id: `temp-history-1`,
            status: 'draft',
            createdAt: new Date().toISOString(),
            createdBy: user?.id || 'unknown',
            createdByName: user?.name || 'Unknown User',
          }],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: user?.id || 'unknown',
          createdByName: user?.name || 'Unknown User',
        };
        queryClient.setQueryData(['permintaan', page, search, startDate, endDate, statusFilter, userFilter], {
          ...previousData,
          data: [optimisticPermintaan, ...previousData.data],
          total: previousData.total + 1,
        });
      }
      return { previousData };
    },
    onSuccess: () => {
      toast.success('Permintaan barang berhasil ditambahkan!');
    },
    onError: (err, _, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['permintaan', page, search, startDate, endDate, statusFilter, userFilter], context.previousData);
      }
      toast.error('Gagal menambahkan permintaan. Silakan coba lagi.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['permintaan', page, search, startDate, endDate, statusFilter, userFilter] });
      setIsAddDialogOpen(false);
    },
  });

  // Mutation untuk approve
  const approveMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: ApprovalFormValues }) => {
      return await api.post<Permintaan>(`/permintaan/${id}/approve`, values);
    },
    onMutate: async ({ id, values }) => {
      await queryClient.cancelQueries({ queryKey: ['permintaan', page, search, startDate, endDate, statusFilter, userFilter] });
      const previousData = queryClient.getQueryData<PermintaanResponse>(['permintaan', page, search, startDate, endDate, statusFilter, userFilter]);

      if (previousData && user) {
        const updatedData = previousData.data.map(item => {
          if (item.id === id) {
            return {
              ...item,
              status: 'disetujui' as const,
              approvedBy: user.id,
              approvedByName: user.name,
              approvedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              statusHistory: [
                ...item.statusHistory,
                {
                  id: `temp-history-${Date.now()}`,
                  status: 'disetujui',
                  catatan: values.catatan,
                  createdAt: new Date().toISOString(),
                  createdBy: user.id,
                  createdByName: user.name,
                }
              ]
            };
          }
          return item;
        });
        queryClient.setQueryData(['permintaan', page, search, startDate, endDate, statusFilter, userFilter], {
          ...previousData,
          data: updatedData,
        });
      }
      return { previousData };
    },
    onSuccess: () => {
      toast.success('Permintaan barang berhasil disetujui!');
    },
    onError: (err, _, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['permintaan', page, search, startDate, endDate, statusFilter, userFilter], context.previousData);
      }
      toast.error('Gagal menyetujui permintaan. Silakan coba lagi.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['permintaan', page, search, startDate, endDate, statusFilter, userFilter] });
      setIsApproveDialogOpen(false);
      setSelectedPermintaan(null);
    },
  });

  // Mutation untuk reject
  const rejectMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: ApprovalFormValues }) => {
      return await api.post<Permintaan>(`/permintaan/${id}/reject`, values);
    },
    onMutate: async ({ id, values }) => {
      await queryClient.cancelQueries({ queryKey: ['permintaan', page, search, startDate, endDate, statusFilter, userFilter] });
      const previousData = queryClient.getQueryData<PermintaanResponse>(['permintaan', page, search, startDate, endDate, statusFilter, userFilter]);

      if (previousData && user) {
        const updatedData = previousData.data.map(item => {
          if (item.id === id) {
            return {
              ...item,
              status: 'ditolak' as const,
              updatedAt: new Date().toISOString(),
              statusHistory: [
                ...item.statusHistory,
                {
                  id: `temp-history-${Date.now()}`,
                  status: 'ditolak',
                  catatan: values.catatan,
                  createdAt: new Date().toISOString(),
                  createdBy: user.id,
                  createdByName: user.name,
                }
              ]
            };
          }
          return item;
        });
        queryClient.setQueryData(['permintaan', page, search, startDate, endDate, statusFilter, userFilter], {
          ...previousData,
          data: updatedData,
        });
      }
      return { previousData };
    },
    onSuccess: () => {
      toast.success('Permintaan barang telah ditolak.');
    },
    onError: (err, _, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['permintaan', page, search, startDate, endDate, statusFilter, userFilter], context.previousData);
      }
      toast.error('Gagal menolak permintaan. Silakan coba lagi.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['permintaan', page, search, startDate, endDate, statusFilter, userFilter] });
      setIsRejectDialogOpen(false);
      setSelectedPermintaan(null);
    },
  });

  // Mutation untuk issue (mengeluarkan barang)
  const issueMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: ApprovalFormValues }) => {
      return await api.post<Permintaan>(`/permintaan/${id}/issue`, values);
    },
    onMutate: async ({ id, values }) => {
      await queryClient.cancelQueries({ queryKey: ['permintaan', page, search, startDate, endDate, statusFilter, userFilter] });
      const previousData = queryClient.getQueryData<PermintaanResponse>(['permintaan', page, search, startDate, endDate, statusFilter, userFilter]);

      if (previousData && user) {
        const updatedData = previousData.data.map(item => {
          if (item.id === id) {
            const updatedDetails = item.details.map(d => ({
              ...d,
              jumlahDikeluarkan: d.jumlah
            }));
            return {
              ...item,
              status: 'dikeluarkan' as const,
              dikeluarkanBy: user.id,
              dikeluarkanByName: user.name,
              dikeluarkanAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              details: updatedDetails,
              statusHistory: [
                ...item.statusHistory,
                {
                  id: `temp-history-${Date.now()}`,
                  status: 'dikeluarkan',
                  catatan: values.catatan,
                  createdAt: new Date().toISOString(),
                  createdBy: user.id,
                  createdByName: user.name,
                }
              ]
            };
          }
          return item;
        });
        queryClient.setQueryData(['permintaan', page, search, startDate, endDate, statusFilter, userFilter], {
          ...previousData,
          data: updatedData,
        });
      }
      return { previousData };
    },
    onSuccess: () => {
      toast.success('Barang permintaan berhasil dikeluarkan!');
    },
    onError: (err, _, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['permintaan', page, search, startDate, endDate, statusFilter, userFilter], context.previousData);
      }
      toast.error('Gagal mengeluarkan barang. Silakan coba lagi.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['permintaan', page, search, startDate, endDate, statusFilter, userFilter] });
      setIsIssueDialogOpen(false);
      setSelectedPermintaan(null);
    },
  });

  // Mutation untuk submit untuk persetujuan (ubah status dari draft ke menunggu)
  const submitForApprovalMutation = useMutation({
    mutationFn: async (id: string) => {
      return await api.post<Permintaan>(`/permintaan/${id}/submit`);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['permintaan', page, search, startDate, endDate, statusFilter, userFilter] });
      const previousData = queryClient.getQueryData<PermintaanResponse>(['permintaan', page, search, startDate, endDate, statusFilter, userFilter]);

      if (previousData && user) {
        const updatedData = previousData.data.map(item => {
          if (item.id === id) {
            return {
              ...item,
              status: 'menunggu_persetujuan' as const,
              updatedAt: new Date().toISOString(),
              statusHistory: [
                ...item.statusHistory,
                {
                  id: `temp-history-${Date.now()}`,
                  status: 'menunggu',
                  createdAt: new Date().toISOString(),
                  createdBy: user.id,
                  createdByName: user.name,
                }
              ]
            };
          }
          return item;
        });
        queryClient.setQueryData(['permintaan', page, search, startDate, endDate, statusFilter, userFilter], {
          ...previousData,
          data: updatedData,
        });
      }
      return { previousData };
    },
    onSuccess: () => {
      toast.success('Permintaan barang telah dikirim untuk persetujuan!');
    },
    onError: (err, _, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['permintaan', page, search, startDate, endDate, statusFilter, userFilter], context.previousData);
      }
      toast.error('Gagal mengirim permintaan. Silakan coba lagi.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['permintaan', page, search, startDate, endDate, statusFilter, userFilter] });
    },
  });

  // Handler submit form tambah
  const handleAddSubmit = (values: PermintaanFormValues) => {
    addMutation.mutate(values);
  };

  // Handler approve
  const handleApproveSubmit = (values: ApprovalFormValues) => {
    if (selectedPermintaan) {
      approveMutation.mutate({ id: selectedPermintaan.id, values });
    }
  };

  // Handler reject
  const handleRejectSubmit = (values: ApprovalFormValues) => {
    if (selectedPermintaan) {
      rejectMutation.mutate({ id: selectedPermintaan.id, values });
    }
  };

  // Handler issue
  const handleIssueSubmit = (values: ApprovalFormValues) => {
    if (selectedPermintaan) {
      issueMutation.mutate({ id: selectedPermintaan.id, values });
    }
  };

  // Definisi kolom untuk Data Table
  const columns: ColumnDef<Permintaan>[] = [
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
      accessorKey: 'departemen',
      header: 'Departemen',
    },
    {
      accessorKey: 'keperluan',
      header: 'Keperluan',
      cell: ({ row }) => {
        const keperluan = row.getValue('keperluan') as string;
        return <span className="text-sm truncate max-w-[200px] block">{keperluan}</span>;
      },
    },
    {
      accessorKey: 'createdByName',
      header: 'Dibuat Oleh',
      cell: ({ row }) => {
        const createdByName = row.getValue('createdByName') as string;
        return <span className="text-sm">{createdByName}</span>;
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
        const permintaan = row.original;
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedPermintaan(permintaan);
                setIsDetailDialogOpen(true);
              }}
              className="h-8 w-8 p-0"
              aria-label={`Lihat detail ${permintaan.nomor}`}
            >
              <Eye className="h-4 w-4" />
            </Button>
            {permintaan.status === 'draft' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  submitForApprovalMutation.mutate(permintaan.id);
                }}
                className="h-8 w-8 p-0"
                aria-label={`Kirim ${permintaan.nomor} untuk persetujuan`}
                disabled={submitForApprovalMutation.isPending}
              >
                <Clock className="h-4 w-4 text-yellow-600" />
              </Button>
            )}
            {permintaan.status === 'menunggu_persetujuan' && user && 'role' in user && user.role === 'approver' && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedPermintaan(permintaan);
                    setIsApproveDialogOpen(true);
                  }}
                  className="h-8 w-8 p-0"
                  aria-label={`Setujui ${permintaan.nomor}`}
                >
                  <Check className="h-4 w-4 text-green-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedPermintaan(permintaan);
                    setIsRejectDialogOpen(true);
                  }}
                  className="h-8 w-8 p-0"
                  aria-label={`Tolak ${permintaan.nomor}`}
                >
                  <XCircle className="h-4 w-4 text-red-600" />
                </Button>
              </>
            )}
            {permintaan.status === 'disetujui' && user && 'role' in user && user.role === 'warehouse' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedPermintaan(permintaan);
                  setIsIssueDialogOpen(true);
                }}
                className="h-8 w-8 p-0"
                aria-label={`Keluarkan barang ${permintaan.nomor}`}
              >
                <Truck className="h-4 w-4 text-blue-600" />
              </Button>
            )}
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
                Gagal memuat data permintaan barang. Silakan coba lagi nanti.
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
            <h2 className="text-3xl font-bold tracking-tight">Permintaan</h2>
            <p className="text-muted-foreground">
              Kelola permintaan dan pengeluaran barang inventaris.
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 transition-all duration-300 hover:scale-105">
                <Plus className="h-4 w-4" />
                Tambah Permintaan
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Tambah Permintaan Barang Baru</DialogTitle>
                <DialogDescription>
                  Masukkan data permintaan barang untuk diproses.
                </DialogDescription>
              </DialogHeader>
              {addMutation.isPending ? (
                <FormSkeleton />
              ) : (
                <PermintaanForm
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
            <CardTitle>Daftar Permintaan Barang</CardTitle>
            <CardDescription>
              Total {data?.total || 0} permintaan tercatat di sistem.
            </CardDescription>
            {/* Filter dan Search */}
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari permintaan..."
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
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-auto min-w-[180px]">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="menunggu">Menunggu</SelectItem>
                  <SelectItem value="disetujui">Disetujui</SelectItem>
                  <SelectItem value="dikeluarkan">Dikeluarkan</SelectItem>
                  <SelectItem value="ditolak">Ditolak</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={userFilter}
                onValueChange={(value) => {
                  setUserFilter(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-auto min-w-[180px]">
                  <SelectValue placeholder="Filter pengguna" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua Pengguna</SelectItem>
                  {userListData?.data.map((user) => (
                    <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(search || startDate || endDate || statusFilter || userFilter) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearch('');
                    setStartDate('');
                    setEndDate('');
                    setStatusFilter('');
                    setUserFilter('');
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
                      {table.getHeaderGroups().map((headerGroup: HeaderGroup<Permintaan>) => (
                        <TableRow key={headerGroup.id}>
                          {headerGroup.headers.map((header: Header<Permintaan, unknown>) => (
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
                        table.getRowModel().rows.map((row: Row<Permintaan>) => (
                          <TableRow
                            key={row.id}
                            className="transition-colors hover:bg-muted/50"
                          >
                            {row.getVisibleCells().map((cell: Cell<Permintaan, unknown>) => (
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
                              <p>Belum ada permintaan barang</p>
                              <p className="text-sm">Tambahkan permintaan pertama Anda.</p>
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
            setSelectedPermintaan(null);
          }}
          permintaan={selectedPermintaan}
          userList={userListData?.data || []}
        />

        {/* Dialog Approve */}
        <ApprovalDialog
          isOpen={isApproveDialogOpen}
          onClose={() => {
            setIsApproveDialogOpen(false);
            setSelectedPermintaan(null);
          }}
          permintaan={selectedPermintaan}
          onSubmit={handleApproveSubmit}
          isSubmitting={approveMutation.isPending}
          action="approve"
        />

        {/* Dialog Reject */}
        <ApprovalDialog
          isOpen={isRejectDialogOpen}
          onClose={() => {
            setIsRejectDialogOpen(false);
            setSelectedPermintaan(null);
          }}
          permintaan={selectedPermintaan}
          onSubmit={handleRejectSubmit}
          isSubmitting={rejectMutation.isPending}
          action="reject"
        />

        {/* Dialog Issue */}
        <ApprovalDialog
          isOpen={isIssueDialogOpen}
          onClose={() => {
            setIsIssueDialogOpen(false);
            setSelectedPermintaan(null);
          }}
          permintaan={selectedPermintaan}
          onSubmit={handleIssueSubmit}
          isSubmitting={issueMutation.isPending}
          action="issue"
        />
      </div>
    </ProtectedRoute>
  );
}
