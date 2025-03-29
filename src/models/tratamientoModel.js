const db = require('../config/database');

const Tratamiento = {
  findAll: async () => {
    const query = `
      SELECT t.*, c.fecha_consulta, 
             p.id_paciente, CONCAT(up.nombre, ' ', up.apellido) as nombre_paciente,
             d.id_doctor, CONCAT(ud.nombre, ' ', ud.apellido) as nombre_doctor
      FROM tratamientos t
      JOIN consultas c ON t.id_consulta = c.id_consulta
      JOIN pacientes p ON c.id_paciente = p.id_paciente
      JOIN doctores d ON c.id_doctor = d.id_doctor
      JOIN usuarios up ON p.id_usuario = up.id_usuario
      JOIN usuarios ud ON d.id_usuario = ud.id_usuario
      ORDER BY t.fecha_inicio DESC
    `;
    const result = await db.query(query);
    return result.rows;
  },
  
  findById: async (id) => {
    const query = `
      SELECT t.*, c.fecha_consulta, 
             p.id_paciente, CONCAT(up.nombre, ' ', up.apellido) as nombre_paciente,
             d.id_doctor, CONCAT(ud.nombre, ' ', ud.apellido) as nombre_doctor
      FROM tratamientos t
      JOIN consultas c ON t.id_consulta = c.id_consulta
      JOIN pacientes p ON c.id_paciente = p.id_paciente
      JOIN doctores d ON c.id_doctor = d.id_doctor
      JOIN usuarios up ON p.id_usuario = up.id_usuario
      JOIN usuarios ud ON d.id_usuario = ud.id_usuario
      WHERE t.id_tratamiento = $1
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  },
  
  create: async (tratamiento) => {
    const query = `
      INSERT INTO tratamientos(
        id_consulta, tipo_tratamiento, nombre, descripcion, dosis, frecuencia, duracion,
        instrucciones_especiales, fecha_inicio, fecha_fin, estado)
      VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    
    const values = [
      tratamiento.id_consulta,
      tratamiento.tipo_tratamiento,
      tratamiento.nombre,
      tratamiento.descripcion,
      tratamiento.dosis,
      tratamiento.frecuencia,
      tratamiento.duracion,
      tratamiento.instrucciones_especiales,
      tratamiento.fecha_inicio,
      tratamiento.fecha_fin,
      tratamiento.estado || 'Activo'
    ];
    
    const result = await db.query(query, values);
    return result.rows[0];
  },
  
  update: async (id, tratamiento) => {
    const query = `
      UPDATE tratamientos
      SET tipo_tratamiento = $1,
          nombre = $2,
          descripcion = $3,
          dosis = $4,
          frecuencia = $5,
          duracion = $6,
          instrucciones_especiales = $7,
          fecha_inicio = $8,
          fecha_fin = $9,
          estado = $10
      WHERE id_tratamiento = $11
      RETURNING *
    `;
    
    const values = [
      tratamiento.tipo_tratamiento,
      tratamiento.nombre,
      tratamiento.descripcion,
      tratamiento.dosis,
      tratamiento.frecuencia,
      tratamiento.duracion,
      tratamiento.instrucciones_especiales,
      tratamiento.fecha_inicio,
      tratamiento.fecha_fin,
      tratamiento.estado,
      id
    ];
    
    const result = await db.query(query, values);
    return result.rows[0];
  },
  
  delete: async (id) => {
    // Cambiar estado a Cancelado en lugar de eliminar
    const query = `
      UPDATE tratamientos
      SET estado = 'Cancelado'
      WHERE id_tratamiento = $1
      RETURNING *
    `;
    
    const result = await db.query(query, [id]);
    return result.rows[0];
  },
  
  getTratamientosByPaciente: async (id_paciente) => {
    const query = `
      SELECT t.*, c.fecha_consulta, 
             d.id_doctor, CONCAT(ud.nombre, ' ', ud.apellido) as nombre_doctor
      FROM tratamientos t
      JOIN consultas c ON t.id_consulta = c.id_consulta
      JOIN doctores d ON c.id_doctor = d.id_doctor
      JOIN usuarios ud ON d.id_usuario = ud.id_usuario
      WHERE c.id_paciente = $1
      ORDER BY t.fecha_inicio DESC
    `;
    
    const result = await db.query(query, [id_paciente]);
    return result.rows;
  },
  
  getTratamientosByConsulta: async (id_consulta) => {
    const query = `
      SELECT t.*
      FROM tratamientos t
      WHERE t.id_consulta = $1
      ORDER BY t.fecha_inicio DESC
    `;
    
    const result = await db.query(query, [id_consulta]);
    return result.rows;
  },
  
  getSeguimientos: async (id_tratamiento) => {
    const query = `
      SELECT st.*, 
             CONCAT(ud.nombre, ' ', ud.apellido) as nombre_doctor
      FROM seguimiento_tratamientos st
      LEFT JOIN doctores d ON st.id_doctor = d.id_doctor
      LEFT JOIN usuarios ud ON d.id_usuario = ud.id_usuario
      WHERE st.id_tratamiento = $1
      ORDER BY st.fecha_seguimiento DESC
    `;
    
    const result = await db.query(query, [id_tratamiento]);
    return result.rows;
  },
  
  addSeguimiento: async (seguimiento) => {
    const query = `
      INSERT INTO seguimiento_tratamientos(
        id_tratamiento, fecha_seguimiento, cumplimiento, efectos_secundarios, 
        efectividad, observaciones, id_doctor)
      VALUES($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const values = [
      seguimiento.id_tratamiento,
      seguimiento.fecha_seguimiento || new Date(),
      seguimiento.cumplimiento,
      seguimiento.efectos_secundarios,
      seguimiento.efectividad,
      seguimiento.observaciones,
      seguimiento.id_doctor
    ];
    
    const result = await db.query(query, values);
    return result.rows[0];
  },
  
  updateSeguimiento: async (id, seguimiento) => {
    const query = `
      UPDATE seguimiento_tratamientos
      SET fecha_seguimiento = $1,
          cumplimiento = $2,
          efectos_secundarios = $3,
          efectividad = $4,
          observaciones = $5,
          id_doctor = $6
      WHERE id_seguimiento = $7
      RETURNING *
    `;
    
    const values = [
      seguimiento.fecha_seguimiento,
      seguimiento.cumplimiento,
      seguimiento.efectos_secundarios,
      seguimiento.efectividad,
      seguimiento.observaciones,
      seguimiento.id_doctor,
      id
    ];
    
    const result = await db.query(query, values);
    return result.rows[0];
  },
  
  deleteSeguimiento: async (id) => {
    const query = `
      DELETE FROM seguimiento_tratamientos
      WHERE id_seguimiento = $1
      RETURNING *
    `;
    
    const result = await db.query(query, [id]);
    return result.rows[0];
  }
};

module.exports = Tratamiento;