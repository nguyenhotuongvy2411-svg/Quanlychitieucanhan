const { Budget, Category, Transaction } = require('../Models');

// Tạo ngân sách
exports.createBudget = async (req, res) => {
  try {
    const { categoryId, amount, period, startDate, endDate } = req.body;
    // Kiểm tra danh mục thuộc về user
    const category = await Category.findOne({ _id: categoryId, userId: req.user.id, type: 'expense' });
    if (!category) return res.status(400).json({ error: 'Danh mục không hợp lệ hoặc không phải chi tiêu' });

    const budget = await Budget.create({
      userId: req.user.id,
      categoryId,
      amount,
      period,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      spent: 0,
      status: 'active',
    });
    res.status(201).json(budget);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Lấy danh sách ngân sách (kèm số tiền đã chi)
exports.getBudgets = async (req, res) => {
  try {
    const budgets = await Budget.find({ userId: req.user.id, status: 'active' })
      .populate('categoryId', 'name icon');
    res.json(budgets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Cập nhật ngân sách
exports.updateBudget = async (req, res) => {
  try {
    const { id } = req.params;
    const budget = await Budget.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      req.body,
      { new: true }
    );
    if (!budget) return res.status(404).json({ error: 'Không tìm thấy ngân sách' });
    res.json(budget);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Xóa ngân sách
exports.deleteBudget = async (req, res) => {
  try {
    const { id } = req.params;
    const budget = await Budget.findOneAndDelete({ _id: id, userId: req.user.id });
    if (!budget) return res.status(404).json({ error: 'Không tìm thấy ngân sách' });
    res.json({ message: 'Xóa ngân sách thành công' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// câu 17: Tổng hợp số tiền còn lại trong mỗi ngân sách đến thời điểm hiện tại
const mongoose = require('mongoose'); // Đảm bảo import mongoose
exports.getBudgetRemaining = async (req, res) => {
  try {
    const userId = req.user.id;
    const objectIdUserId = new mongoose.Types.ObjectId(userId); // Ép kiểu
    const currentDate = new Date();

    const budgets = await Budget.aggregate([
      {
        $match: {
          userId: objectIdUserId,          // Dùng ObjectId
          // endDate: { $gte: currentDate }
        }
      },
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "category"
        }
      },
      { $unwind: "$category" },
      { $match: { "category.type": "expense" } },
      {
        $lookup: {
          from: "transactions",
          let: {
            categoryId: "$categoryId",
            startDate: "$startDate",
            endDate: "$endDate",
            uid: objectIdUserId             // Truyền ObjectId vào
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$userId", "$$uid"] },      // So sánh ObjectId
                    { $eq: ["$type", "expense"] },
                    { $eq: ["$categoryId", "$$categoryId"] },
                    { $gte: ["$date", "$$startDate"] },
                    { $lte: ["$date", "$$endDate"] }
                  ]
                }
              }
            },
            {
              $group: {
                _id: null,
                totalSpent: { $sum: "$amount" }
              }
            }
          ],
          as: "spending"
        }
      },
      {
        $addFields: {
          spentAmount: { $ifNull: [{ $arrayElemAt: ["$spending.totalSpent", 0] }, 0] }
        }
      },
      {
        $project: {
          _id: 1,
          budgetId: "$_id",
          categoryId: 1,
          categoryName: "$category.name",
          categoryIcon: "$category.icon",
          budgetAmount: "$amount",
          period: 1,
          startDate: 1,
          endDate: 1,
          spentAmount: 1,
          remainingAmount: { $subtract: ["$amount", "$spentAmount"] },
          usedPercentage: {
            $multiply: [{ $divide: ["$spentAmount", "$amount"] }, 100]
          },
          warning: {
            $switch: {
              branches: [
                { case: { $gte: ["$spentAmount", "$amount"] }, then: "danger" },
                { case: { $gte: [{ $divide: ["$spentAmount", "$amount"] }, 0.8] }, then: "warning" }
              ],
              default: "normal"
            }
          }
        }
      },
      { $sort: { remainingAmount: 1 } }
    ]);

    const totalRemaining = budgets.reduce((sum, b) => sum + b.remainingAmount, 0);
    const totalBudget = budgets.reduce((sum, b) => sum + b.budgetAmount, 0);
    const totalSpent = budgets.reduce((sum, b) => sum + b.spentAmount, 0);

    res.json({
      success: true,
      summary: {
        totalBudget,
        totalSpent,
        totalRemaining,
        averageUsage: totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(2) : 0
      },
      budgets
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// câu 16: Lấy danh sách ngân sách kèm cảnh báo (số tiền còn lại)
exports.getBudgetsWithWarning = async (req, res) => {
  try {
    const userId = req.user.id;
    const objectIdUserId = new mongoose.Types.ObjectId(userId);
    
    // Lấy tất cả budget active (có thể bỏ status nếu muốn lấy cả expired)
    const budgets = await Budget.find({ userId, status: 'active' })
      .populate('categoryId', 'name icon type');
    
    // Chỉ xử lý các budget thuộc danh mục chi tiêu (expense)
    const expenseBudgets = budgets.filter(b => b.categoryId && b.categoryId.type === 'expense');
    
    // Tính tổng chi thực tế cho từng budget
    const result = await Promise.all(expenseBudgets.map(async (budget) => {
      const spentResult = await Transaction.aggregate([
        {
          $match: {
            userId: objectIdUserId,
            type: 'expense',
            categoryId: budget.categoryId._id,
            date: { $gte: budget.startDate, $lte: budget.endDate }
          }
        },
        { $group: { _id: null, totalSpent: { $sum: "$amount" } } }
      ]);
      const spent = spentResult[0]?.totalSpent || 0;
      const remaining = budget.amount - spent;
      let warningLevel = 'normal';
      if (spent >= budget.amount) warningLevel = 'danger';
      else if (spent >= budget.amount * 0.8) warningLevel = 'warning';
      
      return {
        _id: budget._id,
        category: budget.categoryId,
        budgetAmount: budget.amount,
        spent: spent,
        remaining: remaining,
        percentUsed: (spent / budget.amount) * 100,
        warningLevel,
        period: budget.period,
        startDate: budget.startDate,
        endDate: budget.endDate
      };
    }));
    
    res.json({ success: true, budgets: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};