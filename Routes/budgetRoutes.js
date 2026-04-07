const express = require('express');
const { createBudget, getBudgets, updateBudget, deleteBudget, getBudgetRemaining } = require('../Controllers/budgetController');
const { protect } = require('../Middleware/Auth');
const router = express.Router();

router.use(protect);
router.post('/', createBudget);
router.get('/', getBudgets);
router.put('/:id', updateBudget);
router.delete('/:id', deleteBudget);
router.get('/remaining', getBudgetRemaining); // câu 17: Tổng hợp số tiền còn lại trong mỗi ngân sách

module.exports = router;