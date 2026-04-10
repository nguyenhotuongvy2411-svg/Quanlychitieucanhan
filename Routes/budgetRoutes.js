const express = require('express');
const { createBudget, getBudgets, updateBudget, deleteBudget, getBudgetRemaining, getBudgetsWithWarning } = require('../Controllers/budgetController');
const { protect } = require('../Middleware/Auth');
const router = express.Router();

router.use(protect);
router.post('/', createBudget); // Tạo ngân sách mới
router.get('/', getBudgets); // Lấy danh sách ngân sách (kèm số tiền đã chi)
router.put('/:id', updateBudget); // Cập nhật ngân sách
router.delete('/:id', deleteBudget); // Xóa ngân sách
router.get('/remaining', getBudgetRemaining); // câu 17: Tổng hợp số tiền còn lại trong mỗi ngân sách
router.get('/with-warning', getBudgetsWithWarning); // câu 16

module.exports = router;