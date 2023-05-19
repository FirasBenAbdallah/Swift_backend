/* const multer = require("multer"); // Import multer
const { diskStorage } = require("multer");
const { join, dirname } = require("path");

// Les extensions à accepter
const MIME_TYPES = {
  "image/jpg": "jpg",
  "image/jpeg": "jpg",
  "image/png": "png",
};

module.exports = multer({
  // Configuration de stockage
  storage: diskStorage({
    // Configurer l'emplacement de stockage
    destination: (req, file, callback) => {
      const storagePath = join(dirname(__filename), "./uploads");
      callback(null, storagePath); // Indiquer l'emplacement de stockage
    },
    // Configurer le nom avec lequel le fichier va être enregistré
    filename: (req, file, callback) => {
      // Remplacer les espaces par des underscores
      // const name = file.originalname.split(" ").join("_");
      // Récupérer l'extension à utiliser pour le fichier
      ///  const extension = MIME_TYPES[file.mimetype];
      //  Ajouter un timestamp Date.now() au nom de fichier
      callback(null, file.fieldname + Date.now() + "." + "jpg");
    },
  }),
  // Taille max des images 10Mo
  limits: 10 * 1024 * 1024,
}).single("pde");
 */