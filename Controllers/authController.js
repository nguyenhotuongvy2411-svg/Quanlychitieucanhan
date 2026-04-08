const { User } = require('../Models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {isValidId, badRequest, handleError  } = require('../Helper/validation&handleE')

// Đăng ký
exports.register = async (req, res) => {
  try {
    const { name, email, password, currency } = req.body;
    if (!name?.trim()) return badRequest(res, 'Tên không được rỗng');
    if (!email?.trim()) return badRequest(res, 'Email không được rỗng');
    if (!/^\S+@\S+\.\S+$/.test(email)) return badRequest(res, 'Email không hợp lệ');
    if (!password || password.length < 4) return badRequest(res, 'Mật khẩu tối thiểu 4 ký tự');
    if (currency && !['VND', 'USD', 'EUR'].includes(currency)) return badRequest(res, 'Currency không hợp lệ');

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'Email đã tồn tại' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      currency: currency || 'VND',
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.status(201).json({ token, user: { id: user._id, name, email, currency: user.currency } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Đăng nhập
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Email không tồn tại' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Mật khẩu không đúng' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user._id, name: user.name, email, currency: user.currency } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};