const { ApiResponse } = require("../config/api.response");
const { publicMessageForDbError } = require("../lib/database-error-message");

function errorMiddleware(error, req, res, next) {
  console.error(error);

  let statusCode = error.statusCode || 500;
  let message = error.message || "Error interno del servidor";

  if (error.name === "MulterError") {
    statusCode = 400;
    if (error.code === "LIMIT_FILE_SIZE") {
      message = "La foto de cédula no puede superar 10 MB";
    } else if (error.code === "LIMIT_FILE_COUNT") {
      message = "Solo se permite una foto de cédula";
    } else {
      message = "Archivo de cédula inválido";
    }
  }

  const friendlyDb = publicMessageForDbError(error, message);
  if (friendlyDb) {
    message = friendlyDb;
  }

  const response = new ApiResponse(false, statusCode, message);

  return res.status(statusCode).json(response);
}

module.exports = errorMiddleware;
