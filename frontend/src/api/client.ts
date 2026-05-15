import axios, { AxiosError, type AxiosInstance } from 'axios';

export const TOKEN_STORAGE_KEY = 'amigojolive_token';

const envUrlRaw = (
  import.meta.env.VITE_API_URL as string | undefined
)?.trim();

const PRODUCTION_API_URL = 'https://amigojolive-production.up.railway.app/api/v1';

const baseURL =
  envUrlRaw && envUrlRaw.length > 0
    ? envUrlRaw
    : import.meta.env.DEV
      ? '/api/v1'
      : PRODUCTION_API_URL;

export function getPublicFilesBaseUrl(): string {
  if (envUrlRaw && envUrlRaw.length > 0) {
    return envUrlRaw.replace(/\/api\/v1\/?$/, '');
  }
  if (import.meta.env.DEV) {
    return '';
  }
  return PRODUCTION_API_URL.replace(/\/api\/v1\/?$/, '');
}

export const apiClient: AxiosInstance = axios.create({
  baseURL,
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const path = `${config.baseURL ?? ''}${config.url ?? ''}`;
  const isPublicAuth =
    path.includes('/auth/login') ||
    path.includes('/auth/register-request');

  config.headers = config.headers ?? {};

  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    if (typeof config.headers.setContentType === 'function') {
      config.headers.setContentType(undefined);
    }
    if (typeof config.headers.delete === 'function') {
      config.headers.delete('Content-Type');
    } else {
      delete (config.headers as Record<string, unknown>)['Content-Type'];
    }
  }

  if (isPublicAuth) {
    delete config.headers.Authorization;
    return config;
  }

  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let onUnauthorizedHandler: (() => void) | null = null;

export function registerUnauthorizedHandler(handler: () => void) {
  onUnauthorizedHandler = handler;
}

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      onUnauthorizedHandler?.();
    }
    return Promise.reject(error);
  }
);

export function extractErrorMessage(
  error: unknown,
  fallback = 'Error inesperado, intente nuevamente.'
): string {
  if (axios.isAxiosError(error)) {
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return 'El servidor tardó demasiado en responder. Compruebe que el backend esté en marcha y la conexión a la base de datos.';
    }
    if (!error.response) {
      return 'No hay conexión con el API. Verifique VITE_API_URL y que el backend esté ejecutándose en el puerto 3000.';
    }
    const data = error.response?.data as { message?: string } | undefined;
    if (data?.message) {
      const msg = data.message.trim();
      if (msg.includes('Invalid `prisma.') && msg.includes('invocation')) {
        return 'Error del servidor relacionado con la base de datos. Revise `backend/.env` y la conexion PostgreSQL configurada. Docker solo hace falta si quiere una base local.';
      }
      return msg;
    }
    if (error.message) return error.message;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}
