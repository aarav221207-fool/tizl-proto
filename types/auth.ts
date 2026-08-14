import { UserRole } from './database';

export interface AuthenticatedUser {
  id: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  fullName: string | null;
}

export interface AuthSession {
  user: AuthenticatedUser;
  accessToken: string;
}

export interface AuthState {
  user: AuthenticatedUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}
