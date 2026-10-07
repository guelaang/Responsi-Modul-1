const supabase = require('../config/supabase');

/**
 * GET /loans
 * Mendapatkan semua data peminjaman dengan opsi filter query
 * Query params: status, anggota_id, buku_id, tanggal_pinjam, tanggal_kembali
 */
const getAllLoans = async (req, res) => {
  try {
    const { status, anggota_id, buku_id, tanggal_pinjam, tanggal_kembali } = req.query;

    let query = supabase.from('peminjaman').select(`
      id,
      anggota_id,
      buku_id,
      tanggal_pinjam,
      tanggal_jatuh_tempo,
      tanggal_kembali,
      status,
      denda,
      catatan,
      created_at,
      updated_at,
      anggota:anggota_id (id, nama, email, no_telepon),
      buku:buku_id (id, judul, pengarang, isbn)
    `);

    // Filter berdasarkan status (Dipinjam | Dikembalikan | Terlambat)
    if (status) {
      query = query.eq('status', status);
    }

    // Filter berdasarkan anggota_id
    if (anggota_id) {
      query = query.eq('anggota_id', anggota_id);
    }

    // Filter berdasarkan buku_id
    if (buku_id) {
      query = query.eq('buku_id', buku_id);
    }

    // Filter berdasarkan tanggal_pinjam (format: YYYY-MM-DD)
    if (tanggal_pinjam) {
      query = query.eq('tanggal_pinjam', tanggal_pinjam);
    }

    // Filter berdasarkan tanggal_kembali (format: YYYY-MM-DD)
    if (tanggal_kembali) {
      query = query.eq('tanggal_kembali', tanggal_kembali);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil data peminjaman',
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Data peminjaman berhasil diambil',
      total: data.length,
      filters: { status, anggota_id, buku_id, tanggal_pinjam, tanggal_kembali },
      data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server',
      error: err.message,
    });
  }
};

/**
 * GET /loans/:id
 * Mendapatkan detail satu data peminjaman berdasarkan ID
 */
