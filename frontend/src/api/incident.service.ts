import { apiClient } from './client';
import type { ApiResponse, SecurityIncident } from '../types';

export async function getPendingIncidents(): Promise<SecurityIncident[]> {
  const response = await apiClient.get<ApiResponse<SecurityIncident[]>>('/admin/incidents');
  return response.data.data;
}

export async function resolveIncident(id: number): Promise<SecurityIncident> {
  const response = await apiClient.patch<ApiResponse<SecurityIncident>>(`/admin/incidents/${id}/resolve`);
  return response.data.data;
}

export async function downloadIncidentFile(id: number, fileName: string): Promise<void> {
  const response = await apiClient.get(`/admin/incidents/${id}/download`, {
    responseType: 'blob',
  });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  link.parentNode?.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export async function deletePublicationFromIncident(id: number): Promise<SecurityIncident> {
  const response = await apiClient.delete<ApiResponse<SecurityIncident>>(`/admin/incidents/${id}/publication`);
  return response.data.data;
}
