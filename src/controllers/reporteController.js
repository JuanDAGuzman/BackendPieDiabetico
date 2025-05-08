const db = require("../config/database");

// Reporte de pacientes por tipo de diabetes
exports.pacientesPorTipoDiabetes = async (req, res, next) => {
  try {
    // Solo doctores verificados o admin pueden ver este reporte
    if (
      req.userData.rol !== 1 &&
      !(req.userData.rol === 2 && req.userData.doctor_verificado)
    ) {
      return res
        .status(403)
        .json({ message: "No tienes permisos para acceder a este recurso" });
    }

    const query = `
      SELECT tipo_diabetes, COUNT(*) as cantidad
      FROM pacientes
      WHERE tipo_diabetes IS NOT NULL
      GROUP BY tipo_diabetes
      ORDER BY cantidad DESC
    `;

    const result = await db.query(query);

    res.status(200).json({ data: result.rows });
  } catch (error) {
    next(error);
  }
};

// Reporte de pacientes por nivel de riesgo
exports.pacientesPorNivelRiesgo = async (req, res, next) => {
  try {
    // Solo doctores verificados o admin pueden ver este reporte
    if (
      req.userData.rol !== 1 &&
      !(req.userData.rol === 2 && req.userData.doctor_verificado)
    ) {
      return res
        .status(403)
        .json({ message: "No tienes permisos para acceder a este recurso" });
    }

    const query = `
      SELECT nivel_riesgo, COUNT(*) as cantidad
      FROM pacientes
      WHERE nivel_riesgo IS NOT NULL
      GROUP BY nivel_riesgo
      ORDER BY 
        CASE 
          WHEN nivel_riesgo = 'Bajo' THEN 1
          WHEN nivel_riesgo = 'Medio' THEN 2
          WHEN nivel_riesgo = 'Alto' THEN 3
          WHEN nivel_riesgo = 'Muy Alto' THEN 4
          ELSE 5
        END
    `;

    const result = await db.query(query);

    res.status(200).json({ data: result.rows });
  } catch (error) {
    next(error);
  }
};

