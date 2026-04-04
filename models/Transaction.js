const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
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
  amount: {
    type: Number,
    required: [true, 'Vui lòng nhập số tiền'],
    min: [0.01, 'Số tiền phải lớn hơn 0']
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: [true, 'Vui lòng chọn loại: income hoặc expense']
  },
  description: {
    type: String,
    trim: true
  },
  date: {
    type: Date,
    required: [true, 'Vui lòng chọn ngày giao dịch'],
    default: Date.now
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'credit_card', 'debit_card', 'bank_transfer', 'other'],
    default: 'cash'
  },
  note: {
    type: String,
    trim: true
  },
  attachments: [{
    type: String,
    url: String
  }],
  tags: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'completed'
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

// Chỉ mục để tìm kiếm nhanh
transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, categoryId: 1 });
transactionSchema.index({ userId: 1, type: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
