import { useEffect, useState } from 'react';
import { getPublications } from '../api/publication.service';
import type { Publication } from '../types';
import PublicationCard from '../components/PublicationCard';
import CreatePublicationModal from '../components/CreatePublicationModal';
import Button from '../components/Button';

export default function FeedPage() {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchPublications = async () => {
    try {
      const data = await getPublications();
      setPublications(data);
    } catch (err) {
      setError('No se pudieron cargar las publicaciones.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPublications();
  }, []);



  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-slate-900">Feed de Publicaciones</h1>
          <Button onClick={() => setIsModalOpen(true)}>
            + Nueva Publicación
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {isLoading ? (
          <p>Cargando publicaciones...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : publications.length === 0 ? (
          <p>No hay publicaciones todavía.</p>
        ) : (
          publications.map((pub) => (
            <PublicationCard key={pub.id} pub={pub} onDelete={fetchPublications} />
          ))
        )}
      </div>

      <CreatePublicationModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchPublications}
      />
    </div>
  );
}
