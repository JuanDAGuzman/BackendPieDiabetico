const db = require('../config/database');

const Cita = {
  findAll: async () => {
    const query = `
      SELECT c.*, 
             p.id_paciente, CONCAT(up.nombre, ' ', up.apellido) as nombre_paciente,
             d.id_doctor, CONCAT(ud.nombre, ' ', ud.apellido) as nombre_doctor,
             cm.nombre as centro_nombre
      FROM citas c
      JOIN pacientes p ON c.id_paciente = p.id_paciente
      JOIN doctores d ON c.id_doctor = d.id_doctor
      JOIN usuarios up ON p.id_usuario = up.id_usuario
      JOIN usuarios ud ON d.id_usuario = ud.id_usuario
      JOIN centros_medicos cm ON c.id_centro = cm.id_centro
      ORDER BY c.fecha DESC, c.hora_inicio ASC
    `;
    const result = await db.query(query);
    return result.rows;
  },
  
  findById: async (id) => {
    const query = `
      SELECT c.*, 
             p.id_paciente, CONCAT(up.nombre, ' ', up.apellido) as nombre_paciente,
             d.id_doctor, CONCAT(ud.nombre, ' ', ud.apellido) as nombre_doctor,
             cm.nombre as centro_nombre
      FROM citas c
      JOIN pacientes p ON c.id_paciente = p.id_paciente
      JOIN doctores d ON c.id_doctor = d.id_doctor
      JOIN usuarios up ON p.id_usuario = up.id_usuario
      JOIN usuarios ud ON d.id_usuario = ud.id_usuario
      JOIN centros_medicos cm ON c.id_centro = cm.id_centro
      WHERE c.id_cita = $1
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  },
  
  create: async (cita) => {
    const query = `
      INSERT INTO citas(
        id_paciente, id_doctor, id_centro, fecha, hora_inicio, hora_fin,
        estado, tipo_cita, motivo, notas_previas)
      VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    
    const values = [
      cita.id_paciente,
      cita.id_doctor,
      cita.id_centro,
      cita.fecha,
      cita.hora_inicio,
      cita.hora_fin,
      cita.estado || 'Pendiente',
      cita.tipo_cita,
      cita.motivo,
      cita.notas_previas
    ];
    
    const result = await db.query(query, values);
    return result.rows[0];
  },
  
  update: async (id, cita) => {
    const query = `
      UPDATE citas
      SET id_paciente = $1,
          id_doctor = $2,
          id_centro = $3,
          fecha = $4,
          hora_inicio = $5,
          hora_fin = $6,
          estado = $7,
          tipo_cita = $8,
          motivo = $9,
          notas_previas = $10
      WHERE id_cita = $11
      RETURNING *
    `;
    
    const values = [
      cita.id_paciente,
      cita.id_doctor,
      cita.id_centro,
      cita.fecha,
      cita.hora_inicio,
      cita.hora_fin,
      cita.estado,
      cita.tipo_cita,
      cita.motivo,
      cita.notas_previas,
      id
    ];
    
    const result = await db.query(query, values);
    return result.rows[0];
  },
  
  delete: async (id) => {
    // Cambiamos el estado a Cancelada en lugar de eliminar
    const query = `
      UPDATE citas
      SET estado = 'Cancelada', fecha_modificacion = CURRENT_TIMESTAMP
      WHERE id_cita = $1
      RETURNING *
    `;
    
    const result = await db.query(query, [id]);
    return result.rows[0];
  },
  
  getProximasCitas: async () => {
    const query = `
      SELECT c.*, 
             p.id_paciente, CONCAT(up.nombre, ' ', up.apellido) as nombre_paciente,
             d.id_doctor, CONCAT(ud.nombre, ' ', ud.apellido) as nombre_doctor,
             cm.nombre as centro_nombre
      FROM citas c
      JOIN pacientes p ON c.id_paciente = p.id_paciente
      JOIN doctores d ON c.id_doctor = d.id_doctor
      JOIN usuarios up ON p.id_usuario = up.id_usuario
      JOIN usuarios ud ON d.id_usuario = ud.id_usuario
      JOIN centros_medicos cm ON c.id_centro = cm.id_centro
      WHERE c.fecha >= CURRENT_DATE
        AND c.estado IN ('Pendiente', 'Confirmada')
      ORDER BY c.fecha, c.hora_inicio
    `;
    
    const result = await db.query(query);
    return result.rows;
  },
  
  getCitasByDoctor: async (id_doctor) => {
    const query = `
      SELECT c.*, 
             p.id_paciente, CONCAT(up.nombre, ' ', up.apellido) as nombre_paciente,
             cm.nombre as centro_nombre
      FROM citas c
      JOIN pacientes p ON c.id_paciente = p.id_paciente
      JOIN usuarios up ON p.id_usuario = up.id_usuario
      JOIN centros_medicos cm ON c.id_centro = cm.id_centro
      WHERE c.id_doctor = $1
      ORDER BY c.fecha DESC, c.hora_inicio ASC
    `;
    
    const result = await db.query(query, [id_doctor]);
    return result.rows;
  },
  
  getCitasByPaciente: async (id_paciente) => {
    const query = `
      SELECT c.*, 
             d.id_doctor, CONCAT(ud.nombre, ' ', ud.apellido) as nombre_doctor,
             cm.nombre as centro_nombre
      FROM citas c
      JOIN doctores d ON c.id_doctor = d.id_doctor
      JOIN usuarios ud ON d.id_usuario = ud.id_usuario
      JOIN centros_medicos cm ON c.id_centro = cm.id_centro
      WHERE c.id_paciente = $1
      ORDER BY c.fecha DESC, c.hora_inicio ASC
    `;
    
    const result = await db.query(query, [id_paciente]);
    return result.rows;
  },
  
  verificarDisponibilidad: async (id_doctor, fecha, hora_inicio, hora_fin, id_cita = null) => {
    let query = `
      SELECT COUNT(*) as count
      FROM citas
      WHERE id_doctor = $1
        AND fecha = $2
        AND estado IN ('Pendiente', 'Confirmada')
        AND (
          (hora_inicio <= $3 AND hora_fin > $3) OR
          (hora_inicio < $4 AND hora_fin >= $4) OR
          (hora_inicio >= $3 AND hora_fin <= $4)
        )
    `;
    
    let values = [id_doctor, fecha, hora_inicio, hora_fin];
    
    // Si estamos actualizando una cita existente, excluirla de la verificación
    if (id_cita) {
      query += ` AND id_cita != $5`;
      values.push(id_cita);
    }
    
    const result = await db.query(query, values);
    return result.rows[0].count === '0'; // Retorna true si no hay conflictos
  }
};

module.exports = Cita;