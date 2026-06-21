import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  deletePublication,
  addComment,
  deleteComment,
  updatePublication,
  setPublicationReaction,
  removePublicationReaction,
} from '../api/publication.service';
import { getPublicFilesBaseUrl } from '../api/client';
import { createReport } from '../api/reports.service';
import { useToast } from './Toast';
import type { Publication, Comment, ReactionSummary, ReactionType } from '../types';
import { trackEvent } from '../lib/analytics';

interface PublicationCardProps {
  pub: Publication;
  onDelete?: () => void;
}

const emptyReactionSummary: ReactionSummary = {
  LIKE: 0,
  USEFUL: 0,
  LOVE: 0,
  total: 0,
};

const reactionOptions: Array<{
  type: ReactionType;
  label: string;
}> = [
  { type: 'LIKE', label: 'Me gusta' },
  { type: 'USEFUL', label: 'Me parece util' },
  { type: 'LOVE', label: 'Me encanta' },
];

export default function PublicationCard({ pub, onDelete }: PublicationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [comments, setComments] = useState<Comment[]>(pub.comments ?? []);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(pub.title);
  const [editContent, setEditContent] = useState(pub.content);
  const [localTitle, setLocalTitle] = useState(pub.title);
  const [localContent, setLocalContent] = useState(pub.content);
  const [reactionSummary, setReactionSummary] = useState<ReactionSummary>(
    pub.reactionSummary ?? emptyReactionSummary
  );
  const [myReaction, setMyReaction] = useState<ReactionType | null>(
    pub.myReaction ?? null
  );
  const [isReacting, setIsReacting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const { user } = useAuth();
  const { success, error } = useToast();
  const canDelete = user?.role === 'admin' || user?.id === pub.author.id;
  const publicFilesBaseUrl = getPublicFilesBaseUrl();

  useEffect(() => {
    setLocalTitle(pub.title);
    setLocalContent(pub.content);
    setComments(pub.comments ?? []);
    setReactionSummary(pub.reactionSummary ?? emptyReactionSummary);
    setMyReaction(pub.myReaction ?? null);
  }, [pub]);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('¿Estás seguro de que deseas borrar esta publicación?')) return;

    try {
      await deletePublication(pub.id);
      success('Publicación eliminada correctamente.');
      onDelete?.();
    } catch (err) {
      error('Error al eliminar la publicación.');
      console.error(err);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim() || !editContent.trim()) return;

    setIsUpdating(true);
    try {
      await updatePublication(pub.id, {
        title: editTitle.trim(),
        content: editContent.trim(),
      });
      setLocalTitle(editTitle.trim());
      setLocalContent(editContent.trim());
      success('Publicación actualizada correctamente.');
      setIsEditing(false);
    } catch (err) {
      error('Error al actualizar la publicación.');
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) return;

    setIsSubmittingComment(true);
    try {
      const createdComment = await addComment(pub.id, commentContent.trim());
      setComments((prev) => [...prev, createdComment]);
      setCommentContent('');
      trackEvent('comment_created');
      success('Comentario añadido.');
    } catch (err) {
      error('Error al añadir comentario.');
      console.error(err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!window.confirm('¿Borrar comentario?')) return;

    try {
      await deleteComment(commentId);
      setComments((prev) => prev.filter((comment) => comment.id !== commentId));
      success('Comentario eliminado.');
    } catch (err) {
      error('Error al eliminar comentario.');
      console.error(err);
    }
  };

  const handleReaction = async (
    e: React.MouseEvent<HTMLButtonElement>,
    type: ReactionType
  ) => {
    e.stopPropagation();
    if (isReacting) return;

    setIsReacting(true);
    try {
      const removingReaction = myReaction === type;
      const reactionState =
        removingReaction
          ? await removePublicationReaction(pub.id)
          : await setPublicationReaction(pub.id, type);

      setReactionSummary(reactionState.reactionSummary ?? emptyReactionSummary);
      setMyReaction(reactionState.myReaction ?? null);
      trackEvent(
        removingReaction ? 'reaction_removed' : 'reaction_updated',
        removingReaction ? {} : { reaction_type: type }
      );
    } catch (err) {
      error('Error al actualizar la reaccion.');
      console.error(err);
    } finally {
      setIsReacting(false);
    }
  };

  const handleReport = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('¿Seguro que deseas reportar esta publicación por contenido inapropiado?')) return;
    setIsReporting(true);
    try {
      await createReport(pub.id);
      success('Publicación reportada correctamente. Los administradores revisarán el caso.');
    } catch (err) {
      error('Error al reportar la publicación.');
      console.error(err);
    } finally {
      setIsReporting(false);
    }
  };

  return (
    <div
      className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 cursor-pointer hover:bg-slate-50 transition-colors"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-slate-900">{localTitle}</h2>
        <span className="text-slate-400">
          {isExpanded ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-5 w-5"
            >
              <path
                fillRule="evenodd"
                d="M14.77 12.79a.75.75 0 01-1.06-.02L10 8.832 6.29 12.77a.75.75 0 11-1.08-1.04l4.25-4.5a.75.75 0 011.08 0l4.25 4.5a.75.75 0 01-.02 1.06z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-5 w-5"
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </span>
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
        {pub.tags && pub.tags.map((tag: any) => (
          <span
            key={tag.id || tag}
            className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
          >
            {tag.name || tag}
          </span>
        ))}
      </div>

      <p className="text-xs text-slate-500 mt-2">
        {new Date(pub.createdAt).toLocaleDateString()}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
        {reactionOptions.map((option) => {
          const isActive = myReaction === option.type;
          const count = reactionSummary[option.type] ?? 0;

          return (
            <button
              key={option.type}
              type="button"
              onClick={(e) => handleReaction(e, option.type)}
              disabled={isReacting}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition-colors disabled:opacity-60 ${
                isActive
                  ? 'bg-brand-600 text-white ring-brand-600'
                  : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>{option.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[11px] ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-slate-600">
              Autor: {pub.author.firstName} {pub.author.lastName}
              {pub.isAnonymous && <span className="ml-2 text-slate-400 italic">(Anónimo)</span>}
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleReport}
                disabled={isReporting}
                className="inline-flex items-center gap-1.5 rounded-lg bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-600 hover:bg-orange-100 transition-colors disabled:opacity-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                {isReporting ? 'Reportando...' : 'Reportar'}
              </button>
              
              {canDelete && (
                <>
                  {user?.id === pub.author.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditTitle(localTitle);
                        setEditContent(localContent);
                        setIsEditing(!isEditing);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      Editar
                    </button>
                  )}
                  <button
                    onClick={handleDelete}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-4 w-4"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.75 1A2.75 2.75 0 006 3.75V4H5a2 2 0 00-2 2v.092c0 .546.401.992.945 1.041l.37 3.518a4.25 4.25 0 004.225 3.849h3.42a4.25 4.25 0 004.225-3.849l.37-3.518A1.05 1.05 0 0017 6.092V6a2 2 0 00-2-2h-1V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4.5h2.5V4h-2.5v.5zM7.5 4h5v-.25A1.25 1.25 0 0011.25 2.5h-2.5A1.25 1.25 0 007.5 3.75V4zM5 5.5h10V6H5v-.5z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Borrar
                  </button>
                </>
              )}
            </div>
          </div>
          {isEditing ? (
            <form onSubmit={handleUpdate} className="flex flex-col gap-3 my-4" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="rounded-lg border-slate-200 text-sm font-semibold focus:border-brand-500 focus:ring-brand-500"
                placeholder="Título de la publicación"
                disabled={isUpdating}
                required
              />
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="rounded-lg border-slate-200 text-sm min-h-[100px] focus:border-brand-500 focus:ring-brand-500"
                placeholder="Contenido..."
                disabled={isUpdating}
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                  disabled={isUpdating}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg disabled:opacity-50 transition-colors"
                >
                  {isUpdating ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-slate-700 whitespace-pre-wrap">
              {localContent}
            </div>
          )}
          
          {pub.attachments && pub.attachments.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                Archivos adjuntos:
              </h4>
              <div className="flex flex-col gap-2">
                {pub.attachments.map((file) => {
                  const isImage = file.type === 'IMAGE';
                  const folder = file.type === "IMAGE" ? "images" : "documents";
                  const fileUrl =
                    file.url ||
                    `${publicFilesBaseUrl}/public/${folder}/${file.filename}`;
                  const displayName = file.originalName || file.filename || 'Archivo';
                  
                  return (
                    <div
                      key={file.id}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-900">
                            {displayName}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {isImage ? 'Imagen adjunta' : 'Documento adjunto'}
                          </p>
                          {file.isSuspicious && (
                            <div className="mt-2 inline-flex items-start gap-1.5 rounded-md bg-red-50 px-2 py-1.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                              <span className="shrink-0">⚠️</span>
                              <span className="whitespace-normal">Advertencia: El formato de este archivo no coincide con su contenido real. Ábralo bajo su propio riesgo.</span>
                            </div>
                          )}
                        </div>

                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={displayName}
                          className="inline-flex shrink-0 items-center rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                        >
                          {isImage ? 'Abrir' : 'Descargar'}
                        </a>
                      </div>

                      {isImage && (
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 block overflow-hidden rounded-lg border border-slate-200 bg-white"
                        >
                          <img
                            src={fileUrl}
                            alt={displayName}
                            className="max-h-64 w-full object-contain bg-slate-100"
                            loading="lazy"
                          />
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-slate-100">
            <h4 className="text-sm font-semibold text-slate-900 mb-4">Comentarios</h4>
            
            <div className="space-y-4 mb-6">
              {comments.length > 0 ? (
                comments.map((comment: Comment) => (
                  <div key={comment.id} className="ml-4 pl-4 border-l-2 border-slate-100 group">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold text-slate-900">
                          {comment.author.firstName} {comment.author.lastName}
                          <span className="ml-2 font-normal text-slate-400">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </p>
                        <p className="mt-1 text-sm text-slate-700">{comment.content}</p>
                      </div>
                      {(user?.role === 'admin' || user?.id === comment.author.id) && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic">No hay comentarios aún.</p>
              )}
            </div>

            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="Escribe un comentario..."
                className="flex-1 rounded-lg border-slate-200 text-sm focus:border-brand-500 focus:ring-brand-500"
                disabled={isSubmittingComment}
              />
              <button
                type="submit"
                disabled={isSubmittingComment || !commentContent.trim()}
                className="inline-flex items-center rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
              >
                Enviar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
