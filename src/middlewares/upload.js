const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configurar carpeta de destino
const createDestinationDir = (destination) => {
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }
  return destination;
};

// Configurar almacenamiento
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    // Determinar la subcarpeta según el tipo de imagen
    let folder = 'uploads/evaluaciones';
    
    // Crear la carpeta si no existe
    createDestinationDir(folder);
    
    cb(null, folder);
  },
  filename: function(req, file, cb) {
    // Generar nombre de archivo único
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    cb(null, `image-${uniqueSuffix}${fileExtension}`);
  }
});

// Filtrar archivos para asegurar que solo se suban imágenes
const fileFilter = (req, file, cb) => {
  // Aceptar solo imágenes
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('El archivo debe ser una imagen'), false);
  }
};

// Configurar multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // Limitar tamaño a 5MB
  },
  fileFilter: fileFilter
});

module.exports = upload;