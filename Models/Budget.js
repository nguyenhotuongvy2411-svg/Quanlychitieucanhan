const mongoose = require('mongoose');

const BudgetSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    amount: { type: Number, required: true },      // số tiền ngân sách tối đa
    spent: { type: Number, default: 0 },           // số đã chi trong kỳ
    period: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: ['active', 'expired'], default: 'active' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Budget', BudgetSchema);