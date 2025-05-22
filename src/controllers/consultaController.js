const db = require("../config/database");
const Consulta = require("../models/consultaModel");

class VideollamadaService {
  // Generar enlace con Jitsi
  static generarEnlaceJitsi(idConsulta, nombrePaciente, nombreDoctor) {
    const salaId = `consulta-${idConsulta}-${Date.now()}`;
    const enlace = `https://meet.jit.si/${salaId}`;

    return {
      enlace,
      salaId,
      plataforma: "Jitsi Meet",
      instrucciones:
        "Haga clic en el enlace para unirse a la videollamada. No requiere instalación.",
    };
  }

  static generarEnlacePersonalizado(idConsulta, idPaciente, idDoctor) {
    const salaId = `sala-${idPaciente}-${idDoctor}-${idConsulta}`;
    const enlace = `https://videoconsulta.tusitio.com/sala/${salaId}`;

    return {
      enlace,
      salaId,
      plataforma: "Sistema Propio",
      instrucciones: "Use este enlace para acceder a su consulta virtual.",
    };
  }
}

exports.getAllConsultas = async (req, res, next) => {
  try {
    if (!req.userData) {
      return res.status(401).json({ message: "Autenticación requerida" });
    }

    let consultas = [];

    // Si es admin, obtiene todas las consultas
    if (req.userData.rol === 1) {
      consultas = await Consulta.findAll();
    }
    // Si es doctor, solo obtiene consultas de sus pacientes
    else if (req.userData.rol === 2) {
      const resultDoctor = await db.query(
        "SELECT id_doctor FROM doctores WHERE id_usuario = $1",
        [req.userData.id]
      );

      if (resultDoctor.rows.length > 0) {
        const id_doctor = resultDoctor.rows[0].id_doctor;
        consultas = await Consulta.getConsultasByDoctor(id_doctor);
      }
    }
    // Si es paciente, solo obtiene sus consultas
    else if (req.userData.rol === 3) {
      const resultPaciente = await db.query(
        "SELECT id_paciente FROM pacientes WHERE id_usuario = $1",
        [req.userData.id]
      );

      if (resultPaciente.rows.length > 0) {
        const id_paciente = resultPaciente.rows[0].id_paciente;
        consultas = await Consulta.getConsultasByPaciente(id_paciente);
      } else {
        return res.status(404).json({
          message:
            "No se encontró un perfil de paciente asociado a este usuario",
        });
      }
    } else {
      return res.status(403).json({ message: "Rol de usuario no autorizado" });
    }

    res.status(200).json({ data: consultas });
  } catch (error) {
    next(error);
  }
};

