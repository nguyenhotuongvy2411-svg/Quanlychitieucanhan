const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Vui lòng nhập tên danh mục'],
    trim: true,
    minlength: [2, 'Tên danh mục phải ít nhất 2 ký tự']
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: [true, 'Vui lòng chọn loại: income hoặc expense']
  },
  icon: {
    type: String,
    default: 'folder'
  },
  color: {
    type: String,
    default: '#3498db'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Vui lòng cung cấp ID người dùng']
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Chỉ mục để tìm kiếm nhanh
categorySchema.index({ userId: 1, active: 1 });

module.exports = mongoose.model('Category', categorySchema);
