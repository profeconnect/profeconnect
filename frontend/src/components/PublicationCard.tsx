import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { deletePublication } from '../api/publication.service';
import { useToast } from './Toast';
import type { Publication } from '../types';

interface PublicationCardProps {
  pub: Publication;
  onDelete?: () => void;
}

export default function PublicationCard({ pub, onDelete }: PublicationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { user } = useAuth();
  const { success, error } = useToast();
  const canDelete = user?.role === 'admin' || user?.id === pub.author.id;

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

  return (
    <div
      className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 cursor-pointer hover:bg-slate-50 transition-colors"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-slate-900">{pub.title}</h2>
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

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-slate-600">
              Autor: {pub.author.firstName} {pub.author.lastName}
              {pub.isAnonymous && <span className="ml-2 text-slate-400 italic">(Anónimo)</span>}
            </p>
            {canDelete && (
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
            )}
          </div>
          <div className="text-slate-700 whitespace-pre-wrap">
            {pub.content}
          </div>
          
          {pub.attachments && pub.attachments.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                Archivos adjuntos:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {pub.attachments.map((file) => {
                  const isImage = file.fileType?.startsWith('image/') || file.mimeType?.startsWith('image/');
                  const fileUrl = file.url || `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/uploads/${file.filename}`;
                  
                  return (
                    <div
                      key={file.id}
                      className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:shadow-md transition-all"
                    >
                      {isImage ? (
                        <div className="aspect-video w-full overflow-hidden bg-slate-200">
                          <img
                            src={fileUrl}
                            alt={file.originalName || 'Imagen'}
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          />
                        </div>
                      ) : (
                        <div className="flex h-12 items-center justify-center bg-slate-200 text-slate-400">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                      )}
                      <div className="p-3">
                        <p className="text-xs font-medium text-slate-900 truncate">
                          {file.originalName || file.filename || 'Archivo'}
                        </p>
                        <p className="mt-1 text-[10px] text-slate-500">
                          {file.size ? `${(file.size / 1024).toFixed(1)} KB` : 'Tamaño desconocido'}
                        </p>
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center text-[10px] font-semibold text-brand-600 hover:text-brand-700"
                        >
                          Descargar / Abrir →
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
