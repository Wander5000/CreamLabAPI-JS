const express = require('express');
const router = express.Router();

router.get('/', (req, res) => { res.send('Obtener todos los pedidos'); });
router.get('/:id', (req, res) => { res.send(`Obtener el pedido con ID ${req.params.id}`); });
router.get('/Cliente/:clientId', (req, res) => { res.send(`Obtener pedidos del cliente con ID ${req.params.clientId}`); });
router.post('/', (req, res) => { res.send('Crear un nuevo pedido'); });
router.put('/:id', (req, res) => { res.send(`Actualizar el pedido con ID ${req.params.id}`); });
router.put('/Anular-Pedido/:id', (req, res) => { res.send(`Anular el pedido con ID ${req.params.id}`); });

module.exports = router;