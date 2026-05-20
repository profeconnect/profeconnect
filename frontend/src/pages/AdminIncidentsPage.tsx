import { useEffect, useMemo, useState } from 'react';
import Spinner from '../components/Spinner';
import { useToast } from '../components/Toast';
import { extractErrorMessage } from '../api/client';
import { getPendingIncidents, resolveIncident, downloadIncidentFile, deletePublicationFromIncident } from '../api/incident.service';
import type { SecurityIncident } from '../types';

function formatDate(value: string | null) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('es-EC', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return value;
  }
}

export default function AdminIncidentsPage() {
  const toast = useToast();
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'RESOLVED'>('PENDING');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getPendingIncidents()
      .then((data) => {
        if (cancelled) return;
        setIncidents(data);
      })
      .catch((error) => {
        if (cancelled) return;
        toast.error(
          extractErrorMessage(error, 'No se pudieron cargar los incidentes')
        );
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [toast]);

  const filteredIncidents = useMemo(() => {
    const term = search.trim().toLowerCase();
    
    const tabFiltered = incidents.filter((inc) => 
      activeTab === 'PENDING' ? inc.status === 'PENDING' : inc.status !== 'PENDING'
    );

    if (!term) return tabFiltered;
    
    return tabFiltered.filter((i) => {
      return (
        i.fileName.toLowerCase().includes(term) ||
        i.user?.institutionalEmail.toLowerCase().includes(term) ||
        i.user?.firstName.toLowerCase().includes(term) ||
        i.user?.lastName.toLowerCase().includes(term)
      );
    });
  }, [incidents, search, activeTab]);

  async function handleResolve(incident: SecurityIncident) {
    setResolvingId(incident.id);
    try {
      const updated = await resolveIncident(incident.id);
      setIncidents((prev) => prev.map((i) => i.id === incident.id ? updated : i));
      toast.success('Incidente marcado como falsa alarma');
    } catch (error) {
      toast.error(
        extractErrorMessage(error, 'No se pudo resolver el incidente')
      );
    } finally {
      setResolvingId(null);
    }
  }

  async function handleDownload(incident: SecurityIncident) {
    try {
      await downloadIncidentFile(incident.id, incident.fileName);
      toast.success('Descarga iniciada');
    } catch (error) {
      toast.error(
        extractErrorMessage(error, 'No se pudo descargar el archivo forense')
      );
    }
  }

  async function handleDeletePublication(incident: SecurityIncident) {
    if (!window.confirm('¿Estás seguro de que deseas eliminar la publicación y marcar este incidente como resuelto?')) return;
    setResolvingId(incident.id);
    try {
      const updated = await deletePublicationFromIncident(incident.id);
      setIncidents((prev) => prev.map((i) => i.id === incident.id ? updated : i));
      toast.success('Publicación eliminada e incidente resuelto');
    } catch (error) {
      toast.error(
        extractErrorMessage(error, 'No se pudo eliminar la publicación')
      );
    } finally {
      setResolvingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Incidentes de Seguridad
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {incidents.length} incidente{incidents.length !== 1 ? 's' : ''} pendiente{incidents.length !== 1 ? 's' : ''} de revisión.
          </p>
        </div>
        <input
          type="search"
          placeholder="Buscar por archivo o usuario..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 sm:w-72"
        />
      </div>

      <div className="mb-6 flex space-x-6 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('PENDING')}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'PENDING' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
        >
          Pendientes
        </button>
        <button
          onClick={() => setActiveTab('RESOLVED')}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'RESOLVED' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
        >
          Historial de Resueltos
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Spinner label="Cargando incidentes..." />
          </div>
        ) : filteredIncidents.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-600">
            No hay incidentes de seguridad pendientes. ¡Todo en orden!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Usuario (Culpable)</th>
                  <th className="px-4 py-3">Archivo</th>
                  <th className="px-4 py-3">Tipo Intentado</th>
                  <th className="px-4 py-3">Tipo Detectado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredIncidents.map((incident) => (
                  <tr key={incident.id} className="hover:bg-red-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                      {formatDate(incident.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      {incident.user ? (
                        <>
                          <div className="font-medium text-slate-900">
                            {incident.user.firstName} {incident.user.lastName}
                          </div>
                          <div className="text-xs text-slate-500">
                            {incident.user.institutionalEmail}
                          </div>
                        </>
                      ) : (
                        <span className="text-slate-400">Usuario Desconocido</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-red-600">{incident.fileName}</div>
                      {incident.fileMetadata && (
                        <div className="mt-2 flex flex-col gap-1 rounded bg-slate-50 p-2 text-xs text-slate-600 border border-slate-200">
                          <span className="font-semibold text-slate-700">Análisis del Archivo:</span>
                          {Object.entries(incident.fileMetadata).map(([key, value]) => (
                            <span key={key} className="capitalize">
                              • {key}: {String(value)}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">
                      {incident.attemptedMime}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs font-bold text-red-600">
                      {incident.detectedMime}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <button
                          onClick={() => handleDownload(incident)}
                          className="inline-flex items-center justify-center rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-500/50"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Descargar Evidencia
                        </button>
                        
                        {incident.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleResolve(incident)}
                              disabled={resolvingId === incident.id}
                              className="inline-flex items-center justify-center rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500/50 disabled:opacity-50"
                            >
                              {resolvingId === incident.id ? 'Marcando...' : 'Falsa Alarma (Ignorar)'}
                            </button>
                            {incident.postId && (
                              <button
                                onClick={() => handleDeletePublication(incident)}
                                disabled={resolvingId === incident.id}
                                className="inline-flex items-center justify-center rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500/50 disabled:opacity-50"
                              >
                                Confirmar Malware y Eliminar
                              </button>
                            )}
                          </>
                        )}

                        {incident.status === 'FALSE_ALARM' && (
                          <div className="inline-flex items-center rounded-lg bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                            ✓ Resultado: Falsa Alarma (Seguro)
                          </div>
                        )}

                        {incident.status === 'MALWARE_DELETED' && (
                          <div className="inline-flex items-center rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
                            ⚠️ Resultado: Malware Confirmado y Post Eliminado
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
