const express = require('express');
const router = express.Router();
const { dashboard, exportarExcel } = require('../controllers/dashboardController');
const auth = require('../middlewares/auth');

router.use(auth);
router.get('/', dashboard);
router.get('/exportar', exportarExcel);

module.exports = router;
