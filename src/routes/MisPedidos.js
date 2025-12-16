const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/Auth.js');
const { getPedidosByUser, getPedidoByUserById, anularPedido } = require('../controllers/MisPedidosController.js');

router.get('/Usuario', authMiddleware, getPedidosByUser);
router.get('/Usuario/:id', authMiddleware, getPedidoByUserById);
router.put('/Usuario/Anular-Pedido/:id', authMiddleware, anularPedido);

module.exports = router;