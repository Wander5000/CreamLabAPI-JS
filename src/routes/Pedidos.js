const express = require('express');
const router = express.Router();
const { getAllPedidos, getPedidoById, postPedido, putPedido, anularPedido } = require('../controllers/PedidosController.js')

router.get('/', getAllPedidos);
router.get('/:id', getPedidoById);
router.post('/', postPedido);
router.put('/:id', putPedido);
router.put('/Anular-Pedido/:id', anularPedido);

module.exports = router;