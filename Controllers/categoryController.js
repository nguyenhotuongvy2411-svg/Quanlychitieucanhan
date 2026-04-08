const { Category } = require('../Models');

// Tạo danh mục
exports.createCategory = async (req, res) => {
  try {
    const { name, type, icon } = req.body;
    const category = await Category.create({
      userId: req.user.id,
      name,
      type,
      icon,
    });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Lấy danh sách danh mục của user
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ userId: req.user.id });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Cập nhật danh mục
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      req.body,
      { new: true }
    );
    if (!category) return res.status(404).json({ error: 'Không tìm thấy danh mục' });
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Xóa danh mục
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findOneAndDelete({ _id: id, userId: req.user.id });
    if (!category) return res.status(404).json({ error: 'Không tìm thấy danh mục' });
    res.json({ message: 'Xóa thành công' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// câu 15: Kiểm tra danh mục đã tồn tại (theo tên, loại, userId)
exports.checkCategoryExists = async (req, res) => {
  try {
    const { name, type } = req.query;
    if (!name || !type) {
      return res.status(400).json({ success: false, error: "Vui lòng cung cấp name và type" });
    }
    
    const existing = await Category.findOne({
      userId: req.user.id,
      name: { $regex: new RegExp(`^${name}$`, 'i') }, // không phân biệt hoa thường
      type
    });
    
    res.json({
      success: true,
      exists: !!existing,
      category: existing || null
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};