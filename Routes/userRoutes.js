const express = require('express');
const { getProfile, updateProfile, getAllUsersWithTransactionTotals } = require('../Controllers/userController');
const { protect } = require('../Middleware/Auth');
const router = express.Router();

router.use(protect);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/admin', getAllUsersWithTransactionTotals); // câu 1: Lấy tất cả người dùng và tổng giao dịch của từng người cho admin

module.exports = router;