import { apiClient } from './client';
import type { ApiResponse, Publication, PublicationAuthor } from '../types';

export interface ReportedPostAuthor extends PublicationAuthor {
  hasCedulaPhoto: boolean;
  cedulaPhotoName: string | null;
}

export interface ReportedPost extends Omit<Publication, 'author'> {
  author: ReportedPostAuthor;
  reportCount: number;
}

export async function getReportedPosts(): Promise<ReportedPost[]> {
  const response = await apiClient.get<ApiResponse<ReportedPost[]>>('/reports/posts');
  return response.data.data;
}

export async function createReport(postId: number): Promise<void> {
  await apiClient.post<ApiResponse<any>>(`/reports/${postId}`);
}

export async function deleteReports(postId: number): Promise<void> {
  await apiClient.delete<ApiResponse<any>>(`/reports/${postId}`);
}