const express = require('express');
const router = express.Router();


router.get('/', (req, res) => { res.send('Obtener todos los usuarios'); });
router.post('/', (req, res) => { res.send('Crear un nuevo Usuario'); });
router.put('/Cambiar-Estado/:id', (req, res) => { res.send(`Cambiar estado del Usuario con ID ${req.params.id}`); });

module.exports = router;