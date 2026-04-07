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

// câu 6: Tổng tiền tiết kiệm được (trong các mục tiêu)
exports.getTotalSaved = async (req, res) => {
  try {
    const userId = req.user.id;
    // Tính tổng currentAmount của tất cả mục tiêu của user
    const result = await Goal.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: null,
          totalSaved: { $sum: "$currentAmount" }
        }
      }
    ]);
    const totalSaved = result[0]?.totalSaved || 0;
    res.json({
      success: true,
      totalSaved: totalSaved
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// [D] CÂU 10: Tiến độ hoàn thành mục tiêu
exports.getGoalProgress = async (req, res) => {
  try {
    const userId = req.user.id;

    // Lấy tất cả mục tiêu của user và tính tiến độ
    const goals = await Goal.aggregate([
      { $match: { userId: userId } },
      {
        $project: {
          _id: 1,
          name: 1,
          targetAmount: 1,
          currentAmount: 1,
          deadline: 1,
          status: 1,
          // Tính phần trăm tiến độ
          progress: {
            $multiply: [
              { $divide: ["$currentAmount", "$targetAmount"] },
              100
            ]
          },
          // Tính số tiền còn thiếu
          remaining: {
            $subtract: ["$targetAmount", "$currentAmount"]
          }
        }
      },
      { $sort: { progress: -1 } } // Sắp xếp mục tiêu gần hoàn thành lên đầu
    ]);

    res.json({
      success: true,
      count: goals.length,
      goals: goals
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// câu 18: Tìm mục tiêu theo tên (tìm kiếm gần đúng, không phân biệt hoa thường)
exports.searchGoalsByName = async (req, res) => {
  try {
    const userId = req.user.id;
    const { keyword } = req.query; // Lấy từ khóa từ query string
    // Kiểm tra nếu không có keyword
    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập từ khóa cần tìm"
      });
    }
    // Tìm mục tiêu theo tên (không phân biệt hoa/thường, tìm kiếm gần đúng)
    const goals = await Goal.find({
      userId: userId,
      name: { $regex: keyword, $options: "i" } // i: case-insensitive
    }).sort({ createdAt: -1 }); // Sắp xếp mới nhất trước
    res.json({
      success: true,
      count: goals.length,
      keyword: keyword,
      goals: goals
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};