const db = require('../config/database');

const Consulta = {
  findAll: async () => {
    const query = `
      SELECT c.*, 
             p.id_paciente, CONCAT(up.nombre, ' ', up.apellido) as nombre_paciente,
             d.id_doctor, CONCAT(ud.nombre, ' ', ud.apellido) as nombre_doctor
      FROM consultas c
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
      SELECT c.*, 
             p.id_paciente, CONCAT(up.nombre, ' ', up.apellido) as nombre_paciente,
             d.id_doctor, CONCAT(ud.nombre, ' ', ud.apellido) as nombre_doctor
      FROM consultas c
      JOIN pacientes p ON c.id_paciente = p.id_paciente
      JOIN doctores d ON c.id_doctor = d.id_doctor
      JOIN usuarios up ON p.id_usuario = up.id_usuario
      JOIN usuarios ud ON d.id_usuario = ud.id_usuario
      WHERE c.id_consulta = $1
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  },
  
  create: async (consulta) => {
    const query = `
      INSERT INTO consultas(
        id_cita, id_videocita, id_paciente, id_doctor, fecha_consulta, tipo_consulta,
        sintomas, diagnostico, tratamiento, observaciones, recomendaciones, fecha_proxima_revision)
      VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;
    
    const values = [
      consulta.id_cita,
      consulta.id_videocita,
      consulta.id_paciente,
      consulta.id_doctor,
      consulta.fecha_consulta || new Date(),
      consulta.tipo_consulta,
      consulta.sintomas,
      consulta.diagnostico,
      consulta.tratamiento,
      consulta.observaciones,
      consulta.recomendaciones,
      consulta.fecha_proxima_revision
    ];
    
    const result = await db.query(query, values);
    return result.rows[0];
  },
  
  update: async (id, consulta) => {
    const query = `
      UPDATE consultas
      SET sintomas = $1,
          diagnostico = $2,
          tratamiento = $3,
          observaciones = $4,
          recomendaciones = $5,
          fecha_proxima_revision = $6,
          fecha_modificacion = CURRENT_TIMESTAMP
      WHERE id_consulta = $7
      RETURNING *
    `;
    
    const values = [
      consulta.sintomas,
      consulta.diagnostico,
      consulta.tratamiento,
      consulta.observaciones,
      consulta.recomendaciones,
      consulta.fecha_proxima_revision,
      id
    ];
    
    const result = await db.query(query, values);
    return result.rows[0];
  },
  
  delete: async (id) => {
    // En este caso, realmente eliminamos la consulta
    const query = `
      DELETE FROM consultas
      WHERE id_consulta = $1
      RETURNING *
    `;
    
    const result = await db.query(query, [id]);
    return result.rows[0];
  },
  
  getConsultasByPaciente: async (id_paciente) => {
    const query = `
      SELECT c.*, 
             d.id_doctor, CONCAT(ud.nombre, ' ', ud.apellido) as nombre_doctor
      FROM consultas c
      JOIN doctores d ON c.id_doctor = d.id_doctor
      JOIN usuarios ud ON d.id_usuario = ud.id_usuario
      WHERE c.id_paciente = $1
      ORDER BY c.fecha_consulta DESC
    `;
    
    const result = await db.query(query, [id_paciente]);
    return result.rows;
  },
  
  getConsultasByDoctor: async (id_doctor) => {
    const query = `
      SELECT c.*, 
             p.id_paciente, CONCAT(up.nombre, ' ', up.apellido) as nombre_paciente
      FROM consultas c
      JOIN pacientes p ON c.id_paciente = p.id_paciente
      JOIN usuarios up ON p.id_usuario = up.id_usuario
      WHERE c.id_doctor = $1
      ORDER BY c.fecha_consulta DESC
    `;
    
    const result = await db.query(query, [id_doctor]);
    return result.rows;
  }
};

module.exports = Consulta;