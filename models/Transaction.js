const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ['income', 'expense'], required: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    description: { type: String, default: '' },
    date: { type: Date, required: true, default: Date.now },
    paymentMethod: { type: String, enum: ['cash', 'credit', 'bank', 'other'], default: 'cash' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transaction', TransactionSchema);