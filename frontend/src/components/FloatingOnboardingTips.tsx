import { useState, type ReactNode } from 'react';
import Button from './Button';
import { createPlatformReview } from '../api/review.service';
import { extractErrorMessage } from '../api/client';
import { trackEvent } from '../lib/analytics';

type CardId = 'rating' | 'tip1' | 'tip2';

interface TipCardProps {
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

function TipCard({ onClose, children, className = '' }: TipCardProps) {
  return (
    <div
      className={`relative w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-red-100 bg-white p-4 shadow-lg ring-1 ring-black/5 ${className}`}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-2 top-2 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        aria-label="Cerrar"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-4 w-4"
          aria-hidden
        >
          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
        </svg>
      </button>
      {children}
    </div>
  );
}

function StarRating({
  value,
  hoverValue,
  onSelect,
  onHover,
  onLeave,
  disabled,
}: {
  value: number;
  hoverValue: number;
  onSelect: (rating: number) => void;
  onHover: (rating: number) => void;
  onLeave: () => void;
  disabled?: boolean;
}) {
  const display = hoverValue || value;

  return (
    <div className="flex gap-1" role="group" aria-label="Calificación de 1 a 5 estrellas">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(star)}
          onMouseEnter={() => onHover(star)}
          onMouseLeave={onLeave}
          className="rounded p-0.5 transition hover:scale-110 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={`${star} estrella${star !== 1 ? 's' : ''}`}
        >
          <span
            className={`text-2xl leading-none ${
              star <= display ? 'text-amber-400' : 'text-slate-300'
            }`}
          >
            ★
          </span>
        </button>
      ))}
    </div>
  );
}

function RatingCard({ onClose }: { onClose: () => void }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [thankYou, setThankYou] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (rating < 1) {
      setError('Selecciona al menos una estrella antes de enviar.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await createPlatformReview({
        rating,
        comment: comment.trim() || undefined,
      });
      trackEvent('platform_review_submitted', { rating });
      setThankYou(true);
      window.setTimeout(onClose, 2200);
    } catch (err) {
      setError(extractErrorMessage(err, 'No se pudo enviar tu reseña.'));
    } finally {
      setSubmitting(false);
    }
  }

  if (thankYou) {
    return (
      <TipCard onClose={onClose}>
        <div className="pr-6 text-center">
          <p className="text-3xl" aria-hidden>
            🎉
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            ¡Gracias por tu opinión!
          </p>
          <p className="mt-1 text-xs text-slate-600">
            Tu retroalimentación nos ayuda a mejorar ProfeConnect.
          </p>
        </div>
      </TipCard>
    );
  }

  return (
    <TipCard onClose={onClose}>
      <form onSubmit={handleSubmit} className="pr-4">
        <h3 className="text-sm font-semibold text-slate-900">
          ⭐ ¡Califica tu experiencia!
        </h3>
        <p className="mt-1 text-xs text-slate-600">
          Cuéntanos qué te parece la plataforma.
        </p>

        <div className="mt-3">
          <StarRating
            value={rating}
            hoverValue={hoverRating}
            onSelect={setRating}
            onHover={setHoverRating}
            onLeave={() => setHoverRating(0)}
            disabled={submitting}
          />
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Comentario opcional..."
          rows={3}
          disabled={submitting}
          className="mt-3 w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:bg-slate-50"
        />

        {error && (
          <p className="mt-2 text-xs text-red-600" role="alert">
            {error}
          </p>
        )}

        <Button
          type="submit"
          size="sm"
          loading={submitting}
          disabled={rating < 1}
          className="mt-3 w-full"
        >
          Enviar
        </Button>
      </form>
    </TipCard>
  );
}

export default function FloatingOnboardingTips() {
  const [hiddenCards, setHiddenCards] = useState<Record<CardId, boolean>>({
    rating: false,
    tip1: false,
    tip2: false,
  });

  function hideCard(cardId: CardId) {
    setHiddenCards((prev) => ({ ...prev, [cardId]: true }));
  }

  const visibleCards = (['rating', 'tip1', 'tip2'] as CardId[]).filter(
    (id) => !hiddenCards[id]
  );

  if (visibleCards.length === 0) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed bottom-24 right-4 z-40 flex flex-col items-end gap-3 md:bottom-6 md:right-6"
      aria-live="polite"
    >
      {visibleCards.map((cardId) => {
        if (cardId === 'rating') {
          return (
            <div key={cardId} className="pointer-events-auto">
              <RatingCard onClose={() => hideCard('rating')} />
            </div>
          );
        }

        if (cardId === 'tip1') {
          return (
            <div key={cardId} className="pointer-events-auto">
              <TipCard onClose={() => hideCard('tip1')}>
                <p className="pr-4 text-sm leading-relaxed text-slate-700">
                  En la pestaña superior de{' '}
                  <span className="font-semibold text-brand-700">Publicaciones</span>{' '}
                  encontrarás todo el material de la comunidad. ¡Usa los filtros para
                  encontrar exactamente lo que necesitas para tus clases!
                </p>
              </TipCard>
            </div>
          );
        }

        return (
          <div key={cardId} className="pointer-events-auto">
            <TipCard onClose={() => hideCard('tip2')}>
              <p className="pr-4 text-sm leading-relaxed text-slate-700">
                ¿Buscas contenido pedagógico específico? Ve a la ventana del{' '}
                <span className="font-semibold text-brand-700">Chatbot</span>, donde
                nuestra IA está lista para agilizar tus búsquedas y darte ideas.
              </p>
            </TipCard>
          </div>
        );
      })}
    </div>
  );
}
