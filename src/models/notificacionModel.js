const db = require('../config/database');

const Notificacion = {
  findAll: async () => {
    const query = `
      SELECT * FROM notificaciones
      ORDER BY fecha_envio DESC
    `;
    const result = await db.query(query);
    return result.rows;
  },
  
  findById: async (id) => {
    const query = `
      SELECT * FROM notificaciones
      WHERE id_notificacion = $1
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  },
  
  create: async (notificacion) => {
    const query = `
      INSERT INTO notificaciones(
        id_usuario_destino, tipo_notificacion, titulo, mensaje,
        entidad_relacionada, id_entidad)
      VALUES($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const values = [
      notificacion.id_usuario_destino,
      notificacion.tipo_notificacion,
      notificacion.titulo,
      notificacion.mensaje,
      notificacion.entidad_relacionada,
      notificacion.id_entidad
    ];
    
    const result = await db.query(query, values);
    return result.rows[0];
  },
  
  marcarLeida: async (id) => {
    const query = `
      UPDATE notificaciones
      SET leida = true, fecha_lectura = CURRENT_TIMESTAMP
      WHERE id_notificacion = $1
      RETURNING *
    `;
    
    const result = await db.query(query, [id]);
    return result.rows[0];
  },
  
  marcarTodasLeidas: async (id_usuario) => {
    const query = `
      UPDATE notificaciones
      SET leida = true, fecha_lectura = CURRENT_TIMESTAMP
      WHERE id_usuario_destino = $1 AND leida = false
      RETURNING *
    `;
    
    const result = await db.query(query, [id_usuario]);
    return result.rows;
  },
  
  delete: async (id) => {
    const query = `
      DELETE FROM notificaciones
      WHERE id_notificacion = $1
      RETURNING *
    `;
    
    const result = await db.query(query, [id]);
    return result.rows[0];
  },
  
  getNotificacionesByUsuario: async (id_usuario, soloNoLeidas = false) => {
    let query = `
      SELECT * FROM notificaciones
      WHERE id_usuario_destino = $1
    `;
    
    if (soloNoLeidas) {
      query += ` AND leida = false`;
    }
    
    query += ` ORDER BY fecha_envio DESC`;
    
    const result = await db.query(query, [id_usuario]);
    return result.rows;
  },
  
  getContadorNoLeidas: async (id_usuario) => {
    const query = `
      SELECT COUNT(*) FROM notificaciones
      WHERE id_usuario_destino = $1 AND leida = false
    `;
    
    const result = await db.query(query, [id_usuario]);
    return parseInt(result.rows[0].count);
  }
};

module.exports = Notificacion;