const express = require('express');
const router = express.Router();
const { getAllProIns } = require('../controllers/ProInsController.js');

router.get('/:idProducto', getAllProIns);

module.exports = router;