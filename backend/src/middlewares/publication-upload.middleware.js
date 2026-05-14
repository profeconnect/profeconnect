const multer = require("multer");
const path = require("path");
const fs = require("fs");

const imagePath = path.join(process.cwd(), "public/images");
const documentPath = path.join(process.cwd(), "public/documents");

fs.mkdirSync(imagePath, { recursive: true });
fs.mkdirSync(documentPath, { recursive: true });

const storage = multer.diskStorage({

  destination(req, file, cb) {
    if (file.mimetype === "application/pdf") {
      return cb(null, documentPath);
    }
    cb(null, imagePath);
  },

  filename(req, file, cb) {

    const unique =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9);

    const ext =
      path.extname(file.originalname);

    cb(null, unique + ext);
  },
});

function fileFilter(req, file, cb) {

  const allowedImages = [
    "image/jpeg",
    "image/png",
  ];

  const allowedDocuments = [
    "application/pdf",
  ];

  const allowed = [
    ...allowedImages,
    ...allowedDocuments,
  ];

  if (!allowed.includes(file.mimetype)) {

    return cb(
      new Error(
        "Tipo de archivo no permitido"
      )
    );

  }

  cb(null, true);
}

const upload =
  multer({
    storage,

    fileFilter,

    limits: {
      files: 5,
    },
  });

module.exports = upload;