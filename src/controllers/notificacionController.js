const Notificacion = require('../models/notificacionModel');

exports.getNotificacionesUsuario = async (req, res, next) => {
  try {
    const id_usuario = req.userData.id;
    const soloNoLeidas = req.query.noleidas === 'true';
    
    const notificaciones = await Notificacion.getNotificacionesByUsuario(id_usuario, soloNoLeidas);
    
    res.status(200).json({ data: notificaciones });
  } catch (error) {
    next(error);
  }
};

exports.getContadorNoLeidas = async (req, res, next) => {
  try {
    const id_usuario = req.userData.id;
    
    const contador = await Notificacion.getContadorNoLeidas(id_usuario);
    
    res.status(200).json({ contador });
  } catch (error) {
    next(error);
  }
};

exports.marcarLeida = async (req, res, next) => {
  try {
    const id = req.params.id;
    const notificacion = await Notificacion.findById(id);
    
    if (!notificacion) {
      return res.status(404).json({ message: 'Notificación no encontrada' });
    }
    
    // Verificar que la notificación pertenece al usuario
    if (notificacion.id_usuario_destino !== req.userData.id) {
      return res.status(403).json({ message: 'No tienes permisos para acceder a este recurso' });
    }
    
    const notificacionLeida = await Notificacion.marcarLeida(id);
    
    res.status(200).json({
      message: 'Notificación marcada como leída',
      data: notificacionLeida
    });
  } catch (error) {
    next(error);
  }
};

exports.marcarTodasLeidas = async (req, res, next) => {
  try {
    const id_usuario = req.userData.id;
    
    const notificacionesMarcadas = await Notificacion.marcarTodasLeidas(id_usuario);
    
    res.status(200).json({
      message: `${notificacionesMarcadas.length} notificaciones marcadas como leídas`
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteNotificacion = async (req, res, next) => {
  try {
    const id = req.params.id;
    const notificacion = await Notificacion.findById(id);
    
    if (!notificacion) {
      return res.status(404).json({ message: 'Notificación no encontrada' });
    }
    
    // Verificar que la notificación pertenece al usuario
    if (notificacion.id_usuario_destino !== req.userData.id) {
      return res.status(403).json({ message: 'No tienes permisos para acceder a este recurso' });
    }
    
    const deletedNotificacion = await Notificacion.delete(id);
    
    res.status(200).json({
      message: 'Notificación eliminada exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

// Para administradores o pruebas
exports.createNotificacion = async (req, res, next) => {
  try {
    // Solo administradores pueden crear notificaciones manualmente
    if (req.userData.rol !== 1) {
      return res.status(403).json({ message: 'No tienes permisos para realizar esta acción' });
    }
    
    const { 
      id_usuario_destino, tipo_notificacion, titulo, mensaje,
      entidad_relacionada, id_entidad
    } = req.body;
    
    if (!id_usuario_destino || !tipo_notificacion || !titulo || !mensaje) {
      return res.status(400).json({ message: 'Campos requeridos incompletos' });
    }
    
    const nuevaNotificacion = await Notificacion.create({
      id_usuario_destino,
      tipo_notificacion,
      titulo,
      mensaje,
      entidad_relacionada,
      id_entidad
    });
    
    res.status(201).json({
      message: 'Notificación creada exitosamente',
      data: nuevaNotificacion
    });
  } catch (error) {
    next(error);
  }
};