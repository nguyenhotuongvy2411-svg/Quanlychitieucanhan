const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');

// Trang chủ
router.get('/', (req, res) => {
  if (req.session.user) {
    res.redirect('/dashboard');
  } else {
    res.render('index', {
      title: 'Quản Lý Chi Tiêu Cá Nhân',
      user: req.session.user
    });
  }
});

// Dashboard - yêu cầu đăng nhập
router.get('/dashboard', ensureAuthenticated, async (req, res) => {
  try {
    const { Transaction, Category, Budget, Goal } = require('../models');

    // Lấy dữ liệu thống kê
    const userId = req.session.user._id;

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

    res.render('dashboard', {
      title: 'Dashboard',
      user: req.session.user,
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
    req.flash('error_msg', 'Có lỗi xảy ra khi tải dashboard');
    res.redirect('/');
  }
});

module.exports = router;
