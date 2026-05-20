const { ApiResponse } = require("../../config/api.response");
const incidentService = require("./incident.service");

const prisma = require("../../lib/prisma");

class IncidentController {
  async getPendingIncidents(req, res, next) {
    try {
      const incidents = await incidentService.getPendingIncidents();
      res.json(new ApiResponse(true, 200, "Incidentes obtenidos exitosamente", incidents));
    } catch (error) {
      next(error);
    }
  }

  async resolveIncident(req, res, next) {
    try {
      const { id } = req.params;
      const incident = await incidentService.resolveIncident(id, "FALSE_ALARM");
      res.json(new ApiResponse(true, 200, "Incidente resuelto exitosamente", incident));
    } catch (error) {
      next(error);
    }
  }

  async downloadIncidentFile(req, res, next) {
    try {
      const { id } = req.params;
      const incident = await incidentService.getIncidentById(id);
      
      if (!incident || !incident.physicalPath) {
        return res.status(404).json(new ApiResponse(false, 404, "Archivo no encontrado o no disponible"));
      }

      res.download(incident.physicalPath, incident.fileName, (err) => {
        if (err) {
          next(err);
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async deletePostFromIncident(req, res, next) {
    try {
      const { id } = req.params;
      const incidentId = parseInt(id);

      // 1. Buscar el incidente
      const incident = await incidentService.getIncidentById(incidentId);
      if (!incident) {
        return res.status(404).json(new ApiResponse(false, 404, "Incidente no encontrado"));
      }

      // 2. Si el incidente tiene un Post enlazado, lo desvinculamos y luego lo borramos
      if (incident.postId) {
        const targetPostId = incident.postId;
        
        // A. DESVINCULAR (Salvar el incidente de la cascada)
        await prisma.securityIncident.update({
          where: { id: incidentId },
          data: { postId: null }
        });

        // B. DESTRUIR EL POST
        await prisma.post.delete({
          where: { id: targetPostId }
        });
      }

      // 3. Actualizar el estado a MALWARE_DELETED
      const updatedIncident = await incidentService.resolveIncident(incidentId, "MALWARE_DELETED");

      return res.status(200).json(
        new ApiResponse(true, 200, "Publicación eliminada y registrada como malware", updatedIncident)
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new IncidentController();
