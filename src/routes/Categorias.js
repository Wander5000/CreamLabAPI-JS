const express = require('express');
const router = express.Router();


router.get('/', (req, res) => { res.send('Obtener todas las categorías'); });
router.post('/', (req, res) => { res.send('Crear una nueva categoría'); });
router.put('/:id', (req, res) => { res.send(`Actualizar la categoría con ID ${req.params.id}`); });
router.delete('/:id', (req, res) => { res.send(`Eliminar la categoría con ID ${req.params.id}`); });

module.exports = router;