import { useEffect, useMemo, useState, useCallback } from 'react';
import Spinner from '../components/Spinner';
import { useToast } from '../components/Toast';
import { extractErrorMessage } from '../api/client';
import { getPendingIncidents, resolveIncident, downloadIncidentFile, deletePublicationFromIncident } from '../api/incident.service';
import { getReportedPosts, type ReportedPost } from '../api/reports.service';
import { openUserCedulaPhoto } from '../api/admin.service';
import { deletePublication } from '../api/publication.service';
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

function ReportBadge({ count }: { count: number }) {
  if (count === 0) return null;

  const isHigh = count > 3;
  const isMedium = count >= 1 && count <= 3;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${isHigh
        ? 'bg-red-100 text-red-700 ring-1 ring-red-400/40'
        : isMedium
          ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-400/40'
          : 'bg-slate-100 text-slate-600'
        }`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
        <path fillRule="evenodd" d="M8 1.75a.75.75 0 0 1 .692.462l1.41 3.393 3.664.293a.75.75 0 0 1 .428 1.317l-2.791 2.39.853 3.575a.75.75 0 0 1-1.12.814L8 11.232l-3.136 1.762a.75.75 0 0 1-1.12-.814l.853-3.574-2.79-2.39a.75.75 0 0 1 .427-1.318l3.663-.293L7.308 2.21A.75.75 0 0 1 8 1.75Z" clipRule="evenodd" />
      </svg>
      {count} reporte{count !== 1 ? 's' : ''}
    </span>
  );
}

type MainTab = 'INCIDENTS' | 'REPORTED_POSTS';

export default function AdminIncidentsPage() {
  const toast = useToast();

  // --- Security Incidents state ---
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [loadingIncidents, setLoadingIncidents] = useState(true);
  const [search, setSearch] = useState('');
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const [incidentTab, setIncidentTab] = useState<'PENDING' | 'RESOLVED'>('PENDING');

  // --- Reported Posts state ---
  const [reportedPosts, setReportedPosts] = useState<ReportedPost[]>([]);
  const [loadingReported, setLoadingReported] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<number | null>(null);
  const [expandedPostId, setExpandedPostId] = useState<number | null>(null);
  const [viewingCedulaUserId, setViewingCedulaUserId] = useState<number | null>(null);

  // --- Main tab ---
  const [mainTab, setMainTab] = useState<MainTab>('INCIDENTS');

  // Load security incidents
  useEffect(() => {
    let cancelled = false;
    setLoadingIncidents(true);
    getPendingIncidents()
      .then((data) => {
        if (cancelled) return;
        setIncidents(data);
      })
      .catch((error) => {
        if (cancelled) return;
        toast.error(extractErrorMessage(error, 'No se pudieron cargar los incidentes'));
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingIncidents(false);
      });
    return () => { cancelled = true; };
  }, [toast]);

  // Load reported posts when tab is active
  const fetchReportedPosts = useCallback(async () => {
    setLoadingReported(true);
    try {
      const data = await getReportedPosts();
      setReportedPosts(data);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'No se pudieron cargar las publicaciones reportadas'));
    } finally {
      setLoadingReported(false);
    }
  }, [toast]);

  useEffect(() => {
    if (mainTab === 'REPORTED_POSTS') {
      fetchReportedPosts();
    }
  }, [mainTab, fetchReportedPosts]);

  // --- Incident handlers ---
  const filteredIncidents = useMemo(() => {
    const term = search.trim().toLowerCase();
    const tabFiltered = incidents.filter((inc) =>
      incidentTab === 'PENDING' ? inc.status === 'PENDING' : inc.status !== 'PENDING'
    );
    if (!term) return tabFiltered;
    return tabFiltered.filter((i) =>
      i.fileName.toLowerCase().includes(term) ||
      i.user?.institutionalEmail.toLowerCase().includes(term) ||
      i.user?.firstName.toLowerCase().includes(term) ||
      i.user?.lastName.toLowerCase().includes(term)
    );
  }, [incidents, search, incidentTab]);

  async function handleResolve(incident: SecurityIncident) {
    setResolvingId(incident.id);
    try {
      const updated = await resolveIncident(incident.id);
      setIncidents((prev) => prev.map((i) => i.id === incident.id ? updated : i));
      toast.success('Incidente marcado como falsa alarma');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'No se pudo resolver el incidente'));
    } finally {
      setResolvingId(null);
    }
  }

  async function handleDownload(incident: SecurityIncident) {
    try {
      await downloadIncidentFile(incident.id, incident.fileName);
      toast.success('Descarga iniciada');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'No se pudo descargar el archivo forense'));
    }
  }

  async function handleDeleteIncidentPublication(incident: SecurityIncident) {
    if (!window.confirm('¿Estás seguro de que deseas eliminar la publicación y marcar este incidente como resuelto?')) return;
    setResolvingId(incident.id);
    try {
      const updated = await deletePublicationFromIncident(incident.id);
      setIncidents((prev) => prev.map((i) => i.id === incident.id ? updated : i));
      toast.success('Publicación eliminada e incidente resuelto');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'No se pudo eliminar la publicación'));
    } finally {
      setResolvingId(null);
    }
  }

  // --- Reported Post handlers ---
  async function handleViewUserCedula(userId: number) {
    setViewingCedulaUserId(userId);
    try {
      await openUserCedulaPhoto(userId);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'No se pudo cargar la foto de cédula'));
    } finally {
      setViewingCedulaUserId(null);
    }
  }

  async function handleDeleteReportedPost(post: ReportedPost) {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar la publicación "${post.title}" y todos sus adjuntos?`)) return;
    setDeletingPostId(post.id);
    try {
      await deletePublication(post.id);
      setReportedPosts((prev) => prev.filter((p) => p.id !== post.id));
      toast.success('Publicación eliminada correctamente');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'No se pudo eliminar la publicación'));
    } finally {
      setDeletingPostId(null);
    }
  }

  const pendingIncidentCount = incidents.filter(i => i.status === 'PENDING').length;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Panel de Moderación
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {pendingIncidentCount} incidente{pendingIncidentCount !== 1 ? 's' : ''} de seguridad pendiente{pendingIncidentCount !== 1 ? 's' : ''} · {reportedPosts.length > 0 ? `${reportedPosts.length} publicación${reportedPosts.length !== 1 ? 'es' : ''} reportada${reportedPosts.length !== 1 ? 's' : ''}` : ''}
          </p>
        </div>
        {mainTab === 'INCIDENTS' && (
          <input
            type="search"
            placeholder="Buscar por archivo o usuario..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 sm:w-72"
          />
        )}
      </div>

      {/* Main Tabs */}
      <div className="flex space-x-1 border-b border-slate-200">
        <button
          onClick={() => setMainTab('INCIDENTS')}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors mr-4 ${mainTab === 'INCIDENTS'
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
        >
          🔒 Incidentes de Seguridad
          {pendingIncidentCount > 0 && (
            <span className="ml-2 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
              {pendingIncidentCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setMainTab('REPORTED_POSTS')}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${mainTab === 'REPORTED_POSTS'
            ? 'border-orange-500 text-orange-600'
            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
        >
          🚩 Publicaciones Reportadas
          {reportedPosts.length > 0 && (
            <span className="ml-2 inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700">
              {reportedPosts.length}
            </span>
          )}
        </button>
      </div>

      {/* === INCIDENTS TAB === */}
      {mainTab === 'INCIDENTS' && (
        <>
          <div className="flex space-x-6 border-b border-slate-200 -mt-2">
            <button
              onClick={() => setIncidentTab('PENDING')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${incidentTab === 'PENDING' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
            >
              Pendientes
            </button>
            <button
              onClick={() => setIncidentTab('RESOLVED')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${incidentTab === 'RESOLVED' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
            >
              Historial de Resueltos
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            {loadingIncidents ? (
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
                          <div className="flex justify-end items-center gap-2 flex-wrap">
                            <button
                              onClick={() => handleDownload(incident)}
                              className="inline-flex items-center justify-center rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-500/50"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                              Evidencia
                            </button>

                            {incident.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => handleResolve(incident)}
                                  disabled={resolvingId === incident.id}
                                  className="inline-flex items-center justify-center rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500/50 disabled:opacity-50"
                                >
                                  {resolvingId === incident.id ? 'Marcando...' : 'Falsa Alarma'}
                                </button>
                                {incident.postId && (
                                  <button
                                    onClick={() => handleDeleteIncidentPublication(incident)}
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
                                ✓ Falsa Alarma
                              </div>
                            )}
                            {incident.status === 'MALWARE_DELETED' && (
                              <div className="inline-flex items-center rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
                                ⚠️ Malware Eliminado
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
        </>
      )}

      {/* === REPORTED POSTS TAB === */}
      {mainTab === 'REPORTED_POSTS' && (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          {loadingReported ? (
            <div className="flex h-64 items-center justify-center">
              <Spinner label="Cargando publicaciones reportadas..." />
            </div>
          ) : reportedPosts.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-600">
              🎉 No hay publicaciones reportadas. ¡Todo en orden!
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {reportedPosts.map((post) => {
                const isHigh = post.reportCount > 3;
                const isMedium = post.reportCount >= 1 && post.reportCount <= 3;
                const isExpanded = expandedPostId === post.id;
                const isDeleting = deletingPostId === post.id;

                return (
                  <div
                    key={post.id}
                    className={`p-5 transition-colors ${isHigh
                      ? 'bg-red-50/50 border-l-4 border-red-400'
                      : isMedium
                        ? 'bg-amber-50/50 border-l-4 border-amber-400'
                        : 'border-l-4 border-transparent'
                      }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      {/* Post info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <ReportBadge count={post.reportCount} />
                          {post.isAnonymous && (
                            <span className="inline-flex items-center rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-700 ring-1 ring-violet-300/50">
                              Publicación anónima
                            </span>
                          )}
                          {isHigh && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-bold text-white">
                              ⚡ Alta Importancia
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-semibold text-slate-900 truncate">
                          {post.title}
                        </h3>

                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                          <span>{formatDate(post.createdAt)}</span>
                          {post.tags?.length > 0 && (
                            <>
                              <span>·</span>
                              <div className="flex flex-wrap gap-1">
                                {post.tags.map((tag) => (
                                  <span
                                    key={tag.id}
                                    className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700"
                                  >
                                    {tag.name}
                                  </span>
                                ))}
                              </div>
                            </>
                          )}
                        </div>

                        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Identidad real del autor
                          </p>
                          <div className="mt-2 grid gap-1 text-slate-700">
                            <p>
                              <span className="text-slate-500">Nombre:</span>{' '}
                              {post.author.firstName} {post.author.lastName}
                            </p>
                            <p>
                              <span className="text-slate-500">Correo:</span>{' '}
                              {post.author.institutionalEmail}
                            </p>
                            {post.author.hasCedulaPhoto && post.author.id && (
                              <button
                                type="button"
                                onClick={() => handleViewUserCedula(post.author.id!)}
                                disabled={viewingCedulaUserId === post.author.id}
                                className="mt-1 w-fit text-sm font-medium text-brand-700 hover:text-brand-800 disabled:opacity-50"
                              >
                                {viewingCedulaUserId === post.author.id
                                  ? 'Abriendo...'
                                  : `Ver foto de cédula${post.author.cedulaPhotoName ? ` (${post.author.cedulaPhotoName})` : ''}`}
                              </button>
                            )}
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="mt-3 rounded-lg bg-white border border-slate-200 p-3 text-sm text-slate-700 whitespace-pre-wrap max-h-48 overflow-y-auto">
                            {post.content}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setExpandedPostId(isExpanded ? null : post.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                            <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
                            <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41ZM14 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" clipRule="evenodd" />
                          </svg>
                          {isExpanded ? 'Ocultar' : 'Ver contenido'}
                        </button>

                        <button
                          onClick={() => handleDeleteReportedPost(post)}
                          disabled={isDeleting}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          {isDeleting ? (
                            <>
                              <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                              Eliminando...
                            </>
                          ) : (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                                <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75V4H5a2 2 0 00-2 2v.092c0 .546.401.992.945 1.041l.37 3.518a4.25 4.25 0 004.225 3.849h3.42a4.25 4.25 0 004.225-3.849l.37-3.518A1.05 1.05 0 0017 6.092V6a2 2 0 00-2-2h-1V3.75A2.75 2.75 0 0011.25 1h-2.5z" clipRule="evenodd" />
                              </svg>
                              Eliminar publicación
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
