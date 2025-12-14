const express = require('express');
const router = express.Router();
const { LogIn, Register } = require('../controllers/AuthController.js');

router.post('/Log-In', LogIn);
router.post('/Sign-Up', Register);

module.exports = router;