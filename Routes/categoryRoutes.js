const express = require('express');
const { createCategory, getCategories, updateCategory, deleteCategory, checkCategoryExists } = require('../Controllers/categoryController');
const { protect } = require('../Middleware/Auth');
const router = express.Router();

router.use(protect);
router.post('/', createCategory);
router.get('/', getCategories);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);
router.get('/check', checkCategoryExists); // câu 15

module.exports = router;