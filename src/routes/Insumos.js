const express = require('express');
const router = express.Router();
const { getAllInsumos, postInsumo, putInsumo, deleteInsumo} = require('../controllers/InsumosController.js');

router.get('/', getAllInsumos);
router.post('/', postInsumo);
router.put('/:id', putInsumo);
router.delete('/:id', deleteInsumo);

module.exports = router;