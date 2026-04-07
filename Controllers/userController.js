const { User, Transaction } = require('../Models');
const bcrypt = require('bcryptjs');

// Lấy thông tin cá nhân
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Cập nhật thông tin cá nhân
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, password, currency } = req.body;
    const updateData = { name, email, currency };
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }
    const user = await User.findByIdAndUpdate(req.user.id, updateData, { new: true }).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// câu 1: Lấy tất cả người dùng và tổng giao dịch của từng người (dành cho admin)
exports.getAllUsersWithTransactionTotals = async (req, res) => {
  try {
    // Kiểm tra quyền admin (nếu có middleware riêng)
    // if (req.user.role !== 'admin') {
    //   return res.status(403).json({ success: false, message: 'Không có quyền truy cập' });
    // }
    // Bước 1: Lấy tất cả người dùng
    const users = await User.find({}).select('-password'); // Không lấy password
    // Bước 2: Với mỗi user, tính tổng thu và tổng chi từ giao dịch
    const result = await Promise.all(
      users.map(async (user) => {
        // Tính tổng thu
        const totalIncome = await Transaction.aggregate([
          { $match: { userId: user._id, type: "income" } },
          { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        // Tính tổng chi
        const totalExpense = await Transaction.aggregate([
          { $match: { userId: user._id, type: "expense" } },
          { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        // Tính tổng số giao dịch
        const transactionCount = await Transaction.countDocuments({ userId: user._id });
        return {
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            currency: user.currency,
            createdAt: user.createdAt
          },
          stats: {
            totalIncome: totalIncome[0]?.total || 0,
            totalExpense: totalExpense[0]?.total || 0,
            balance: (totalIncome[0]?.total || 0) - (totalExpense[0]?.total || 0),
            transactionCount: transactionCount
          }
        };
      })
    );
    res.json({
      success: true,
      count: result.length,
      users: result
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};