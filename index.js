require('dotenv').config();
const express = require('express');
const cors = require('cors');
const loanRoutes = require('./src/routes/loanRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '📚 API Perpustakaan - Sistem Peminjaman Buku',
    version: '1.0.0',
    endpoints: {
      loans: {
        'GET /loans': 'Ambil semua peminjaman (support filter: ?status=&anggota_id=&buku_id=)',
        'GET /loans/:id': 'Ambil detail peminjaman berdasarkan ID',
        'POST /loans': 'Buat peminjaman baru',
        'PUT /loans/:id': 'Update data peminjaman / catat pengembalian',
        'DELETE /loans/:id': 'Hapus data peminjaman',
      },
    },
    filter_examples: [
      'GET /loans?status=Dipinjam',
      'GET /loans?status=Terlambat',
      'GET /loans?status=Dikembalikan',
      'GET /loans?anggota_id=1',
      'GET /loans?buku_id=2&status=Dipinjam',
      'GET /loans?tanggal_pinjam=2025-01-15',
    ],
  });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/loans', loanRoutes);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} tidak ditemukan`,
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({
    success: false,
    message: 'Terjadi kesalahan pada server',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n📚 API Perpustakaan berjalan di: http://localhost:${PORT}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📋 Dokumentasi endpoint: http://localhost:${PORT}/\n`);
});

module.exports = app;
