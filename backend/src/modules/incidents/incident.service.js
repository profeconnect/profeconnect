const prisma = require("../../lib/prisma");

class IncidentService {
  async getPendingIncidents() {
    return await prisma.securityIncident.findMany({
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
    });
  }

  async resolveIncident(id, newStatus = "RESOLVED") {
    return await prisma.securityIncident.update({
      where: { id: parseInt(id) },
      data: { status: newStatus },
    });
  }

  async getIncidentById(id) {
    return await prisma.securityIncident.findUnique({
      where: { id: parseInt(id) }
    });
  }
}

module.exports = new IncidentService();
