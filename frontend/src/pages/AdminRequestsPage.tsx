import { useCallback, useEffect, useState } from 'react';
import Button from '../components/Button';
import Field from '../components/Field';
import Modal from '../components/Modal';
import Spinner from '../components/Spinner';
import { RequestStatusBadge } from '../components/Badge';
import { useToast } from '../components/Toast';
import { extractErrorMessage } from '../api/client';
import {
  approveRegistrationRequest,
  getRegistrationRequests,
  openRegistrationRequestCedulaPhoto,
  rejectRegistrationRequest,
} from '../api/admin.service';
import { useAuth } from '../context/AuthContext';
import type {
  RegistrationRequest,
  RegistrationRequestStatus,
} from '../types';

type StatusFilter = RegistrationRequestStatus | 'TODAS';

const STATUS_FILTERS: StatusFilter[] = [
  'TODAS',
  'PENDIENTE',
  'APROBADA',
  'RECHAZADA',
];

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

export default function AdminRequestsPage() {
  const toast = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>('PENDIENTE');
  const [actionId, setActionId] = useState<number | null>(null);

  const [rejectTarget, setRejectTarget] = useState<RegistrationRequest | null>(
    null
  );
  const [rejectComment, setRejectComment] = useState('');
  const [viewingPhotoId, setViewingPhotoId] = useState<number | null>(null);

  const load = useCallback(
    async (statusFilter: StatusFilter) => {
      setLoading(true);
      try {
        const data = await getRegistrationRequests(
          statusFilter === 'TODAS' ? undefined : statusFilter
        );
        setRequests(data);
      } catch (error) {
        toast.error(
          extractErrorMessage(error, 'No se pudieron cargar las solicitudes')
        );
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    load(filter);
  }, [filter, load]);

  async function handleViewCedula(request: RegistrationRequest) {
    setViewingPhotoId(request.id);
    try {
      await openRegistrationRequestCedulaPhoto(request.id);
    } catch (error) {
      toast.error(
        extractErrorMessage(error, 'No se pudo cargar la foto de cédula')
      );
    } finally {
      setViewingPhotoId(null);
    }
  }

  async function handleApprove(request: RegistrationRequest) {
    setActionId(request.id);
    try {
      await approveRegistrationRequest(request.id);
      toast.success(
        `Solicitud de ${request.firstName} ${request.lastName} aprobada`
      );
      await load(filter);
    } catch (error) {
      toast.error(
        extractErrorMessage(error, 'No se pudo aprobar la solicitud')
      );
    } finally {
      setActionId(null);
    }
  }

  function openRejectModal(request: RegistrationRequest) {
    setRejectTarget(request);
    setRejectComment('');
  }

  function closeRejectModal() {
    setRejectTarget(null);
    setRejectComment('');
  }

  async function handleReject() {
    if (!rejectTarget) return;
    setActionId(rejectTarget.id);
    try {
      await rejectRegistrationRequest(
        rejectTarget.id,
        rejectComment.trim() || undefined
      );
      toast.success('Solicitud rechazada');
      closeRejectModal();
      await load(filter);
    } catch (error) {
      toast.error(
        extractErrorMessage(error, 'No se pudo rechazar la solicitud')
      );
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Solicitudes de registro
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Revisa, aprueba o rechaza las solicitudes de docentes nuevos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-700">
            Filtrar:
          </label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as StatusFilter)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          >
            {STATUS_FILTERS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Spinner label="Cargando solicitudes..." />
          </div>
        ) : requests.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-600">
            No hay solicitudes en este filtro.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {requests.map((req) => (
              <li
                key={req.id}
                className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-slate-900">
                      {req.firstName} {req.lastName}
                    </p>
                    <RequestStatusBadge status={req.status} />
                  </div>
                  <p className="text-sm text-slate-600">
                    {req.institutionalEmail}
                  </p>
                  {req.hasCedulaPhoto && (
                    <button
                      type="button"
                      onClick={() => handleViewCedula(req)}
                      disabled={viewingPhotoId === req.id}
                      className="mt-2 text-sm font-medium text-brand-700 hover:text-brand-800 disabled:opacity-50"
                    >
                      {viewingPhotoId === req.id
                        ? 'Abriendo...'
                        : `Ver foto de cédula${req.cedulaPhotoName ? ` (${req.cedulaPhotoName})` : ''}`}
                    </button>
                  )}
                  {req.area && (
                    <p className="mt-1 text-xs text-slate-500">
                      Área: <span className="font-medium">{req.area}</span>
                    </p>
                  )}
                  {req.description && (
                    <p className="mt-2 text-sm text-slate-700">
                      {req.description}
                    </p>
                  )}
                  <div className="mt-2 grid grid-cols-1 gap-1 text-xs text-slate-500 sm:grid-cols-2">
                    <span>Solicitada: {formatDate(req.createdAt)}</span>
                    {req.reviewedAt && (
                      <span>Revisada: {formatDate(req.reviewedAt)}</span>
                    )}
                    {req.reviewedBy && (
                      <span>
                        Revisor: {req.reviewedBy.firstName}{' '}
                        {req.reviewedBy.lastName}
                      </span>
                    )}
                    {req.reviewComment && (
                      <span className="sm:col-span-2">
                        Comentario: {req.reviewComment}
                      </span>
                    )}
                  </div>
                </div>

                {req.status === 'PENDIENTE' && isAdmin && (
                  <div className="flex gap-2 sm:flex-col sm:items-stretch">
                    <Button
                      variant="success"
                      size="sm"
                      loading={actionId === req.id}
                      onClick={() => handleApprove(req)}
                    >
                      Aprobar
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={actionId === req.id}
                      onClick={() => openRejectModal(req)}
                    >
                      Rechazar
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal
        open={!!rejectTarget}
        title="Rechazar solicitud"
        onClose={closeRejectModal}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={closeRejectModal}
              disabled={actionId === rejectTarget?.id}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleReject}
              loading={actionId === rejectTarget?.id}
            >
              Confirmar rechazo
            </Button>
          </>
        }
      >
        {rejectTarget && (
          <div className="flex flex-col gap-3">
            <p>
              Vas a rechazar la solicitud de{' '}
              <strong>
                {rejectTarget.firstName} {rejectTarget.lastName}
              </strong>{' '}
              ({rejectTarget.institutionalEmail}).
            </p>
            <Field
              as="textarea"
              label="Comentario (opcional)"
              name="reviewComment"
              placeholder="Motivo del rechazo (visible para registros internos)"
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
