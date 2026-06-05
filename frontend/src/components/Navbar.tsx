import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { RoleBadge } from './Badge';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  const baseLink =
    'rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-slate-100';
  const activeLink = 'bg-brand-50 text-brand-700 hover:bg-brand-50';

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <NavLink to="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white font-bold">
            A
          </div>
          <span className="text-lg font-semibold text-slate-900">
            AmigoJoLive
          </span>
        </NavLink>

        <nav className="hidden items-center gap-1 md:flex">
          <NavLink
            to="/dashboard"
            end
            className={({ isActive }) =>
              `${baseLink} ${isActive ? activeLink : 'text-slate-700'}`
            }
          >
            Inicio
          </NavLink>
          <NavLink
            to="/chatbot"
            className={({ isActive }) =>
              `${baseLink} ${isActive ? activeLink : 'text-slate-700'}`
            }
          >
            Chatbot
          </NavLink>
          <NavLink
            to="/perfil"
            className={({ isActive }) =>
              `${baseLink} ${isActive ? activeLink : 'text-slate-700'}`
            }
          >
            Mi perfil
          </NavLink>
          {user?.role === 'admin' && (
            <>
              <NavLink
                to="/admin/usuarios"
                className={({ isActive }) =>
                  `${baseLink} ${isActive ? activeLink : 'text-slate-700'}`
                }
              >
                Usuarios
              </NavLink>
              <NavLink
                to="/admin/solicitudes"
                className={({ isActive }) =>
                  `${baseLink} ${isActive ? activeLink : 'text-slate-700'}`
                }
              >
                Solicitudes
              </NavLink>
              <NavLink
                to="/admin/incidentes"
                className={({ isActive }) =>
                  `${baseLink} ${isActive ? activeLink : 'text-slate-700'}`
                }
              >
                Incidentes
              </NavLink>
            </>
          )}
          {user?.role === 'moderador' && (
            <>
              <NavLink
                to="/admin/solicitudes"
                className={({ isActive }) =>
                  `${baseLink} ${isActive ? activeLink : 'text-slate-700'}`
                }
              >
                Solicitudes
              </NavLink>
              <NavLink
                to="/admin/incidentes"
                className={({ isActive }) =>
                  `${baseLink} ${isActive ? activeLink : 'text-slate-700'}`
                }
              >
                Incidentes
              </NavLink>
            </>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {user && (
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-slate-900">
                {user.firstName} {user.lastName}
              </p>
              <div className="flex items-center justify-end gap-1">
                <RoleBadge role={user.role} />
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </header>
  );
}
