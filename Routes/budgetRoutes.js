const express = require('express');
const { createBudget, getBudgets, updateBudget, deleteBudget } = require('../Controllers/budgetController');
const { protect } = require('../Middleware/Auth');
const router = express.Router();

router.use(protect);
router.post('/', createBudget);
router.get('/', getBudgets);
router.put('/:id', updateBudget);
router.delete('/:id', deleteBudget);

module.exports = router;