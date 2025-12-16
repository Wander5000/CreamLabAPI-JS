const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/Auth.js')
const { getCarrito , agregarProducto, actualizarCantidad, quitarProducto, confirmarPedido } = require('../controllers/CarritoController.js');

router.get('/Mi-Carrito/', authMiddleware, getCarrito);
router.post('/Agregar-Producto', authMiddleware, agregarProducto);
router.put('/Actualizar-Cantidad', authMiddleware, actualizarCantidad);
router.delete('/Quitar-Producto', authMiddleware, quitarProducto);
router.post('/Confirmar-Pedido', authMiddleware, confirmarPedido);

module.exports = router;