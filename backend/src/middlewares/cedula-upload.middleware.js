const multer = require("multer");
const path = require("path");
const { CEDULA_DIR, toRelativeCedulaPath } = require("../lib/cedula-storage");
const {
  uploadPrivateFile,
  removeLocalFile,
} = require("../lib/storage");

function sanitizeFilename(name) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._\- ]/g, "_")
    .trim();
}

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, CEDULA_DIR);
  },

  filename(_req, file, cb) {
    file.originalname = sanitizeFilename(file.originalname);
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, unique + ext);
  },
});

const cedulaUpload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1,
  },
});

async function attachCedulaPhotoMeta(req, _res, next) {
  try {
    if (req.file) {
      const uploadResult = await uploadPrivateFile(req.file, "cedulas");
      req.cedulaPhotoPath = uploadResult.storedInSupabase
        ? uploadResult.uri
        : toRelativeCedulaPath(req.file.filename);
      req.cedulaPhotoMime = req.file.mimetype || "application/octet-stream";
      req.cedulaPhotoName = req.file.originalname;

      if (uploadResult.storedInSupabase) {
        removeLocalFile(req.file.path);
      }
    }
    next();
  } catch (error) {
    if (req.file?.path) {
      removeLocalFile(req.file.path);
    }
    next(error);
  }
}

module.exports = {
  cedulaUpload,
  attachCedulaPhotoMeta,
};
