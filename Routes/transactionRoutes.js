const express = require('express');
const { createTransaction, updateTransaction, deleteTransaction, getTransactions, sortTransactions } = require('../Controllers/transactionController');
const { protect } = require('../Middleware/Auth');
const router = express.Router();

router.use(protect);
router.post('/', createTransaction);
router.get('/', getTransactions);
router.put('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);
router.get('/sort', sortTransactions); // câu 14: Sắp xếp giao dịch theo số tiền hoặc ngày

module.exports = router;