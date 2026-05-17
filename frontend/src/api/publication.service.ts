import { apiClient } from './client';
import type {
  ApiResponse,
  Publication,
  Comment,
} from '../types';

export async function getPublications(tagIds?: number[]): Promise<Publication[]> {
  const params: Record<string, string> = {};
  if (tagIds && tagIds.length > 0) {
    params.tagIds = tagIds.join(',');
  }
  const response = await apiClient.get<ApiResponse<Publication[]>>('/publications', { params });
  return response.data.data;
}

export async function createPublication(
  payload: FormData
): Promise<Publication> {
  const response = await apiClient.post<ApiResponse<Publication>>(
    '/publications',
    payload
  );
  return response.data.data;
}

export async function updatePublication(
  id: number,
  payload: Partial<Publication>
): Promise<Publication> {
  const response = await apiClient.put<ApiResponse<Publication>>(
    `/publications/${id}`,
    payload
  );
  return response.data.data;
}

export async function deletePublication(id: number): Promise<void> {
  await apiClient.delete(`/publications/${id}`);
}

export async function addComment(
  postId: number,
  content: string
): Promise<Comment> {
  const response = await apiClient.post<ApiResponse<Comment>>(
    `/publications/${postId}/comments`,
    { content }
  );
  return response.data.data;
}

export async function deleteComment(commentId: number): Promise<void> {
  await apiClient.delete(`/comments/${commentId}`);
}
