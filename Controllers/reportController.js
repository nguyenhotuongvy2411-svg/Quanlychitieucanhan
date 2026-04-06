const { Transaction, Budget, Goal, Category } = require('../Models');
const mongoose = require('mongoose');

// Tổng thu, chi theo tháng
exports.summaryByMonth = async (req, res) => {
  try {
    const { year, month } = req.query;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const result = await Transaction.aggregate([
      { $match: { userId: req.user._id, date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } }
    ]);
    const income = result.find(r => r._id === 'income')?.total || 0;
    const expense = result.find(r => r._id === 'expense')?.total || 0;
    res.json({ income, expense, balance: income - expense });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Số dư đến một ngày
exports.balanceUpToDate = async (req, res) => {
  try {
    const { date } = req.query;
    const upTo = new Date(date);
    const result = await Transaction.aggregate([
      { $match: { userId: req.user._id, date: { $lte: upTo } } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } }
    ]);
    const income = result.find(r => r._id === 'income')?.total || 0;
    const expense = result.find(r => r._id === 'expense')?.total || 0;
    res.json({ balance: income - expense });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Top 3 danh mục chi nhiều nhất trong tháng
exports.topExpenseCategories = async (req, res) => {
  try {
    const { year, month } = req.query;
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    const top = await Transaction.aggregate([
      { $match: { userId: req.user._id, type: 'expense', date: { $gte: start, $lte: end } } },
      { $group: { _id: '$categoryId', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } },
      { $limit: 3 },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
      { $unwind: '$category' }
    ]);
    res.json(top);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Báo cáo số tiền còn lại trong mỗi ngân sách
exports.budgetRemaining = async (req, res) => {
  try {
    const budgets = await Budget.find({ userId: req.user.id, status: 'active' })
      .populate('categoryId', 'name');
    const report = budgets.map(b => ({
      category: b.categoryId.name,
      budgetAmount: b.amount,
      spent: b.spent,
      remaining: b.amount - b.spent,
      status: b.spent > b.amount ? 'Vượt' : 'Còn',
    }));
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Tiến độ mục tiêu
exports.goalProgress = async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.user.id });
    const progress = goals.map(g => ({
      name: g.name,
      target: g.targetAmount,
      current: g.currentAmount,
      percent: (g.currentAmount / g.targetAmount) * 100,
      remaining: g.targetAmount - g.currentAmount,
      status: g.status,
    }));
    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Thống kê chi tiêu trung bình theo ngày trong tuần
exports.averageSpendingByWeekday = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const match = {
      userId: req.user._id,
      type: 'expense',
    };
    if (startDate && endDate) {
      match.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    const result = await Transaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dayOfWeek: '$date' },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        }
      },
      {
        $project: {
          weekday: '$_id',
          totalAmount: 1,
          count: 1,
          average: { $divide: ['$totalAmount', '$count'] }
        }
      },
      { $sort: { weekday: 1 } }
    ]);
    const weekdays = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const formatted = result.map(r => ({
      day: weekdays[r.weekday - 1],
      totalAmount: r.totalAmount,
      transactionCount: r.count,
      averageSpending: r.average,
    }));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};