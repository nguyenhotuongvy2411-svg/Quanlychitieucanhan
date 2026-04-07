const { Transaction, Budget, Goal } = require('../Models');

// Helper: cập nhật spent trong Budget khi tạo/xóa/sửa expense
async function updateBudgetSpent(userId, categoryId, amountDelta, date) {
  const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const budget = await Budget.findOne({
    userId,
    categoryId,
    startDate: { $lte: endOfMonth },
    endDate: { $gte: startOfMonth },
    status: 'active'
  });
  if (budget) {
    budget.spent += amountDelta;
    if (budget.spent < 0) budget.spent = 0;
    await budget.save();
    return budget;
  }
  return null;
}

// Thêm giao dịch
exports.createTransaction = async (req, res) => {
  try {
    const { amount, type, categoryId, description, date, paymentMethod, goalId } = req.body;
    const transactionDate = date ? new Date(date) : new Date();

    // Kiểm tra nếu là transfer thì phải có goalId
    if (type === 'transfer' && !goalId) {
      return res.status(400).json({ error: 'Transfer cần chọn mục tiêu' });
    }

    const transaction = await Transaction.create({
      userId: req.user.id,
      amount,
      type,
      categoryId,
      goalId: type === 'transfer' ? goalId : null,
      description,
      date: transactionDate,
      paymentMethod,
    });

    let warning = null;

    // Xử lý cập nhật ngân sách (nếu là expense)
    if (type === 'expense') {
      const updatedBudget = await updateBudgetSpent(req.user.id, categoryId, amount, transactionDate);
      if (updatedBudget && updatedBudget.spent > updatedBudget.amount) {
        warning = `Cảnh báo: Bạn đã vượt ngân sách cho danh mục này! (Đã chi ${updatedBudget.spent}/${updatedBudget.amount})`;
      }
    }

    // Xử lý cập nhật mục tiêu (nếu là transfer)
    if (type === 'transfer' && goalId) {
      const goal = await Goal.findOne({ _id: goalId, userId: req.user.id });
      if (goal) {
        goal.currentAmount += amount;
        if (goal.currentAmount >= goal.targetAmount) {
          goal.status = 'achieved';
          warning = warning ? `${warning} Chúc mừng! Bạn đã đạt mục tiêu "${goal.name}".` : `Chúc mừng! Bạn đã đạt mục tiêu "${goal.name}".`;
        }
        await goal.save();
      }
    }

    res.status(201).json({ transaction, warning });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Sửa giao dịch (cần điều chỉnh budget spent và goal currentAmount)
exports.updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const oldTx = await Transaction.findOne({ _id: id, userId: req.user.id });
    if (!oldTx) return res.status(404).json({ error: 'Giao dịch không tồn tại' });

    const { amount, type, categoryId, description, date, paymentMethod, goalId } = req.body;
    const newDate = date ? new Date(date) : oldTx.date;

    // Hoàn tác ảnh hưởng cũ
    if (oldTx.type === 'expense') {
      await updateBudgetSpent(req.user.id, oldTx.categoryId, -oldTx.amount, oldTx.date);
    }
    if (oldTx.type === 'transfer' && oldTx.goalId) {
      const oldGoal = await Goal.findOne({ _id: oldTx.goalId, userId: req.user.id });
      if (oldGoal) {
        oldGoal.currentAmount -= oldTx.amount;
        if (oldGoal.currentAmount < 0) oldGoal.currentAmount = 0;
        if (oldGoal.status === 'achieved' && oldGoal.currentAmount < oldGoal.targetAmount) oldGoal.status = 'pending';
        await oldGoal.save();
      }
    }

    // Cập nhật giao dịch
    const updatedTx = await Transaction.findByIdAndUpdate(
      id,
      {
        amount,
        type,
        categoryId,
        goalId: type === 'transfer' ? goalId : null,
        description,
        date: newDate,
        paymentMethod,
      },
      { new: true }
    );

    let warning = null;
    // Áp dụng ảnh hưởng mới
    if (type === 'expense') {
      const updatedBudget = await updateBudgetSpent(req.user.id, categoryId, amount, newDate);
      if (updatedBudget && updatedBudget.spent > updatedBudget.amount) {
        warning = `Cảnh báo: Vượt ngân sách (${updatedBudget.spent}/${updatedBudget.amount})`;
      }
    }
    if (type === 'transfer' && goalId) {
      const goal = await Goal.findOne({ _id: goalId, userId: req.user.id });
      if (goal) {
        goal.currentAmount += amount;
        if (goal.currentAmount >= goal.targetAmount) {
          goal.status = 'achieved';
          warning = warning ? `${warning} Đạt mục tiêu "${goal.name}"!` : `Đạt mục tiêu "${goal.name}"!`;
        }
        await goal.save();
      }
    }

    res.json({ transaction: updatedTx, warning });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Xóa giao dịch
exports.deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const tx = await Transaction.findOne({ _id: id, userId: req.user.id });
    if (!tx) return res.status(404).json({ error: 'Giao dịch không tồn tại' });

    if (tx.type === 'expense') {
      await updateBudgetSpent(req.user.id, tx.categoryId, -tx.amount, tx.date);
    }
    if (tx.type === 'transfer' && tx.goalId) {
      const goal = await Goal.findOne({ _id: tx.goalId, userId: req.user.id });
      if (goal) {
        goal.currentAmount -= tx.amount;
        if (goal.currentAmount < 0) goal.currentAmount = 0;
        if (goal.status === 'achieved' && goal.currentAmount < goal.targetAmount) goal.status = 'pending';
        await goal.save();
      }
    }

    await tx.deleteOne();
    res.json({ message: 'Xóa giao dịch thành công' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Tìm kiếm, lọc, sắp xếp giao dịch
exports.getTransactions = async (req, res) => {
  try {
    const { categoryId, startDate, endDate, type, paymentMethod, sortBy, order } = req.query;
    const filter = { userId: req.user.id };
    if (categoryId) filter.categoryId = categoryId;
    if (type) filter.type = type;
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    let sort = {};
    if (sortBy === 'amount') sort.amount = order === 'desc' ? -1 : 1;
    else if (sortBy === 'date') sort.date = order === 'asc' ? 1 : -1;
    else sort.date = -1;

    const transactions = await Transaction.find(filter)
      .populate('categoryId', 'name type icon')
      .populate('goalId', 'name targetAmount')
      .sort(sort);
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// câu 14: Sắp xếp giao dịch theo số tiền hoặc ngày
exports.sortTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    // Lấy tham số từ query string: ?sortBy=amount&order=desc
    const { sortBy, order } = req.query;
    // Mặc định: sắp xếp theo ngày mới nhất trước
    let sortField = sortBy || 'date';
    let sortOrder = order === 'asc' ? 1 : -1; // -1: giảm dần, 1: tăng dần
    // Tạo object sort
    let sortObject = {};
    sortObject[sortField] = sortOrder;
    const transactions = await Transaction.find({ userId: userId })
      .populate('categoryId', 'name icon type')
      .sort(sortObject);
    res.json({
      success: true,
      count: transactions.length,
      sortBy: sortField,
      order: sortOrder === 1 ? 'asc' : 'desc',
      transactions: transactions
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};