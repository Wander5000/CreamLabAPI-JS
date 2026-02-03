const express = require('express');
const router = express.Router();
const { getAllCategoriasInsumo, postCategoriaInsumo, putCategoriaInsumo, deleteCategoriaInsumo } = require('../controllers/CategoriasInsumoController');

router.get('/', getAllCategoriasInsumo);
router.post('/', postCategoriaInsumo);
router.put('/:id', putCategoriaInsumo);
router.delete('/:id', deleteCategoriaInsumo);

module.exports = router;