const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// Kết nối MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/quanlychitieucanhan', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log(' Kết nối MongoDB thành công'))
.catch(err => console.error(' Lỗi kết nối MongoDB:', err));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Routes
app.use('/', require('./routes/index'));

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
  console.log(`Truy cập: http://localhost:${PORT}`);
});
