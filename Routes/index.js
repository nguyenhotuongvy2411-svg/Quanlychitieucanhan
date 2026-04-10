const express = require('express');
const router = express.Router();

// API endpoint cho dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const { Transaction, Category, Budget, Goal } = require('../Models');

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


// const result = await Model.aggregate([
//   { $match: { userId: objectId, type: 'expense', date: { $gte: start, $lte: end } } },  //lọc dữ liệu (giống WHERE trong SQL)
//   { $lookup: { from: 'categories', localField: 'categoryId', foreignField: '_id', as: 'category' } }, // join với collection khác
//   { $unwind: '$category' },  //giải nén mảng (sau $lookup thường có mảng 1 phần tử)
//   { $group: { _id: '$category.name', total: { $sum: '$amount' } } },  //nhóm theo một trường, tính tổng/trung bình/đếm
//   { $sort: { total: -1 } }, //sắp xếp
//   { $limit: 5 },  //iới hạn số lượng
//   { $project: { categoryName: '$_id', totalAmount: '$total', _id: 0 } }  //$project / $addFields: thêm, bớt, đổi tên, tính toán trường mới $expr: dùng biểu thức trong $match (so sánh giữa các trường) $cond, $switch: logic if-else
// ]);


module.exports = router;
