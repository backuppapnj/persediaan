'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Permintaan } from '@/lib/api/permintaan';

const approvalSchema = z.object({
  catatan: z.string().optional(),
});

type ApprovalFormValues = z.infer<typeof approvalSchema>;

interface ApprovalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  permintaan: Permintaan | null;
  onSubmit: (values: ApprovalFormValues) => void;
  isSubmitting: boolean;
  action: 'approve' | 'reject' | 'issue';
}

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
      case 'approve':
        return 'Setujui Permintaan';
      case 'reject':
        return 'Tolak Permintaan';
      case 'issue':
        return 'Keluarkan Barang';
      default:
        return 'Proses';
    }
  };

  const getVariant = () => {
    switch (action) {
      case 'approve':
        return 'default';
      case 'reject':
        return 'destructive';
      case 'issue':
        return 'default';
      default:
        return 'default';
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
          <Button type="submit" disabled={isSubmitting} variant={getVariant()} className="w-full">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Memproses...' : getButtonText()}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export default function ApprovalDialog({
  isOpen,
  onClose,
  permintaan,
  onSubmit,
  isSubmitting,
  action,
}: ApprovalDialogProps) {
  if (!permintaan) return null;

  const getTitle = () => {
    switch (action) {
      case 'approve':
        return 'Setujui Permintaan Barang';
      case 'reject':
        return 'Tolak Permintaan Barang';
      case 'issue':
        return 'Keluarkan Barang Permintaan';
      default:
        return 'Proses Permintaan';
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
        <ApprovalForm onSubmit={onSubmit} isSubmitting={isSubmitting} action={action} />
      </DialogContent>
    </Dialog>
  );
}
