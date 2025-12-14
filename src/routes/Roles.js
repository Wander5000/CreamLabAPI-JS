const express = require('express');
const router = express.Router();
const { getAllRoles, postRol, putRol, deleteRol } = require('../controllers/RolesController');

router.get('/', getAllRoles);
router.post('/', postRol);
router.put('/:id', putRol);
router.delete('/:id', deleteRol);

module.exports = router;