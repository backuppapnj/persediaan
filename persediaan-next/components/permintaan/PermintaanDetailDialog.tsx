'use client';

import { Printer, Check, XCircle, Clock, Truck, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Permintaan, getStatusVariant, getStatusLabel } from '@/lib/api/permintaan';

interface UserData {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface PermintaanDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  permintaan: Permintaan | null;
  userList: UserData[];
}

export default function PermintaanDetailDialog({
  isOpen,
  onClose,
  permintaan,
  userList,
}: PermintaanDetailDialogProps) {
  if (!permintaan) return null;

  const handlePrint = () => {
    window.print();
  };

  const getUserById = (userId: string) => {
    return userList.find((u) => u.id === userId);
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
              <Label className="text-sm text-muted-foreground">Tanggal</Label>
              <p className="font-medium mt-1">
                {new Date(permintaan.tanggal).toLocaleDateString('id-ID')}
              </p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Departemen</Label>
              <p className="font-medium mt-1">{permintaan.departemen}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Keperluan</Label>
              <p className="font-medium mt-1">{permintaan.keperluan}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Dibuat Oleh</Label>
              <div className="flex items-center gap-2 mt-1">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={getUserById(permintaan.createdBy)?.avatar} />
                  <AvatarFallback>
                    {permintaan.createdByName?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{permintaan.createdByName}</span>
              </div>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Status</Label>
              <div className="mt-1">
                <Badge variant={getStatusVariant(permintaan.status)}>
                  {getStatusLabel(permintaan.status)}
                </Badge>
              </div>
            </div>
            {permintaan.approvedBy && (
              <>
                <div>
                  <Label className="text-sm text-muted-foreground">Disetujui Oleh</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={getUserById(permintaan.approvedBy)?.avatar} />
                      <AvatarFallback>
                        {permintaan.approvedByName?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{permintaan.approvedByName}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Tanggal Persetujuan</Label>
                  <p className="font-medium mt-1">
                    {permintaan.approvedAt
                      ? new Date(permintaan.approvedAt).toLocaleDateString('id-ID')
                      : '-'}
                  </p>
                </div>
              </>
            )}
            {permintaan.dikeluarkanBy && (
              <>
                <div>
                  <Label className="text-sm text-muted-foreground">Dikeluarkan Oleh</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={getUserById(permintaan.dikeluarkanBy)?.avatar} />
                      <AvatarFallback>
                        {permintaan.dikeluarkanByName?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">
                      {permintaan.dikeluarkanByName}
                    </span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Tanggal Pengeluaran</Label>
                  <p className="font-medium mt-1">
                    {permintaan.dikeluarkanAt
                      ? new Date(permintaan.dikeluarkanAt).toLocaleDateString('id-ID')
                      : '-'}
                  </p>
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
                  <TableHead scope="col" className="text-right">
                    Jumlah Diminta
                  </TableHead>
                  <TableHead scope="col" className="text-right">
                    Jumlah Dikeluarkan
                  </TableHead>
                  <TableHead scope="col">Satuan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {permintaan.details.map((detail) => (
                  <TableRow key={detail.id}>
                    <TableCell>{detail.barang.kode}</TableCell>
                    <TableCell>{detail.barang.nama}</TableCell>
                    <TableCell className="text-right">{detail.jumlah}</TableCell>
                    <TableCell className="text-right">
                      {detail.jumlahDikeluarkan}
                    </TableCell>
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
                      <div
                        className={`rounded-full p-1 ${
                          history.status === 'disetujui'
                            ? 'bg-green-100'
                            : history.status === 'dikeluarkan'
                            ? 'bg-blue-100'
                            : history.status === 'ditolak'
                            ? 'bg-red-100'
                            : history.status === 'menunggu'
                            ? 'bg-yellow-100'
                            : 'bg-gray-100'
                        }`}
                      >
                        {history.status === 'disetujui' ? (
                          <Check className="h-3 w-3 text-green-600" />
                        ) : history.status === 'dikeluarkan' ? (
                          <Truck className="h-3 w-3 text-blue-600" />
                        ) : history.status === 'ditolak' ? (
                          <XCircle className="h-3 w-3 text-red-600" />
                        ) : history.status === 'menunggu' ? (
                          <Clock className="h-3 w-3 text-yellow-600" />
                        ) : (
                          <Clock className="h-3 w-3 text-gray-600" />
                        )}
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
                      <p className="text-sm text-muted-foreground">
                        Oleh: {history.createdByName}
                      </p>
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
              <Label className="text-sm text-muted-foreground">Keterangan</Label>
              <p className="mt-1">{permintaan.keterangan}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
