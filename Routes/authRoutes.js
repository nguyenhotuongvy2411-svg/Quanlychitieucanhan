const express = require('express');
const { register, login } = require('../Controllers/authController');
const router = express.Router();

router.post('/register', register); // Đăng ký người dùng mới
router.post('/login', login); // Đăng nhập và nhận token JWT

module.exports = router;