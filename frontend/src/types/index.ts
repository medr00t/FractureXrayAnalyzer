export interface User {
  id: string;
  email: string;
  name: string;
  role: 'radiologist' | 'doctor' | 'admin';
  specialty?: string;
  hospital?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface Analysis {
  id: string;
  userId: string;
  patientId?: string;
  patientName?: string;
  imageUrl: string;
  annotatedImageUrl: string;
  originalFilename: string;
  uploadDate: string;
  processedDate: string;
  fractureType: string | null;
  fractureLocation: string | null;
  recoveryTimeWeeks: number | null;
  confidence: number;
  notes: string;
  suspectedFracture: boolean;
  annotations?: FractureAnnotation[];
}

export interface FractureAnnotation {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fractureType: string;
  confidence: number;
  corrected?: boolean;
  originalCoordinates?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface UploadState {
  loading: boolean;
  progress: number;
  error: string | null;
  preview: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  name: string;
  role: 'radiologist' | 'doctor';
  specialty?: string;
  hospital?: string;
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}