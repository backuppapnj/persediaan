# Design Document: Persediaan ATK — Frontend/Backend Separation

**Date:** 2026-04-15
**Status:** Draft — awaiting user review
**Approach:** Feature-Slice (Phase-by-Phase)

---

## 1. Project Overview

### 1.1 Purpose
Memisahkan aplikasi monolith PHP native menjadi dua bagian:
- **Backend:** PHP native (existing) sebagai REST API
- **Frontend:** Next.js 16 (App Router) sebagai UI layer

### 1.2 Tech Stack

**Backend (PHP Native):**
- Custom MVC-like framework
- Dependencies: vlucas/phpdotenv, robmorgan/phinx, defuse/php-encryption, firebase/php-jwt (new)
- 12 modul dengan endpoint API: auth, barang, barangmasuk, permintaan, pembelian, dashboard, laporan, stockopname, pengguna, hakakses, notifikasi, pengaturan

**Frontend (Next.js):**
- Next.js 16.2.3, React 19, TypeScript 5
- Tailwind CSS v4 (CSS-based config, oklch design tokens)
- shadcn/ui (7 installed, 10 planned)
- MagicUI (installed, belum dipakai)
- State: TanStack Query v5, React Context (auth)
- Forms: react-hook-form + Zod
- API client: custom fetch wrapper

### 1.3 Current State

**Backend:** ✅ 12 modul API ready (session-based auth + CSRF)
**Frontend:** 🔧 Foundation stage — login page only, infrastructure ready

---

## 2. Authentication Architecture (JWT)

### 2.1 Decision: JWT via firebase/php-jwt

Backend dimodifikasi untuk issue JWT token saat login, menggantikan session-based auth untuk API consumption.

### 2.2 JWT Payload Structure

```json
{
  "sub": "1234567890",     // NIP (user identifier)
  "name": "John Doe",      // Nama lengkap
  "role": "admin",          // Role pengguna
  "iat": 1700000000,        // Issued at
  "exp": 1700086400         // Expires (24h default)
}
```

### 2.3 Auth Flow

```
Frontend                          Backend
  │                                 │
  ├─ POST /auth/api/login ─────────▶│
  │   { nip: "123...", password }   │
  │                                 ├─ Validate NIP + password
  │                                 ├─ Generate JWT (HS256, SECRET_KEY)
  │◀─ { token, user } ──────────────┤
  │                                 │
  ├─ Simpan JWT ke localStorage     │
  ├─ Redirect ke /dashboard         │
  │                                 │
  ├─ GET /barang/api/list ─────────▶│
  │   Authorization: Bearer {JWT}   ├─ verify_jwt() middleware
  │◀─ { data: [...] } ──────────────┤
  │                                 │
  ├─ POST /auth/api/logout ────────▶│
  │   Authorization: Bearer {JWT}   ├─ Invalidate (optional)
  │◀─ { success: true } ────────────┤
```

### 2.4 Backend Changes

| File | Change |
|------|--------|
| `composer.json` | Tambah `firebase/php-jwt` |
| `.env` + `.env.example` | Tambah `JWT_SECRET_KEY`, `JWT_EXPIRY_HOURS` |
| `app/modules/auth/controllers/Auth.php` | Modifikasi `process_login` → issue JWT. Tambah `api/me`, `api/logout` |
| `app/core/Helper.php` | Tambah `generate_jwt($user)`, `verify_jwt()` functions |
| All module API endpoints | Tambah JWT verification, hapus CSRF requirement untuk API calls |

### 2.5 Frontend Changes

| File | Change |
|------|--------|
| `.env.local` (new) | `NEXT_PUBLIC_API_URL=http://localhost:8000/api` |
| `app/login/page.tsx` | Ganti field `email` → `nip`. Handle JWT response. |
| `lib/api.ts` | Hapus CSRF logic. Attach JWT Bearer dari localStorage. 401 interceptor → redirect /login. |
| `providers/AuthProvider.tsx` | Decode JWT payload untuk user object. |

---

## 3. Layout & Component Architecture

### 3.1 Route Group Structure

