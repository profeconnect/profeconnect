import { useCallback, useEffect, useState } from 'react';
import Spinner from '../components/Spinner';
import { useToast } from '../components/Toast';
import { extractErrorMessage } from '../api/client';
import { getPlatformReviews } from '../api/review.service';
import type { PlatformReview } from '../types';

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

function StarDisplay({
  rating,
  size = 'md',
  rounded = false,
}: {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  rounded?: boolean;
}) {
  const sizeClass =
    size === 'lg' ? 'text-3xl' : size === 'md' ? 'text-lg' : 'text-sm';
  const threshold = rounded ? Math.round(rating) : rating;

  return (
    <div className={`flex gap-0.5 ${sizeClass}`} aria-label={`${rating} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={star <= threshold ? 'text-amber-400' : 'text-slate-300'}
          aria-hidden
        >
          ★
        </span>
      ))}
    </div>
  );
}

function AverageRatingCard({
  averageRating,
  totalCount,
}: {
  averageRating: number;
  totalCount: number;
}) {
  const formattedAverage =
    totalCount > 0 ? averageRating.toFixed(1) : '—';

  return (
    <div className="rounded-2xl bg-gradient-to-br from-amber-50 via-white to-brand-50 p-6 shadow-sm ring-1 ring-amber-200/60">
      <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
        <div>
          <p className="text-sm font-medium uppercase tracking-wider text-amber-700">
            Promedio general
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {totalCount} reseña{totalCount !== 1 ? 's' : ''} registrada
            {totalCount !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex flex-col items-center sm:items-end">
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold text-slate-900">{formattedAverage}</span>
            <span className="text-lg text-slate-500">/ 5</span>
          </div>
          <StarDisplay rating={averageRating} size="lg" rounded />
        </div>
      </div>
    </div>
  );
}

export default function AdminReviewsPage() {
  const toast = useToast();
  const [reviews, setReviews] = useState<PlatformReview[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Estados para el filtro de fechas
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modificamos la función para que acepte parámetros opcionales
  const fetchReviews = useCallback(async (start?: string, end?: string) => {
    setLoading(true);
    try {
      const data = await getPlatformReviews(start, end);
      setReviews(data.reviews);
      setAverageRating(data.averageRating);
      setTotalCount(data.totalCount);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'No se pudieron cargar las reseñas'));
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Carga inicial (sin filtros)
  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Funciones para manejar los botones del filtro
  const handleFilter = () => {
    fetchReviews(startDate, endDate);
  };

  const handleClear = () => {
    setStartDate('');
    setEndDate('');
    fetchReviews('', ''); // Recarga todo
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Reseñas de la Plataforma
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Retroalimentación enviada por los docentes sobre su experiencia en ProfeConnect.
        </p>
      </div>

      {/* Tarjeta de Filtros */}
      <div className="flex flex-wrap items-end gap-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col">
          <label htmlFor="startDate" className="mb-1 text-sm font-medium text-slate-700">
            Fecha inicio
          </label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="flex flex-col">
          <label htmlFor="endDate" className="mb-1 text-sm font-medium text-slate-700">
            Fecha fin
          </label>
          <input
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleFilter}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Filtrar
          </button>
          <button
            onClick={handleClear}
            className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
          >
            Limpiar
          </button>
        </div>
      </div>

      <AverageRatingCard averageRating={averageRating} totalCount={totalCount} />

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Spinner label="Cargando reseñas..." />
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-600">
            Aún no hay reseñas registradas o no se encontraron en este rango de fechas.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Usuario</th>
                  <th className="px-4 py-3">Calificación</th>
                  <th className="px-4 py-3">Comentario</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reviews.map((review) => (
                  <tr key={review.id} className="hover:bg-amber-50/40 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                      {formatDate(review.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      {review.user ? (
                        <>
                          <div className="font-medium text-slate-900">
                            {review.user.firstName} {review.user.lastName}
                          </div>
                          <div className="text-xs text-slate-500">
                            {review.user.institutionalEmail}
                          </div>
                        </>
                      ) : (
                        <span className="text-slate-400">Anónimo</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <StarDisplay rating={review.rating} size="sm" />
                        <span className="font-semibold text-slate-700">
                          {review.rating}/5
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-md">
                      {review.comment ? (
                        <p className="whitespace-pre-wrap text-slate-700">{review.comment}</p>
                      ) : (
                        <span className="text-slate-400 italic">Sin comentario</span>
                      )}
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