const express = require('express');
const { getProfile, updateProfile } = require('../Controllers/userController');
const { protect } = require('../Middleware/Auth');
const router = express.Router();

router.use(protect);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

module.exports = router;