const db = require('../config/database');

const ResultadoLaboratorio = {
  findAll: async () => {
    const query = `
      SELECT rl.*, 
             p.id_paciente, CONCAT(up.nombre, ' ', up.apellido) as nombre_paciente,
             d1.id_doctor as id_doctor_ordenante, CONCAT(ud1.nombre, ' ', ud1.apellido) as nombre_doctor_ordenante,
             d2.id_doctor as id_doctor_interpreta, CONCAT(ud2.nombre, ' ', ud2.apellido) as nombre_doctor_interpreta
      FROM resultados_laboratorio rl
      JOIN pacientes p ON rl.id_paciente = p.id_paciente
      JOIN usuarios up ON p.id_usuario = up.id_usuario
      LEFT JOIN doctores d1 ON rl.id_doctor_ordenante = d1.id_doctor
      LEFT JOIN usuarios ud1 ON d1.id_usuario = ud1.id_usuario
      LEFT JOIN doctores d2 ON rl.id_doctor_interpreta = d2.id_doctor
      LEFT JOIN usuarios ud2 ON d2.id_usuario = ud2.id_usuario
      ORDER BY rl.fecha_examen DESC, rl.fecha_registro DESC
    `;
    const result = await db.query(query);
    return result.rows;
  },
  
  findById: async (id) => {
    const query = `
      SELECT rl.*, 
             p.id_paciente, CONCAT(up.nombre, ' ', up.apellido) as nombre_paciente,
             d1.id_doctor as id_doctor_ordenante, CONCAT(ud1.nombre, ' ', ud1.apellido) as nombre_doctor_ordenante,
             d2.id_doctor as id_doctor_interpreta, CONCAT(ud2.nombre, ' ', ud2.apellido) as nombre_doctor_interpreta
      FROM resultados_laboratorio rl
      JOIN pacientes p ON rl.id_paciente = p.id_paciente
      JOIN usuarios up ON p.id_usuario = up.id_usuario
      LEFT JOIN doctores d1 ON rl.id_doctor_ordenante = d1.id_doctor
      LEFT JOIN usuarios ud1 ON d1.id_usuario = ud1.id_usuario
      LEFT JOIN doctores d2 ON rl.id_doctor_interpreta = d2.id_doctor
      LEFT JOIN usuarios ud2 ON d2.id_usuario = ud2.id_usuario
      WHERE rl.id_resultado = $1
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  },
  
  create: async (resultado) => {
    const query = `
      INSERT INTO resultados_laboratorio(
        id_paciente, fecha_examen, tipo_examen, resultados, valores_referencia,
        interpretacion, id_doctor_ordenante, id_doctor_interpreta)
      VALUES($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const values = [
      resultado.id_paciente,
      resultado.fecha_examen,
      resultado.tipo_examen,
      resultado.resultados,
      resultado.valores_referencia,
      resultado.interpretacion,
      resultado.id_doctor_ordenante,
      resultado.id_doctor_interpreta
    ];
    
    const result = await db.query(query, values);
    return result.rows[0];
  },
  
  update: async (id, resultado) => {
    const query = `
      UPDATE resultados_laboratorio
      SET fecha_examen = $1,
          tipo_examen = $2,
          resultados = $3,
          valores_referencia = $4,
          interpretacion = $5,
          id_doctor_ordenante = $6,
          id_doctor_interpreta = $7
      WHERE id_resultado = $8
      RETURNING *
    `;
    
    const values = [
      resultado.fecha_examen,
      resultado.tipo_examen,
      resultado.resultados,
      resultado.valores_referencia,
      resultado.interpretacion,
      resultado.id_doctor_ordenante,
      resultado.id_doctor_interpreta,
      id
    ];
    
    const result = await db.query(query, values);
    return result.rows[0];
  },
  
  delete: async (id) => {
    const query = `
      DELETE FROM resultados_laboratorio
      WHERE id_resultado = $1
      RETURNING *
    `;
    
    const result = await db.query(query, [id]);
    return result.rows[0];
  },
  
  getResultadosByPaciente: async (id_paciente) => {
    const query = `
      SELECT rl.*, 
             d1.id_doctor as id_doctor_ordenante, CONCAT(ud1.nombre, ' ', ud1.apellido) as nombre_doctor_ordenante,
             d2.id_doctor as id_doctor_interpreta, CONCAT(ud2.nombre, ' ', ud2.apellido) as nombre_doctor_interpreta
      FROM resultados_laboratorio rl
      LEFT JOIN doctores d1 ON rl.id_doctor_ordenante = d1.id_doctor
      LEFT JOIN usuarios ud1 ON d1.id_usuario = ud1.id_usuario
      LEFT JOIN doctores d2 ON rl.id_doctor_interpreta = d2.id_doctor
      LEFT JOIN usuarios ud2 ON d2.id_usuario = ud2.id_usuario
      WHERE rl.id_paciente = $1
      ORDER BY rl.fecha_examen DESC, rl.fecha_registro DESC
    `;
    
    const result = await db.query(query, [id_paciente]);
    return result.rows;
  },
  
  getResultadosByTipo: async (tipo_examen) => {
    const query = `
      SELECT rl.*, 
             p.id_paciente, CONCAT(up.nombre, ' ', up.apellido) as nombre_paciente,
             d1.id_doctor as id_doctor_ordenante, CONCAT(ud1.nombre, ' ', ud1.apellido) as nombre_doctor_ordenante,
             d2.id_doctor as id_doctor_interpreta, CONCAT(ud2.nombre, ' ', ud2.apellido) as nombre_doctor_interpreta
      FROM resultados_laboratorio rl
      JOIN pacientes p ON rl.id_paciente = p.id_paciente
      JOIN usuarios up ON p.id_usuario = up.id_usuario
      LEFT JOIN doctores d1 ON rl.id_doctor_ordenante = d1.id_doctor
      LEFT JOIN usuarios ud1 ON d1.id_usuario = ud1.id_usuario
      LEFT JOIN doctores d2 ON rl.id_doctor_interpreta = d2.id_doctor
      LEFT JOIN usuarios ud2 ON d2.id_usuario = ud2.id_usuario
      WHERE rl.tipo_examen ILIKE $1
      ORDER BY rl.fecha_examen DESC, rl.fecha_registro DESC
    `;
    
    const result = await db.query(query, [`%${tipo_examen}%`]);
    return result.rows;
  }
};

module.exports = ResultadoLaboratorio;