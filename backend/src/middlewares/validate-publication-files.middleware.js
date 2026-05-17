const { ApiResponse } = require("../config/api.response");

const MAX_IMAGE_SIZE_MB = 2;
const MAX_DOCUMENT_SIZE_MB = 10;
const MAX_IMAGES = 4;
const MAX_DOCUMENTS = 1;

const DOCUMENT_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);

function validatePublicationFiles(req, res, next) {
  const files = req.files || [];

  const images = files.filter((f) => f.mimetype.startsWith("image/"));
  const documents = files.filter((f) => DOCUMENT_MIME_TYPES.has(f.mimetype));

  if (images.length > MAX_IMAGES) {
    return res
      .status(400)
      .json(new ApiResponse(false, 400, `Máximo ${MAX_IMAGES} imágenes por publicación`, {}));
  }

  if (documents.length > MAX_DOCUMENTS) {
    return res
      .status(400)
      .json(new ApiResponse(false, 400, `Máximo ${MAX_DOCUMENTS} documento por publicación`, {}));
  }

  for (const image of images) {
    const limitBytes = MAX_IMAGE_SIZE_MB * 1024 * 1024;
    if (image.size > limitBytes) {
      return res.status(400).json(
        new ApiResponse(
          false,
          400,
          `La imagen "${image.originalname}" supera el límite de ${MAX_IMAGE_SIZE_MB} MB`,
          {}
        )
      );
    }
  }

  for (const doc of documents) {
    const limitBytes = MAX_DOCUMENT_SIZE_MB * 1024 * 1024;
    if (doc.size > limitBytes) {
      let documentLabel = "archivo Excel";
      if (doc.mimetype === "application/pdf") documentLabel = "PDF";
      else if (doc.mimetype.includes("wordprocessingml") || doc.mimetype === "application/msword") documentLabel = "documento Word";
      else if (doc.mimetype === "text/plain") documentLabel = "archivo de texto";
      
      return res.status(400).json(
        new ApiResponse(
          false,
          400,
          `El ${documentLabel} "${doc.originalname}" supera el límite de ${MAX_DOCUMENT_SIZE_MB} MB`,
          {}
        )
      );
    }
  }

  next();
}

module.exports = validatePublicationFiles;
