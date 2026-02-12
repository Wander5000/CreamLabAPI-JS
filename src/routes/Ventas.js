const express = require('express');
const router = express.Router();
const { getAllVentas, getVentabyId, postVenta, putVenta } = require('../controllers/VentasController.js');

router.get('/', getAllVentas);
router.get('/:id', getVentabyId);
router.post('/', postVenta);
router.put('/:id', putVenta);

module.exports = router;