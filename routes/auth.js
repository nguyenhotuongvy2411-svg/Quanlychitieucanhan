const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { User } = require('../models');

// Middleware kiểm tra đã đăng nhập
const redirectIfAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  next();
};

// Trang đăng nhập
router.get('/login', redirectIfAuthenticated, (req, res) => {
  res.render('auth/login', {
    title: 'Đăng nhập',
    errors: req.flash('error')
  });
});

// Xử lý đăng nhập
router.post('/login', [
  body('email').isEmail().withMessage('Email không hợp lệ'),
  body('password').notEmpty().withMessage('Vui lòng nhập mật khẩu')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash('error', errors.array()[0].msg);
      return res.redirect('/auth/login');
    }

    const { email, password } = req.body;

    // Tìm user theo email
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      req.flash('error', 'Email hoặc mật khẩu không đúng');
      return res.redirect('/auth/login');
    }

    // Kiểm tra mật khẩu
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      req.flash('error', 'Email hoặc mật khẩu không đúng');
      return res.redirect('/auth/login');
    }

    // Kiểm tra tài khoản có active không
    if (!user.isActive) {
      req.flash('error', 'Tài khoản đã bị khóa');
      return res.redirect('/auth/login');
    }

    // Lưu thông tin user vào session (không bao gồm password)
    req.session.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      currency: user.currency
    };

    req.flash('success_msg', `Chào mừng ${user.name} đã quay trở lại!`);
    res.redirect('/dashboard');

  } catch (error) {
    console.error('Login error:', error);
    req.flash('error', 'Có lỗi xảy ra, vui lòng thử lại');
    res.redirect('/auth/login');
  }
});

// Trang đăng ký
router.get('/register', redirectIfAuthenticated, (req, res) => {
  res.render('auth/register', {
    title: 'Đăng ký',
    errors: req.flash('error')
  });
});

// Xử lý đăng ký
router.post('/register', [
  body('name').trim().isLength({ min: 2 }).withMessage('Tên phải ít nhất 2 ký tự'),
  body('email').isEmail().withMessage('Email không hợp lệ'),
  body('password').isLength({ min: 6 }).withMessage('Mật khẩu phải ít nhất 6 ký tự'),
  body('password2').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Mật khẩu xác nhận không khớp');
    }
    return true;
  })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash('error', errors.array()[0].msg);
      return res.redirect('/auth/register');
    }

    const { name, email, password } = req.body;

    // Kiểm tra email đã tồn tại chưa
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      req.flash('error', 'Email đã được sử dụng');
      return res.redirect('/auth/register');
    }

    // Tạo user mới
    const user = await User.create({
      name,
      email,
      password
    });

    // Lưu thông tin user vào session
    req.session.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      currency: user.currency
    };

    req.flash('success_msg', 'Đăng ký thành công! Chào mừng bạn đến với ứng dụng quản lý chi tiêu.');
    res.redirect('/dashboard');

  } catch (error) {
    console.error('Register error:', error);
    req.flash('error', 'Có lỗi xảy ra, vui lòng thử lại');
    res.redirect('/auth/register');
  }
});

// Đăng xuất
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.redirect('/dashboard');
    }
    res.redirect('/');
  });
});

module.exports = router;
