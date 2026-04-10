const express = require('express');
const { createTransaction, updateTransaction, deleteTransaction, getTransactions, sortTransactions, getTransactionsAboveAverage, filterTransactions } = require('../Controllers/transactionController');
const { protect } = require('../Middleware/Auth');
const router = express.Router();

router.use(protect);
router.post('/', createTransaction);
router.get('/', getTransactions);
router.put('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);
router.get('/sort', sortTransactions); // câu 14: Sắp xếp giao dịch theo số tiền hoặc ngày
router.get('/above-average', getTransactionsAboveAverage); // câu 3: Tìm giao dịch có số tiền lớn hơn mức trung bình của user
router.get('/filter', filterTransactions) //câu 13: Lọc giao dịch (loại/danh mục/phương thức thanh toán)

module.exports = router;