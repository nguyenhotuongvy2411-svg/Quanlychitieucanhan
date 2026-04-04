const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Vui lòng cung cấp ID người dùng']
  },
  name: {
    type: String,
    required: [true, 'Vui lòng nhập tên mục tiêu'],
    trim: true,
    minlength: [2, 'Tên mục tiêu phải ít nhất 2 ký tự']
  },
  description: {
    type: String,
    trim: true
  },
  targetAmount: {
    type: Number,
    required: [true, 'Vui lòng nhập số tiền mục tiêu'],
    min: [0.01, 'Số tiền phải lớn hơn 0']
  },
  currentAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  category: {
    type: String,
    enum: ['savings', 'investment', 'education', 'travel', 'home', 'car', 'health', 'other'],
    required: [true, 'Vui lòng chọn loại mục tiêu']
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  deadline: {
    type: Date,
    required: [true, 'Vui lòng chọn thời hạn']
  },
  status: {
    type: String,
    enum: ['active', 'on-hold', 'completed', 'cancelled'],
    default: 'active'
  },
  icon: {
    type: String,
    default: 'target'
  },
  color: {
    type: String,
    default: '#27ae60'
  },
  notes: {
    type: String,
    trim: true
  },
  completedAt: {
    type: Date
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

// Tính toán phần trăm hoàn thành
goalSchema.virtual('progressPercentage').get(function() {
  return this.targetAmount > 0 ? (this.currentAmount / this.targetAmount) * 100 : 0;
});

// Tính số ngày còn lại
goalSchema.virtual('daysRemaining').get(function() {
  const today = new Date();
  const timeDiff = this.deadline - today;
  const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  return daysDiff > 0 ? daysDiff : 0;
});

// Kiểm tra xem mục tiêu đã hết hạn hay chưa
goalSchema.virtual('isOverdue').get(function() {
  return this.deadline < new Date() && this.status !== 'completed' && this.status !== 'cancelled';
});

// Chỉ mục để tìm kiếm nhanh
goalSchema.index({ userId: 1, status: 1 });
goalSchema.index({ userId: 1, deadline: 1 });
goalSchema.index({ userId: 1, category: 1 });

module.exports = mongoose.model('Goal', goalSchema);
