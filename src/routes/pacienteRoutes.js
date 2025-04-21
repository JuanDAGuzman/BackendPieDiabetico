const express = require("express");
const router = express.Router();
const pacienteController = require("../controllers/pacienteController");
const {
  authMiddleware,
  esAdmin,
  esDoctorVerificado,
  accesoPaciente,
} = require("../middlewares/auth");

// Todas las rutas requieren autenticación
router.use(authMiddleware);


router.get('/:id_paciente/doctores', authMiddleware, accesoPaciente, doctorPacienteController.getDoctoresByPaciente);


// Rutas para admin y doctores verificados
router.get("/", esDoctorVerificado, pacienteController.getAllPacientes);
router.post("/", authMiddleware, pacienteController.createPaciente); // Cualquiera puede registrar un paciente

// Rutas con control de acceso por paciente
router.get("/:id", accesoPaciente, pacienteController.getPacienteById);
router.put("/:id", accesoPaciente, pacienteController.updatePaciente);
router.delete("/:id", esAdmin, pacienteController.deletePaciente); // Solo admin puede eliminar

// Rutas adicionales con control de acceso
router.get(
  "/:id_paciente/consultas",
  accesoPaciente,
  pacienteController.getConsultasPaciente
);
router.get(
  "/:id_paciente/citas",
  accesoPaciente,
  pacienteController.getCitasPaciente
);
router.get(
  "/:id_paciente/evaluaciones-pie",
  accesoPaciente,
  pacienteController.getEvaluacionesPiePaciente
);
router.get(
  "/:id_paciente/resultados-laboratorio",
  accesoPaciente,
  pacienteController.getResultadosLaboratorioPaciente
);

module.exports = router;
