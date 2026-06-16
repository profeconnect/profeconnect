import { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { RoleBadge } from './Badge';
import type { Role } from '../types';

// Importamos el nuevo logo
import logoFya from '../assets/logo-fya.png';

const MAIN_LINKS = [
  { to: '/dashboard', label: 'Inicio', end: true },
  { to: '/feed', label: 'Publicaciones', end: false },
  { to: '/chatbot', label: 'Chatbot', end: false },
] as const;

const ADMIN_MANAGEMENT_LINKS = [
  { to: '/admin/usuarios', label: 'Usuarios' },
  { to: '/admin/solicitudes', label: 'Solicitudes' },
  { to: '/admin/incidentes', label: 'Incidentes' },
  { to: '/admin/reviews', label: 'Reseñas' },
] as const;

const MODERATOR_MANAGEMENT_LINKS = [
  { to: '/admin/solicitudes', label: 'Solicitudes' },
  { to: '/admin/incidentes', label: 'Incidentes' },
] as const;

function getManagementLinks(role: Role | undefined) {
  if (role === 'admin') {
    return ADMIN_MANAGEMENT_LINKS;
  }
  if (role === 'moderador') {
    return MODERATOR_MANAGEMENT_LINKS;
  }
  return [];
}

function navLinkClass(isActive: boolean, mobile = false) {
  const base = mobile
    ? 'block rounded-lg px-4 py-3 text-base font-medium transition'
    : 'rounded-lg px-3 py-2 text-sm font-medium transition';

  if (isActive) {
    return `${base} text-brand-600 underline decoration-2 underline-offset-4 decoration-brand-600`;
  }

  return `${base} text-slate-700 hover:bg-red-50 hover:text-brand-600`;
}

function UserAvatar({
  firstName,
  lastName,
  photoUrl,
  size = 'md',
}: {
  firstName: string;
  lastName: string;
  photoUrl?: string | null;
  size?: 'sm' | 'md';
}) {
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  const sizeClass = size === 'sm' ? 'h-9 w-9 text-sm' : 'h-10 w-10 text-base';

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={`${firstName} ${lastName}`}
        className={`${sizeClass} rounded-full object-cover ring-2 ring-red-100`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} flex items-center justify-center rounded-full bg-brand-600 font-semibold text-white ring-2 ring-red-100`}
      aria-hidden
    >
      {initials}
    </div>
  );
}

export default function Navbar() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  const managementLinks = getManagementLinks(user?.role);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    }

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [userMenuOpen]);

  return (
    <header className="sticky top-0 z-30 border-b border-red-100 bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <NavLink
            to="/dashboard"
            className="flex shrink-0 items-center gap-2"
            onClick={closeMenu}
          >
            {/* Aquí reemplazamos el div con la "P" por el nuevo logo */}
            <img 
              src={logoFya} 
              alt="Logo Fe y Alegría" 
              className="h-8 w-auto object-contain" 
            />
            <span className="text-lg font-semibold text-slate-900">
              ProfeConnect
            </span>
          </NavLink>

          <nav
            className="hidden items-center gap-1 md:flex"
            aria-label="Navegación principal"
          >
            {MAIN_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) => navLinkClass(isActive)}
              >
                {link.label}
              </NavLink>
            ))}
            {managementLinks.length > 0 && (
              <span
                className="mx-1 hidden h-5 w-px bg-red-100 lg:inline-block"
                aria-hidden
              />
            )}
            {managementLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => navLinkClass(isActive)}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {user && (
              <div className="relative hidden md:block" ref={userMenuRef}>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full p-1 transition hover:bg-red-50"
                  aria-expanded={userMenuOpen}
                  aria-haspopup="menu"
                  aria-label="Menú de usuario"
                  onClick={() => setUserMenuOpen((prev) => !prev)}
                >
                  <UserAvatar
                    firstName={user.firstName}
                    lastName={user.lastName}
                    photoUrl={profile?.profile?.photoUrl}
                    size="sm"
                  />
                </button>

                {userMenuOpen && (
                  <div
                    className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-red-100 bg-white py-2 shadow-lg ring-1 ring-black/5"
                    role="menu"
                  >
                    <div className="border-b border-red-50 px-4 py-3">
                      <p className="text-sm font-medium text-slate-900">
                        {user.firstName} {user.lastName}
                      </p>
                      <div className="mt-1">
                        <RoleBadge role={user.role} />
                      </div>
                    </div>

                    <NavLink
                      to="/perfil"
                      role="menuitem"
                      onClick={() => setUserMenuOpen(false)}
                      className={({ isActive }) =>
                        `block px-4 py-2.5 text-sm transition hover:bg-red-50 ${
                          isActive ? 'font-medium text-brand-600' : 'text-slate-700'
                        }`
                      }
                    >
                      Mi perfil
                    </NavLink>

                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setUserMenuOpen(false);
                        handleLogout();
                      }}
                      className="block w-full px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-red-50"
                    >
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              className="inline-flex items-center justify-center rounded-lg p-2 text-slate-700 hover:bg-red-50 md:hidden"
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              {menuOpen ? (
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav
            id="mobile-nav"
            className="mt-3 border-t border-red-100 pt-3 md:hidden"
            aria-label="Navegación móvil"
          >
            <div className="flex flex-col gap-1">
              {MAIN_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  onClick={closeMenu}
                  className={({ isActive }) => navLinkClass(isActive, true)}
                >
                  {link.label}
                </NavLink>
              ))}

              {managementLinks.length > 0 && (
                <>
                  <div
                    className="mx-4 my-1 border-t border-red-100"
                    aria-hidden
                  />
                  <p className="px-4 py-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Gestión
                  </p>
                  {managementLinks.map((link) => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      onClick={closeMenu}
                      className={({ isActive }) => navLinkClass(isActive, true)}
                    >
                      {link.label}
                    </NavLink>
                  ))}
                </>
              )}

              <div className="mx-4 my-1 border-t border-red-100" aria-hidden />

              <NavLink
                to="/perfil"
                onClick={closeMenu}
                className={({ isActive }) => navLinkClass(isActive, true)}
              >
                Mi perfil
              </NavLink>

              {user && (
                <div className="mt-2 flex items-center gap-3 border-t border-red-100 px-4 py-3">
                  <UserAvatar
                    firstName={user.firstName}
                    lastName={user.lastName}
                    photoUrl={profile?.profile?.photoUrl}
                    size="sm"
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {user.firstName} {user.lastName}
                    </p>
                    <div className="mt-1">
                      <RoleBadge role={user.role} />
                    </div>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  closeMenu();
                  handleLogout();
                }}
                className="mt-2 rounded-lg border border-slate-300 px-4 py-3 text-left text-base font-medium text-slate-700 hover:bg-red-50"
              >
                Cerrar sesión
              </button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}