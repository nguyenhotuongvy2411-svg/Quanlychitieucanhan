const { Transaction, Budget, Goal, Category } = require('../Models');
const mongoose = require('mongoose');
const {isValidId, badRequest, handleError  } = require('../Helper/validation&handleE')

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

// câu 4: Lấy danh sách giao dịch kèm tổng tiền (lấy đến ngày chọn)
exports.getTransactionsWithTotals = async (req, res) => {
  try {
    const userId = req.user._id;
    const { date } = req.query; // Nhập ngày (format: YYYY-MM-DD)
    // Xây dựng điều kiện lọc
    let matchCondition = { userId: userId };
    // Nếu có nhập ngày thì lọc tất cả giao dịch ĐẾN ngày đó
    if (date) {
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      matchCondition.date = {
        $lte: endDate  // Lấy tất cả giao dịch <= ngày chọn
      };
    }
    // Bước 1: Lấy danh sách giao dịch (có join category)
    const transactions = await Transaction.aggregate([
      { $match: matchCondition },
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "category"
        }
      },
      { $unwind: "$category" },
      { $sort: { date: -1 } }
    ]);
    // Bước 2: Tính tổng thu và tổng chi 
    const totalIncome = await Transaction.aggregate([
      { $match: { ...matchCondition, type: "income" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const totalExpense = await Transaction.aggregate([
      { $match: { ...matchCondition, type: "expense" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    // Bước 3: Trả kết quả
    res.json({
      success: true,
      filterDate: date || "all",
      message: date ? `Tất cả giao dịch đến ngày ${date}` : "Tất cả giao dịch",
      transactions: transactions,
      totalIncome: totalIncome[0]?.total || 0,
      totalExpense: totalExpense[0]?.total || 0,
      balance: (totalIncome[0]?.total || 0) - (totalExpense[0]?.total || 0)
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// câu 2: Tổng chi theo từng danh mục trong tháng
exports.getExpenseByCategoryInMonth = async (req, res) => {
  try {
    const userId = req.user.id;
    const objectIdUserId = new mongoose.Types.ObjectId(userId); // Ép kiểu

    let { month, year } = req.query;
    const currentDate = new Date();
    const selectedMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
    const selectedYear = year ? parseInt(year) : currentDate.getFullYear();

    // Kiểm tra tính hợp lệ
    if (isNaN(selectedMonth) || selectedMonth < 1 || selectedMonth > 12 ||
        isNaN(selectedYear) || selectedYear < 2000) {
      return res.status(400).json({
        success: false,
        error: 'month (1-12) và year (>=2000) phải là số hợp lệ'
      });
    }

    // Sử dụng UTC để tránh lệch múi giờ
    const startDate = new Date(Date.UTC(selectedYear, selectedMonth - 1, 1, 0, 0, 0));
    const endDate = new Date(Date.UTC(selectedYear, selectedMonth, 0, 23, 59, 59, 999));

    const result = await Transaction.aggregate([
      {
        $match: {
          userId: objectIdUserId,
          type: "expense",
          date: { $gte: startDate, $lte: endDate }
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
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: {
            categoryId: "$category._id",
            categoryName: "$category.name",
            categoryIcon: "$category.icon"
          },
          totalAmount: { $sum: "$amount" },
          transactionCount: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          categoryId: "$_id.categoryId",
          categoryName: "$_id.categoryName",
          categoryIcon: "$_id.categoryIcon",
          totalAmount: 1,
          transactionCount: 1
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    const totalExpense = result.reduce((sum, item) => sum + item.totalAmount, 0);

    res.json({
      success: true,
      period: {
        month: selectedMonth,
        year: selectedYear,
        startDate: startDate,
        endDate: endDate
      },
      totalExpense: totalExpense,
      categories: result
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// câu 9: Top 3 danh mục chi tiêu nhiều nhất trong tháng (sử dụng $lookup)
exports.getTop3ExpenseCategories = async (req, res) => {
  try {
    const userId = req.user.id;
    const objectIdUserId = new mongoose.Types.ObjectId(userId); // Ép kiểu

    let { month, year } = req.query;
    const currentDate = new Date();
    const selectedMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
    const selectedYear = year ? parseInt(year) : currentDate.getFullYear();

    // Kiểm tra tính hợp lệ
    if (isNaN(selectedMonth) || selectedMonth < 1 || selectedMonth > 12 ||
        isNaN(selectedYear) || selectedYear < 2000) {
      return res.status(400).json({
        success: false,
        error: 'month (1-12) và year (>=2000) phải là số hợp lệ'
      });
    }

    // Sử dụng UTC để tránh lệch múi giờ
    const startDate = new Date(Date.UTC(selectedYear, selectedMonth - 1, 1, 0, 0, 0));
    const endDate = new Date(Date.UTC(selectedYear, selectedMonth, 0, 23, 59, 59, 999));

    // Aggregate: lấy top 3 danh mục chi nhiều nhất
    const result = await Transaction.aggregate([
      {
        $match: {
          userId: objectIdUserId,
          type: "expense",
          date: { $gte: startDate, $lte: endDate }
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
      {
        $group: {
          _id: {
            categoryId: "$category._id",
            categoryName: "$category.name",
            categoryIcon: "$category.icon",
            categoryType: "$category.type"
          },
          totalAmount: { $sum: "$amount" },
          transactionCount: { $sum: 1 }
        }
      },
      { $sort: { totalAmount: -1 } },
      { $limit: 3 },
      {
        $project: {
          _id: 0,
          categoryId: "$_id.categoryId",
          categoryName: "$_id.categoryName",
          categoryIcon: "$_id.categoryIcon",
          totalAmount: 1,
          transactionCount: 1
        }
      }
    ]);

    const totalTop3 = result.reduce((sum, item) => sum + item.totalAmount, 0);

    // Tính tổng chi cả tháng
    const totalExpenseAll = await Transaction.aggregate([
      {
        $match: {
          userId: objectIdUserId,
          type: "expense",
          date: { $gte: startDate, $lte: endDate }
        }
      },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const totalExpense = totalExpenseAll[0]?.total || 0;

    res.json({
      success: true,
      period: {
        month: selectedMonth,
        year: selectedYear,
        startDate: startDate,
        endDate: endDate
      },
      totalExpense: totalExpense,
      top3Count: result.length,
      top3Total: totalTop3,
      top3Percentage: totalExpense > 0 ? ((totalTop3 / totalExpense) * 100).toFixed(2) : 0,
      topCategories: result
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// câu 20: Liệt kê chi tiêu chi tiết theo từng ngày trong tuần
exports.getExpenseByDayOfWeek = async (req, res) => {
  try {
    const userId = req.user.id;
    const objectIdUserId = new mongoose.Types.ObjectId(userId); // Ép kiểu

    let { month, year } = req.query;
    const currentDate = new Date();
    const selectedMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
    const selectedYear = year ? parseInt(year) : currentDate.getFullYear();

    // Kiểm tra tính hợp lệ
    if (isNaN(selectedMonth) || selectedMonth < 1 || selectedMonth > 12 ||
        isNaN(selectedYear) || selectedYear < 2000) {
      return res.status(400).json({
        success: false,
        error: 'month (1-12) và year (>=2000) phải là số hợp lệ'
      });
    }

    // Sử dụng UTC để tránh lệch múi giờ
    const startDate = new Date(Date.UTC(selectedYear, selectedMonth - 1, 1, 0, 0, 0));
    const endDate = new Date(Date.UTC(selectedYear, selectedMonth, 0, 23, 59, 59, 999));

    // Aggregate: thống kê chi tiêu theo từng ngày trong tuần
    const result = await Transaction.aggregate([
      {
        $match: {
          userId: objectIdUserId,
          type: "expense",
          date: { $gte: startDate, $lte: endDate }
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
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          dayOfWeekNumber: { $dayOfWeek: "$date" }, // 1=Chủ nhật, 2=Thứ 2,... 7=Thứ 7
          dayOfWeekName: {
            $switch: {
              branches: [
                { case: { $eq: [{ $dayOfWeek: "$date" }, 1] }, then: "Chủ nhật" },
                { case: { $eq: [{ $dayOfWeek: "$date" }, 2] }, then: "Thứ hai" },
                { case: { $eq: [{ $dayOfWeek: "$date" }, 3] }, then: "Thứ ba" },
                { case: { $eq: [{ $dayOfWeek: "$date" }, 4] }, then: "Thứ tư" },
                { case: { $eq: [{ $dayOfWeek: "$date" }, 5] }, then: "Thứ năm" },
                { case: { $eq: [{ $dayOfWeek: "$date" }, 6] }, then: "Thứ sáu" },
                { case: { $eq: [{ $dayOfWeek: "$date" }, 7] }, then: "Thứ bảy" }
              ],
              default: "Không xác định"
            }
          }
        }
      },
      {
        $group: {
          _id: {
            dayOfWeekNumber: "$dayOfWeekNumber",
            dayOfWeekName: "$dayOfWeekName",
            categoryId: "$category._id",
            categoryName: "$category.name",
            categoryIcon: "$category.icon"
          },
          totalAmount: { $sum: "$amount" },
          transactions: {
            $push: {
              _id: "$_id",
              amount: "$amount",
              description: "$description",
              date: "$date",
              paymentMethod: "$paymentMethod",
              categoryName: "$category.name"
            }
          },
          transactionCount: { $sum: 1 }
        }
      },
      { $sort: { "_id.dayOfWeekNumber": 1, "totalAmount": -1 } },
      {
        $group: {
          _id: {
            dayOfWeekNumber: "$_id.dayOfWeekNumber",
            dayOfWeekName: "$_id.dayOfWeekName"
          },
          dayTotal: { $sum: "$totalAmount" },
          categories: {
            $push: {
              categoryId: "$_id.categoryId",
              categoryName: "$_id.categoryName",
              categoryIcon: "$_id.categoryIcon",
              totalAmount: "$totalAmount",
              transactionCount: "$transactionCount",
              transactions: "$transactions"
            }
          },
          transactionCount: { $sum: "$transactionCount" }
        }
      },
      { $sort: { "_id.dayOfWeekNumber": 1 } },
      {
        $project: {
          _id: 0,
          dayOfWeekNumber: "$_id.dayOfWeekNumber",
          dayOfWeekName: "$_id.dayOfWeekName",
          dayTotal: 1,
          transactionCount: 1,
          categories: 1
        }
      }
    ]);

    const totalExpense = result.reduce((sum, day) => sum + day.dayTotal, 0);
    const topDay = result.length > 0 ?
      result.reduce((max, day) => day.dayTotal > max.dayTotal ? day : max, result[0]) : null;

    res.json({
      success: true,
      period: {
        month: selectedMonth,
        year: selectedYear,
        startDate: startDate,
        endDate: endDate
      },
      summary: {
        totalExpense: totalExpense,
        averagePerDay: totalExpense > 0 ? ((totalExpense / 7).toFixed(2)) : 0,
        topDay: topDay ? {
          day: topDay.dayOfWeekName,
          amount: topDay.dayTotal,
          percentage: totalExpense > 0 ? ((topDay.dayTotal / totalExpense) * 100).toFixed(2) : 0
        } : null
      },
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// câu 5: Tìm danh mục chi tiêu cao nhất trong tháng
exports.getHighestExpenseCategory = async (req, res) => {
  try {
    const userId = req.user.id;
    const objectIdUserId = new mongoose.Types.ObjectId(userId);  // Ép kiểu

    const { month, year } = req.query;
    const currentDate = new Date();
    const selectedMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
    const selectedYear = year ? parseInt(year) : currentDate.getFullYear();
    
    const startDate = new Date(selectedYear, selectedMonth - 1, 1);
    const endDate = new Date(selectedYear, selectedMonth, 0, 23, 59, 59);
    
    const result = await Transaction.aggregate([
      {
        $match: {
          userId: objectIdUserId,        // Dùng ObjectId thay vì string
          type: "expense",
          date: { $gte: startDate, $lte: endDate }
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
      {
        $group: {
          _id: {
            categoryId: "$category._id",
            categoryName: "$category.name",
            categoryIcon: "$category.icon"
          },
          totalAmount: { $sum: "$amount" }
        }
      },
      { $sort: { totalAmount: -1 } },
      { $limit: 1 }
    ]);
    
    if (result.length === 0) {
      return res.json({ success: true, message: "Không có giao dịch chi trong tháng", category: null });
    }
    
    res.json({
      success: true,
      period: { month: selectedMonth, year: selectedYear },
      highestCategory: result[0]
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


// câu 7: Tổng thu, tổng chi theo tháng (không theo danh mục)
exports.getMonthlySummary = async (req, res) => {
  try {
    const { year, month } = req.query;
    
    // Kiểm tra tham số
    if (!year || !month) {
      return res.status(400).json({ 
        success: false, 
        error: 'Vui lòng cung cấp year và month (ví dụ: ?year=2026&month=4)' 
      });
    }
    
    const selectedYear = parseInt(year);
    const selectedMonth = parseInt(month);
    
    if (isNaN(selectedYear) || isNaN(selectedMonth) || selectedMonth < 1 || selectedMonth > 12) {
      return res.status(400).json({ 
        success: false, 
        error: 'year và month phải là số hợp lệ (month từ 1 đến 12)' 
      });
    }
    
    // Tạo khoảng thời gian UTC để tránh lệch múi giờ
    const startDate = new Date(Date.UTC(selectedYear, selectedMonth - 1, 1, 0, 0, 0));
    const endDate = new Date(Date.UTC(selectedYear, selectedMonth, 0, 23, 59, 59, 999));
    
    // Ép kiểu userId
    const userId = req.user._id || req.user.id;
    const objectIdUserId = new mongoose.Types.ObjectId(userId);
    
    const result = await Transaction.aggregate([
      { 
        $match: { 
          userId: objectIdUserId, 
          date: { $gte: startDate, $lte: endDate } 
        } 
      },
      { $group: { _id: '$type', total: { $sum: '$amount' } } }
    ]);
    
    const income = result.find(r => r._id === 'income')?.total || 0;
    const expense = result.find(r => r._id === 'expense')?.total || 0;
    
    res.json({
      success: true,
      year: selectedYear,
      month: selectedMonth,
      income,
      expense,
      balance: income - expense
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// câu 8: Số dư theo ngày cụ thể (kể cả hiện tại)
exports.getBalanceOnDate = async (req, res) => {
  try {
    const { date } = req.query;
    let upTo;
    if (date) {
      upTo = new Date(date);
      if (isNaN(upTo.getTime())) {
        return res.status(400).json({ success: false, error: "Ngày không hợp lệ" });
      }
    } else {
      upTo = new Date(); // hiện tại
    }
    
    const result = await Transaction.aggregate([
      { $match: { userId: req.user._id, date: { $lte: upTo } } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } }
    ]);
    
    const income = result.find(r => r._id === 'income')?.total || 0;
    const expense = result.find(r => r._id === 'expense')?.total || 0;
    
    res.json({
      success: true,
      date: upTo,
      balance: income - expense
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// câu 11: Thống kê chi tiêu theo ngày trong tuần (phân tích xu hướng)
exports.getWeeklyTrend = async (req, res) => {
  try {
    const userId = req.user.id;
    const objectIdUserId = new mongoose.Types.ObjectId(userId); // Ép kiểu

    let { startDate, endDate } = req.query;
    let matchCondition = { 
      userId: objectIdUserId, 
      type: "expense" 
    };

    // Xử lý khoảng thời gian nếu có
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ 
          success: false, 
          error: "startDate hoặc endDate không hợp lệ (định dạng YYYY-MM-DD)" 
        });
      }
      // Đặt endDate về cuối ngày để bao gồm toàn bộ ngày
      end.setHours(23, 59, 59, 999);
      matchCondition.date = { $gte: start, $lte: end };
    }

    const result = await Transaction.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: { $dayOfWeek: "$date" },
          totalSpent: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          dayOfWeek: "$_id",
          totalSpent: 1,
          count: 1,
          averageSpent: { $divide: ["$totalSpent", "$count"] }
        }
      },
      { $sort: { dayOfWeek: 1 } }
    ]);

    const weekdays = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];
    const trends = result.map(item => ({
      day: weekdays[item.dayOfWeek - 1],
      totalSpent: item.totalSpent,
      transactionCount: item.count,
      averageSpent: item.averageSpent
    }));

    res.json({ success: true, trends });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// câu 12: Tổng hợp báo cáo tài chính cá nhân theo tháng
exports.getMonthlyFinancialReport = async (req, res) => {
  try {
    const userId = req.user.id;
    const objectIdUserId = new mongoose.Types.ObjectId(userId); // Ép kiểu

    let { year, month } = req.query;
    const currentDate = new Date();
    const selectedYear = year ? parseInt(year) : currentDate.getFullYear();
    const selectedMonth = month ? parseInt(month) : currentDate.getMonth() + 1;

    // Tạo khoảng thời gian UTC để tránh lệch múi giờ
    const startDate = new Date(Date.UTC(selectedYear, selectedMonth - 1, 1, 0, 0, 0));
    const endDate = new Date(Date.UTC(selectedYear, selectedMonth, 0, 23, 59, 59, 999));

    // Tổng thu chi
    const incomeExpense = await Transaction.aggregate([
      { 
        $match: { 
          userId: objectIdUserId, 
          date: { $gte: startDate, $lte: endDate } 
        } 
      },
      { $group: { _id: "$type", total: { $sum: "$amount" } } }
    ]);
    const totalIncome = incomeExpense.find(i => i._id === "income")?.total || 0;
    const totalExpense = incomeExpense.find(i => i._id === "expense")?.total || 0;

    // Chi tiêu theo danh mục (top 5)
    const topExpenseCategories = await Transaction.aggregate([
      { 
        $match: { 
          userId: objectIdUserId, 
          type: "expense", 
          date: { $gte: startDate, $lte: endDate } 
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
      {
        $group: {
          _id: { id: "$category._id", name: "$category.name" },
          amount: { $sum: "$amount" }
        }
      },
      { $sort: { amount: -1 } },
      { $limit: 5 }
    ]);

    // Số giao dịch (dùng find với ObjectId)
    const transactionCount = await Transaction.countDocuments({
      userId: objectIdUserId,
      date: { $gte: startDate, $lte: endDate }
    });

    // Ngân sách & chi tiêu thực tế (dùng find với ObjectId)
    const budgets = await Budget.find({
      userId: objectIdUserId,
      startDate: { $lte: endDate },
      endDate: { $gte: startDate },
      status: "active"
    }).populate("categoryId", "name");

    const budgetStatus = budgets.map(b => ({
      category: b.categoryId?.name || 'Không xác định',
      budgetAmount: b.amount,
      spent: b.spent,
      remaining: b.amount - b.spent,
      percentUsed: b.amount > 0 ? (b.spent / b.amount) * 100 : 0
    }));

    res.json({
      success: true,
      period: { year: selectedYear, month: selectedMonth },
      summary: {
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
        transactionCount
      },
      topExpenseCategories: topExpenseCategories.map(c => ({ name: c._id.name, amount: c.amount })),
      budgetStatus
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};