const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middlewares/auth');

// Rutas que no requieren autenticación
router.post('/login', authController.login);
router.post('/register', authController.register);

// Rutas que requieren autenticación
router.get('/profile', authMiddleware, authController.getProfile);
router.put('/profile', authMiddleware, authController.updateProfile);

module.exports = router;