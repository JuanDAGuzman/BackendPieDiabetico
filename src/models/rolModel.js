const db = require('../config/database');

const Rol = {
  findAll: async () => {
    const result = await db.query('SELECT * FROM roles');
    return result.rows;
  },
  
  findById: async (id) => {
    const result = await db.query('SELECT * FROM roles WHERE id_rol = $1', [id]);
    return result.rows[0];
  },
  
  create: async (rol) => {
    const query = `
      INSERT INTO roles(nombre_rol, descripcion)
      VALUES($1, $2)
      RETURNING *
    `;
    
    const values = [rol.nombre_rol, rol.descripcion];
    const result = await db.query(query, values);
    return result.rows[0];
  },
  
  update: async (id, rol) => {
    const query = `
      UPDATE roles
      SET nombre_rol = $1,
          descripcion = $2,
          fecha_modificacion = CURRENT_TIMESTAMP
      WHERE id_rol = $3
      RETURNING *
    `;
    
    const values = [rol.nombre_rol, rol.descripcion, id];
    const result = await db.query(query, values);
    return result.rows[0];
  },
  
  delete: async (id) => {
    // En lugar de eliminar, podríamos marcar como inactivo si tuviera un campo de estado
    const result = await db.query('DELETE FROM roles WHERE id_rol = $1 RETURNING *', [id]);
    return result.rows[0];
  },
  
  getPermisos: async (id_rol) => {
    const query = `
      SELECT p.*
      FROM permisos p
      JOIN rol_permiso rp ON p.id_permiso = rp.id_permiso
      WHERE rp.id_rol = $1
    `;
    
    const result = await db.query(query, [id_rol]);
    return result.rows;
  }
};

module.exports = Rol;