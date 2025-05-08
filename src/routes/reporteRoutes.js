const express = require('express');
const router = express.Router();
const reporteController = require('../controllers/reporteController');
const { authMiddleware, esAdmin, esDoctorVerificado } = require('../middlewares/auth');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Reportes generales (admin y doctores verificados)
router.get('/pacientes-por-tipo-diabetes', esDoctorVerificado, reporteController.pacientesPorTipoDiabetes);
router.get('/pacientes-por-nivel-riesgo', esDoctorVerificado, reporteController.pacientesPorNivelRiesgo);
router.get('/consultas-por-mes', esDoctorVerificado, reporteController.consultasPorMes);
router.get('/evaluaciones-por-grado-riesgo', esDoctorVerificado, reporteController.evaluacionesPorGradoRiesgo);

// Reportes específicos por doctor
router.get('/estadisticas-por-doctor', esAdmin, reporteController.estadisticasPorDoctor);
router.get('/doctor/:id_doctor/estadisticas', reporteController.estadisticasDoctor);

// Dashboard para paciente
router.get('/paciente/dashboard', reporteController.dashboardPaciente);

module.exports = router;