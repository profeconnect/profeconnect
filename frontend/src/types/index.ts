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
  hasCedulaPhoto: boolean;
  cedulaPhotoName: string | null;
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
  cedulaPhoto: File;
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

export type ReactionType = 'LIKE' | 'USEFUL' | 'LOVE';

export interface ReactionSummary {
  LIKE: number;
  USEFUL: number;
  LOVE: number;
  total: number;
}

export interface Attachment {
  id: number;
  url?: string | null;
  fileType?: string;
  filename?: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
  type?: "IMAGE" | "DOCUMENT" | string;
  isSuspicious?: boolean;
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
  comments?: Comment[];
  reactionSummary?: ReactionSummary;
  myReaction?: ReactionType | null;
}

export interface Comment {
  id: number;
  content: string;
  createdAt: string;
  author: PublicationAuthor;
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

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SecurityIncident {
  id: number;
  userId: number;
  fileName: string;
  attemptedMime: string;
  detectedMime: string;
  status: "PENDING" | "FALSE_ALARM" | "MALWARE_DELETED" | string;
  fileMetadata?: any;
  createdAt: string;
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    institutionalEmail: string;
  };
  postId?: number;
}
