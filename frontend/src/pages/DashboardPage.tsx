import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { RoleBadge, UserStatusBadge } from '../components/Badge';
import Button from '../components/Button';
import CreatePublicationModal from '../components/CreatePublicationModal';
import PublicationCard from '../components/PublicationCard';
import { getPublications } from '../api/publication.service';
import type { Publication } from '../types';

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [recentPublications, setRecentPublications] = useState<Publication[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(false);

  const fetchRecentPublications = async () => {
    setLoadingFeed(true);
    try {
      const data = await getPublications();
      setRecentPublications(data.items.slice(0, 5));
    } catch (err) {
      console.error('Error fetching recent publications:', err);
    } finally {
      setLoadingFeed(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchRecentPublications();
    }
  }, [user]);

  if (!user) return null;

  const roleGreeting: Record<typeof user.role, string> = {
    admin: 'Como administrador, puedes gestionar usuarios y aprobar solicitudes.',
    docente: 'Comparte tus experiencias y enriquece a la comunidad pedagógica.',
    moderador: 'Modera el contenido para mantener una comunidad sana.',
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-8 text-white shadow-lg">
        <p className="text-sm uppercase tracking-wider text-gray-100">
          Bienvenido(a)
        </p>
        <h1 className="mt-1 text-3xl font-semibold text-white">
          {user.firstName} {user.lastName}
        </h1>
        <p className="mt-3 max-w-2xl text-gray-100">
          {roleGreeting[user.role]}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Rol
          </p>
          <div className="mt-2">
            <RoleBadge role={user.role} />
          </div>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Estado
          </p>
          <div className="mt-2">
            <UserStatusBadge status={user.status} />
          </div>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Correo
          </p>
          <p className="mt-2 truncate text-sm font-medium text-slate-900">
            {user.institutionalEmail}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-base font-semibold text-slate-900">
            Mi perfil docente
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Actualiza tu área, descripción y foto.
          </p>
          {profile?.profile && (
            <dl className="mt-4 grid grid-cols-1 gap-3 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wider text-slate-500">
                  Área
                </dt>
                <dd className="font-medium text-slate-900">
                  {profile.profile.area ?? 'Sin definir'}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-slate-500">
                  Descripción
                </dt>
                <dd className="text-slate-700">
                  {profile.profile.description ?? 'Sin descripción'}
                </dd>
              </div>
            </dl>
          )}
          <Link
            to="/perfil"
            className="mt-4 inline-flex text-sm font-medium text-brand-700 hover:text-brand-800"
          >
            Editar perfil →
          </Link>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 flex flex-col">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-base font-semibold text-slate-900">
              Comunidad pedagógica
            </h2>
            <Button size="sm" onClick={() => setIsModalOpen(true)}>
              + Nueva publicación
            </Button>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Últimas publicaciones de tus colegas.
          </p>

          <div className="mt-4 flex-1 space-y-3">
            {loadingFeed ? (
              <p className="text-xs text-slate-400">Cargando...</p>
            ) : recentPublications.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No hay publicaciones recientes.</p>
            ) : (
              recentPublications.map((pub) => (
                <PublicationCard
                  key={pub.id}
                  pub={pub}
                  onDelete={fetchRecentPublications}
                />
              ))
            )}
          </div>

          <Link
            to="/feed"
            className="mt-4 inline-flex text-sm font-medium text-brand-700 hover:text-brand-800"
          >
            Ver todo el feed →
          </Link>
        </div>
      </div>

      <CreatePublicationModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchRecentPublications}
      />
    </div>
  );
}
