const express = require('express');
const { summaryByMonth, 
        balanceUpToDate, 
        topExpenseCategories, 
        budgetRemaining, 
        goalProgress, 
        averageSpendingByWeekday, 
        getTransactionsWithTotals, 
        getExpenseByCategoryInMonth, 
        getTop3ExpenseCategories, 
        getExpenseByDayOfWeek,
        getHighestExpenseCategory,
        getMonthlySummary, 
        getBalanceOnDate, 
        getWeeklyTrend, 
        getMonthlyFinancialReport } = require('../Controllers/reportController');
const { protect } = require('../Middleware/Auth');
const router = express.Router();

router.use(protect);
router.get('/summary', summaryByMonth);
router.get('/balance', balanceUpToDate);
router.get('/top-expense-categories', topExpenseCategories);
router.get('/budget-remaining', budgetRemaining);
router.get('/goal-progress', goalProgress);
router.get('/average-weekday', averageSpendingByWeekday);
router.get('/transactions-with-totals', getTransactionsWithTotals); // câu 4: Lấy danh sách kèm tổng tiền giao dịch
router.get('/expense-by-category', getExpenseByCategoryInMonth); // câu 2: Tổng chi theo từng danh mục trong tháng
router.get('/top-3', getTop3ExpenseCategories); // câu 9: Top 3 danh mục chi tiêu nhiều nhất trong tháng
router.get('/expense', getExpenseByDayOfWeek); // câu 20: Liệt kê chi tiêu chi tiết theo từng ngày trong tuần
router.get('/highest-expense-category', getHighestExpenseCategory); // câu 5: Tìm danh mục chi tiêu cao nhất trong tháng
router.get('/monthly-summary', getMonthlySummary); // câu 7: Tổng thu, tổng chi theo tháng (k theo từng danh mục mà kiểu chung chung)
router.get('/balance-on-date', getBalanceOnDate); // câu 8: Số dư theo ngày cụ thể (kể cả hiện tại)
router.get('/weekly-trend', getWeeklyTrend); // câu 11: Thống kê chi tiêu theo ngày trong tuần (phân tích xu hướng)
router.get('/monthly-report', getMonthlyFinancialReport); // câu 12: Tổng hợp báo cáo tài chính cá nhân theo tháng

module.exports = router;