import { apiClient } from './client';
import type {
  AdminUser,
  ApiResponse,
  RegistrationRequest,
  RegistrationRequestStatus,
  UserStatus,
} from '../types';

export async function getUsers(): Promise<AdminUser[]> {
  const response = await apiClient.get<ApiResponse<AdminUser[]>>(
    '/admin/users'
  );
  return response.data.data;
}

export async function updateUserStatus(
  userId: number,
  status: UserStatus
): Promise<AdminUser> {
  const response = await apiClient.patch<ApiResponse<AdminUser>>(
    `/admin/users/${userId}/status`,
    { status }
  );
  return response.data.data;
}

export async function getRegistrationRequests(
  status?: RegistrationRequestStatus
): Promise<RegistrationRequest[]> {
  const response = await apiClient.get<ApiResponse<RegistrationRequest[]>>(
    '/admin/registration-requests',
    {
      params: status ? { status } : undefined,
    }
  );
  return response.data.data;
}

export async function approveRegistrationRequest(requestId: number) {
  const response = await apiClient.patch<ApiResponse<unknown>>(
    `/admin/registration-requests/${requestId}/approve`
  );
  return response.data;
}

export async function rejectRegistrationRequest(
  requestId: number,
  reviewComment?: string
) {
  const response = await apiClient.patch<ApiResponse<unknown>>(
    `/admin/registration-requests/${requestId}/reject`,
    { reviewComment }
  );
  return response.data;
}

export async function openRegistrationRequestCedulaPhoto(
  requestId: number
): Promise<void> {
  const response = await apiClient.get(
    `/admin/registration-requests/${requestId}/cedula-photo`,
    { responseType: 'blob' }
  );

  const mimeType =
    (response.headers['content-type'] as string | undefined) ||
    'application/octet-stream';
  const url = window.URL.createObjectURL(
    new Blob([response.data], { type: mimeType })
  );
  window.open(url, '_blank', 'noopener,noreferrer');
  window.setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
}

export async function openUserCedulaPhoto(userId: number): Promise<void> {
  const response = await apiClient.get(
    `/admin/users/${userId}/cedula-photo`,
    { responseType: 'blob' }
  );

  const mimeType =
    (response.headers['content-type'] as string | undefined) ||
    'application/octet-stream';
  const url = window.URL.createObjectURL(
    new Blob([response.data], { type: mimeType })
  );
  window.open(url, '_blank', 'noopener,noreferrer');
  window.setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
}
