// src/routes/consultaRoutes.js
const express = require("express");
const router = express.Router();
const consultaController = require("../controllers/consultaController");
const {
  authMiddleware,
  esDoctorVerificado,
  accesoPaciente,
} = require("../middlewares/auth");

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Rutas generales (filtran resultados según rol en el controlador)
router.get("/", consultaController.getAllConsultas);
router.get("/:id", consultaController.getConsultaById);

// Rutas específicas con control de acceso
router.get(
  "/paciente/:id_paciente",
  accesoPaciente,
  consultaController.getConsultasByPaciente
);
router.get("/doctor/:id_doctor", consultaController.getConsultasByDoctor);

// Rutas para crear y modificar consultas (solo doctores verificados)
router.post("/", esDoctorVerificado, consultaController.createConsulta);
router.put("/:id", consultaController.updateConsulta);
router.delete("/:id", consultaController.deleteConsulta);

// Obtener enlace de videollamada de una consulta específica
router.get("/:id/videollamada", consultaController.getEnlaceVideollamada);

// Actualizar estado de videollamada
router.patch(
  "/:id/videollamada/estado",
  consultaController.actualizarEstadoVideollamada
);

// Regenerar enlace de videollamada (opcional)
router.put(
  "/:id/videollamada/regenerar",
  consultaController.regenerarEnlaceVideollamada
);

module.exports = router;
