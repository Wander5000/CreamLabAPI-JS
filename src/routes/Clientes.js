const express = require('express');
const router = express.Router();
const { getAllClients, postClient, updateClient, changeClientStatus } = require('../controllers/ClientesController.js');

router.get('/', getAllClients);
router.post('/', postClient);
router.put('/:id', updateClient);
router.put('/Cambiar-Estado/:id', changeClientStatus);

module.exports = router;