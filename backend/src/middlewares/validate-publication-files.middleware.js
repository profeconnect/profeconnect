const { ApiResponse } = require("../config/api.response");
const FileType = require("file-type");
const fs = require("fs");
const prisma = require("../lib/prisma");

const NodeClam = require('clamscan');
const { extractFileMetadata } = require('../utils/file-analyzer.util');

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

async function validatePublicationFiles(req, res, next) {
  try {
    const files = req.files || [];

    let clamscan;
    try {
      clamscan = await new NodeClam().init({
        clamdscan: {
          host: process.env.CLAMAV_HOST || '127.0.0.1',
          port: process.env.CLAMAV_PORT || 3310,
          active: true
        },
        preference: 'clamdscan'
      });
    } catch (err) {
      console.warn("⚠️ ClamAV no está disponible o no respondió. Se omitirá el escaneo profundo:", err.message);
    }

    const images = files.filter((f) => f.mimetype.startsWith("image/"));
    const documents = files.filter((f) => DOCUMENT_MIME_TYPES.has(f.mimetype));

    if (images.length > MAX_IMAGES) {
      return res.status(400).json(new ApiResponse(false, 400, `Máximo ${MAX_IMAGES} imágenes por publicación`, {}));
    }

    if (documents.length > MAX_DOCUMENTS) {
      return res.status(400).json(new ApiResponse(false, 400, `Máximo ${MAX_DOCUMENTS} documento por publicación`, {}));
    }

    // VALIDACIÓN ESTRICTA DE MAGIC NUMBERS
    for (const file of files) {
      const expectedMime = file.mimetype; // Lo que el usuario dice que es (ej. application/pdf)
      const fileTypeResult = await FileType.fromFile(file.path);

      // Si la librería no detecta nada, asumimos de forma segura que es texto plano o un formato sin firma
      const actualMime = fileTypeResult ? fileTypeResult.mime : "text/plain";

      let isMismatch = false;

      // Regla 1: Si dice ser PDF, DEBE ser detectado como PDF real
      if (expectedMime === 'application/pdf' && actualMime !== 'application/pdf') {
        isMismatch = true;
      }
      // Regla 2: Si dice ser Imagen, DEBE ser una imagen real
      else if (expectedMime.startsWith('image/') && !actualMime.startsWith('image/')) {
        isMismatch = true;
      }
      // Regla 3: Si dice ser Word/Excel (o documento), NO puede ser texto plano
      else if (expectedMime.includes('document') || expectedMime.includes('ms-excel')) {
        if (actualMime === 'text/plain' || actualMime.includes('executable')) {
          isMismatch = true;
        }
      }

      if (isMismatch) {
        // Marcamos el archivo como sospechoso en memoria y guardamos los datos
        file.isSuspicious = true;
        file.detectedMime = actualMime;
        file.attemptedMime = expectedMime;
      }

      // Si el Magic Number estaba bien (el archivo es estructuralmente válido), procedemos al escaneo de malware
      if (!file.isSuspicious && clamscan) {
        try {
          const readStream = fs.createReadStream(file.path);
          const { isInfected, viruses } = await clamscan.scanStream(readStream);

          if (isInfected) {
            file.isSuspicious = true;
            // Guardamos el nombre del virus detectado como evidencia forense
            file.detectedMime = "VIRUS: " + viruses.join(", "); 
            file.attemptedMime = expectedMime;
          }
        } catch (scanErr) {
          console.error("Error al escanear archivo con ClamAV:", scanErr.message);
        }
      }

      if (file.isSuspicious) {
        const isMalware = file.detectedMime?.startsWith("VIRUS");
        file.extractedMetadata = await extractFileMetadata(file, isMalware);
      }
    }

    // Validaciones de tamaño de imágenes
    for (const image of images) {
      const limitBytes = MAX_IMAGE_SIZE_MB * 1024 * 1024;
      if (image.size > limitBytes) {
        return res.status(400).json(new ApiResponse(false, 400, `La imagen "${image.originalname}" supera el límite de ${MAX_IMAGE_SIZE_MB} MB`, {}));
      }
    }

    // Validaciones de tamaño de documentos
    for (const doc of documents) {
      const limitBytes = MAX_DOCUMENT_SIZE_MB * 1024 * 1024;
      if (doc.size > limitBytes) {
        return res.status(400).json(new ApiResponse(false, 400, `El documento "${doc.originalname}" supera el límite de ${MAX_DOCUMENT_SIZE_MB} MB`, {}));
      }
    }

    next();
  } catch (error) {
    // Si algo falla catastróficamente, limpiar el disco
    for (const f of req.files || []) {
      if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
    }
    next(error);
  }
}

module.exports = validatePublicationFiles;