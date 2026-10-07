const express = require('express');
const router = express.Router();
const {
  getAllLoans,
  getLoanById,
  createLoan,
  updateLoan,
  deleteLoan,
} = require('../controllers/loanController');

// GET    /loans            → Semua peminjaman (dengan filter query opsional)
// GET    /loans/:id        → Detail peminjaman berdasarkan ID
// POST   /loans            → Buat peminjaman baru
// PUT    /loans/:id        → Update peminjaman (termasuk pengembalian)
// DELETE /loans/:id        → Hapus peminjaman

router.get('/', getAllLoans);
router.get('/:id', getLoanById);
router.post('/', createLoan);
router.put('/:id', updateLoan);
router.delete('/:id', deleteLoan);

module.exports = router;
