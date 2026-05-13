export type Role = 'admin' | 'docente' | 'moderador';

export type UserStatus = 'ACTIVO' | 'INACTIVO' | 'PENDIENTE' | 'BLOQUEADO';

export type RegistrationRequestStatus = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';

export interface TeacherProfile {
  id: number;
  userId: number;
  area: string | null;
  description: string | null;
  photoUrl: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthUser {
  id: number;
  institutionalEmail: string;
  firstName: string;
  lastName: string;
  role: Role;
  status: UserStatus;
}

export interface MeResponse {
  id: number;
  institutionalEmail: string;
  firstName: string;
  lastName: string;
  status: UserStatus;
  role: Role;
  profile: TeacherProfile | null;
}

export interface AdminUser {
  id: number;
  institutionalEmail: string;
  firstName: string;
  lastName: string;
  status: UserStatus;
  role: Role;
  profile: TeacherProfile | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RegistrationRequest {
  id: number;
  institutionalEmail: string;
  firstName: string;
  lastName: string;
  area: string | null;
  description: string | null;
  status: RegistrationRequestStatus;
  reviewComment: string | null;
  reviewedAt: string | null;
  reviewedBy: {
    id: number;
    firstName: string;
    lastName: string;
    institutionalEmail: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface LoginPayload {
  institutionalEmail: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface RegisterRequestPayload {
  institutionalEmail: string;
  password: string;
  firstName: string;
  lastName: string;
  area?: string;
  description?: string;
}

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  area?: string;
  description?: string;
  photoUrl?: string;
}

export interface PublicationAuthor {
  id: number | null;
  firstName: string;
  lastName: string;
  institutionalEmail: string | null;
  role: string | null;
}

export interface Attachment {
  id: number;
  url: string;
  fileType?: string;
  filename?: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
}

export interface Publication {
  id: number;
  title: string;
  content: string;
  isAnonymous: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
  author: PublicationAuthor;
  tags: any[];
  attachments?: Attachment[];
}

export interface CreatePublicationPayload {
  title: string;
  content: string;
  isAnonymous: boolean;
  tags: number[];
}

export interface ApiResponse<T> {
  message: string;
  data: T;
}
