const express = require('express');
const { createCategory, getCategories, updateCategory, deleteCategory } = require('../Controllers/categoryController');
const { protect } = require('../Middleware/Auth');
const router = express.Router();

router.use(protect);
router.post('/', createCategory);
router.get('/', getCategories);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

module.exports = router;