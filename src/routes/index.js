const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const usuarioRoutes = require('./usuarioRoutes');
const pacienteRoutes = require('./pacienteRoutes');
const doctorRoutes = require('./doctorRoutes');
const citaRoutes = require('./citaRoutes');
const centroMedicoRoutes = require('./centroMedicoRoutes');
const consultaRoutes = require('./consultaRoutes');
const evaluacionPieRoutes = require('./evaluacionPieRoutes');
const tratamientoRoutes = require('./tratamientoRoutes'); 

// Ruta de prueba
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'API funcionando correctamente' });
});

// Rutas de autenticación
router.use('/auth', authRoutes);

// Rutas de recursos
router.use('/usuarios', usuarioRoutes);
router.use('/pacientes', pacienteRoutes);
router.use('/doctores', doctorRoutes);
router.use('/citas', citaRoutes);
router.use('/centros', centroMedicoRoutes);
router.use('/consultas', consultaRoutes);
router.use('/evaluaciones-pie', evaluacionPieRoutes);
router.use('/tratamientos', tratamientoRoutes); 

module.exports = router;