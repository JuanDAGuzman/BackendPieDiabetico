const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { authMiddleware, esAdmin, esDoctorVerificado } = require('../middlewares/auth');

// Todas las rutas requieren autenticación
router.use(authMiddleware);


router.post('/:id_doctor/pacientes', authMiddleware, esAdmin, doctorPacienteController.asignarPaciente);
router.delete('/:id_doctor/pacientes/:id_paciente', authMiddleware, esAdmin, doctorPacienteController.desasignarPaciente);
router.get('/:id_doctor/pacientes', authMiddleware, esDoctorVerificado, doctorPacienteController.getPacientesByDoctor);

// Rutas para crear y verificar doctores
router.post('/', authMiddleware, doctorController.createDoctor); // Cualquiera puede solicitar ser doctor
router.put('/:id/verificar', authMiddleware, esAdmin, doctorController.verificarDoctor);

// Rutas para consultar doctores
router.get('/', authMiddleware, doctorController.getAllDoctores); // Todos pueden ver doctores verificados
router.get('/:id', authMiddleware, doctorController.getDoctorById);

// Rutas para gestionar doctores
router.put('/:id', esAdmin, doctorController.updateDoctor); // Solo admin puede actualizar
router.delete('/:id', esAdmin, doctorController.deleteDoctor); // Solo admin puede eliminar

// Rutas adicionales
router.get('/:id/centros', authMiddleware, doctorController.getCentrosDoctor);
router.get('/:id/horarios', authMiddleware, doctorController.getHorariosDoctor);
router.get('/:id/pacientes', esDoctorVerificado, doctorController.getPacientesDoctor);

module.exports = router;