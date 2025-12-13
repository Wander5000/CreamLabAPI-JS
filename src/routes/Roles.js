const express = require('express');
const router = express.Router();


router.get('/', (req, res) => { res.send('Obtener todos los roles'); });
router.post('/', (req, res) => { res.send('Crear un nuevo rol'); });
router.put('/:id', (req, res) => { res.send(`Actualizar el rol con ID ${req.params.id}`); });
router.delete('/:id', (req, res) => { res.send(`Eliminar el rol con ID ${req.params.id}`); });

module.exports = router;