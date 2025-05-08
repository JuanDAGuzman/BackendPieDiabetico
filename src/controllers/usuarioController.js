// src/controllers/usuarioController.js
const Usuario = require("../models/usuarioModel");

exports.getAllUsuarios = async (req, res, next) => {
  try {
    const usuarios = await Usuario.findAll();

    // Ocultar contraseñas
    const usuariosSinPassword = usuarios.map((u) => {
      const { password, ...usuarioSinPassword } = u;
      return usuarioSinPassword;
    });

    res.status(200).json({ data: usuariosSinPassword });
  } catch (error) {
    next(error);
  }
};

exports.getUsuarioById = async (req, res, next) => {
  try {
    const id = req.params.id;

    // Solo permitir acceso si es administrador o el propio usuario
    if (req.userData.rol !== 1 && req.userData.id !== parseInt(id)) {
      return res
        .status(403)
        .json({ message: "No tienes permisos para ver este usuario" });
    }

    const usuario = await Usuario.findById(id);

    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Ocultar contraseña
    delete usuario.password;

    res.status(200).json({ data: usuario });
  } catch (error) {
    next(error);
  }
};

exports.createUsuario = async (req, res, next) => {
  try {
    const {
      id_rol,
      nombre,
      apellido,
      email,
      password,
      telefono,
      direccion,
      fecha_nacimiento,
      genero,
      numero_identificacion,
      tipo_identificacion,
    } = req.body;

    // Validar que el email no exista ya
    const existingUser = await Usuario.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "El email ya está registrado" });
    }

    const nuevoUsuario = await Usuario.create({
      id_rol,
      nombre,
      apellido,
      email,
      password,
      telefono,
      direccion,
      fecha_nacimiento,
      genero,
      numero_identificacion,
      tipo_identificacion,
    });

    if (!nuevoUsuario) {
      return res.status(500).json({ message: "Error al crear el usuario" });
    }

    // Ocultar contraseña
    delete nuevoUsuario.password;

    res.status(201).json({
      message: "Usuario creado exitosamente",
      data: nuevoUsuario,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateUsuario = async (req, res, next) => {
  try {
    const id = req.params.id;

    // Solo permitir actualización si es administrador o el propio usuario
    if (req.userData.rol !== 1 && req.userData.id !== parseInt(id)) {
      return res
        .status(403)
        .json({ message: "No tienes permisos para actualizar este usuario" });
    }

    const usuario = await Usuario.findById(id);

    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Si no es administrador, restringir los campos que puede actualizar
    let datosActualizados = req.body;
    if (req.userData.rol !== 1) {
      const { nombre, apellido, telefono, direccion } = req.body;
      datosActualizados = { nombre, apellido, telefono, direccion };
    }

    const updatedUser = await Usuario.update(id, datosActualizados);

    if (!updatedUser) {
      return res
        .status(500)
        .json({ message: "Error al actualizar el usuario" });
    }

    // Ocultar contraseña
    delete updatedUser.password;

    res.status(200).json({
      message: "Usuario actualizado exitosamente",
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteUsuario = async (req, res, next) => {
  try {
    const id = req.params.id;
    const usuario = await Usuario.findById(id);

    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const deletedUser = await Usuario.delete(id);

    if (!deletedUser) {
      return res
        .status(500)
        .json({ message: "Error al desactivar el usuario" });
    }

    res.status(200).json({
      message: "Usuario desactivado exitosamente",
    });
  } catch (error) {
    next(error);
  }
};
