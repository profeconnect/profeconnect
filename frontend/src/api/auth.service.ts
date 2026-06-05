import { apiClient } from './client';
import type {
  ApiResponse,
  LoginPayload,
  LoginResponse,
  MeResponse,
  RegisterRequestPayload,
  RegistrationRequest,
} from '../types';

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const response = await apiClient.post<ApiResponse<LoginResponse>>(
    '/auth/login',
    payload
  );
  return response.data.data;
}

export async function registerRequest(
  payload: RegisterRequestPayload
): Promise<RegistrationRequest> {
  const formData = new FormData();
  formData.append('institutionalEmail', payload.institutionalEmail);
  formData.append('password', payload.password);
  formData.append('firstName', payload.firstName);
  formData.append('lastName', payload.lastName);
  formData.append('cedulaPhoto', payload.cedulaPhoto);
  if (payload.area) formData.append('area', payload.area);
  if (payload.description) formData.append('description', payload.description);

  const response = await apiClient.post<ApiResponse<RegistrationRequest>>(
    '/auth/register-request',
    formData
  );
  return response.data.data;
}

export async function fetchMe(): Promise<MeResponse> {
  const response = await apiClient.get<ApiResponse<MeResponse>>('/auth/me');
  return response.data.data;
}
