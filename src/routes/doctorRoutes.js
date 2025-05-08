// src/routes/doctorRoutes.js
const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { authMiddleware, esAdmin, esDoctorVerificado } = require('../middlewares/auth');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Ruta para completar perfil de doctor (usuario existente)
router.post('/perfil', authMiddleware, doctorController.completarPerfilDoctor);

// Cualquiera puede ver la lista de doctores verificados
router.get('/', authMiddleware, doctorController.getAllDoctores);

// Cualquiera puede ver los detalles de un doctor verificado
router.get('/:id', authMiddleware, doctorController.getDoctorById);

// Cualquiera puede solicitar ser doctor
router.post('/', authMiddleware, doctorController.createDoctor);

// Solo administradores pueden verificar doctores
router.put('/:id/verificar', esAdmin, doctorController.verificarDoctor);

// Solo el propio doctor o administradores pueden actualizar un doctor
router.put('/:id', authMiddleware, doctorController.updateDoctor);

// Solo administradores pueden eliminar doctores
router.delete('/:id', esAdmin, doctorController.deleteDoctor);

// Cualquiera puede ver los centros donde trabaja un doctor
router.get('/:id/centros', authMiddleware, doctorController.getCentrosDoctor);

// Cualquiera puede ver los horarios de un doctor
router.get('/:id/horarios', authMiddleware, doctorController.getHorariosDoctor);

// Solo el propio doctor o administradores pueden ver los pacientes del doctor
router.get('/:id/pacientes', esDoctorVerificado, doctorController.getPacientesDoctor);

module.exports = router;