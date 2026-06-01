const express = require('express');
const router = express.Router();
const c = require('../controllers/jornadasController');
const auth = require('../middlewares/auth');

router.use(auth);
router.get('/', c.historial);
router.get('/activa', c.getActiva);
router.get('/:id', c.getJornada);
router.post('/abrir', c.abrir);
router.post('/asignar', c.asignar);
router.post('/cerrar', c.cerrar);

module.exports = router;
