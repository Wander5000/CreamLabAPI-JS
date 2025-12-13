const express = require('express');
const router = express.Router();


router.get('/', (req, res) => { res.send('Obtener todos los estados'); });
router.post('/', (req, res) => { res.send('Crear un nuevo estado'); });
router.put('/:id', (req, res) => { res.send(`Actualizar el estado con ID ${req.params.id}`); });
router.delete('/:id', (req, res) => { res.send(`Eliminar el estado con ID ${req.params.id}`); });

module.exports = router;