const path = require("path");
const fs = require("fs");

const PRIVATE_DIR = path.resolve(__dirname, "../../private");
const CEDULA_DIR = path.join(PRIVATE_DIR, "cedulas");

fs.mkdirSync(CEDULA_DIR, { recursive: true });

function toRelativeCedulaPath(filename) {
  return path.posix.join("cedulas", filename);
}

function resolveCedulaPath(relativePath) {
  if (!relativePath) {
    return null;
  }

  const fullPath = path.resolve(PRIVATE_DIR, relativePath);
  const normalizedPrivate = path.resolve(PRIVATE_DIR);

  if (
    !fullPath.startsWith(normalizedPrivate + path.sep) &&
    fullPath !== normalizedPrivate
  ) {
    const error = new Error("Ruta de archivo no válida");
    error.statusCode = 400;
    throw error;
  }

  return fullPath;
}

module.exports = {
  PRIVATE_DIR,
  CEDULA_DIR,
  toRelativeCedulaPath,
  resolveCedulaPath,
};
