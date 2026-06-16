import { Link } from 'react-router-dom';
import heroImage from '../assets/hero.png';

// Importamos los logos
import logoFya from '../assets/logo-fya.png';
import logoPuce from '../assets/logo-puce.png';

export default function LandingPage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-white">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden="true"
      >
        <div className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-red-100/50 blur-3xl" />
        <div className="absolute -right-24 top-1/3 h-80 w-80 rounded-full bg-red-200/40 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-red-50/80 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-white to-red-50/50" />
      </div>

      <header className="sticky top-0 z-20 border-b border-red-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 transition hover:text-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            {/* Reemplazamos el cuadro con la letra "P" por el logo oficial */}
            <img 
              src={logoFya} 
              alt="Logo Fe y Alegría" 
              className="h-9 w-auto object-contain" 
            />
            ProfeConnect
          </Link>
          <nav
            className="flex items-center gap-2 sm:gap-6"
            aria-label="Acciones de cuenta"
          >
            <Link
              to="/login"
              className="rounded-lg px-4 py-3 text-base font-medium text-slate-700 transition hover:text-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            >
              Iniciar Sesión
            </Link>
            <Link
              to="/register"
              className="rounded-full bg-brand-600 px-5 py-3 text-base font-semibold text-white shadow-md transition hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 sm:px-6"
            >
              Registrarse
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex flex-1 items-center px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-12 md:grid-cols-2 md:gap-16 lg:gap-20">
          <div className="order-2 text-center md:order-1 md:text-left">
            <span className="mb-4 inline-block rounded-full bg-brand-50 px-4 py-1.5 text-base font-medium text-brand-700">
              Red pedagógica · Fe y Alegría
            </span>

            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-5xl">
              Construye una{' '}
              <span className="bg-gradient-to-r from-brand-600 to-brand-800 bg-clip-text text-transparent">
                comunidad pedagógica segura
              </span>{' '}
              para docentes que inspiran
            </h1>

            <p className="mt-6 text-lg leading-relaxed text-slate-600 md:text-xl">
              Nuestra misión es crear una comunidad pedagógica segura para
              profesores, desde educación primaria hasta áreas educativas
              universarias, donde puedan compartir contenido, consejos,
              frustraciones e ideas.
            </p>

            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row md:justify-start">
              <Link
                to="/register"
                className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-brand-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:bg-brand-700 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
              >
                Únete a la comunidad
              </Link>
              <Link
                to="/login"
                className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-slate-300 bg-white px-8 py-3.5 text-base font-medium text-slate-700 shadow-sm transition hover:border-brand-300 hover:text-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
              >
                Ya tengo cuenta
              </Link>
            </div>

            <ul
              className="mt-10 flex flex-wrap justify-center gap-3 md:justify-start"
              aria-label="Beneficios de la plataforma"
            >
              {[
                'Espacio seguro para docentes',
                'Primaria a universidad',
                'Comparte ideas y experiencias',
              ].map((item) => (
                <li
                  key={item}
                  className="rounded-xl border border-red-100 bg-white/80 px-4 py-2 text-base font-medium text-slate-700 shadow-sm backdrop-blur-sm"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="order-1 flex justify-center md:order-2 md:justify-end">
            <div className="relative w-full max-w-lg">
              <div
                className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-brand-400/20 via-red-300/20 to-red-100/30 blur-sm"
                aria-hidden="true"
              />
              <div className="relative rotate-1 rounded-3xl border border-white/60 bg-white/40 p-3 shadow-2xl backdrop-blur-sm transition duration-500 hover:rotate-0">
                <img
                  src={heroImage}
                  alt="Docentes colaborando en un entorno pedagógico acogedor y moderno"
                  className="w-full rounded-2xl object-cover shadow-lg"
                  width={640}
                  height={480}
                  loading="eager"
                  fetchPriority="high"
                />
              </div>
              <div
                className="absolute -bottom-4 -left-4 hidden rounded-2xl border border-red-100 bg-white px-4 py-3 shadow-lg sm:block"
                aria-hidden="true"
              >
                <p className="text-base font-semibold text-slate-900">
                  + docentes conectados
                </p>
                <p className="text-base text-slate-600">
                  Comparte, aprende y crece
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Nuevo Footer con Créditos y Logos */}
      <footer className="mt-auto border-t border-red-100 bg-gray-50/80 py-10 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center text-center">
            
            {/* Contenedor de logos institucionales */}
            <div className="mb-6 flex items-center justify-center gap-8 sm:gap-12">
              <img 
                src={logoFya} 
                alt="Fe y Alegría Ecuador" 
                className="h-14 w-auto object-contain opacity-80 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0 sm:h-16" 
              />
              <div className="h-12 border-l border-gray-300" aria-hidden="true"></div>
              <img 
                src={logoPuce} 
                alt="Pontificia Universidad Católica del Ecuador" 
                className="h-14 w-auto object-contain opacity-80 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0 sm:h-16" 
              />
            </div>
            
            {/* Texto de créditos */}
            <div className="mb-6 max-w-2xl">
              <p className="text-sm leading-relaxed text-slate-600">
                ProfeConnect es una plataforma desarrollada para fortalecer la comunidad educativa. 
                Un agradecimiento especial a la <strong>Pontificia Universidad Católica del Ecuador</strong> y a <strong>Fe y Alegría</strong> por su apoyo fundamental en este proyecto.
              </p>
            </div>
            
            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()} ProfeConnect — Comunidad pedagógica para docentes
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}