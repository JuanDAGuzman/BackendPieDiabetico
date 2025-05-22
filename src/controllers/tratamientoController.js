const db = require("../config/database");
const Tratamiento = require("../models/tratamientoModel");

exports.getAllTratamientos = async (req, res, next) => {
  try {
    if (!req.userData) {
      return res.status(401).json({ message: "Autenticación requerida" });
    }

    let tratamientos = [];

    // Si es admin, obtiene todos los tratamientos
    if (req.userData.rol === 1) {
      tratamientos = await Tratamiento.findAll();
    }
    // Si es doctor, solo obtiene tratamientos de sus pacientes
    else if (req.userData.rol === 2) {
      const resultDoctor = await db.query(
        "SELECT id_doctor FROM doctores WHERE id_usuario = $1",
        [req.userData.id]
      );

      if (resultDoctor.rows.length > 0) {
        const id_doctor = resultDoctor.rows[0].id_doctor;
        // Obtener tratamientos de consultas del doctor
        const query = `
          SELECT t.*, c.fecha_consulta, 
                 p.id_paciente, CONCAT(up.nombre, ' ', up.apellido) as nombre_paciente
          FROM tratamientos t
          JOIN consultas c ON t.id_consulta = c.id_consulta
          JOIN pacientes p ON c.id_paciente = p.id_paciente
          JOIN usuarios up ON p.id_usuario = up.id_usuario
          WHERE c.id_doctor = $1
          ORDER BY t.fecha_inicio DESC
        `;

        const result = await db.query(query, [id_doctor]);
        tratamientos = result.rows;
      }
    }
    // Si es paciente, solo obtiene sus tratamientos
    else if (req.userData.rol === 3) {
      const resultPaciente = await db.query(
        "SELECT id_paciente FROM pacientes WHERE id_usuario = $1",
        [req.userData.id]
      );

      if (resultPaciente.rows.length > 0) {
        const id_paciente = resultPaciente.rows[0].id_paciente;
        tratamientos = await Tratamiento.getTratamientosByPaciente(id_paciente);
      } else {
        return res.status(404).json({
          message:
            "No se encontró un perfil de paciente asociado a este usuario",
        });
      }
    } else {
      return res.status(403).json({ message: "Rol de usuario no autorizado" });
    }

    res.status(200).json({ data: tratamientos });
  } catch (error) {
    next(error);
  }
};

exports.getTratamientoById = async (req, res, next) => {
  try {
    if (!req.userData) {
      return res.status(401).json({ message: "Autenticación requerida" });
    }

    const id = req.params.id;
    const tratamiento = await Tratamiento.findById(id);

    if (!tratamiento) {
      return res.status(404).json({ message: "Tratamiento no encontrado" });
    }

    // Si es admin, permitir acceso
    if (req.userData.rol === 1) {
      return res.status(200).json({ data: tratamiento });
    }

    // Si es doctor, verificar si el tratamiento es de una consulta suya
    if (req.userData.rol === 2) {
      const resultDoctor = await db.query(
        "SELECT id_doctor FROM doctores WHERE id_usuario = $1",
        [req.userData.id]
      );

      if (resultDoctor.rows.length > 0) {
        const id_doctor = resultDoctor.rows[0].id_doctor;

        // Verificar si el tratamiento pertenece a una consulta del doctor
        const verificacion = await db.query(
          "SELECT c.id_doctor FROM consultas c WHERE c.id_consulta = $1",
          [tratamiento.id_consulta]
        );

        if (
          verificacion.rows.length > 0 &&
          verificacion.rows[0].id_doctor === id_doctor
        ) {
          return res.status(200).json({ data: tratamiento });
        }
      }
    }

    // Si es paciente, verificar si el tratamiento es suyo
    if (req.userData.rol === 3) {
      const resultPaciente = await db.query(
        "SELECT id_paciente FROM pacientes WHERE id_usuario = $1",
        [req.userData.id]
      );

      if (resultPaciente.rows.length > 0) {
        const id_paciente = resultPaciente.rows[0].id_paciente;

        // Verificar si el tratamiento pertenece a una consulta del paciente
        const verificacion = await db.query(
          "SELECT c.id_paciente FROM consultas c WHERE c.id_consulta = $1",
          [tratamiento.id_consulta]
        );

        if (
          verificacion.rows.length > 0 &&
          verificacion.rows[0].id_paciente === id_paciente
        ) {
          return res.status(200).json({ data: tratamiento });
        }
      }
    }

    return res
      .status(403)
      .json({ message: "No tienes permisos para acceder a este tratamiento" });
  } catch (error) {
    next(error);
  }
};

