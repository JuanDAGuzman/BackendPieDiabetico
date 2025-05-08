// src/routes/consultaRoutes.js
const express = require('express');
const router = express.Router();
const consultaController = require('../controllers/consultaController');
const { authMiddleware, esDoctorVerificado, accesoPaciente } = require('../middlewares/auth');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Solo doctores verificados pueden ver todas las consultas
router.get('/', esDoctorVerificado, consultaController.getAllConsultas);

// Control de acceso para consultas específicas
router.get('/:id', authMiddleware, consultaController.getConsultaById); // Se verifica dentro del controlador

// Solo doctores pueden crear consultas
router.post('/', esDoctorVerificado, consultaController.createConsulta);

// Solo el doctor que creó la consulta puede actualizarla
router.put('/:id', esDoctorVerificado, consultaController.updateConsulta); // Se verifica dentro del controlador

// Solo doctores pueden eliminar consultas
router.delete('/:id', esDoctorVerificado, consultaController.deleteConsulta); // Se verifica dentro del controlador

// Control de acceso para consultas de un paciente específico
router.get('/paciente/:id_paciente', accesoPaciente, consultaController.getConsultasByPaciente);

module.exports = router;