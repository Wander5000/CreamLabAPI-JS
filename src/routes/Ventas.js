const express = require('express');
const router = express.Router();


router.get('/', (req, res) => { res.send('Obtener todas las ventas'); });
router.post('/', (req, res) => { res.send('Crear una nueva venta'); });
router.put('/:id', (req, res) => { res.send(`Actualizar la venta con ID ${req.params.id}`); });

module.exports = router;