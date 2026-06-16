import { apiClient } from './client';
import type { ApiResponse, PlatformReviewListResponse } from '../types';

export interface CreatePlatformReviewPayload {
  rating: number;
  comment?: string;
}

export async function createPlatformReview(
  payload: CreatePlatformReviewPayload
): Promise<void> {
  await apiClient.post<ApiResponse<unknown>>('/reviews', payload);
}

export async function getPlatformReviews(
  startDate?: string,
  endDate?: string
): Promise<PlatformReviewListResponse> {
  // Construimos los parámetros de la URL de forma limpia y segura
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  
  const queryString = params.toString() ? `?${params.toString()}` : '';

  const response = await apiClient.get<ApiResponse<PlatformReviewListResponse>>(
    `/admin/reviews${queryString}`
  );
  return response.data.data;
}