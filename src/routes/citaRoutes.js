// src/routes/citaRoutes.js
const express = require('express');
const router = express.Router();
const citaController = require('../controllers/citaController');
const { authMiddleware, esAdmin, esDoctorVerificado, accesoPaciente } = require('../middlewares/auth');

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

// Rutas generales (filtran resultados según rol en el controlador)
router.get('/', citaController.getAllCitas);
router.get('/proximas', citaController.getProximasCitas);

// Rutas específicas con control de acceso adicional
router.get('/doctor/:id_doctor', citaController.getCitasByDoctor);
router.get('/paciente/:id_paciente', accesoPaciente, citaController.getCitasByPaciente);
router.get('/:id', citaController.getCitaById);

// Rutas para crear y modificar citas (solo doctores y admin)
router.post('/', esDoctorVerificado, citaController.createCita);
router.put('/:id', esDoctorVerificado, citaController.updateCita);
router.delete('/:id', esDoctorVerificado, citaController.deleteCita);

module.exports = router;