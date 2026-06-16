const prisma = require("../../lib/prisma");

class ReviewService {
  async createReview({ rating, comment, userId }) {
    return prisma.platformReview.create({
      data: {
        rating,
        comment: comment?.trim() || null,
        userId: userId ?? null,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            institutionalEmail: true,
          },
        },
      },
    });
  }

  async getAllReviews(startDate, endDate) {
    // 1. Construir el filtro condicional
    const where = {};

    if (startDate || endDate) {
      where.createdAt = {};
      
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      
      if (endDate) {
        // Aseguramos que cubra hasta el último milisegundo del día final seleccionado
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    // 2. Ejecutar ambas consultas simultáneas aplicando el filtro 'where'
    const [reviews, aggregate] = await Promise.all([
      prisma.platformReview.findMany({
        where, // Filtramos la lista
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              institutionalEmail: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.platformReview.aggregate({
        where, // Filtramos el cálculo del promedio y total
        _avg: { rating: true },
        _count: { id: true },
      }),
    ]);

    return {
      reviews,
      averageRating: aggregate._avg.rating ? Number(aggregate._avg.rating.toFixed(1)) : 0,
      totalCount: aggregate._count.id,
    };
  }
}

module.exports = new ReviewService();