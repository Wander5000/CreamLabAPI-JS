const express = require('express');
const router = express.Router();
const { getAllVentas, postVenta, putVenta } = require('../controllers/VentasController.js');

router.get('/', getAllVentas);
router.post('/', postVenta);
router.put('/:id', putVenta);

module.exports = router;