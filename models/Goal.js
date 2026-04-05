const mongoose = require('mongoose');

const GoalSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    targetAmount: { type: Number, required: true },
    currentAmount: { type: Number, default: 0 },
    deadline: { type: Date, required: true },
    status: { type: String, enum: ['pending', 'achieved', 'failed'], default: 'pending' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Goal', GoalSchema);