import { useState } from 'react';
import Modal from './Modal';
import Field from './Field';
import Button from './Button';
import { createPublication } from '../api/publication.service';
import { useToast } from './Toast';

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
  const [tags, setTags] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(selectedFiles);
      
      // Whitelist validation (for demonstration)
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf'];
      const invalidFiles = selectedFiles.filter(file => {
        const ext = file.name.slice((file.name.lastIndexOf(".") - 1 >>> 0) + 2).toLowerCase();
        return !allowedExtensions.includes(`.${ext}`);
      });

      if (invalidFiles.length > 0) {
        setFileError(`Advertencia: Has seleccionado archivos que no son imágenes o PDFs (${invalidFiles.map(f => f.name).join(', ')}). Esto podría ser peligroso, pero permitiremos la subida para la demostración.`);
      } else {
        setFileError(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      error('El título y el contenido son obligatorios.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('content', content.trim());
      formData.append('isAnonymous', isAnonymous ? 'true' : 'false');
      
      // Tags (sending as JSON string for the backend to parse)
      const tagsArray = tags.split(',').map(t => t.trim()).filter(t => t !== '');
      if (tagsArray.length > 0) {
        formData.append('tags', JSON.stringify(tagsArray));
      }

      // Files
      files.forEach(file => {
        formData.append('files', file);
      });

      await createPublication(formData);
      success('Publicación creada correctamente.');
      setTitle('');
      setContent('');
      setTags('');
      setFiles([]);
      setIsAnonymous(false);
      onSuccess();
      onClose();
    } catch (err) {
      error('Error al crear la publicación.');
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
        <Field
          label="Etiquetas"
          placeholder="Ej: tecnología, educación, campus (separadas por comas)"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          disabled={loading}
        />
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Archivos adjuntos (Imágenes, PDFs)
          </label>
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 transition-colors"
            disabled={loading}
          />
          {fileError && (
            <div className="mt-2 text-xs font-medium text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-200">
              ⚠️ {fileError}
            </div>
          )}
          {files.length > 0 && !fileError && (
            <div className="mt-2 text-xs text-slate-500">
              {files.length} archivo(s) seleccionado(s)
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
