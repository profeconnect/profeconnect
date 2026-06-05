const registrationRequestService = require("./registrationRequest.service");
const { ApiResponse } = require("../../config/api.response");

async function getRegistrationRequests(req, res, next) {
  try {
    const { status } = req.query;

    const requests = await registrationRequestService.getRegistrationRequests(status);

    const apiResponse = new ApiResponse(true, 200, "Solicitudes de registro obtenidas correctamente", requests);

    return res.status(200).json(apiResponse);
  } catch (error) {
    next(error);
  }
}

async function approveRegistrationRequest(req, res, next) {
  try {
    const user = await registrationRequestService.approveRegistrationRequest(
      req.params.id,
      req.user.id
    );

    const apiResponse = new ApiResponse(true, 200, "Solicitud aprobada y usuario docente creado correctamente", user);

    return res.status(200).json(apiResponse);
  } catch (error) {
    next(error);
  }
}

async function getRegistrationRequestCedulaPhoto(req, res, next) {
  try {
    const photo = await registrationRequestService.getRegistrationRequestCedulaPhoto(
      req.params.id
    );

    res.setHeader("Content-Type", photo.mimeType);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${photo.filename}"`
    );

    return res.sendFile(photo.fullPath, (err) => {
      if (err) {
        next(err);
      }
    });
  } catch (error) {
    next(error);
  }
}

async function rejectRegistrationRequest(req, res, next) {
  try {
    const request = await registrationRequestService.rejectRegistrationRequest(
      req.params.id,
      req.user.id,
      req.body.reviewComment
    );

    const apiResponse = new ApiResponse(true, 204, "Solicitud rechazada correctamente");

    return res.status(204).json(apiResponse);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getRegistrationRequests,
  approveRegistrationRequest,
  rejectRegistrationRequest,
  getRegistrationRequestCedulaPhoto,
};