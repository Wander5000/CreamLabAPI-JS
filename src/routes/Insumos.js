const express = require('express');
const router = express.Router();


router.get('/', (req, res) => { res.send('Obtener todos los insumos'); });
router.post('/', (req, res) => { res.send('Crear un nuevo insumo'); });
router.put('/:id', (req, res) => { res.send(`Actualizar el insumo con ID ${req.params.id}`); });
router.delete('/:id', (req, res) => { res.send(`Eliminar el insumo con ID ${req.params.id}`); });

module.exports = router;