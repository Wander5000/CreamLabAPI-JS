const express = require('express');
const router = express.Router();
const { getAllClients, postClient, changeClientStatus } = require('../controllers/ClientesController.js');

router.get('/', getAllClients);
router.post('/', postClient);
router.put('/Cambiar-Estado/:id', changeClientStatus);

module.exports = router;