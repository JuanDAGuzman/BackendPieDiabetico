const db = require('../config/database');

const EvaluacionPie = {
  findAll: async () => {
    const query = `
      SELECT ep.*, c.fecha_consulta, 
             p.id_paciente, CONCAT(up.nombre, ' ', up.apellido) as nombre_paciente,
             d.id_doctor, CONCAT(ud.nombre, ' ', ud.apellido) as nombre_doctor
      FROM evaluaciones_pie ep
      JOIN consultas c ON ep.id_consulta = c.id_consulta
      JOIN pacientes p ON c.id_paciente = p.id_paciente
      JOIN doctores d ON c.id_doctor = d.id_doctor
      JOIN usuarios up ON p.id_usuario = up.id_usuario
      JOIN usuarios ud ON d.id_usuario = ud.id_usuario
      ORDER BY c.fecha_consulta DESC
    `;
    const result = await db.query(query);
    return result.rows;
  },
  
  findById: async (id) => {
    const query = `
      SELECT ep.*, c.fecha_consulta, 
             p.id_paciente, CONCAT(up.nombre, ' ', up.apellido) as nombre_paciente,
             d.id_doctor, CONCAT(ud.nombre, ' ', ud.apellido) as nombre_doctor
      FROM evaluaciones_pie ep
      JOIN consultas c ON ep.id_consulta = c.id_consulta
      JOIN pacientes p ON c.id_paciente = p.id_paciente
      JOIN doctores d ON c.id_doctor = d.id_doctor
      JOIN usuarios up ON p.id_usuario = up.id_usuario
      JOIN usuarios ud ON d.id_usuario = ud.id_usuario
      WHERE ep.id_evaluacion = $1
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  },
  
  create: async (evaluacion) => {
    const query = `
      INSERT INTO evaluaciones_pie(
        id_consulta, pie, pulso_pedio, pulso_tibial, tiempo_llenado_capilar, temperatura_piel,
        color_piel, sensibilidad_tactil, sensibilidad_vibratoria, sensibilidad_dolorosa, reflejos,
        deformidades, descripcion_deformidades, callosidades, ubicacion_callosidades,
        presencia_ulceras, clasificacion_wagner, clasificacion_texas, localizacion_lesiones,
        evaluacion_calzado, recomendacion_calzado, grado_riesgo, observaciones)
      VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
      RETURNING *
    `;
    
    const values = [
      evaluacion.id_consulta,
      evaluacion.pie,
      evaluacion.pulso_pedio,
      evaluacion.pulso_tibial,
      evaluacion.tiempo_llenado_capilar,
      evaluacion.temperatura_piel,
      evaluacion.color_piel,
      evaluacion.sensibilidad_tactil,
      evaluacion.sensibilidad_vibratoria,
      evaluacion.sensibilidad_dolorosa,
      evaluacion.reflejos,
      evaluacion.deformidades || false,
      evaluacion.descripcion_deformidades,
      evaluacion.callosidades || false,
      evaluacion.ubicacion_callosidades,
      evaluacion.presencia_ulceras || false,
      evaluacion.clasificacion_wagner,
      evaluacion.clasificacion_texas,
      evaluacion.localizacion_lesiones,
      evaluacion.evaluacion_calzado,
      evaluacion.recomendacion_calzado,
      evaluacion.grado_riesgo || '0',
      evaluacion.observaciones
    ];
    
    const result = await db.query(query, values);
    return result.rows[0];
  },
  
  update: async (id, evaluacion) => {
    const query = `
      UPDATE evaluaciones_pie
      SET pie = $1,
          pulso_pedio = $2,
          pulso_tibial = $3,
          tiempo_llenado_capilar = $4,
          temperatura_piel = $5,
          color_piel = $6,
          sensibilidad_tactil = $7,
          sensibilidad_vibratoria = $8,
          sensibilidad_dolorosa = $9,
          reflejos = $10,
          deformidades = $11,
          descripcion_deformidades = $12,
          callosidades = $13,
          ubicacion_callosidades = $14,
          presencia_ulceras = $15,
          clasificacion_wagner = $16,
          clasificacion_texas = $17,
          localizacion_lesiones = $18,
          evaluacion_calzado = $19,
          recomendacion_calzado = $20,
          grado_riesgo = $21,
          observaciones = $22
      WHERE id_evaluacion = $23
      RETURNING *
    `;
    
    const values = [
      evaluacion.pie,
      evaluacion.pulso_pedio,
      evaluacion.pulso_tibial,
      evaluacion.tiempo_llenado_capilar,
      evaluacion.temperatura_piel,
      evaluacion.color_piel,
      evaluacion.sensibilidad_tactil,
      evaluacion.sensibilidad_vibratoria,
      evaluacion.sensibilidad_dolorosa,
      evaluacion.reflejos,
      evaluacion.deformidades,
      evaluacion.descripcion_deformidades,
      evaluacion.callosidades,
      evaluacion.ubicacion_callosidades,
      evaluacion.presencia_ulceras,
      evaluacion.clasificacion_wagner,
      evaluacion.clasificacion_texas,
      evaluacion.localizacion_lesiones,
      evaluacion.evaluacion_calzado,
      evaluacion.recomendacion_calzado,
      evaluacion.grado_riesgo,
      evaluacion.observaciones,
      id
    ];
    
    const result = await db.query(query, values);
    return result.rows[0];
  },
  
  delete: async (id) => {
    const query = `
      DELETE FROM evaluaciones_pie
      WHERE id_evaluacion = $1
      RETURNING *
    `;
    
    const result = await db.query(query, [id]);
    return result.rows[0];
  },
  
  getEvaluacionesByPaciente: async (id_paciente) => {
    const query = `
      SELECT ep.*, c.fecha_consulta, 
             d.id_doctor, CONCAT(ud.nombre, ' ', ud.apellido) as nombre_doctor
      FROM evaluaciones_pie ep
      JOIN consultas c ON ep.id_consulta = c.id_consulta
      JOIN doctores d ON c.id_doctor = d.id_doctor
      JOIN usuarios ud ON d.id_usuario = ud.id_usuario
      WHERE c.id_paciente = $1
      ORDER BY c.fecha_consulta DESC
    `;
    
    const result = await db.query(query, [id_paciente]);
    return result.rows;
  },
  
  getImagenesEvaluacion: async (id_evaluacion) => {
    const query = `
      SELECT *
      FROM imagenes_evaluacion
      WHERE id_evaluacion = $1
      ORDER BY fecha_captura DESC
    `;
    
    const result = await db.query(query, [id_evaluacion]);
    return result.rows;
  },
  
  addImagenEvaluacion: async (imagen) => {
    const query = `
      INSERT INTO imagenes_evaluacion(
        id_evaluacion, url_imagen, tipo_imagen, descripcion, fecha_captura)
      VALUES($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const values = [
      imagen.id_evaluacion,
      imagen.url_imagen,
      imagen.tipo_imagen,
      imagen.descripcion,
      imagen.fecha_captura || new Date()
    ];
    
    const result = await db.query(query, values);
    return result.rows[0];
  },
  
  deleteImagenEvaluacion: async (id_imagen) => {
    const query = `
      DELETE FROM imagenes_evaluacion
      WHERE id_imagen = $1
      RETURNING *
    `;
    
    const result = await db.query(query, [id_imagen]);
    return result.rows[0];
  }
};

module.exports = EvaluacionPie;