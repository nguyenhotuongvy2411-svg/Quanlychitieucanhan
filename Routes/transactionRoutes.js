const express = require('express');
const { createTransaction, updateTransaction, deleteTransaction, getTransactions } = require('../Controllers/transactionController');
const { protect } = require('../Middleware/Auth');
const router = express.Router();

router.use(protect);
router.post('/', createTransaction);
router.get('/', getTransactions);
router.put('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);

module.exports = router;