const getLoanById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('peminjaman')
      .select(`
        id,
        anggota_id,
        buku_id,
        tanggal_pinjam,
        tanggal_jatuh_tempo,
        tanggal_kembali,
        status,
        denda,
        catatan,
        created_at,
        updated_at,
        anggota:anggota_id (id, nama, email, no_telepon),
        buku:buku_id (id, judul, pengarang, isbn)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: `Peminjaman dengan ID ${id} tidak ditemukan`,
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil data peminjaman',
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Data peminjaman berhasil diambil',
      data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server',
      error: err.message,
    });
  }
};

/**
 * POST /loans
 * Membuat data peminjaman baru
 * Body: { anggota_id, buku_id, tanggal_pinjam, tanggal_jatuh_tempo, catatan? }
 */
const createLoan = async (req, res) => {
  try {
    const { anggota_id, buku_id, tanggal_pinjam, tanggal_jatuh_tempo, catatan } = req.body;

    // Validasi field wajib
    if (!anggota_id || !buku_id || !tanggal_pinjam || !tanggal_jatuh_tempo) {
      return res.status(400).json({
        success: false,
        message: 'Field wajib: anggota_id, buku_id, tanggal_pinjam, tanggal_jatuh_tempo',
      });
    }

    // Cek apakah anggota ada
    const { data: anggota, error: anggotaError } = await supabase
      .from('anggota')
      .select('id, nama')
      .eq('id', anggota_id)
      .single();

    if (anggotaError || !anggota) {
      return res.status(404).json({
        success: false,
        message: `Anggota dengan ID ${anggota_id} tidak ditemukan`,
      });
    }

    // Cek apakah buku ada
    const { data: buku, error: bukuError } = await supabase
      .from('buku')
      .select('id, judul, stok_tersedia')
      .eq('id', buku_id)
      .single();

    if (bukuError || !buku) {
      return res.status(404).json({
        success: false,
        message: `Buku dengan ID ${buku_id} tidak ditemukan`,
      });
    }

    // Cek stok buku
    if (buku.stok_tersedia <= 0) {
      return res.status(400).json({
        success: false,
        message: `Stok buku "${buku.judul}" habis, tidak dapat dipinjam`,
      });
    }

    // Buat record peminjaman
    const { data: peminjaman, error: peminjamanError } = await supabase
      .from('peminjaman')
      .insert([
        {
          anggota_id,
          buku_id,
          tanggal_pinjam,
          tanggal_jatuh_tempo,
          tanggal_kembali: null,
          status: 'Dipinjam',
          denda: 0,
          catatan: catatan || null,
        },
      ])
      .select(`
        id, anggota_id, buku_id, tanggal_pinjam, tanggal_jatuh_tempo,
        tanggal_kembali, status, denda, catatan, created_at,
        anggota:anggota_id (id, nama),
        buku:buku_id (id, judul)
      `)
      .single();

    if (peminjamanError) {
      return res.status(500).json({
        success: false,
        message: 'Gagal membuat data peminjaman',
        error: peminjamanError.message,
      });
    }

    // Kurangi stok buku
    await supabase
      .from('buku')
      .update({ stok_tersedia: buku.stok_tersedia - 1 })
      .eq('id', buku_id);

    return res.status(201).json({
      success: true,
      message: 'Peminjaman buku berhasil dibuat',
      data: peminjaman,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server',
      error: err.message,
    });
  }
};

/**
 * PUT /loans/:id
 * Mengupdate data peminjaman (termasuk pengembalian buku)
 * Body: { tanggal_kembali?, status?, catatan?, denda? }
 */
const updateLoan = async (req, res) => {
  try {
    const { id } = req.params;
    const { tanggal_kembali, status, catatan, denda } = req.body;

    // Cek apakah peminjaman ada
    const { data: existingLoan, error: findError } = await supabase
      .from('peminjaman')
      .select('*, buku:buku_id (id, stok_tersedia)')
      .eq('id', id)
      .single();

    if (findError || !existingLoan) {
      return res.status(404).json({
        success: false,
        message: `Peminjaman dengan ID ${id} tidak ditemukan`,
      });
    }

    // Bangun objek update
    const updateData = {};
    if (tanggal_kembali !== undefined) updateData.tanggal_kembali = tanggal_kembali;
    if (status !== undefined) updateData.status = status;
    if (catatan !== undefined) updateData.catatan = catatan;
    if (denda !== undefined) updateData.denda = denda;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tidak ada data yang dikirim untuk diupdate',
      });
    }

    // Hitung denda otomatis jika buku dikembalikan dan status diubah menjadi "Terlambat"
    if (tanggal_kembali && status === 'Terlambat' && denda === undefined) {
      const jatuhTempo = new Date(existingLoan.tanggal_jatuh_tempo);
      const kembali = new Date(tanggal_kembali);
      const selisihHari = Math.ceil((kembali - jatuhTempo) / (1000 * 60 * 60 * 24));
      if (selisihHari > 0) {
        updateData.denda = selisihHari * 1000; // Rp1.000 per hari
      }
    }

    // Auto-set status menjadi "Dikembalikan" jika tanggal_kembali diisi & status tidak diubah manual
    if (tanggal_kembali && status === undefined) {
      const jatuhTempo = new Date(existingLoan.tanggal_jatuh_tempo);
      const kembali = new Date(tanggal_kembali);
      if (kembali > jatuhTempo) {
        const selisihHari = Math.ceil((kembali - jatuhTempo) / (1000 * 60 * 60 * 24));
        updateData.status = 'Terlambat';
        updateData.denda = selisihHari * 1000; // Rp1.000 per hari
      } else {
        updateData.status = 'Dikembalikan';
      }
    }

    const { data: updatedLoan, error: updateError } = await supabase
      .from('peminjaman')
      .update(updateData)
      .eq('id', id)
      .select(`
        id, anggota_id, buku_id, tanggal_pinjam, tanggal_jatuh_tempo,
        tanggal_kembali, status, denda, catatan, updated_at,
        anggota:anggota_id (id, nama),
        buku:buku_id (id, judul)
      `)
      .single();

    if (updateError) {
      return res.status(500).json({
        success: false,
        message: 'Gagal mengupdate data peminjaman',
        error: updateError.message,
      });
    }

    // Jika buku dikembalikan, tambah stok kembali
    if (
      tanggal_kembali &&
      existingLoan.tanggal_kembali === null &&
      existingLoan.buku
    ) {
      await supabase
        .from('buku')
        .update({ stok_tersedia: existingLoan.buku.stok_tersedia + 1 })
        .eq('id', existingLoan.buku_id);
    }

    return res.status(200).json({
      success: true,
      message: 'Data peminjaman berhasil diupdate',
      data: updatedLoan,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server',
      error: err.message,
    });
  }
};

/**
 * DELETE /loans/:id
 * Menghapus data peminjaman berdasarkan ID
 */
const deleteLoan = async (req, res) => {
  try {
    const { id } = req.params;

    // Cek apakah peminjaman ada
    const { data: existingLoan, error: findError } = await supabase
      .from('peminjaman')
      .select('*, buku:buku_id (id, stok_tersedia)')
      .eq('id', id)
      .single();

    if (findError || !existingLoan) {
      return res.status(404).json({
        success: false,
        message: `Peminjaman dengan ID ${id} tidak ditemukan`,
      });
    }

    const { error: deleteError } = await supabase
      .from('peminjaman')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return res.status(500).json({
        success: false,
        message: 'Gagal menghapus data peminjaman',
        error: deleteError.message,
      });
    }

    // Jika buku belum dikembalikan, kembalikan stok
    if (existingLoan.tanggal_kembali === null && existingLoan.buku) {
      await supabase
        .from('buku')
        .update({ stok_tersedia: existingLoan.buku.stok_tersedia + 1 })
        .eq('id', existingLoan.buku_id);
    }

    return res.status(200).json({
      success: true,
      message: `Peminjaman dengan ID ${id} berhasil dihapus`,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server',
      error: err.message,
    });
  }
};

module.exports = { getAllLoans, getLoanById, createLoan, updateLoan, deleteLoan };
