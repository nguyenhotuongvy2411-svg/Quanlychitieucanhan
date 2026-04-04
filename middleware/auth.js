// Middleware kiểm tra người dùng đã đăng nhập
const ensureAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return next();
  }

  req.flash('error', 'Vui lòng đăng nhập để tiếp tục');
  res.redirect('/auth/login');
};

// Middleware kiểm tra người dùng chưa đăng nhập (cho trang login/register)
const ensureGuest = (req, res, next) => {
  if (!req.session.user) {
    return next();
  }

  res.redirect('/dashboard');
};

module.exports = {
  ensureAuthenticated,
  ensureGuest
};
