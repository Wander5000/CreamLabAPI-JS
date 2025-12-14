const express = require('express');
const router = express.Router();
const { getAllStates, postState, putState, deleteState } = require('../controllers/EstadosController.js');

router.get('/', getAllStates);
router.post('/', postState);
router.put('/:id', putState);
router.delete('/:id', deleteState);

module.exports = router;