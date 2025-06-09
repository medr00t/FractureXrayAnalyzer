import { jwtDecode } from 'jwt-decode';

interface JWTPayload {
  exp: number;
  iat: number;
  sub: string;
  email: string;
  role: string;
}

export const isTokenValid = (token: string | null): boolean => {
  if (!token || token.split('.').length !== 3) {
    return false;
  }

  try {
    const decoded = jwtDecode<JWTPayload>(token);
    const currentTime = Date.now() / 1000;

    // Check if token is expired
    if (decoded.exp < currentTime) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error decoding token:', error);
    return false;
  }
};

export const getTokenExpirationTime = (token: string): number | null => {
  if (!token || token.split('.').length !== 3) {
    return null;
  }

  try {
    const decoded = jwtDecode<JWTPayload>(token);
    return decoded.exp;
  } catch {
    return null;
  }
};

export const getUserDataFromToken = (token: string): Partial<JWTPayload> | null => {
  if (!token || token.split('.').length !== 3) {
    return null;
  }

  try {
    const decoded = jwtDecode<JWTPayload>(token);
    return {
      sub: decoded.sub,
      email: decoded.email,
      role: decoded.role
    };
  } catch {
    return null;
  }
};