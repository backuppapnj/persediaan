'use client';

import { CheckCircle, Loader2, Package, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TableSkeleton } from '@/components/ui/skeleton';
import { PurchaseRequest } from '@/lib/api/pembelian';

// Fungsi untuk format tanggal ke Bahasa Indonesia
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

// Fungsi untuk mendapatkan variant badge berdasarkan status
function getStatusVariant(status: string) {
  switch (status) {
    case 'Sudah Dibeli':
      return 'success';
    case 'Diproses Pembelian':
      return 'warning';
    default:
      return 'secondary';
  }
}

interface PembelianTableProps {
  data: PurchaseRequest[];
  isLoading: boolean;
  error: Error | null;
  onRefetch: () => void;
  onMarkAsPurchased: (id: string) => void;
  isMarkingAsPurchased: boolean;
  selectedRequest: PurchaseRequest | null;
  onConfirmMarkAsPurchased: () => void;
  onCancelMarkAsPurchased: () => void;
  onSelectRequest: (request: PurchaseRequest) => void;
}

/**
 * Komponen Tabel Pembelian
 * Menampilkan daftar permintaan pembelian dengan tombol aksi
 */
export function PembelianTable({
  data,
  isLoading,
  error,
  onRefetch,
  onMarkAsPurchased,
  isMarkingAsPurchased,
  selectedRequest,
  onConfirmMarkAsPurchased,
  onCancelMarkAsPurchased,
  onSelectRequest,
}: PembelianTableProps) {
  // Tampilkan error jika terjadi kesalahan
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Terjadi Kesalahan</CardTitle>
          <CardDescription>
            Gagal memuat data permintaan pembelian. Silakan coba lagi nanti.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            {error.message || 'Kesalahan tidak diketahui'}
          </p>
          <Button onClick={onRefetch} className="w-full">
            <RotateCcw className="h-4 w-4 mr-2" />
            Coba Lagi
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Daftar Permintaan Pembelian</CardTitle>
          <CardDescription>
            Total {data.length} permintaan pembelian yang perlu diproses.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead scope="col">ID</TableHead>
                    <TableHead scope="col">Pemohon</TableHead>
                    <TableHead scope="col">Jumlah Item</TableHead>
                    <TableHead scope="col">Items Detail</TableHead>
                    <TableHead scope="col">Status</TableHead>
                    <TableHead scope="col">Tanggal Permintaan</TableHead>
                    <TableHead scope="col" className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.length > 0 ? (
                    data.map((request) => (
                      <TableRow key={request.id_permintaan} className="transition-colors hover:bg-muted/50">
                        <TableCell className="font-mono text-xs font-medium">
                          {request.id_permintaan_encrypted}
                        </TableCell>
                        <TableCell className="font-medium">{request.nama_pemohon}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{request.jumlah_item} item</Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate" title={request.nama_items}>
                          {request.nama_items}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(request.status_permintaan)}>
                            {request.status_permintaan}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(request.tanggal_permintaan)}
                        </TableCell>
                        <TableCell className="text-right">
                          {request.status_permintaan === 'Diproses Pembelian' && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => onSelectRequest(request)}
                              disabled={isMarkingAsPurchased}
                              className="gap-1"
                            >
                              {isMarkingAsPurchased && selectedRequest?.id_permintaan === request.id_permintaan ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle className="h-4 w-4" />
                              )}
                              Mark as Purchased
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <Package className="h-8 w-8 mb-2 opacity-50" />
                          <p>Belum ada permintaan pembelian</p>
                          <p className="text-sm">Permintaan akan muncul di sini setelah ada permintaan baru</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Konfirmasi Mark as Purchased */}
      <AlertDialog open={!!selectedRequest} onOpenChange={(open) => !open && onCancelMarkAsPurchased()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tandai sebagai Sudah Dibeli?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menandai permintaan dari{' '}
              <strong>{selectedRequest?.nama_pemohon}</strong> dengan{' '}
              <strong>{selectedRequest?.jumlah_item} item</strong> sebagai sudah dibeli?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={onCancelMarkAsPurchased}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirmMarkAsPurchased}
              disabled={isMarkingAsPurchased}
              className="bg-green-600 hover:bg-green-700"
            >
              {isMarkingAsPurchased && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Ya, Sudah Dibeli
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
