const express = require('express');
const router = express.Router();
const { login, me } = require('../controllers/authController');
const auth = require('../middlewares/auth');

router.post('/login', login);
router.get('/me', auth, me);

module.exports = router;