exports.createConsulta = async (req, res, next) => {
  try {
    // Solo doctores verificados o admin pueden crear consultas
    if (
      req.userData.rol !== 1 &&
      !(req.userData.rol === 2 && req.userData.doctor_verificado)
    ) {
      return res
        .status(403)
        .json({ message: "No tienes permisos para realizar esta acción" });
    }

    const {
      id_cita,
      id_videocita,
      id_paciente,
      id_doctor,
      fecha_consulta,
      tipo_consulta,
      sintomas,
      diagnostico,
      tratamiento,
      observaciones,
      recomendaciones,
      fecha_proxima_revision,
    } = req.body;

    // Validar que al menos un origen (cita o videocita) está presente
    if (!id_cita && !id_videocita) {
      return res
        .status(400)
        .json({ message: "Se requiere un id_cita o id_videocita" });
    }

    // Validar que el paciente y doctor existan
    if (!id_paciente || !id_doctor) {
      return res
        .status(400)
        .json({ message: "Se requiere id_paciente y id_doctor" });
    }

    // Si es doctor (no admin), verificar que sea el doctor asignado
    if (req.userData.rol === 2) {
      const resultDoctor = await db.query(
        "SELECT id_doctor FROM doctores WHERE id_usuario = $1",
        [req.userData.id]
      );

      if (
        resultDoctor.rows.length === 0 ||
        resultDoctor.rows[0].id_doctor !== parseInt(id_doctor)
      ) {
        return res.status(403).json({
          message: "Solo puedes crear consultas como el doctor asignado",
        });
      }
    }

    let videollamadaData = null;
    let nombrePaciente = "";
    let nombreDoctor = "";

    if (tipo_consulta === "Virtual") {
      try {
        console.log('🎥 Generando videollamada para consulta virtual...');
        
        const resultPaciente = await db.query(
          `SELECT p.*, u.nombre, u.apellido, u.email 
           FROM pacientes p 
           JOIN usuarios u ON p.id_usuario = u.id_usuario 
           WHERE p.id_paciente = $1`,
          [id_paciente]
        );

        const resultDoctor = await db.query(
          `SELECT d.*, u.nombre, u.apellido, u.email 
           FROM doctores d 
           JOIN usuarios u ON d.id_usuario = u.id_usuario 
           WHERE d.id_doctor = $1`,
          [id_doctor]
        );

        console.log('👤 Datos paciente encontrados:', resultPaciente.rows.length > 0);
        console.log('👨‍⚕️ Datos doctor encontrados:', resultDoctor.rows.length > 0);

        if (resultPaciente.rows.length > 0 && resultDoctor.rows.length > 0) {
          nombrePaciente = `${resultPaciente.rows[0].nombre} ${resultPaciente.rows[0].apellido}`;
          nombreDoctor = `${resultDoctor.rows[0].nombre} ${resultDoctor.rows[0].apellido}`;

          console.log('🏷️ Nombre paciente:', nombrePaciente);
          console.log('🏷️ Nombre doctor:', nombreDoctor);

          videollamadaData = VideollamadaService.generarEnlaceJitsi(
            Date.now(), 
            nombrePaciente,
            nombreDoctor
          );

          console.log('🔗 Videollamada generada:', videollamadaData);
        } else {
          console.log('❌ No se encontraron datos del paciente o doctor');
        }
      } catch (videoError) {
        console.error("❌ Error generando videollamada:", videoError);
      }
    }

    const consultaData = {
      id_cita,
      id_videocita,
      id_paciente,
      id_doctor,
      fecha_consulta,
      tipo_consulta,
      sintomas,
      diagnostico,
      tratamiento,
      observaciones,
      recomendaciones,
      fecha_proxima_revision,
      link_videollamada: videollamadaData?.enlace || null,
      sala_virtual: videollamadaData?.salaId || null,
      estado_videollamada: tipo_consulta === "Virtual" ? "pendiente" : null,
    };

    console.log('💾 Creando consulta con datos:', consultaData);

    const nuevaConsulta = await Consulta.create(consultaData);

    if (!nuevaConsulta) {
      return res.status(500).json({ message: "Error al crear la consulta" });
    }

    console.log('✅ Consulta creada con ID:', nuevaConsulta.id_consulta);

    if (tipo_consulta === "Virtual" && videollamadaData && nombrePaciente && nombreDoctor) {
      try {
        console.log('🔄 Actualizando enlace con ID real de consulta...');
        
        const videollamadaFinal = VideollamadaService.generarEnlaceJitsi(
          nuevaConsulta.id_consulta,
          nombrePaciente,
          nombreDoctor
        );

        await Consulta.updateVideollamada(nuevaConsulta.id_consulta, {
          link_videollamada: videollamadaFinal.enlace,
          sala_virtual: videollamadaFinal.salaId,
          estado_videollamada: "pendiente"
        });

        videollamadaData.enlace = videollamadaFinal.enlace;
        videollamadaData.salaId = videollamadaFinal.salaId;

        console.log('✅ Enlace actualizado:', videollamadaFinal.enlace);
      } catch (updateError) {
        console.error("❌ Error actualizando enlace videollamada:", updateError);
      }
    }

    const consultaCompleta = await Consulta.findById(nuevaConsulta.id_consulta);

    const response = {
      message: "Consulta creada exitosamente",
      data: consultaCompleta,
    };

    if (tipo_consulta === "Virtual" && videollamadaData) {
      response.videollamada = {
        enlace: videollamadaData.enlace,
        plataforma: videollamadaData.plataforma,
        instrucciones: videollamadaData.instrucciones,
        sala_id: videollamadaData.salaId,
      };
      console.log('📤 Respuesta incluye videollamada:', response.videollamada);
    }

    res.status(201).json(response);
  } catch (error) {
    console.error('💥 Error general en createConsulta:', error);
    next(error);
  }
};

