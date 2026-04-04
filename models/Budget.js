const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Vui lòng cung cấp ID người dùng']
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Vui lòng chọn danh mục']
  },
  name: {
    type: String,
    required: [true, 'Vui lòng nhập tên ngân sách'],
    trim: true
  },
  limitAmount: {
    type: Number,
    required: [true, 'Vui lòng nhập giới hạn ngân sách'],
    min: [0.01, 'Giới hạn phải lớn hơn 0']
  },
  spentAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  month: {
    type: String,
    required: [true, 'Vui lòng nhập tháng (YYYY-MM)'],
    match: [/^\d{4}-\d{2}$/, 'Định dạng tháng phải là YYYY-MM']
  },
  year: {
    type: Number,
    required: true
  },
  alertThreshold: {
    type: Number,
    default: 80,
    min: [0, 'Ngưỡng cảnh báo phải ít nhất 0'],
    max: [100, 'Ngưỡng cảnh báo không vượt quá 100']
  },
  isAlert: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'paused'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Tính toán phần trăm đã dùng
budgetSchema.virtual('usagePercentage').get(function() {
  return this.limitAmount > 0 ? (this.spentAmount / this.limitAmount) * 100 : 0;
});

// Chỉ mục để tìm kiếm nhanh
budgetSchema.index({ userId: 1, month: 1 });
budgetSchema.index({ userId: 1, categoryId: 1 });
budgetSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('Budget', budgetSchema);
