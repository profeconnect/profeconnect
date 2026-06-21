import { useState, useEffect } from 'react';
import Modal from './Modal';
import Field from './Field';
import Button from './Button';
import { createPublication } from '../api/publication.service';
import { getCategories, type Category } from '../api/category.service';
import { useToast } from './Toast';
import { extractErrorMessage } from '../api/client';
import { trackEvent } from '../lib/analytics';

interface CreatePublicationModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreatePublicationModal({
  open,
  onClose,
  onSuccess,
}: CreatePublicationModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();

  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf', '.xls', '.xlsx'];

  useEffect(() => {
    if (!open) return;
    getCategories()
      .then(setAvailableCategories)
      .catch(() => {});
  }, [open]);

  const toggleTag = (id: number) => {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files);
    setFiles(selected);

    const invalid = selected.filter((file) => {
      const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
      return !allowedExtensions.includes(ext);
    });

    setFileError(
      invalid.length > 0
        ? `Tipo no permitido: ${invalid.map((f) => f.name).join(', ')}. Solo se aceptan JPG, PNG, PDF y Excel (.xls, .xlsx).`
        : null
    );
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setSelectedTagIds([]);
    setFiles([]);
    setFileError(null);
    setIsAnonymous(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      error('El título y el contenido son obligatorios.');
      return;
    }
    if (fileError) {
      error('Corrige los archivos antes de publicar.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('content', content.trim());
      formData.append('isAnonymous', isAnonymous ? 'true' : 'false');

      selectedTagIds.forEach((id) => formData.append('tags', String(id)));
      files.forEach((file) => formData.append('files', file));

      await createPublication(formData);
      trackEvent('publication_created');
      success('Publicación creada correctamente.');
      resetForm();
      onSuccess();
      onClose();
    } catch (err) {
      error(extractErrorMessage(err, 'Error al crear la publicación.'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nueva Publicación"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            Publicar
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field
          label="Título"
          placeholder="Escribe un título descriptivo"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          disabled={loading}
        />
        <Field
          as="textarea"
          label="Descripción de la publicación"
          placeholder="Escribe aquí el contenido de tu publicación..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          disabled={loading}
        />

        {availableCategories.length > 0 && (
          <div>
            <p className="block text-sm font-medium text-slate-700 mb-2">
              Categorías
            </p>
            <div className="flex flex-wrap gap-2">
              {availableCategories.map((cat) => {
                const selected = selectedTagIds.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    disabled={loading}
                    onClick={() => toggleTag(cat.id)}
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border transition-colors ${
                      selected
                        ? 'bg-brand-600 text-white border-brand-600'
                        : 'bg-white text-slate-600 border-slate-300 hover:border-brand-400 hover:text-brand-600'
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
            {selectedTagIds.length > 0 && (
              <p className="mt-1 text-xs text-slate-400">
                {selectedTagIds.length} categoría(s) seleccionada(s)
              </p>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Archivos adjuntos (Imágenes JPG/PNG hasta 2 MB, PDF o Excel hasta 10 MB)
          </label>
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            accept=".jpg,.jpeg,.png,.pdf,.xls,.xlsx"
            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 transition-colors"
            disabled={loading}
          />
          {fileError && (
            <p className="mt-2 text-xs font-medium text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
              {fileError}
            </p>
          )}
          {files.length > 0 && (
            <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-medium text-slate-600">
                {files.length} archivo(s) seleccionado(s)
              </p>
              <ul className="mt-2 space-y-1 text-xs text-slate-600">
                {files.map((file) => (
                  <li key={`${file.name}-${file.size}`} className="truncate">
                    {file.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <label className="flex items-center gap-2 cursor-pointer mt-2">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            disabled={loading}
          />
          <span className="text-sm text-slate-700">Publicar como anónimo</span>
        </label>
      </form>
    </Modal>
  );
}
