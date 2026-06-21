import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Button from '../components/Button';
import Spinner from '../components/Spinner';
import { extractErrorMessage } from '../api/client';
import { verifyEmail } from '../api/auth.service';
import { trackEvent } from '../lib/analytics';

type VerificationState = 'loading' | 'success' | 'error';

type VerificationResult = {
  state: VerificationState;
  message: string;
};

const verificationRequests = new Map<string, Promise<VerificationResult>>();

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<VerificationState>('loading');
  const [message, setMessage] = useState('Verificando correo institucional...');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setState('error');
      setMessage('El enlace de verificacion no contiene un token valido.');
      return;
    }

    let active = true;
    const verificationToken = token;
    const request =
      verificationRequests.get(verificationToken) ??
      verifyEmail(verificationToken)
        .then<VerificationResult>(() => {
          trackEvent('email_verification_success');
          return {
            state: 'success',
            message: 'Cuenta verificada exitosamente. Tu usuario docente ya esta activo.',
          };
        })
        .catch<VerificationResult>((error) => ({
          state: 'error',
          message: extractErrorMessage(
            error,
            'No se pudo verificar el correo institucional'
          ),
        }));

    if (!verificationRequests.has(verificationToken)) {
      verificationRequests.set(verificationToken, request);
    }

    request.then((result) => {
      if (!active) return;
      setState(result.state);
      setMessage(result.message);
    });

    return () => {
      active = false;
    };
  }, [searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-white to-slate-100 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl ring-1 ring-slate-200">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-xl font-bold text-white shadow-lg">
          A
        </div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Verificacion institucional
        </h1>
        <div className="mt-5">
          {state === 'loading' ? (
            <Spinner label={message} />
          ) : (
            <p
              className={`text-sm ${
                state === 'success' ? 'text-emerald-700' : 'text-red-700'
              }`}
            >
              {message}
            </p>
          )}
        </div>
        <div className="mt-6">
          <Link to="/login">
            <Button size="lg">
              Ir a iniciar sesion
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
