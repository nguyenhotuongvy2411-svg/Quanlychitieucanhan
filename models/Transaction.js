const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ['income', 'expense', 'transfer'], required: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    goalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Goal', default: null }, // chỉ dùng khi type = transfer
    description: { type: String, default: '' },
    date: { type: Date, required: true, default: Date.now },
    paymentMethod: { type: String, enum: ['cash', 'credit', 'bank', 'other'], default: 'cash' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transaction', TransactionSchema);