exports.createTratamiento = async (req, res, next) => {
  try {
    const {
      id_consulta,
      tipo_tratamiento,
      nombre,
      descripcion,
      dosis,
      frecuencia,
      duracion,
      instrucciones_especiales,
      fecha_inicio,
      fecha_fin,
      estado,
    } = req.body;

    if (!id_consulta || !tipo_tratamiento || !nombre) {
      return res.status(400).json({
        message: "Se requiere id_consulta, tipo_tratamiento y nombre",
      });
    }

    const nuevoTratamiento = await Tratamiento.create({
      id_consulta,
      tipo_tratamiento,
      nombre,
      descripcion,
      dosis,
      frecuencia,
      duracion,
      instrucciones_especiales,
      fecha_inicio,
      fecha_fin,
      estado,
    });

    if (!nuevoTratamiento) {
      return res.status(500).json({ message: "Error al crear el tratamiento" });
    }

    // Obtener el tratamiento completo
    const tratamientoCompleto = await Tratamiento.findById(
      nuevoTratamiento.id_tratamiento
    );

    res.status(201).json({
      message: "Tratamiento creado exitosamente",
      data: tratamientoCompleto,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateTratamiento = async (req, res, next) => {
  try {
    const id = req.params.id;
    const tratamiento = await Tratamiento.findById(id);

    if (!tratamiento) {
      return res.status(404).json({ message: "Tratamiento no encontrado" });
    }

    const updatedTratamiento = await Tratamiento.update(id, {
      tipo_tratamiento:
        req.body.tipo_tratamiento || tratamiento.tipo_tratamiento,
      nombre: req.body.nombre || tratamiento.nombre,
      descripcion: req.body.descripcion || tratamiento.descripcion,
      dosis: req.body.dosis || tratamiento.dosis,
      frecuencia: req.body.frecuencia || tratamiento.frecuencia,
      duracion: req.body.duracion || tratamiento.duracion,
      instrucciones_especiales:
        req.body.instrucciones_especiales ||
        tratamiento.instrucciones_especiales,
      fecha_inicio: req.body.fecha_inicio || tratamiento.fecha_inicio,
      fecha_fin: req.body.fecha_fin || tratamiento.fecha_fin,
      estado: req.body.estado || tratamiento.estado,
    });

    if (!updatedTratamiento) {
      return res
        .status(500)
        .json({ message: "Error al actualizar el tratamiento" });
    }

    // Obtener el tratamiento actualizado completo
    const tratamientoActualizado = await Tratamiento.findById(id);

    res.status(200).json({
      message: "Tratamiento actualizado exitosamente",
      data: tratamientoActualizado,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteTratamiento = async (req, res, next) => {
  try {
    const id = req.params.id;
    const tratamiento = await Tratamiento.findById(id);

    if (!tratamiento) {
      return res.status(404).json({ message: "Tratamiento no encontrado" });
    }

    const deletedTratamiento = await Tratamiento.delete(id);

    if (!deletedTratamiento) {
      return res
        .status(500)
        .json({ message: "Error al cancelar el tratamiento" });
    }

    res.status(200).json({
      message: "Tratamiento cancelado exitosamente",
    });
  } catch (error) {
    next(error);
  }
};

exports.getTratamientosByPaciente = async (req, res, next) => {
  try {
    if (!req.userData) {
      return res.status(401).json({ message: "Autenticación requerida" });
    }

    const id_paciente = parseInt(req.params.id_paciente);

    // Si es admin, puede ver tratamientos de cualquier paciente
    if (req.userData.rol === 1) {
      const tratamientos = await Tratamiento.getTratamientosByPaciente(
        id_paciente
      );
      return res.status(200).json({ data: tratamientos });
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
          const tratamientos = await Tratamiento.getTratamientosByPaciente(
            id_paciente
          );
          return res.status(200).json({ data: tratamientos });
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
        const tratamientos = await Tratamiento.getTratamientosByPaciente(
          id_paciente
        );
        return res.status(200).json({ data: tratamientos });
      }
    }

    return res
      .status(403)
      .json({
        message: "No tienes permisos para acceder a estos tratamientos",
      });
  } catch (error) {
    next(error);
  }
};

exports.getTratamientosByConsulta = async (req, res, next) => {
  try {
    const id_consulta = req.params.id_consulta;
    const tratamientos = await Tratamiento.getTratamientosByConsulta(
      id_consulta
    );

    res.status(200).json({ data: tratamientos });
  } catch (error) {
    next(error);
  }
};

exports.getSeguimientos = async (req, res, next) => {
  try {
    const id_tratamiento = req.params.id_tratamiento;
    const seguimientos = await Tratamiento.getSeguimientos(id_tratamiento);

    res.status(200).json({ data: seguimientos });
  } catch (error) {
    next(error);
  }
};

exports.addSeguimiento = async (req, res, next) => {
  try {
    const id_tratamiento = req.params.id_tratamiento;
    const {
      fecha_seguimiento,
      cumplimiento,
      efectos_secundarios,
      efectividad,
      observaciones,
      id_doctor,
    } = req.body;

    if (!cumplimiento || !efectividad) {
      return res
        .status(400)
        .json({ message: "Se requiere cumplimiento y efectividad" });
    }

    const nuevoSeguimiento = await Tratamiento.addSeguimiento({
      id_tratamiento,
      fecha_seguimiento,
      cumplimiento,
      efectos_secundarios,
      efectividad,
      observaciones,
      id_doctor,
    });

    if (!nuevoSeguimiento) {
      return res
        .status(500)
        .json({ message: "Error al agregar el seguimiento" });
    }

    res.status(201).json({
      message: "Seguimiento agregado exitosamente",
      data: nuevoSeguimiento,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateSeguimiento = async (req, res, next) => {
  try {
    const id = req.params.id_seguimiento;

    // Verificar que existe
    const seguimientoExistente = await db.query(
      "SELECT * FROM seguimiento_tratamientos WHERE id_seguimiento = $1",
      [id]
    );

    if (seguimientoExistente.rows.length === 0) {
      return res.status(404).json({ message: "Seguimiento no encontrado" });
    }

    const updatedSeguimiento = await Tratamiento.updateSeguimiento(
      id,
      req.body
    );

    if (!updatedSeguimiento) {
      return res
        .status(500)
        .json({ message: "Error al actualizar el seguimiento" });
    }

    res.status(200).json({
      message: "Seguimiento actualizado exitosamente",
      data: updatedSeguimiento,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteSeguimiento = async (req, res, next) => {
  try {
    const id = req.params.id_seguimiento;

    const deletedSeguimiento = await Tratamiento.deleteSeguimiento(id);

    if (!deletedSeguimiento) {
      return res.status(404).json({ message: "Seguimiento no encontrado" });
    }

    res.status(200).json({
      message: "Seguimiento eliminado exitosamente",
    });
  } catch (error) {
    next(error);
  }
};
