const { ApiResponse } = require("../../config/api.response");
const reviewService = require("./review.service");

class ReviewController {
  async createReview(req, res, next) {
    try {
      const rating = Number(req.body.rating);
      const comment = req.body.comment;

      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return res
          .status(400)
          .json(new ApiResponse(false, 400, "La calificación debe ser un entero entre 1 y 5"));
      }

      const review = await reviewService.createReview({
        rating,
        comment,
        userId: req.user?.id,
      });

      return res
        .status(201)
        .json(new ApiResponse(true, 201, "Reseña registrada exitosamente", review));
    } catch (error) {
      next(error);
    }
  }

  async getAllReviews(req, res, next) {
    try {
      // 1. Extraemos las fechas de los parámetros de la URL
      const { startDate, endDate } = req.query;

      // 2. Pasamos las fechas al servicio
      const data = await reviewService.getAllReviews(startDate, endDate);
      
      return res.json(
        new ApiResponse(true, 200, "Reseñas obtenidas exitosamente", data)
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ReviewController();