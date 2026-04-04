const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');
require('dotenv').config();

const app = express();

// Kết nối MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/quanlychitieucanhan', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log(' Kết nối MongoDB thành công'))
.catch(err => console.error(' Lỗi kết nối MongoDB:', err));

// Cấu hình EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Serve logo.png from views if placed there
app.get('/logo.png', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'logo.png'));
});

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'quanlychitieucanhan_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } 
}));

// Flash messages
app.use(flash());

// Global variables middleware
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.user = req.session.user || null;
  next();
});

// Routes
app.use('/', require('./routes/index'));
app.use('/auth', require('./routes/auth'));

// 404 handler - redirect về trang chủ với thông báo
app.use((req, res) => {
  req.flash('error_msg', 'Trang bạn tìm không tồn tại');
  res.redirect('/');
});

// Error handler - redirect về trang chủ với thông báo
app.use((err, req, res, next) => {
  console.error(err.stack);
  req.flash('error_msg', 'Đã có lỗi xảy ra, vui lòng thử lại sau');
  res.redirect('/');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(` Server đang chạy trên port ${PORT}`);
  console.log(`Truy cập: http://localhost:${PORT}`);
});