```
app/
├── layout.tsx                         # Root (Providers: QueryClient + Auth)
├── login/page.tsx                     # Login page (fix NIP field)
├── unauthorized/page.tsx              # 403 page
└── (dashboard)/
    ├── layout.tsx                     # DashboardLayout (Sidebar + Header)
    ├── dashboard/page.tsx
    ├── barang/page.tsx
    ├── barang-masuk/page.tsx
    ├── permintaan/page.tsx
    ├── pembelian/page.tsx
    ├── stock-opname/page.tsx
    ├── laporan/page.tsx
    ├── pengguna/page.tsx
    ├── hak-akses/page.tsx
    ├── notifikasi/page.tsx
    └── pengaturan/page.tsx
```

### 3.2 DashboardLayout Structure

```
┌─────────────────────────────────────────────────────────────┐
│                     DashboardLayout                          │
├──────────────┬──────────────────────────────────────────────┤
│  AppSidebar   │              DashboardHeader                 │
│              │  ┌──────────────────────────────────────────┐│
│  Logo/Name   │  │ Breadcrumb | Notifications | User Avatar ││
│  ─────────   │  └──────────────────────────────────────────┘│
│  📊 Dashboard│                                              │
│  📋 Barang   │              Page Content                    │
│  📥 Masuk    │              {children}                      │
│  📤 Perminta │                                              │
│  🛒 Pembelian│                                              │
│  ─────────   │                                              │
│  ▼ Manage    │                                              │
│    📝 Opname │                                              │
│    📈 Laporan│                                              │
│    👥 Pengguna                                              │
│    🔐 HakAkses                                              │
│    🔔 Notifikasi                                            │
│  ─────────   │                                              │
│  ⚙️ Settings │                                              │
│  🚪 Logout   │                                              │
└──────────────┴──────────────────────────────────────────────┘
```

### 3.3 Sidebar Menu Structure

**Group: Menu Utama**
- 📊 Dashboard
- 📋 Data Barang
- 📥 Barang Masuk
- 📤 Permintaan ATK
- 🛒 Pembelian

**Group: Manajemen** (collapsible)
- 📝 Stock Opname
- 📈 Laporan
- 👥 Pengguna
- 🔐 Hak Akses
- 🔔 Notifikasi (badge counter)

**Group: Settings** (bottom)
- ⚙️ Pengaturan
- 🚪 Logout

### 3.4 UI Components

**Already Installed (7):**
- Button (6 variants, 7 sizes)
- Card (+ Header, Title, Description, Content, Footer)
- Alert (+ Title, Description, Action)
- Input
- Label
- Form (react-hook-form integration)

**To Build (10):**

| Component | Source | Features |
|-----------|--------|----------|
| DataTable | shadcn Table + custom | Sorting, filtering, pagination, action column, loading state |
| Dialog | shadcn | Add/Edit forms, confirmations |
| Dropdown Menu | shadcn | Row actions, user menu |
| Select | shadcn | Dropdown selections, foreign key fields |
| Tabs | shadcn | Tabbed interfaces |
| Toast | Sonner | Success/error notifications |
| Badge | shadcn | Status indicators |
| Skeleton | shadcn | Loading placeholders |
| Breadcrumb | shadcn | Navigation trail |
| AppSidebar | custom | Grouped + collapsible navigation |

### 3.5 File Organization

```
persediaan-next-new/
├── components/
│   ├── ui/                     # shadcn/magicui primitives
│   ├── layout/
│   │   ├── AppSidebar.tsx      # Sidebar navigation
│   │   └── DashboardHeader.tsx # Header with breadcrumb
│   └── features/               # Feature-specific components
│       ├── auth/
│       │   └── LoginForm.tsx
│       ├── barang/
│       │   ├── BarangTable.tsx
│       │   └── BarangDialog.tsx
│       └── .../                # Per modul
├── hooks/
│   ├── useAuth.ts              # Existing
│   ├── useDashboard.ts         # Phase 2
│   ├── useBarang.ts            # Phase 3
│   └── .../                    # Per modul query hooks
└── lib/
    ├── api.ts                  # Existing (fix JWT)
    ├── queryClient.ts          # Existing
    └── utils.ts                # Existing
```

---

## 4. Phase Breakdown

### Phase 1: Auth & Shell (Foundation)

**Goal:** Login berfungsi dengan JWT, layout shell siap.

**Step 1.1 — Backend JWT Setup:**
- Install `firebase/php-jwt` via composer
- Buat JWT helper: `generate_jwt($user)`, `verify_jwt()`
- Modifikasi `Auth::process_login` → return JWT token (bukan session redirect)
- Buat `Auth::api/me` endpoint — verify JWT, return user info
- Buat `Auth::api/logout` endpoint
- Buat JWT middleware yang bisa dipakai di semua modul API

