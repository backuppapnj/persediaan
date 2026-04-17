'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useDebounce } from '@/hooks/useDebounce';
import { useAuth } from '@/hooks/useAuth';
import { Package, Plus, Search, X, Eye, Clock, Check, XCircle, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
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
import { TableSkeleton } from '@/components/ui/skeleton';
import {
  ColumnDef,
  SortingState,
  ColumnFiltersState,
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
  usePermintaanList,
  useCreatePermintaan,
  useApprovePermintaan,
  useRejectPermintaan,
  useIssuePermintaan,
  useSubmitForApproval,
  useBarangs,
  useUsers,
} from '@/hooks/usePermintaan';
import { Permintaan, getStatusVariant, getStatusLabel } from '@/lib/api/permintaan';
import PermintaanDetailDialog from '@/components/permintaan/PermintaanDetailDialog';
import ApprovalDialog from '@/components/permintaan/ApprovalDialog';
import PermintaanForm from '@/components/permintaan/PermintaanForm';

interface UserData {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export default function PermintaanPage() {
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

  // Reset page ketika search berubah
  useEffect(() => {
    if (search !== '') {
      setPage(1);
    }
  }, [search]);

  // Query untuk mengambil data permintaan
  const { data, isPending, error, refetch } = usePermintaanList({
    page,
    limit,
    search: debouncedSearch,
    startDate,
    endDate,
    status: statusFilter,
    userId: userFilter,
  });

  // Query untuk mengambil daftar barang
  const { data: barangListData } = useBarangs();

  // Query untuk mengambil daftar user
  const { data: userListData } = useUsers();

  // Mutations
  const createMutation = useCreatePermintaan();
  const approveMutation = useApprovePermintaan();
  const rejectMutation = useRejectPermintaan();
  const issueMutation = useIssuePermintaan();
  const submitForApprovalMutation = useSubmitForApproval();

  // Handler functions
  const handleAddSubmit = (values: any) => {
    createMutation.mutate(values, {
      onSuccess: () => {
        setIsAddDialogOpen(false);
      },
    });
  };

  const handleApproveSubmit = (values: any) => {
    if (selectedPermintaan) {
      approveMutation.mutate({ id: selectedPermintaan.id, values }, {
        onSuccess: () => {
          setIsApproveDialogOpen(false);
          setSelectedPermintaan(null);
        },
      });
    }
  };

  const handleRejectSubmit = (values: any) => {
    if (selectedPermintaan) {
      rejectMutation.mutate({ id: selectedPermintaan.id, values }, {
        onSuccess: () => {
          setIsRejectDialogOpen(false);
          setSelectedPermintaan(null);
        },
      });
    }
  };

  const handleIssueSubmit = (values: any) => {
    if (selectedPermintaan) {
      issueMutation.mutate({ id: selectedPermintaan.id, values }, {
        onSuccess: () => {
          setIsIssueDialogOpen(false);
          setSelectedPermintaan(null);
        },
      });
    }
  };

  const handleViewDetail = (permintaan: Permintaan) => {
    setSelectedPermintaan(permintaan);
    setIsDetailDialogOpen(true);
  };

  const handleSubmitForApproval = (id: string) => {
    submitForApprovalMutation.mutate(id);
  };

  const handleApprove = (permintaan: Permintaan) => {
    setSelectedPermintaan(permintaan);
    setIsApproveDialogOpen(true);
  };

  const handleReject = (permintaan: Permintaan) => {
    setSelectedPermintaan(permintaan);
    setIsRejectDialogOpen(true);
  };

  const handleIssue = (permintaan: Permintaan) => {
    setSelectedPermintaan(permintaan);
    setIsIssueDialogOpen(true);
  };

  // Definisi kolom tabel
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
        const hasApproverRole = user && 'role' in user && user.role === 'approver';
        const hasWarehouseRole = user && 'role' in user && user.role === 'warehouse';

        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleViewDetail(permintaan)}
              className="h-8 w-8 p-0"
              aria-label={`Lihat detail ${permintaan.nomor}`}
            >
              <Eye className="h-4 w-4" />
            </Button>
            {permintaan.status === 'draft' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSubmitForApproval(permintaan.id)}
                className="h-8 w-8 p-0"
                aria-label={`Kirim ${permintaan.nomor} untuk persetujuan`}
                disabled={submitForApprovalMutation.isPending}
              >
                <Clock className="h-4 w-4 text-yellow-600" />
              </Button>
            )}
            {permintaan.status === 'menunggu_persetujuan' && hasApproverRole && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleApprove(permintaan)}
                  className="h-8 w-8 p-0"
                  aria-label={`Setujui ${permintaan.nomor}`}
                >
                  <Check className="h-4 w-4 text-green-600" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      aria-label={`Tolak ${permintaan.nomor}`}
                    >
                      <XCircle className="h-4 w-4 text-red-600" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Konfirmasi Penolakan</AlertDialogTitle>
                      <AlertDialogDescription>
                        Apakah Anda yakin ingin menolak permintaan ini? Tindakan ini tidak dapat dibatalkan.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Batal</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleReject(permintaan)}>
                        Ya, Tolak
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
            {permintaan.status === 'disetujui' && hasWarehouseRole && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    aria-label={`Keluarkan barang ${permintaan.nomor}`}
                  >
                    <Truck className="h-4 w-4 text-blue-600" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Konfirmasi Pengeluaran Barang</AlertDialogTitle>
                    <AlertDialogDescription>
                      Apakah Anda yakin ingin mengeluarkan barang untuk permintaan ini? Stok barang akan berkurang.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleIssue(permintaan)}>
                      Ya, Keluarkan
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
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
              <PermintaanForm
                onSubmit={handleAddSubmit}
                isSubmitting={createMutation.isPending}
                barangList={barangListData || []}
              />
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
                  {userListData?.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
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
                              <p>Belum ada permintaatan barang</p>
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
        <PermintaanDetailDialog
          isOpen={isDetailDialogOpen}
          onClose={() => {
            setIsDetailDialogOpen(false);
            setSelectedPermintaan(null);
          }}
          permintaan={selectedPermintaan}
          userList={userListData || []}
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
