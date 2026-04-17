'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, X, Calendar, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Barang } from '@/lib/api/permintaan';

const detailBarangSchema = z.object({
  barangId: z.string().min(1, 'Pilih barang'),
  jumlah: z.number().min(1, 'Jumlah minimal 1'),
  keterangan: z.string().optional(),
});

const permintaanSchema = z.object({
  tanggal: z.string().min(1, 'Tanggal tidak boleh kosong'),
  departemen: z.string().min(2, 'Nama departemen minimal 2 karakter'),
  keperluan: z.string().min(5, 'Keperluan minimal 5 karakter'),
  keterangan: z.string().optional(),
});

type DetailBarangFormValues = z.infer<typeof detailBarangSchema>;
type PermintaanFormValues = z.infer<typeof permintaanSchema>;

interface PermintaanFormProps {
  onSubmit: (values: PermintaanFormValues & { details: DetailBarangFormValues[] }) => void;
  isSubmitting: boolean;
  barangList: Barang[];
}

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
  const selectedBarang = barangList.find((b) => b.id === detail.barangId);

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
        <Input className="mt-1" value={selectedBarang?.satuan || ''} disabled />
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

export default function PermintaanForm({
  onSubmit,
  isSubmitting,
  barangList,
}: PermintaanFormProps) {
  const [details, setDetails] = useState<DetailBarangFormValues[]>([
    { barangId: '', jumlah: 1, keterangan: '' },
  ]);

  const form = useForm<PermintaanFormValues>({
    resolver: zodResolver(permintaanSchema),
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

    // Tambahkan validasi stok
    if (field === 'jumlah') {
      const selectedBarang = barangList.find(b => b.id === details[index].barangId);
      if (selectedBarang && Number(value) > selectedBarang.stok) {
        toast.error(`Jumlah melebihi stok tersedia (${selectedBarang.stok})`);
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
    const validDetails = details.filter((d) => d.barangId && d.jumlah > 0);

    // Cek duplicate barangId
    const barangIds = validDetails.map((d) => d.barangId);
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
      </form>
    </Form>
  );
}
