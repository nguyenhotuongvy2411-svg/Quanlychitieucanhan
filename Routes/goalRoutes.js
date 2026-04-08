const express = require('express');
const { createGoal, getGoals, updateGoal, deleteGoal, getTotalSaved, getGoalProgress, searchGoalsByName, sortGoalsByDeadline,withdrawSavedMoney  } = require('../Controllers/goalController');
const { protect } = require('../Middleware/Auth');
const router = express.Router();

router.use(protect);
router.post('/', createGoal);
router.get('/', getGoals);
router.put('/:id', updateGoal);
router.delete('/:id', deleteGoal);
router.post('/withdraw-saved',withdrawSavedMoney);
router.get('/total-saved', getTotalSaved); // câu 6: Lấy tổng số tiền đã tiết kiệm được cho tất cả mục tiêu
router.get('/progress', getGoalProgress); // câu 10: Tiến độ hoàn thành mục tiêu
router.get('/search', searchGoalsByName); // câu 18: Tìm mục tiêu theo tên
router.get('/sort-by-deadline', sortGoalsByDeadline); // câu 19

module.exports = router;