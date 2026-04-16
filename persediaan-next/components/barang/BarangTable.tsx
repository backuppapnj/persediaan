// components/barang/BarangTable.tsx
'use client';

import { Barang } from '@/hooks/useBarang';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, Pencil, Trash2 } from 'lucide-react';

interface BarangTableProps {
  data: Barang[];
  onEdit?: (barang: Barang) => void;
  onDelete?: (barang: Barang) => void;
  isLoading?: boolean;
}

export function BarangTable({ data, onEdit, onDelete, isLoading }: BarangTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <Package className="h-12 w-12 mb-4" />
        <p>Belum ada data barang</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Kode</TableHead>
          <TableHead>Nama Barang</TableHead>
          <TableHead>Kategori</TableHead>
          <TableHead>Satuan</TableHead>
          <TableHead className="text-right">Stok Umum</TableHead>
          <TableHead className="text-right">Stok Perkara</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead className="text-center">Aksi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((barang) => (
          <TableRow key={barang.id_barang}>
            <TableCell className="font-mono text-sm">{barang.kode_barang}</TableCell>
            <TableCell className="font-medium">{barang.nama_barang}</TableCell>
            <TableCell>
              <Badge variant="secondary">{barang.nama_kategori}</Badge>
            </TableCell>
            <TableCell>{barang.nama_satuan}</TableCell>
            <TableCell className="text-right">{barang.stok_umum}</TableCell>
            <TableCell className="text-right">{barang.stok_perkara}</TableCell>
            <TableCell className="text-right font-bold">
              {barang.stok_total}
            </TableCell>
            <TableCell className="text-center">
              <div className="flex items-center justify-center gap-2">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(barang)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(barang)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
