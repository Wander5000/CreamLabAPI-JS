const express = require('express');
const router = express.Router();
const { getAllCategories, postCategory, putCategory, deleteCategory } = require('../controllers/CategoriasController.js');

router.get('/', getAllCategories);
router.post('/', postCategory);
router.put('/:id', putCategory);
router.delete('/:id', deleteCategory);

module.exports = router;