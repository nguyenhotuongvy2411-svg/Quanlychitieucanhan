const { Goal } = require('../Models');

// Tạo mục tiêu
exports.createGoal = async (req, res) => {
  try {
    const { name, targetAmount, deadline } = req.body;
    const goal = await Goal.create({
      userId: req.user.id,
      name,
      targetAmount,
      deadline: new Date(deadline),
      currentAmount: 0,
      status: 'pending',
    });
    res.status(201).json(goal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Lấy danh sách mục tiêu (có tìm kiếm & sắp xếp)
exports.getGoals = async (req, res) => {
  try {
    const { search, sortBy } = req.query;
    let filter = { userId: req.user.id };
    if (search) filter.name = { $regex: search, $options: 'i' };
    let sort = {};
    if (sortBy === 'deadline') sort.deadline = 1;
    else sort.createdAt = -1;

    const goals = await Goal.find(filter).sort(sort);
    res.json(goals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Cập nhật mục tiêu
exports.updateGoal = async (req, res) => {
  try {
    const { id } = req.params;
    const goal = await Goal.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      req.body,
      { new: true }
    );
    if (!goal) return res.status(404).json({ error: 'Không tìm thấy mục tiêu' });
    res.json(goal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Xóa mục tiêu
exports.deleteGoal = async (req, res) => {
  try {
    const { id } = req.params;
    const goal = await Goal.findOneAndDelete({ _id: id, userId: req.user.id });
    if (!goal) return res.status(404).json({ error: 'Không tìm thấy mục tiêu' });
    res.json({ message: 'Xóa mục tiêu thành công' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};