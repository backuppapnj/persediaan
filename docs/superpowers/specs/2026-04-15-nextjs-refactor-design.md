---
date: 2026-04-15
title: Refactor Project Persediaan ke Next.js Frontend + PHP API Backend
status: Approved
author: Claude Code
---

# Spesifikasi Desain Refactor Next.js

## Ringkasan
Memisahkan arsitektur project persediaan ATK menjadi arsitektur terpisah:
- **Backend:** PHP Existing sebagai API JSON murni
- **Frontend:** Next.js 15 App Router sebagai full frontend
- **Database:** MySQL 100% tidak berubah

## Arsitektur Umum

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Next.js App    │────▶│   PHP API       │────▶│  MySQL Database │
│  (Frontend)     │     │  (Existing)     │     │   (Unchanged)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Prinsip Utama
✅ **TIDAK ADA PERUBAHAN** pada logika bisnis, model, query database di PHP
✅ **TIDAK ADA PERUBAHAN** pada struktur tabel, relasi, data
✅ Semua perubahan hanya pada lapisan Controller PHP dan UI Next.js

## Backend API (PHP)

### Perubahan yang Dibutuhkan
1.  Modifikasi `app/core/Controller.php` menambahkan method `json()` standar
2.  Tambahkan CORS Middleware di entry point `public/index.php`
3.  Implementasi JWT Authentication untuk semua request API
4.  Ubah setiap Controller agar mengembalikan JSON bukan render HTML view
5.  Semua endpoint menggunakan prefix `/api/`

### Response Standar
```json
{
  "success": true,
  "message": "Data berhasil diambil",
  "data": {},
  "errors": []
}
```

## Frontend Next.js

### Teknologi Stack
- Next.js 15 App Router
- TypeScript
- Tailwind CSS v3
- shadcn/ui
- Magic UI
- TanStack React Query
- Zod (Validasi Schema)
- Zustand (State Management)

### Struktur Folder
```
persediaan-next/
├── app/                # App Router Pages
├── components/         # Reusable Components
├── lib/                # Utilities, Hooks, API Client
├── types/              # TypeScript Type Definitions
├── validators/         # Zod Schema Validators
└── providers/          # React Context Providers
```

## Tahapan Implementasi

| Tahap | Deskripsi | Estimasi Waktu |
|---|---|---|
| 1 | Setup Backend API Foundation | 1 hari |
| 2 | Setup Next.js Foundation | 1 hari |
| 3 | Migrasi Modul Auth & Login | 1 hari |
| 4 | Migrasi Modul Dashboard | 1 hari |
| 5 | Migrasi Modul Barang | 1 hari |
| 6 | Migrasi Modul Barang Masuk | 1 hari |
| 7 | Migrasi Modul Pembelian | 1 hari |
| 8 | Migrasi Modul Permintaan | 1 hari |
| 9 | Migrasi Modul Pengguna & Hak Akses | 1 hari |
| 10 | Migrasi Modul Kartu Stok & Stock Opname | 2 hari |
| 11 | Migrasi Modul Laporan & Log | 1 hari |
| 12 | Testing & Deployment | 2 hari |

## Standar UI
- Full Responsive Desktop + Mobile
- Dark Mode by Default
- Semua form dengan validasi realtime
- Data Table dengan sorting, filtering, pagination
- Loading state & skeleton untuk semua halaman
- Toast notifikasi untuk setiap operasi
- Konfirmasi dialog untuk action destructive

## Risiko & Mitigasi
| Risiko | Mitigasi |
|---|---|
| API PHP lambat | Tambahkan cache di Next.js atau PHP |
| Perilaku berbeda dengan lama | Testing setiap modul secara paralel |
| Downtime saat migrasi | Jalankan kedua sistem bersamaan sementara |
