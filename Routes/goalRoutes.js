const express = require('express');
const { createGoal, getGoals, updateGoal, deleteGoal } = require('../Controllers/goalController');
const { protect } = require('../Middleware/Auth');
const router = express.Router();

router.use(protect);
router.post('/', createGoal);
router.get('/', getGoals);
router.put('/:id', updateGoal);
router.delete('/:id', deleteGoal);

module.exports = router;