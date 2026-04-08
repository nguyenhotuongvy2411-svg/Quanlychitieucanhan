const mongoose = require('mongoose');

exports.isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

exports.badRequest  = (res, message) =>
  res.status(400).json({ success: false, message });

exports.handleErrorhandleError = (res, error) => {
  if (error?.name === 'ValidationError') {
    return res.status(400).json({ success: false, message: error.message });
  }
  if (error?.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'ID không hợp lệ' });
  }
  console.error(error);
  return res.status(500).json({ success: false, message: 'Có lỗi xảy ra' });
};