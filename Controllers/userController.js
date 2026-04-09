const { User, Transaction } = require('../Models');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const {isValidId, badRequest, handleError  } = require('../Helper/validation&handleE')

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
    if (email && !/^\S+@\S+\.\S+$/.test(email)) return badRequest(res, 'Email không hợp lệ');
    if (password && password.length < 4) return badRequest(res, 'Mật khẩu tối thiểu 4 ký tự');

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

// câu 1: Lấy tất cả người dùng và tổng giao dịch của từng người
exports.getAllUsersWithTransactionTotals = async (req, res) => {
  try {
    // Kiểm tra quyền admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Không có quyền truy cập' });
    }
    // Chỉ lấy những user có role = 'user'
    const users = await User.find({ role: 'user' }).select('-password');
    const result = await Promise.all(
      users.map(async (user) => {
        const userIdObj = new mongoose.Types.ObjectId(user._id);  
        const [totalIncome, totalExpense, transactionCount] = await Promise.all([
          Transaction.aggregate([
            { $match: { userId: userIdObj, type: "income" } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
          ]),
          Transaction.aggregate([
            { $match: { userId: userIdObj, type: "expense" } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
          ]),
          Transaction.countDocuments({ userId: user._id })
        ]);
        return {
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            currency: user.currency,
            role: user.role,
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
    res.json({ success: true, count: result.length, users: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};