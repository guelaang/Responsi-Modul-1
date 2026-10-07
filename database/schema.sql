-- ============================================================
-- SKEMA DATABASE SUPABASE - Sistem Peminjaman Buku Perpustakaan
-- Jalankan SQL ini di SQL Editor pada dashboard Supabase Anda
-- ============================================================

-- ─── Tabel: anggota ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS anggota (
  id            BIGSERIAL PRIMARY KEY,
  nama          VARCHAR(100)        NOT NULL,
  email         VARCHAR(150) UNIQUE NOT NULL,
  no_telepon    VARCHAR(20),
  alamat        TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Tabel: buku ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS buku (
  id              BIGSERIAL PRIMARY KEY,
  judul           VARCHAR(200)  NOT NULL,
  pengarang       VARCHAR(150)  NOT NULL,
  isbn            VARCHAR(20)   UNIQUE,
  penerbit        VARCHAR(150),
  tahun_terbit    INT,
  stok_total      INT DEFAULT 1 CHECK (stok_total >= 0),
  stok_tersedia   INT DEFAULT 1 CHECK (stok_tersedia >= 0),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Tabel: peminjaman ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS peminjaman (
  id                  BIGSERIAL PRIMARY KEY,
  anggota_id          BIGINT NOT NULL REFERENCES anggota(id) ON DELETE RESTRICT,
  buku_id             BIGINT NOT NULL REFERENCES buku(id) ON DELETE RESTRICT,
  tanggal_pinjam      DATE NOT NULL,
  tanggal_jatuh_tempo DATE NOT NULL,
  tanggal_kembali     DATE,
  status              VARCHAR(20) NOT NULL DEFAULT 'Dipinjam'
                        CHECK (status IN ('Dipinjam', 'Dikembalikan', 'Terlambat')),
  denda               INT DEFAULT 0 CHECK (denda >= 0),  -- dalam Rupiah
  catatan             TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Trigger: auto-update updated_at ─────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_anggota_updated_at
  BEFORE UPDATE ON anggota
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_buku_updated_at
  BEFORE UPDATE ON buku
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_peminjaman_updated_at
  BEFORE UPDATE ON peminjaman
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── Index untuk performa query filter ───────────────────────
CREATE INDEX IF NOT EXISTS idx_peminjaman_status      ON peminjaman(status);
CREATE INDEX IF NOT EXISTS idx_peminjaman_anggota_id  ON peminjaman(anggota_id);
CREATE INDEX IF NOT EXISTS idx_peminjaman_buku_id     ON peminjaman(buku_id);
CREATE INDEX IF NOT EXISTS idx_peminjaman_tanggal_pinjam ON peminjaman(tanggal_pinjam);

-- ─── Data Contoh: anggota ─────────────────────────────────────
INSERT INTO anggota (nama, email, no_telepon, alamat) VALUES
  ('Budi Santoso',   'budi@example.com',   '081234567890', 'Jl. Merdeka No.1, Jakarta'),
  ('Siti Rahayu',    'siti@example.com',   '082345678901', 'Jl. Sudirman No.2, Bandung'),
  ('Ahmad Fauzi',    'ahmad@example.com',  '083456789012', 'Jl. Gatot Subroto No.3, Surabaya'),
  ('Dewi Lestari',   'dewi@example.com',   '084567890123', 'Jl. Diponegoro No.4, Yogyakarta');

-- ─── Data Contoh: buku ────────────────────────────────────────
INSERT INTO buku (judul, pengarang, isbn, penerbit, tahun_terbit, stok_total, stok_tersedia) VALUES
  ('Laskar Pelangi',        'Andrea Hirata',       '978-979-1328-00-0', 'Bentang Pustaka',    2005, 3, 2),
  ('Bumi Manusia',          'Pramoedya Ananta Toer','978-979-407-195-2','Hasta Mitra',        1980, 2, 1),
  ('Dilan 1990',            'Pidi Baiq',           '978-602-412-230-1', 'Pastel Books',       2014, 4, 4),
  ('Filosofi Teras',        'Henry Manampiring',   '978-602-03-8755-0', 'Kompas',             2018, 2, 1),
  ('Atomic Habits',         'James Clear',         '978-602-481-111-7', 'Gramedia',           2019, 3, 3);

-- ─── Data Contoh: peminjaman ──────────────────────────────────
INSERT INTO peminjaman (anggota_id, buku_id, tanggal_pinjam, tanggal_jatuh_tempo, tanggal_kembali, status, denda) VALUES
  (1, 1, '2025-09-01', '2025-09-15', NULL,         'Dipinjam',     0),
  (2, 2, '2025-08-20', '2025-09-03', '2025-09-10', 'Terlambat',    7000),
  (3, 4, '2025-09-05', '2025-09-19', '2025-09-18', 'Dikembalikan', 0),
  (4, 1, '2025-08-01', '2025-08-15', NULL,         'Terlambat',    0);
