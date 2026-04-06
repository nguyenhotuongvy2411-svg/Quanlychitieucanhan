const express = require('express');
const { summaryByMonth, balanceUpToDate, topExpenseCategories, budgetRemaining, goalProgress, averageSpendingByWeekday } = require('../Controllers/reportController');
const { protect } = require('../Middleware/Auth');
const router = express.Router();

router.use(protect);
router.get('/summary', summaryByMonth);
router.get('/balance', balanceUpToDate);
router.get('/top-expense-categories', topExpenseCategories);
router.get('/budget-remaining', budgetRemaining);
router.get('/goal-progress', goalProgress);
router.get('/average-weekday', averageSpendingByWeekday);

module.exports = router;