const { Budget, Category } = require('../Models');

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