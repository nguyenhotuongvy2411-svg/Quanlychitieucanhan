const express = require('express');
const { createCategory, getCategories, updateCategory, deleteCategory, checkCategoryExists } = require('../Controllers/categoryController');
const { protect } = require('../Middleware/Auth');
const router = express.Router();

router.use(protect);
router.post('/', createCategory); // Tạo danh mục mới
router.get('/', getCategories); // Lấy danh sách danh mục của người dùng 
router.put('/:id', updateCategory); // Cập nhật danh mục
router.delete('/:id', deleteCategory); // Xóa danh mục
router.get('/check', checkCategoryExists); // câu 15:  Kiểm tra xem một danh mục đã tồn tại hay chưa (tránh trùng khi thêm mới)

module.exports = router;