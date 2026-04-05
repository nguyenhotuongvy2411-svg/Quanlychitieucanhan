const express = require('express');
const router = express.Router();

// API endpoint cho dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const { Transaction, Category, Budget, Goal } = require('../models');

    // Giả sử userId từ query param hoặc body, ví dụ ?userId=...
    const userId = req.query.userId; // Thay đổi theo nhu cầu

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Tổng thu nhập và chi tiêu trong tháng này
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const [incomeStats] = await Transaction.aggregate([
      { $match: { userId, type: 'income', date: { $gte: currentMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const [expenseStats] = await Transaction.aggregate([
      { $match: { userId, type: 'expense', date: { $gte: currentMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Lấy 5 giao dịch gần nhất
    const recentTransactions = await Transaction.find({ userId })
      .populate('categoryId', 'name type icon color')
      .sort({ date: -1 })
      .limit(5);

    // Lấy ngân sách đang hoạt động
    const activeBudgets = await Budget.find({ userId, status: 'active' })
      .populate('categoryId', 'name')
      .sort({ createdAt: -1 })
      .limit(3);

    // Lấy mục tiêu đang hoạt động
    const activeGoals = await Goal.find({ userId, status: 'active' })
      .sort({ deadline: 1 })
      .limit(3);

    res.json({
      stats: {
        income: incomeStats?.total || 0,
        expense: expenseStats?.total || 0,
        balance: (incomeStats?.total || 0) - (expenseStats?.total || 0)
      },
      recentTransactions,
      activeBudgets,
      activeGoals
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Có lỗi xảy ra khi tải dashboard' });
  }
});

// Trang chủ - trả về message
router.get('/', (req, res) => {
  res.json({ message: 'API Quản Lý Chi Tiêu Cá Nhân' });
});

module.exports = router;
