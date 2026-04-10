const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Kết nối MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/quanlychitieucanhan')
  .then(() => console.log('Kết nối MongoDB thành công'))
  .catch(err => console.error('Lỗi kết nối MongoDB:', err));

// Routes
app.use('/api/auth', require('./Routes/authRoutes'));
app.use('/api/users', require('./Routes/userRoutes'));
app.use('/api/categories', require('./Routes/categoryRoutes'));
app.use('/api/transactions', require('./Routes/transactionRoutes'));
app.use('/api/budgets', require('./Routes/budgetRoutes'));
app.use('/api/goals', require('./Routes/goalRoutes'));
app.use('/api/reports', require('./Routes/reportRoutes'));

app.get('/', (req, res) => {
  res.json({ message: 'API Quản Lý Chi Tiêu Cá Nhân' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint không tồn tại' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Đã có lỗi xảy ra, vui lòng thử lại sau' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(` Server đang chạy trên port ${PORT}`);
  console.log(` Truy cập: http://localhost:${PORT}`);
});