// src/routes/pacienteRoutes.js
const express = require('express');
const router = express.Router();
const pacienteController = require('../controllers/pacienteController');
const { authMiddleware, esAdmin, esDoctorVerificado, accesoPaciente } = require('../middlewares/auth');

// Todas las rutas requieren autenticación
router.use(authMiddleware);


// Ruta para completar perfil de paciente (usuario existente)
router.post('/perfil', authMiddleware, pacienteController.completarPerfilPaciente);
// Solo admin o doctores verificados pueden ver todos los pacientes
router.get('/', esDoctorVerificado, pacienteController.getAllPacientes);

// Control de acceso para ver un paciente específico
router.get('/:id', accesoPaciente, pacienteController.getPacienteById);

// Cualquiera puede registrarse como paciente
router.post('/', authMiddleware, pacienteController.createPaciente);

// Control de acceso para actualizar un paciente
router.put('/:id', accesoPaciente, pacienteController.updatePaciente);

// Solo administradores pueden eliminar pacientes
router.delete('/:id', esAdmin, pacienteController.deletePaciente);

// Rutas adicionales con control de acceso
router.get('/:id_paciente/consultas', accesoPaciente, pacienteController.getConsultasPaciente);
router.get('/:id_paciente/citas', accesoPaciente, pacienteController.getCitasPaciente);
router.get('/:id_paciente/evaluaciones-pie', accesoPaciente, pacienteController.getEvaluacionesPiePaciente);
router.get('/:id_paciente/resultados-laboratorio', accesoPaciente, pacienteController.getResultadosLaboratorioPaciente);

module.exports = router;