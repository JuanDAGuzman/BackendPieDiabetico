const db = require("../config/database");

const Doctor = {
findAll: async () => {
  try {
    // Primero intentar con filtro de estado_verificacion
    try {
      const query = `
        SELECT d.*, u.nombre, u.apellido, u.email, u.telefono, u.estado
        FROM doctores d
        JOIN usuarios u ON d.id_usuario = u.id_usuario
        WHERE u.estado = 'Activo'
        ORDER BY u.apellido, u.nombre
      `;
      
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      console.error("Error al consultar doctores con filtro:", error);
      
      // Si falla, intentar sin filtro de estado_verificacion (por si la columna no existe)
      const fallbackQuery = `
        SELECT d.*, u.nombre, u.apellido, u.email, u.telefono, u.estado
        FROM doctores d
        JOIN usuarios u ON d.id_usuario = u.id_usuario
        WHERE u.estado = 'Activo'
        ORDER BY u.apellido, u.nombre
      `;
      
      const fallbackResult = await db.query(fallbackQuery);
      return fallbackResult.rows;
    }
  } catch (error) {
    console.error("Error general en findAll de doctores:", error);
    throw error;
  }
},

  findById: async (id) => {
    const query = `
      SELECT d.*, u.nombre, u.apellido, u.email, u.telefono, u.estado
      FROM doctores d
      JOIN usuarios u ON d.id_usuario = u.id_usuario
      WHERE d.id_doctor = $1
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  },

  create: async (doctor) => {
    const query = `
      INSERT INTO doctores(
        id_usuario, especialidad, numero_licencia, consulta_duracion_minutos, 
        biografia, estado_verificacion)
      VALUES($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [
      doctor.id_usuario,
      doctor.especialidad,
      doctor.numero_licencia,
      doctor.consulta_duracion_minutos || 30,
      doctor.biografia,
      "Pendiente", // Por defecto, todos los doctores empiezan como pendientes
    ];

    const result = await db.query(query, values);
    return result.rows[0];
  },
  verificarDoctor: async (id, estado) => {
    const query = `
      UPDATE doctores
      SET estado_verificacion = $1
      WHERE id_doctor = $2
      RETURNING *
    `;

    const values = [estado, id];
    const result = await db.query(query, values);
    return result.rows[0];
  },

  // Modificar findAll para solo devolver doctores verificados (a menos que sea admin)
  findAll: async (incluirPendientes = false) => {
    let query = `
      SELECT d.*, u.nombre, u.apellido, u.email, u.telefono, u.estado
      FROM doctores d
      JOIN usuarios u ON d.id_usuario = u.id_usuario
      WHERE u.estado = 'Activo'
    `;

    if (!incluirPendientes) {
      query += ` AND d.estado_verificacion = 'Aprobado'`;
    }

    query += ` ORDER BY u.apellido, u.nombre`;

    const result = await db.query(query);
    return result.rows;
  },

  delete: async (id) => {
    // Esto marcará al usuario asociado como inactivo
    const query = `
      UPDATE usuarios u
      SET estado = 'Inactivo', fecha_modificacion = CURRENT_TIMESTAMP
      FROM doctores d
      WHERE d.id_doctor = $1 AND d.id_usuario = u.id_usuario
      RETURNING d.*
    `;

    const result = await db.query(query, [id]);
    return result.rows[0];
  },

  getCentros: async (id_doctor) => {
    const query = `
      SELECT cm.*
      FROM centros_medicos cm
      JOIN doctor_centro dc ON cm.id_centro = dc.id_centro
      WHERE dc.id_doctor = $1 AND cm.estado = 'Activo'
    `;

    const result = await db.query(query, [id_doctor]);
    return result.rows;
  },

  getHorarios: async (id_doctor) => {
    const query = `
      SELECT hd.*
      FROM horarios_doctores hd
      WHERE hd.id_doctor = $1
    `;

    const result = await db.query(query, [id_doctor]);
    return result.rows;
  },

  getPacientes: async (id_doctor) => {
    const query = `
      SELECT p.*, u.nombre, u.apellido, u.email, u.telefono
      FROM pacientes p
      JOIN usuarios u ON p.id_usuario = u.id_usuario
      WHERE p.id_doctor_principal = $1 AND u.estado = 'Activo'
    `;

    const result = await db.query(query, [id_doctor]);
    return result.rows;
  },
};

module.exports = Doctor;
