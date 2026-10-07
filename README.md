# Responsi Modul 1 — REST API Peminjaman Buku Perpustakaan

Ini adalah project REST API sederhana buat sistem peminjaman buku perpustakaan. Dibuat pakai **Node.js**, **Express.js**, dan **Supabase** sebagai database-nya.

---

## Teknologi yang Dipakai

- **Node.js** — runtime JavaScript
- **Express.js** — framework buat bikin REST API-nya
- **Supabase** — database berbasis PostgreSQL (cloud, gratis)
- **dotenv** — buat baca file `.env`
- **cors** — biar API bisa diakses dari mana aja

---

## Cara Pakai

### 1. Clone & Install

```bash
npm install
```

### 2. Setting Environment

Bikin file `.env` di root folder (sejajar sama `index.js`), isinya:

```env
SUPABASE_URL=https://xxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=isi_dengan_anon_key_kamu
PORT=3000
```

Nilai `SUPABASE_URL` dan `SUPABASE_ANON_KEY` bisa didapet dari dashboard Supabase → **Project Settings** → **API**.

### 3. Setup Database

Buka **SQL Editor** di Supabase, copy-paste semua isi file `database/schema.sql`, terus klik **Run**. Ini bakal otomatis bikin 3 tabel plus data contohnya.

### 4. Jalankan Server

```bash
npm run dev
```

Kalau berhasil bakal muncul:

```
📚 API Perpustakaan berjalan di: http://localhost:3000
```

---

## Struktur Folder

```
├── index.js                        # file utama, server jalan dari sini
├── src/
│   ├── config/
│   │   └── supabase.js             # koneksi ke Supabase
│   ├── controllers/
│   │   └── loanController.js       # logika CRUD peminjaman
│   └── routes/
│       └── loanRoutes.js           # daftar endpoint
├── database/
│   └── schema.sql                  # SQL buat bikin tabel di Supabase
└── .env.example                    # contoh isi file .env
```

---

## Struktur Database

Ada 3 tabel yang dipakai:

**`anggota`** — data anggota perpustakaan

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | BIGSERIAL | Primary key |
| nama | VARCHAR | Nama lengkap anggota |
| email | VARCHAR | Email (unik) |
| no_telepon | VARCHAR | Nomor HP |
| alamat | TEXT | Alamat lengkap |

**`buku`** — data koleksi buku

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | BIGSERIAL | Primary key |
| judul | VARCHAR | Judul buku |
| pengarang | VARCHAR | Nama pengarang |
| isbn | VARCHAR | Kode ISBN (unik) |
| stok_total | INT | Total buku yang dimiliki |
| stok_tersedia | INT | Buku yang masih bisa dipinjam |

**`peminjaman`** — data transaksi pinjam buku

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | BIGSERIAL | Primary key |
| anggota_id | BIGINT | Relasi ke tabel anggota |
| buku_id | BIGINT | Relasi ke tabel buku |
| tanggal_pinjam | DATE | Kapan buku dipinjam |
| tanggal_jatuh_tempo | DATE | Batas waktu pengembalian |
| tanggal_kembali | DATE | Kapan buku dikembalikan (nullable) |
| status | VARCHAR | `Dipinjam` / `Dikembalikan` / `Terlambat` |
| denda | INT | Denda keterlambatan (Rp1.000/hari) |
| catatan | TEXT | Catatan tambahan (opsional) |

---

## Endpoint API

Base URL: `http://localhost:3000`

### GET `/loans`
Ambil semua data peminjaman. Bisa difilter pakai query parameter.

**Contoh penggunaan:**
```
GET /loans                              → semua data
GET /loans?status=Terlambat            → yang telat
GET /loans?status=Dipinjam             → yang lagi dipinjam
GET /loans?anggota_id=1                → punya anggota tertentu
GET /loans?buku_id=2&status=Dipinjam   → buku tertentu yang dipinjam
```

**Response:**
```json
{
  "success": true,
  "message": "Data peminjaman berhasil diambil",
  "total": 2,
  "data": [ ... ]
}
```

---

### GET `/loans/:id`
Ambil detail satu data peminjaman berdasarkan ID.

```
GET /loans/1
```

---

### POST `/loans`
Buat data peminjaman baru.

**Body (JSON):**
```json
{
  "anggota_id": 1,
  "buku_id": 3,
  "tanggal_pinjam": "2025-10-07",
  "tanggal_jatuh_tempo": "2025-10-21",
  "catatan": "opsional, boleh dikosongkan"
}
```

> Stok buku otomatis berkurang 1 waktu peminjaman berhasil dibuat.

---

### PUT `/loans/:id`
Update data peminjaman — biasanya dipakai buat mencatat pengembalian buku.

**Body (JSON):**
```json
{
  "tanggal_kembali": "2025-10-25"
}
```

> Sistem otomatis ngitung:
> - Kalau balik tepat waktu → status `Dikembalikan`, denda `0`
> - Kalau telat → status `Terlambat`, denda dihitung `Rp1.000 × jumlah hari telat`
> - Stok buku otomatis bertambah 1 lagi

---

### DELETE `/loans/:id`
Hapus data peminjaman.

```
DELETE /loans/5
```

---

## Format Response

Semua response punya format yang sama:

```json
{
  "success": true,
  "message": "pesan hasil operasi",
  "data": { }
}
```

Kalau error:
```json
{
  "success": false,
  "message": "keterangan errornya"
}
```

| Kode | Artinya |
|------|---------|
| 200 | Berhasil |
| 201 | Data berhasil dibuat |
| 400 | Input tidak valid / ada field yang kurang |
| 404 | Data tidak ditemukan |
| 500 | Ada error di server |

---

## Catatan

- File `.env` **jangan di-push ke GitHub** — sudah dimasukin ke `.gitignore`
- Kalau mau jalankan ulang setelah install ulang dependensi, tinggal `npm install` lagi
- Data contoh sudah otomatis masuk waktu jalankan `schema.sql`

---

## Author

**Gilang**

> maaf mas kalau yang push ke Git namanya Jedan, soalnya laptop saya masih rusak mas, jadi emang laptop nya sharing gitu hehe
