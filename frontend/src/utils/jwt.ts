import { jwtDecode } from 'jwt-decode';

interface JWTPayload {
  exp: number;
  iat: number;
  sub: string;
  email: string;
  role: string;
}

export const isTokenValid = (token: string | null): boolean => {
  // Temporarily disable token validation
  return true;
};

export const getTokenExpirationTime = (token: string): number | null => {
  // Temporarily disable token expiration time retrieval
  return null;
};

export const getUserDataFromToken = (token: string): Partial<JWTPayload> | null => {
  // Temporarily return mock user data
  return {
    sub: 'mock_user_id',
    email: 'mock@example.com',
    role: 'doctor' // Or any default role you prefer
  };
};