exports.updateConsulta = async (req, res, next) => {
  try {
    if (!req.userData) {
      return res.status(401).json({ message: "Autenticación requerida" });
    }

    const id = req.params.id;
    const consulta = await Consulta.findById(id);

    if (!consulta) {
      return res.status(404).json({ message: "Consulta no encontrada" });
    }

    // Solo admin o el doctor que creó la consulta pueden actualizarla
    if (req.userData.rol !== 1) {
      if (req.userData.rol === 2) {
        const resultDoctor = await db.query(
          "SELECT id_doctor FROM doctores WHERE id_usuario = $1",
          [req.userData.id]
        );

        if (
          resultDoctor.rows.length === 0 ||
          resultDoctor.rows[0].id_doctor !== consulta.id_doctor
        ) {
          return res
            .status(403)
            .json({ message: "Solo puedes actualizar tus propias consultas" });
        }
      } else {
        return res
          .status(403)
          .json({ message: "No tienes permisos para actualizar consultas" });
      }
    }

    const updatedConsulta = await Consulta.update(id, {
      sintomas: req.body.sintomas,
      diagnostico: req.body.diagnostico,
      tratamiento: req.body.tratamiento,
      observaciones: req.body.observaciones,
      recomendaciones: req.body.recomendaciones,
      fecha_proxima_revision: req.body.fecha_proxima_revision,
    });

    if (!updatedConsulta) {
      return res
        .status(500)
        .json({ message: "Error al actualizar la consulta" });
    }

    // Obtener la consulta actualizada con información completa
    const consultaActualizada = await Consulta.findById(id);

    res.status(200).json({
      message: "Consulta actualizada exitosamente",
      data: consultaActualizada,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteConsulta = async (req, res, next) => {
  try {
    const id = req.params.id;
    const consulta = await Consulta.findById(id);

    if (!consulta) {
      return res.status(404).json({ message: "Consulta no encontrada" });
    }

    const deletedConsulta = await Consulta.delete(id);

    if (!deletedConsulta) {
      return res.status(500).json({ message: "Error al eliminar la consulta" });
    }

    res.status(200).json({
      message: "Consulta eliminada exitosamente",
    });
  } catch (error) {
    next(error);
  }
};

exports.getConsultaById = async (req, res, next) => {
  try {
    if (!req.userData) {
      return res.status(401).json({ message: "Autenticación requerida" });
    }

    const id = req.params.id;
    const consulta = await Consulta.findById(id);

    if (!consulta) {
      return res.status(404).json({ message: "Consulta no encontrada" });
    }

    // Si es admin, permitir acceso
    if (req.userData.rol === 1) {
      return res.status(200).json({ data: consulta });
    }

    // Si es doctor, verificar si la consulta es suya
    if (req.userData.rol === 2) {
      const resultDoctor = await db.query(
        "SELECT id_doctor FROM doctores WHERE id_usuario = $1",
        [req.userData.id]
      );

      if (
        resultDoctor.rows.length > 0 &&
        resultDoctor.rows[0].id_doctor === consulta.id_doctor
      ) {
        return res.status(200).json({ data: consulta });
      }
    }

    // Si es paciente, verificar si la consulta es suya
    if (req.userData.rol === 3) {
      const resultPaciente = await db.query(
        "SELECT id_paciente FROM pacientes WHERE id_usuario = $1",
        [req.userData.id]
      );

      if (
        resultPaciente.rows.length > 0 &&
        resultPaciente.rows[0].id_paciente === consulta.id_paciente
      ) {
        return res.status(200).json({ data: consulta });
      }
    }

    return res
      .status(403)
      .json({ message: "No tienes permisos para acceder a esta consulta" });
  } catch (error) {
    next(error);
  }
};

exports.getConsultasByPaciente = async (req, res, next) => {
  try {
    if (!req.userData) {
      return res.status(401).json({ message: "Autenticación requerida" });
    }

    const id_paciente = parseInt(req.params.id_paciente);

    // Si es admin, puede ver consultas de cualquier paciente
    if (req.userData.rol === 1) {
      const consultas = await Consulta.getConsultasByPaciente(id_paciente);
      return res.status(200).json({ data: consultas });
    }

    // Si es doctor, verificar si el paciente está asignado a él
    if (req.userData.rol === 2) {
      const resultDoctor = await db.query(
        "SELECT id_doctor FROM doctores WHERE id_usuario = $1",
        [req.userData.id]
      );

      if (resultDoctor.rows.length > 0) {
        const id_doctor = resultDoctor.rows[0].id_doctor;

        // Verificar si el paciente está asignado a este doctor
        const resultPaciente = await db.query(
          "SELECT * FROM pacientes WHERE id_paciente = $1 AND id_doctor_principal = $2",
          [id_paciente, id_doctor]
        );

        if (resultPaciente.rows.length > 0) {
          const consultas = await Consulta.getConsultasByPaciente(id_paciente);
          return res.status(200).json({ data: consultas });
        }
      }
    }

    // Si es el propio paciente
    if (req.userData.rol === 3) {
      const resultPaciente = await db.query(
        "SELECT id_paciente FROM pacientes WHERE id_usuario = $1",
        [req.userData.id]
      );

      if (
        resultPaciente.rows.length > 0 &&
        resultPaciente.rows[0].id_paciente === id_paciente
      ) {
        const consultas = await Consulta.getConsultasByPaciente(id_paciente);
        return res.status(200).json({ data: consultas });
      }
    }

    return res
      .status(403)
      .json({ message: "No tienes permisos para acceder a estas consultas" });
  } catch (error) {
    next(error);
  }
};

exports.getConsultasByDoctor = async (req, res, next) => {
  try {
    const id_doctor = req.params.id_doctor;
    const consultas = await Consulta.getConsultasByDoctor(id_doctor);

    res.status(200).json({ data: consultas });
  } catch (error) {
    next(error);
  }
};


exports.getEnlaceVideollamada = async (req, res, next) => {
  try {
    if (!req.userData) {
      return res.status(401).json({ message: "Autenticación requerida" });
    }

    const id = req.params.id;

    const result = await db.query(
      `SELECT 
        c.*,
        up.nombre as nombre_paciente,
        up.apellido as apellido_paciente,
        ud.nombre as nombre_doctor,
        ud.apellido as apellido_doctor
      FROM consultas c
      JOIN pacientes p ON c.id_paciente = p.id_paciente
      JOIN usuarios up ON p.id_usuario = up.id_usuario
      JOIN doctores d ON c.id_doctor = d.id_doctor
      JOIN usuarios ud ON d.id_usuario = ud.id_usuario
      WHERE c.id_consulta = $1 AND c.tipo_consulta = 'Virtual'`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Consulta virtual no encontrada",
      });
    }

    const consulta = result.rows[0];

    // Verificar permisos
    let tieneAcceso = false;

    if (req.userData.rol === 1) {
      tieneAcceso = true; // Admin
    } else if (req.userData.rol === 2) {
      // Doctor - verificar si es su consulta
      const resultDoctor = await db.query(
        "SELECT id_doctor FROM doctores WHERE id_usuario = $1",
        [req.userData.id]
      );

      if (
        resultDoctor.rows.length > 0 &&
        resultDoctor.rows[0].id_doctor === consulta.id_doctor
      ) {
        tieneAcceso = true;
      }
    } else if (req.userData.rol === 3) {
      // Paciente - verificar si es su consulta
      const resultPaciente = await db.query(
        "SELECT id_paciente FROM pacientes WHERE id_usuario = $1",
        [req.userData.id]
      );

      if (
        resultPaciente.rows.length > 0 &&
        resultPaciente.rows[0].id_paciente === consulta.id_paciente
      ) {
        tieneAcceso = true;
      }
    }

    if (!tieneAcceso) {
      return res.status(403).json({
        message: "No tienes permisos para acceder a esta videollamada",
      });
    }

    res.json({
      success: true,
      videollamada: {
        enlace: consulta.link_videollamada,
        sala_id: consulta.sala_virtual,
        estado: consulta.estado_videollamada,
        paciente: `${consulta.nombre_paciente} ${consulta.apellido_paciente}`,
        doctor: `${consulta.nombre_doctor} ${consulta.apellido_doctor}`,
        fecha: consulta.fecha_consulta,
        plataforma: "Jitsi Meet",
      },
    });
  } catch (error) {
    next(error);
  }
};

// Actualizar estado de videollamada
exports.actualizarEstadoVideollamada = async (req, res, next) => {
  try {
    if (!req.userData) {
      return res.status(401).json({ message: "Autenticación requerida" });
    }

    const id = req.params.id;
    const { estado } = req.body;

    // Validar estado
    const estadosValidos = ["pendiente", "activa", "finalizada"];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({
        message:
          "Estado inválido. Estados válidos: pendiente, activa, finalizada",
      });
    }

    // Verificar que la consulta existe y es virtual
    const consulta = await Consulta.findById(id);
    if (!consulta || consulta.tipo_consulta !== "Virtual") {
      return res.status(404).json({
        message: "Consulta virtual no encontrada",
      });
    }

    // Verificar permisos (solo doctor y paciente de la consulta pueden cambiar estado)
    let tienePermiso = false;

    if (req.userData.rol === 1) {
      tienePermiso = true; // Admin
    } else if (req.userData.rol === 2) {
      // Doctor
      const resultDoctor = await db.query(
        "SELECT id_doctor FROM doctores WHERE id_usuario = $1",
        [req.userData.id]
      );

      if (
        resultDoctor.rows.length > 0 &&
        resultDoctor.rows[0].id_doctor === consulta.id_doctor
      ) {
        tienePermiso = true;
      }
    } else if (req.userData.rol === 3) {
      // Paciente
      const resultPaciente = await db.query(
        "SELECT id_paciente FROM pacientes WHERE id_usuario = $1",
        [req.userData.id]
      );

      if (
        resultPaciente.rows.length > 0 &&
        resultPaciente.rows[0].id_paciente === consulta.id_paciente
      ) {
        tienePermiso = true;
      }
    }

    if (!tienePermiso) {
      return res.status(403).json({
        message: "No tienes permisos para actualizar esta videollamada",
      });
    }

    // Actualizar estado
    await db.query(
      "UPDATE consultas SET estado_videollamada = $1 WHERE id_consulta = $2",
      [estado, id]
    );

    res.json({
      success: true,
      message: "Estado de videollamada actualizado exitosamente",
    });
  } catch (error) {
    next(error);
  }
};

// Regenerar enlace de videollamada (en caso de problemas)
exports.regenerarEnlaceVideollamada = async (req, res, next) => {
  try {
    if (!req.userData) {
      return res.status(401).json({ message: "Autenticación requerida" });
    }

    const id = req.params.id;

    // Solo admin y doctor pueden regenerar enlaces
    if (req.userData.rol !== 1 && req.userData.rol !== 2) {
      return res.status(403).json({
        message: "No tienes permisos para regenerar enlaces de videollamada",
      });
    }

    const consulta = await Consulta.findById(id);
    if (!consulta || consulta.tipo_consulta !== "Virtual") {
      return res.status(404).json({
        message: "Consulta virtual no encontrada",
      });
    }

    // Si es doctor, verificar que sea su consulta
    if (req.userData.rol === 2) {
      const resultDoctor = await db.query(
        "SELECT id_doctor FROM doctores WHERE id_usuario = $1",
        [req.userData.id]
      );

      if (
        resultDoctor.rows.length === 0 ||
        resultDoctor.rows[0].id_doctor !== consulta.id_doctor
      ) {
        return res.status(403).json({
          message: "Solo puedes regenerar enlaces de tus propias consultas",
        });
      }
    }

    // CORREGIDO: Obtener datos para generar nuevo enlace
    const resultPaciente = await db.query(
      `SELECT u.nombre, u.apellido 
       FROM pacientes p 
       JOIN usuarios u ON p.id_usuario = u.id_usuario 
       WHERE p.id_paciente = $1`,
      [consulta.id_paciente]
    );

    const resultDoctor = await db.query(
      `SELECT u.nombre, u.apellido 
       FROM doctores d 
       JOIN usuarios u ON d.id_usuario = u.id_usuario 
       WHERE d.id_doctor = $1`,
      [consulta.id_doctor]
    );

    const nombrePaciente = `${resultPaciente.rows[0].nombre} ${resultPaciente.rows[0].apellido}`;
    const nombreDoctor = `${resultDoctor.rows[0].nombre} ${resultDoctor.rows[0].apellido}`;

    // Generar nuevo enlace
    const nuevaVideollamada = VideollamadaService.generarEnlaceJitsi(
      id,
      nombrePaciente,
      nombreDoctor
    );

    // Actualizar en base de datos
    await db.query(
      "UPDATE consultas SET link_videollamada = $1, sala_virtual = $2, estado_videollamada = $3 WHERE id_consulta = $4",
      [nuevaVideollamada.enlace, nuevaVideollamada.salaId, "pendiente", id]
    );

    res.json({
      success: true,
      message: "Enlace de videollamada regenerado exitosamente",
      videollamada: {
        enlace: nuevaVideollamada.enlace,
        sala_id: nuevaVideollamada.salaId,
        plataforma: nuevaVideollamada.plataforma,
        instrucciones: nuevaVideollamada.instrucciones,
      },
    });
  } catch (error) {
    next(error);
  }
};