const { Transaction, Budget, Goal, Category } = require('../Models');
const mongoose = require('mongoose');

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

// câu 4: Lấy danh sách giao dịch kèm tổng tiền
exports.getTransactionsWithTotals = async (req, res) => {
  try {
    const userId = req.user._id;
    // Bước 1: Lấy danh sách giao dịch (có join category)
    const transactions = await Transaction.aggregate([
      { $match: { userId: userId } },
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
    const totalIncome = await Transaction.aggregate([ // tính tổng thu
      { $match: { userId: userId, type: "income" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const totalExpense = await Transaction.aggregate([ // tính tổng chi
      { $match: { userId: userId, type: "expense" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    // Bước 3: Trả kết quả
    res.json({
      transactions: transactions,
      totalIncome: totalIncome[0]?.total || 0,
      totalExpense: totalExpense[0]?.total || 0,
      balance: (totalIncome[0]?.total || 0) - (totalExpense[0]?.total || 0) // tính số dư
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// câu 2: Tổng chi theo từng danh mục trong tháng
exports.getExpenseByCategoryInMonth = async (req, res) => {
  try {
    const userId = req.user.id;
    // Lấy tháng và năm từ query, mặc định là tháng hiện tại
    const { month, year } = req.query;
    const currentDate = new Date();
    const selectedMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
    const selectedYear = year ? parseInt(year) : currentDate.getFullYear();
    // Tính ngày đầu và cuối tháng
    const startDate = new Date(selectedYear, selectedMonth - 1, 1);
    const endDate = new Date(selectedYear, selectedMonth, 0, 23, 59, 59);
    // Aggregate: lọc giao dịch chi trong tháng, group theo danh mục
    const result = await Transaction.aggregate([
      // 1. Lọc giao dịch của user, loại chi, trong khoảng thời gian
      {
        $match: {
          userId: userId,
          type: "expense",
          date: { $gte: startDate, $lte: endDate }
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
      // 3. Bỏ mảng category (chỉ lấy phần tử đầu)
      { $unwind: "$category" },
      // 4. Group theo danh mục, tính tổng chi
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
      // 5. Định dạng lại kết quả
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
      // 6. Sắp xếp theo tổng tiền giảm dần (danh mục chi nhiều nhất lên đầu)
      { $sort: { totalAmount: -1 } }
    ]);
    // Tính tổng chi tất cả danh mục
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
    // Lấy tháng và năm từ query, mặc định là tháng hiện tại
    const { month, year } = req.query;
    const currentDate = new Date();
    const selectedMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
    const selectedYear = year ? parseInt(year) : currentDate.getFullYear();
    // Tính ngày đầu và cuối tháng
    const startDate = new Date(selectedYear, selectedMonth - 1, 1);
    const endDate = new Date(selectedYear, selectedMonth, 0, 23, 59, 59);
    // Aggregate: lấy top 3 danh mục chi nhiều nhất
    const result = await Transaction.aggregate([
      // 1. Lọc giao dịch chi của user trong tháng
      {
        $match: {
          userId: userId,
          type: "expense",
          date: { $gte: startDate, $lte: endDate }
        }
      },
      // 2. Join với categories để lấy thông tin danh mục
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "category"
        }
      },
      // 3. Bỏ mảng category (chỉ lấy phần tử đầu)
      { $unwind: "$category" },
      // 4. Group theo danh mục, tính tổng chi
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
      // 5. Sắp xếp theo tổng tiền giảm dần
      { $sort: { totalAmount: -1 } },
      // 6. Chỉ lấy top 3
      { $limit: 3 },
      // 7. Định dạng lại kết quả
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
    // Tính tổng chi của top 3
    const totalTop3 = result.reduce((sum, item) => sum + item.totalAmount, 0);
    // Tính tổng chi cả tháng (để biết top 3 chiếm bao nhiêu %)
    const totalExpenseAll = await Transaction.aggregate([
      {
        $match: {
          userId: userId,
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
    
    // Lấy tháng và năm từ query, mặc định là tháng hiện tại
    const { month, year } = req.query;
    const currentDate = new Date();
    const selectedMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
    const selectedYear = year ? parseInt(year) : currentDate.getFullYear();
    
    // Tính ngày đầu và cuối tháng
    const startDate = new Date(selectedYear, selectedMonth - 1, 1);
    const endDate = new Date(selectedYear, selectedMonth, 0, 23, 59, 59);
    
    // Mảng ánh xạ thứ trong tuần (Tiếng Việt)
    const dayOfWeekMap = {
      0: "Chủ nhật",
      1: "Thứ hai",
      2: "Thứ ba",
      3: "Thứ tư",
      4: "Thứ năm",
      5: "Thứ sáu",
      6: "Thứ bảy"
    };
    
    // Aggregate: thống kê chi tiêu theo từng ngày trong tuần
    const result = await Transaction.aggregate([
      // 1. Lọc giao dịch chi của user trong tháng
      {
        $match: {
          userId: userId,
          type: "expense",
          date: { $gte: startDate, $lte: endDate }
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
      
      // 4. Thêm trường dayOfWeek (0-6) và tên thứ
      {
        $addFields: {
          dayOfWeekNumber: { $dayOfWeek: "$date" }, // 1=Chủ nhật, 2=Thứ 2,...
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
      
      // 5. Group theo ngày trong tuần và danh mục (chi tiết)
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
              paymentMethod: "$paymentMethod"
            }
          },
          transactionCount: { $sum: 1 }
        }
      },
      
      // 6. Sắp xếp theo thứ tự ngày trong tuần
      { $sort: { "_id.dayOfWeekNumber": 1, "totalAmount": -1 } },
      
      // 7. Nhóm lại theo ngày trong tuần (tổng hợp từng ngày)
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
      
      // 8. Sắp xếp lại và định dạng kết quả
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
    
    // Tính tổng chi cả tháng
    const totalExpense = result.reduce((sum, day) => sum + day.dayTotal, 0);
    
    // Tìm ngày chi tiêu nhiều nhất
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
        averagePerDay: ((totalExpense / 7) || 0).toFixed(2), // Trung bình trên 7 ngày
        topDay: topDay ? {
          day: topDay.dayOfWeekName,
          amount: topDay.dayTotal,
          percentage: ((topDay.dayTotal / totalExpense) * 100).toFixed(2)
        } : null
      },
      data: result
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};