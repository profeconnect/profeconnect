import { Link } from 'react-router-dom';
import logoFya from '../assets/logo-fya.png';
import logoPuce from '../assets/logotipo-puce-80_png/logotipo-puce-80_color_horizontal.png';

const githubUrl = 'https://github.com/profeconnect/profeconnect';
const tutorialUrl =
  'https://drive.google.com/file/d/15GtNwIkP-7EqTF53aP9GD0J7B43AoxK3/view?usp=sharing';
const manualUrl =
  'https://drive.google.com/file/d/1K6xj2Btc6EGxUqZpBTfCTBls0QjH8g_a/view?usp=sharing';

export default function ProjectInfoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-white to-red-50/40">
      <header className="border-b border-red-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 transition hover:text-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            <img
              src={logoFya}
              alt="Logo Fe y Alegría"
              className="h-9 w-auto object-contain"
            />
            ProfeConnect
          </Link>
          <Link
            to="/"
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:text-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            Volver al inicio
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <section className="mb-10">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-brand-700">
            Créditos e información institucional
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
            Acerca de ProfeConnect
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-slate-600">
            ProfeConnect es una iniciativa académica orientada a fortalecer una
            comunidad pedagógica segura para docentes, con recursos,
            interacción y acompañamiento digital.
          </p>
        </section>

        <section className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
          <article className="space-y-5 rounded-2xl border border-red-100 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-base leading-8 text-slate-700">
              Este proyecto, denominado <strong>ProfeConnect</strong>, fue
              desarrollado por los estudiantes{' '}
              <strong>
                Angel Jhosue Fonseca Acosta, Francisco Javier Miguez Tapia,
                Gabirel Alejandro Vásconez Aveiga y Luis Alfredo Alobuela
                Carrillo
              </strong>
              , bajo la tutoría del Ing. Francisco Rodríguez, profesor tutor.
            </p>

            <p className="text-base leading-8 text-slate-700">
              El proyecto se realizó en el marco de la asignatura de{' '}
              <strong>Emprendimiento Tecnológico</strong>, con la metodología de{' '}
              <strong>Aprendizaje-Servicio</strong>, en la Pontificia
              Universidad Católica del Ecuador (PUCE).
            </p>

            <p className="text-base leading-8 text-slate-700">
              Agradecemos de manera especial a la Coordinación de
              Aprendizaje-Servicio de la PUCE por su acompañamiento; sin su
              apoyo no habría sido posible esta iniciativa innovadora dentro de
              la universidad. Extendemos también nuestro agradecimiento a la
              Unidad Educativa Fe y Alegría por las facilidades brindadas para
              el desarrollo de este proyecto.
            </p>

            <p className="text-base leading-8 text-slate-700">
              Agradecemos asimismo a la docente <strong>Deysi Sánchez</strong>,
              quien colaboró en la validación de este proyecto.
            </p>

            <p className="text-base leading-8 text-slate-700">
              Este proyecto se distribuye como software libre a través de
              GitHub, e incluye el manual de usuario y el video tutorial
              correspondientes, disponibles en los enlaces señalados en esta
              página.
            </p>
          </article>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-red-100 bg-white p-6 shadow-sm">
              <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
                Instituciones
              </p>
              <div className="space-y-6">
                <img
                  src={logoPuce}
                  alt="Pontificia Universidad Católica del Ecuador"
                  className="h-auto w-full object-contain"
                />
                <div className="border-t border-slate-100 pt-6">
                  <img
                    src={logoFya}
                    alt="Fe y Alegría"
                    className="mx-auto h-16 w-auto object-contain"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-red-100 bg-white p-6 shadow-sm">
              <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
                Recursos
              </p>
              <div className="space-y-3">
                <a
                  href={githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-h-[44px] items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:text-brand-700"
                >
                  Repositorio en GitHub
                </a>
                <a
                  href={tutorialUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-h-[44px] items-center justify-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
                >
                  Ver video tutorial
                </a>
                <a
                  href={manualUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-h-[44px] items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:text-brand-700"
                >
                  Ver manual de usuario
                </a>
              </div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
