const express = require('express');
const router = express.Router();
const c = require('../controllers/mensajerosController');
const auth = require('../middlewares/auth');

router.use(auth);
router.get('/', c.getAll);
router.get('/:id', c.getById);
router.post('/', c.create);
router.put('/:id', c.update);
router.patch('/:id/toggle', c.toggleActive);
router.delete('/:id', c.remove);

module.exports = router;
