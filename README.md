# 📚 API Perpustakaan — Sistem Peminjaman Buku

REST API untuk manajemen peminjaman buku perpustakaan menggunakan **Node.js**, **Express.js**, dan **Supabase**.

---

## 🚀 Cara Menjalankan

### 1. Install Dependensi
```bash
npm install
```

### 2. Konfigurasi Environment
Salin file `.env.example` menjadi `.env` lalu isi dengan kredensial Supabase Anda:
```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
PORT=3000
```

### 3. Setup Database Supabase
Buka **SQL Editor** di dashboard Supabase, lalu jalankan seluruh isi file `database/schema.sql`.

### 4. Jalankan Server
```bash
npm start       # Mode produksi
npm run dev     # Mode development (auto-restart)
```

Server berjalan di: `http://localhost:3000`

---

## Struktur Proyek

```
├── index.js                    # Entry point aplikasi
├── src/
│   ├── config/
│   │   └── supabase.js         # Konfigurasi Supabase client
│   ├── controllers/
│   │   └── loanController.js   # Logic CRUD peminjaman
│   └── routes/
│       └── loanRoutes.js       # Definisi endpoint
├── database/
│   └── schema.sql              # Skema + data contoh Supabase
└── .env.example
```

---

## Skema Database

### Tabel `anggota`
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | BIGSERIAL | Primary Key |
| nama | VARCHAR(100) | Nama lengkap |
| email | VARCHAR(150) | Email unik |
| no_telepon | VARCHAR(20) | Nomor telepon |

### Tabel `buku`
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | BIGSERIAL | Primary Key |
| judul | VARCHAR(200) | Judul buku |
| pengarang | VARCHAR(150) | Nama pengarang |
| isbn | VARCHAR(20) | ISBN unik |
| stok_tersedia | INT | Stok yang bisa dipinjam |

### Tabel `peminjaman`
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | BIGSERIAL | Primary Key |
| anggota_id | BIGINT | FK → anggota |
| buku_id | BIGINT | FK → buku |
| tanggal_pinjam | DATE | Tanggal dipinjam |
| tanggal_jatuh_tempo | DATE | Batas kembali |
| tanggal_kembali | DATE | Tanggal dikembalikan |
| status | VARCHAR | `Dipinjam` / `Dikembalikan` / `Terlambat` |
| denda | INT | Denda Rupiah (Rp1.000/hari terlambat) |

---

## Dokumentasi Endpoint

### `GET /loans` — Ambil semua peminjaman
Mendukung filter query parameter:

| Parameter | Contoh |
|-----------|--------|
| `status` | `?status=Terlambat` |
| `anggota_id` | `?anggota_id=1` |
| `buku_id` | `?buku_id=2` |
| `tanggal_pinjam` | `?tanggal_pinjam=2025-09-01` |

Contoh:
```
GET /loans?status=Terlambat
GET /loans?status=Dipinjam&anggota_id=1
```

---

### `GET /loans/:id` — Detail peminjaman
```
GET /loans/2
```

---

### `POST /loans` — Buat peminjaman baru
```json
{
  "anggota_id": 1,
  "buku_id": 3,
  "tanggal_pinjam": "2025-10-01",
  "tanggal_jatuh_tempo": "2025-10-15",
  "catatan": "Opsional"
}
```
> Stok buku otomatis berkurang 1.

---

### `PUT /loans/:id` — Update / catat pengembalian
```json
{
  "tanggal_kembali": "2025-10-20"
}
```
> **Logika otomatis:**
> - Kembali tepat waktu → status `Dikembalikan`, denda `0`
> - Kembali terlambat → status `Terlambat`, denda `Rp1.000 × hari terlambat`
> - Stok buku otomatis bertambah 1.

---

### `DELETE /loans/:id` — Hapus peminjaman
```
DELETE /loans/5
```

---

## Format Response

**Sukses:**
```json
{ "success": true, "message": "...", "data": { ... } }
```

**Error:**
```json
{ "success": false, "message": "Pesan error" }
```

| Kode | Keterangan |
|------|------------|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request |
| 404 | Not Found |
| 500 | Server Error |
