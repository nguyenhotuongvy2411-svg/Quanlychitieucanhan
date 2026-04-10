const express = require('express');
const { createGoal, getGoals, updateGoal, deleteGoal, getTotalSaved, getGoalProgress, searchGoalsByName, sortGoalsByDeadline,withdrawSavedMoney  } = require('../Controllers/goalController');
const { protect } = require('../Middleware/Auth');
const router = express.Router();

router.use(protect);
router.post('/', createGoal); // Tạo mục tiêu mới
router.get('/', getGoals); // Lấy danh sách mục tiêu của người dùng (kèm số tiền đã tiết kiệm được)
router.put('/:id', updateGoal); // Cập nhật mục tiêu
router.delete('/:id', deleteGoal); // Xóa mục tiêu
router.post('/withdraw-saved',withdrawSavedMoney); // rút tiền đã tiết kiệm được ra khỏi mục tiêu 
router.get('/total-saved', getTotalSaved); // câu 6: Lấy tổng số tiền đã tiết kiệm được cho tất cả mục tiêu
router.get('/progress', getGoalProgress); // câu 10: Tiến độ hoàn thành mục tiêu
router.get('/search', searchGoalsByName); // câu 18: Tìm mục tiêu theo tên
router.get('/sort-by-deadline', sortGoalsByDeadline); // câu 19: sắp xếp mục tiêu theo thời hạn hoàn thành (deadline)

module.exports = router;