**Step 1.2 — Frontend Auth Integration:**
- Buat `.env.local` dengan `NEXT_PUBLIC_API_URL=http://localhost:8000/api`
- Fix login form: field `email` → `nip`, label "NIP"
- Handle JWT response → simpan ke localStorage
- Update API client (`lib/api.ts`):
  - Hapus CSRF token logic
  - Attach `Authorization: Bearer {JWT}` di setiap request
  - Tambah 401 interceptor → hapus token, redirect ke `/login`
- Update `AuthProvider`: decode JWT payload untuk user object

**Step 1.3 — Layout Shell:**
- Install shadcn: Sheet (untuk mobile sidebar toggle)
- Buat `components/layout/AppSidebar.tsx`:
  - Logo + app name area
  - Grouped menu (Menu Utama, Manajemen, Settings)
  - Collapsible sub-menu untuk grup "Manajemen"
  - Active state highlight
  - Mobile responsive (collapsible via Sheet)
- Buat `components/layout/DashboardHeader.tsx`:
  - Dynamic breadcrumb (based on current route)
  - Notification bell icon
  - User avatar + name dropdown (dropdown menu)
- Buat `app/(dashboard)/layout.tsx` — `DashboardLayout` component
- Buat `app/unauthorized/page.tsx` — 403 page dengan link ke dashboard

**✅ Deliverable:** Bisa login dengan NIP → redirect ke dashboard (placeholder) dengan sidebar + header.

---

### Phase 2: Dashboard + Core Components

**Goal:** Dashboard menampilkan data real dari backend.

**Step 2.1 — UI Components:**
- shadcn add: Badge, Skeleton, Tabs
- MagicUI: Animated Number (untuk stat cards)
- Install `sonner` — toast notifications, setup `<Toaster />` di root layout

**Step 2.2 — Dashboard Page:**
- Buat `hooks/useDashboard.ts` — query hook untuk:
  - `useDashboardStats()` — GET /dashboard/api/stats
  - `useRecentTransactions()` — GET /dashboard/api/recent_transactions
  - `useLowStockAlerts()` — GET /dashboard/api/low_stock_alerts
- Buat stat cards:
  - Total Barang (animated number)
  - Stok Rendah (red badge, clickable)
  - Permintaan Pending (blue badge)
  - Pembelian Hari Ini
- Recent transactions list (card list)
- Low stock alert section
- Chart placeholder area (untuk integrasi chart library nanti)

**✅ Deliverable:** Dashboard menampilkan data real dari backend API.

---

### Phase 3: Data Barang (CRUD Template)

**Goal:** CRUD Barang lengkap + DataTable reusable component.

**Step 3.1 — DataTable Component:**
- shadcn add: Table, Dropdown Menu, Select, Dialog
- Buat `components/ui/DataTable.tsx` — generic reusable table:
  - Props: `columns`, `data`, `loading`, `onEdit`, `onDelete`, `pagination`, `search`
  - Column headers dengan sort toggle
  - Search/filter bar
  - Pagination (client-side dan server-side support)
  - Loading skeleton state
  - Empty state message
  - Action column (Edit, Delete, View)

**Step 3.2 — Barang CRUD:**
- Buat `hooks/useBarang.ts` — query hooks:
  - `useBarangList(filters)` — GET /barang/api/list
  - `useBarangCreate()` — POST /barang/api/create
  - `useBarangUpdate(id)` — POST /barang/api/update/{id}
  - `useBarangDelete(id)` — POST /barang/api/delete/{id}
- Buat `components/features/barang/BarangTable.tsx`:
  - DataTable dengan kolom: Kode, Nama, Kategori, Satuan, Stok, Harga, Aksi
  - Search bar
  - "Tambah Barang" button → buka Dialog
- Buat `components/features/barang/BarangDialog.tsx`:
  - Form add/edit dengan field: Kode, Nama, Kategori (select), Satuan, Stok Awal, Harga
  - Zod validation
  - Toast on success/error
- Buat `app/(dashboard)/barang/page.tsx`

**✅ Deliverable:** CRUD Barang lengkap. DataTable reusable untuk semua modul berikutnya.

---

