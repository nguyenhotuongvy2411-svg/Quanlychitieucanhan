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
exports.getBudgetRemaining = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentDate = new Date();
    // Lấy tất cả ngân sách của user (đang active)
    const budgets = await Budget.aggregate([
      // 1. Lọc ngân sách của user, còn hiệu lực (endDate >= hiện tại)
      {
        $match: {
          userId: userId,
          endDate: { $gte: currentDate }
        }
      },
      // 2. Join với categories để lấy tên danh mục
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "category"
        }
      },
      // 3. Bỏ mảng category
      { $unwind: "$category" },
      // 4. Lọc chỉ lấy danh mục chi tiêu (expense)
      { $match: { "category.type": "expense" } },
      // 5. Join với transactions để tính chi tiêu thực tế
      {
        $lookup: {
          from: "transactions",
          let: { 
            categoryId: "$categoryId",
            startDate: "$startDate",
            endDate: "$endDate"
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$userId", userId] },
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
      // 6. Lấy số tiền đã chi (hoặc 0 nếu chưa có)
      {
        $addFields: {
          spentAmount: { $ifNull: [{ $arrayElemAt: ["$spending.totalSpent", 0] }, 0] }
        }
      },
      // 7. Tính số tiền còn lại trong ngân sách
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
          // Tính phần trăm đã sử dụng
          usedPercentage: {
            $multiply: [
              { $divide: ["$spentAmount", "$amount"] },
              100
            ]
          },
          // Cảnh báo nếu vượt quá 80% hoặc 100%
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
      // 8. Sắp xếp theo số tiền còn lại tăng dần (ngân sách cạn nhất lên đầu)
      { $sort: { remainingAmount: 1 } }
    ]);
    // Tính tổng số tiền còn lại của tất cả ngân sách
    const totalRemaining = budgets.reduce((sum, b) => sum + b.remainingAmount, 0);
    const totalBudget = budgets.reduce((sum, b) => sum + b.budgetAmount, 0);
    const totalSpent = budgets.reduce((sum, b) => sum + b.spentAmount, 0);
    res.json({
      success: true,
      summary: {
        totalBudget: totalBudget,
        totalSpent: totalSpent,
        totalRemaining: totalRemaining,
        averageUsage: totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(2) : 0
      },
      budgets: budgets
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};  

// câu 16: Lấy danh sách ngân sách kèm cảnh báo (số tiền còn lại)
exports.getBudgetsWithWarning = async (req, res) => {
  try {
    const userId = req.user.id;
    const budgets = await Budget.find({ userId, status: 'active' })
      .populate('categoryId', 'name icon');
    
    const result = budgets.map(b => {
      const remaining = b.amount - b.spent;
      let warningLevel = 'normal';
      if (b.spent >= b.amount) warningLevel = 'danger';
      else if (b.spent >= b.amount * 0.8) warningLevel = 'warning';
      
      return {
        _id: b._id,
        category: b.categoryId,
        budgetAmount: b.amount,
        spent: b.spent,
        remaining: remaining,
        percentUsed: (b.spent / b.amount) * 100,
        warningLevel,
        period: b.period,
        startDate: b.startDate,
        endDate: b.endDate
      };
    });
    
    res.json({ success: true, budgets: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};