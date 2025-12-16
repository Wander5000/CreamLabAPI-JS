const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/Auth.js')
const { getCarrito , agregarProducto } = require('../controllers/CarritoController.js');

router.get('/Mi-Carrito/', authMiddleware, getCarrito);
router.post('/Agregar-Producto', authMiddleware, agregarProducto);
//router.put('/Actualizar-Cantidad', );
//router.delete('/Quitar-Producto', );
//router.post('/Confirmar-Pedido', );

module.exports = router;