### Phase 4: Barang Masuk

**Goal:** Modul pencatatan barang masuk.

- Query hooks: `useBarangMasukList()`, `useBarangMasukCreate()`, `useBarangMasukUpdate()`, `useBarangMasukDelete()`
- Halaman: DataTable dengan kolom: Tanggal, Kode Barang, Nama Barang, Qty, Sumber, Keterangan
- Form: Select barang, input qty, sumber, keterangan
- Integrasi: Saat barang masuk → stok barang bertambah

---

### Phase 5: Permintaan ATK

**Goal:** Modul permintaan ATK dengan approval workflow.

- Query hooks: `usePermintaanList()`, `usePermintaanCreate()`, `usePermintaanApprove()`, `usePermintaanReject()`
- Halaman: DataTable dengan status filter (Pending, Approved, Rejected, Fulfilled)
- Form: Multi-item request (bisa request beberapa barang sekaligus)
- Approval: Approve/Reject buttons dengan keterangan
- Status badge dengan warna berbeda

---

### Phase 6: Pembelian

**Goal:** Modul pembelian (purchase order).

- Query hooks: `usePembelianList()`, `usePembelianCreate()`, `usePembelianUpdate()`, `usePembelianDelete()`
- Halaman: DataTable dengan status filter (Draft, Ordered, Received, Cancelled)
- Form: Multi-item purchase order
- Integrasi: Saat pembelian diterima → stok barang bertambah (mirip barang masuk)

---

### Phase 7: Stock Opname

**Goal:** Modul stock opname (penghitungan fisik).

- Query hooks: `useStockOpnameList()`, `useStockOpnameCreate()`, `useStockOpnameSubmit()`
- Halaman: DataTable dengan kolom: Tanggal Opname, Kode Barang, Nama Barang, Stok Sistem, Fisik, Selisih
- Form: Input fisik, auto-hitung selisih
- Highlight selisih negatif (merah)

---

### Phase 8: Admin & Polish

**Goal:** Modul admin + UI polish + production readiness.

**Admin Modules:**
- **Laporan:** Report filters (date range, kategori), export (PDF/Excel)
- **Pengguna:** CRUD user management
- **Hak Akses:** Role & permission management
- **Notifikasi:** Notification center, mark as read
- **Pengaturan:** System settings

**UI Polish:**
- Error boundaries (error.tsx per route)
- Not-found pages (not-found.tsx)
- Loading states consistency
- Mobile responsiveness review
- Keyboard navigation
- Accessibility audit
- Empty states for all tables

---

## 5. API Integration Notes

### 5.1 Backend API Pattern
```
/{module}/api/{method}/{param?}
Authorization: Bearer {JWT}
Content-Type: application/json
```

### 5.2 Response Format (Expected)
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### 5.3 Error Format
```json
{
  "success": false,
  "message": "Error description",
  "errors": { ... }
}
```

---

## 6. Design Decisions & Rationale

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Auth approach | JWT via firebase/php-jwt | Stateless, scalable, standar industri |
| Login field | NIP (bukan email) | Sesuai kebutuhan user |
| Layout | Sidebar kiri + icon + label | Navigasi selalu terlihat, visual cue jelas |
| Menu structure | Grouped + collapsible | Organisir menu yang banyak dengan rapi |
| Implementation approach | Feature-Slice | Tiap modul langsung fungsional, bisa demo |
| Component strategy | Reusable DataTable | Template untuk semua CRUD, hindari duplikasi |
| State management | TanStack Query | Built-in caching, retry, stale-time management |
| Form validation | Zod + react-hook-form | Type-safe, shadcn Form integration |

---

## 7. Open Questions / Future Considerations

1. **Chart Library:** Dashboard butuh chart library (recharts, chart.js, atau lainnya). Ditunda sampai Phase 2 implementation.
2. **Chart Type:** Jenis chart yang dibutuhkan (line, bar, pie, dll) — akan ditentukan saat Phase 2.
3. **Export Format:** Laporan export format (PDF, Excel, CSV) — akan ditentukan saat Phase 8.
4. **Image Upload:** Apakah ada kebutuhan upload gambar (foto barang, dokumen)? — belum ada di scope saat ini.
5. **Real-time Notifications:** Polling vs WebSocket untuk notifikasi real-time — polling untuk sekarang, WebSocket nanti jika diperlukan.