// Reporte de consultas por mes
exports.consultasPorMes = async (req, res, next) => {
  try {
    // Solo doctores verificados o admin pueden ver este reporte
    if (
      req.userData.rol !== 1 &&
      !(req.userData.rol === 2 && req.userData.doctor_verificado)
    ) {
      return res
        .status(403)
        .json({ message: "No tienes permisos para acceder a este recurso" });
    }

    const query = `
      SELECT 
        DATE_TRUNC('month', fecha_consulta) as mes,
        COUNT(*) as cantidad
      FROM consultas
      WHERE fecha_consulta >= NOW() - INTERVAL '12 months'
      GROUP BY mes
      ORDER BY mes
    `;

    const result = await db.query(query);

    // Continuación de src/controllers/reporteController.js

    // Formatear resultados para mejor legibilidad
    const data = result.rows.map((row) => {
      return {
        mes: new Date(row.mes).toISOString().substring(0, 7), // Formato YYYY-MM
        cantidad: parseInt(row.cantidad),
      };
    });

    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
};

// Reporte de evaluaciones por grado de riesgo
exports.evaluacionesPorGradoRiesgo = async (req, res, next) => {
  try {
    // Solo doctores verificados o admin pueden ver este reporte
    if (
      req.userData.rol !== 1 &&
      !(req.userData.rol === 2 && req.userData.doctor_verificado)
    ) {
      return res
        .status(403)
        .json({ message: "No tienes permisos para acceder a este recurso" });
    }

    const query = `
        SELECT grado_riesgo, COUNT(*) as cantidad
        FROM evaluaciones_pie
        WHERE grado_riesgo IS NOT NULL
        GROUP BY grado_riesgo
        ORDER BY grado_riesgo
      `;

    const result = await db.query(query);

    res.status(200).json({ data: result.rows });
  } catch (error) {
    next(error);
  }
};

// Estadísticas por doctor (cantidad de pacientes, consultas, evaluaciones)
exports.estadisticasPorDoctor = async (req, res, next) => {
  try {
    // Solo admin puede ver estadísticas de todos los doctores
    if (req.userData.rol !== 1) {
      return res
        .status(403)
        .json({ message: "No tienes permisos para acceder a este recurso" });
    }

    const query = `
        SELECT 
          d.id_doctor,
          CONCAT(u.nombre, ' ', u.apellido) as nombre_doctor,
          u.email,
          d.especialidad,
          COUNT(DISTINCT p.id_paciente) as cantidad_pacientes,
          COUNT(DISTINCT c.id_consulta) as cantidad_consultas,
          COUNT(DISTINCT ep.id_evaluacion) as cantidad_evaluaciones
        FROM doctores d
        JOIN usuarios u ON d.id_usuario = u.id_usuario
        LEFT JOIN pacientes p ON p.id_doctor_principal = d.id_doctor
        LEFT JOIN consultas c ON c.id_doctor = d.id_doctor
        LEFT JOIN evaluaciones_pie ep ON ep.id_consulta = c.id_consulta
        WHERE d.estado_verificacion = 'Aprobado'
        GROUP BY d.id_doctor, u.nombre, u.apellido, u.email, d.especialidad
        ORDER BY cantidad_pacientes DESC, cantidad_consultas DESC
      `;

    const result = await db.query(query);

    res.status(200).json({ data: result.rows });
  } catch (error) {
    next(error);
  }
};

// Estadísticas para un doctor específico
exports.estadisticasDoctor = async (req, res, next) => {
  try {
    const id_doctor = req.params.id_doctor;

    // Verificar si es el mismo doctor o admin
    if (
      req.userData.rol !== 1 &&
      !(
        req.userData.rol === 2 && req.userData.id_doctor === parseInt(id_doctor)
      )
    ) {
      return res
        .status(403)
        .json({ message: "No tienes permisos para acceder a este recurso" });
    }

    // Obtener estadísticas básicas
    const queryBasico = `
        SELECT 
          COUNT(DISTINCT p.id_paciente) as cantidad_pacientes,
          COUNT(DISTINCT c.id_consulta) as cantidad_consultas,
          COUNT(DISTINCT ep.id_evaluacion) as cantidad_evaluaciones,
          COUNT(DISTINCT t.id_tratamiento) as cantidad_tratamientos
        FROM doctores d
        LEFT JOIN pacientes p ON p.id_doctor_principal = d.id_doctor
        LEFT JOIN consultas c ON c.id_doctor = d.id_doctor
        LEFT JOIN evaluaciones_pie ep ON ep.id_consulta = c.id_consulta
        LEFT JOIN tratamientos t ON t.id_consulta = c.id_consulta
        WHERE d.id_doctor = $1
      `;

    const resultBasico = await db.query(queryBasico, [id_doctor]);

    // Obtener distribución de pacientes por nivel de riesgo
    const queryRiesgo = `
        SELECT 
          p.nivel_riesgo,
          COUNT(p.id_paciente) as cantidad
        FROM pacientes p
        WHERE p.id_doctor_principal = $1 AND p.nivel_riesgo IS NOT NULL
        GROUP BY p.nivel_riesgo
        ORDER BY 
          CASE 
            WHEN p.nivel_riesgo = 'Bajo' THEN 1
            WHEN p.nivel_riesgo = 'Medio' THEN 2
            WHEN p.nivel_riesgo = 'Alto' THEN 3
            WHEN p.nivel_riesgo = 'Muy Alto' THEN 4
            ELSE 5
          END
      `;

    const resultRiesgo = await db.query(queryRiesgo, [id_doctor]);

    // Obtener consultas por mes
    const queryConsultas = `
        SELECT 
          DATE_TRUNC('month', c.fecha_consulta) as mes,
          COUNT(*) as cantidad
        FROM consultas c
        WHERE c.id_doctor = $1 AND c.fecha_consulta >= NOW() - INTERVAL '6 months'
        GROUP BY mes
        ORDER BY mes
      `;

    const resultConsultas = await db.query(queryConsultas, [id_doctor]);

    // Formatear resultados de consultas por mes
    const consultasPorMes = resultConsultas.rows.map((row) => {
      return {
        mes: new Date(row.mes).toISOString().substring(0, 7), // Formato YYYY-MM
        cantidad: parseInt(row.cantidad),
      };
    });

    res.status(200).json({
      data: {
        estadisticas_basicas: resultBasico.rows[0],
        pacientes_por_nivel_riesgo: resultRiesgo.rows,
        consultas_por_mes: consultasPorMes,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Dashboard para paciente
exports.dashboardPaciente = async (req, res, next) => {
  try {
    const id_paciente = req.userData.id_paciente;

    if (!id_paciente) {
      return res
        .status(403)
        .json({ message: "No tienes permisos para acceder a este recurso" });
    }

    // Obtener cantidad de consultas, evaluaciones y tratamientos
    const queryCantidades = `
        SELECT 
          COUNT(DISTINCT c.id_consulta) as cantidad_consultas,
          COUNT(DISTINCT ep.id_evaluacion) as cantidad_evaluaciones,
          COUNT(DISTINCT t.id_tratamiento) as cantidad_tratamientos,
          COUNT(DISTINCT rl.id_resultado) as cantidad_resultados
        FROM pacientes p
        LEFT JOIN consultas c ON c.id_paciente = p.id_paciente
        LEFT JOIN evaluaciones_pie ep ON ep.id_consulta = c.id_consulta
        LEFT JOIN tratamientos t ON t.id_consulta = c.id_consulta
        LEFT JOIN resultados_laboratorio rl ON rl.id_paciente = p.id_paciente
        WHERE p.id_paciente = $1
      `;

    const resultCantidades = await db.query(queryCantidades, [id_paciente]);

    // Obtener próximas citas
    const queryCitas = `
        SELECT 
          c.id_cita,
          c.fecha,
          c.hora_inicio,
          c.estado,
          c.tipo_cita,
          c.motivo,
          CONCAT(u.nombre, ' ', u.apellido) as nombre_doctor,
          cm.nombre as centro_medico
        FROM citas c
        JOIN doctores d ON c.id_doctor = d.id_doctor
        JOIN usuarios u ON d.id_usuario = u.id_usuario
        JOIN centros_medicos cm ON c.id_centro = cm.id_centro
        WHERE c.id_paciente = $1 AND c.fecha >= CURRENT_DATE
        ORDER BY c.fecha, c.hora_inicio
        LIMIT 5
      `;

    const resultCitas = await db.query(queryCitas, [id_paciente]);

    // Obtener consultas recientes
    const queryConsultas = `
        SELECT 
          c.id_consulta,
          c.fecha_consulta,
          c.tipo_consulta,
          c.diagnostico,
          CONCAT(u.nombre, ' ', u.apellido) as nombre_doctor
        FROM consultas c
        JOIN doctores d ON c.id_doctor = d.id_doctor
        JOIN usuarios u ON d.id_usuario = u.id_usuario
        WHERE c.id_paciente = $1
        ORDER BY c.fecha_consulta DESC
        LIMIT 5
      `;

    const resultConsultas = await db.query(queryConsultas, [id_paciente]);

    // Obtener tratamientos activos
    const queryTratamientos = `
        SELECT 
          t.id_tratamiento,
          t.nombre,
          t.tipo_tratamiento,
          t.dosis,
          t.frecuencia,
          t.fecha_inicio,
          t.fecha_fin
        FROM tratamientos t
        JOIN consultas c ON t.id_consulta = c.id_consulta
        WHERE c.id_paciente = $1 AND t.estado = 'Activo'
        ORDER BY t.fecha_inicio DESC
      `;

    const resultTratamientos = await db.query(queryTratamientos, [id_paciente]);

    res.status(200).json({
      data: {
        cantidades: resultCantidades.rows[0],
        proximas_citas: resultCitas.rows,
        consultas_recientes: resultConsultas.rows,
        tratamientos_activos: resultTratamientos.rows,
      },
    });
  } catch (error) {
    next(error);
  }
};
