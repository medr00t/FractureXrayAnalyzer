import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { AuthState, LoginCredentials, RegisterCredentials, User } from '../types';
import * as authApi from '../api/auth';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  userId: string;
  role: string;
  email: string;
  exp: number;
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; role?: string }>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthAction = 
  | { type: 'INIT'; payload: { user: User | null; token: string | null } }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'LOGOUT' };

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: true,
  error: null
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'INIT':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: !!action.payload.token,
        loading: false,
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        error: null,
      };
    case 'AUTH_FAILURE':
      return { ...state, error: action.payload };
    case 'LOGOUT':
      return { ...initialState, loading: false };
    default:
      return state;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    try {
      const token = localStorage.getItem('jwt');
      if (token) {
        const decodedToken = jwtDecode<DecodedToken>(token);
        if (decodedToken.exp * 1000 > Date.now()) {
          const user: User = { id: decodedToken.userId, email: decodedToken.email, role: decodedToken.role, fullName: '', createdAt: '' };
          dispatch({ type: 'INIT', payload: { user, token } });
        } else {
          localStorage.removeItem('jwt');
          dispatch({ type: 'INIT', payload: { user: null, token: null } });
        }
      } else {
        dispatch({ type: 'INIT', payload: { user: null, token: null } });
      }
    } catch (error) {
      dispatch({ type: 'INIT', payload: { user: null, token: null } });
    }
  }, []);

  const login = async (credentials: LoginCredentials): Promise<{ success: boolean; role?: string }> => {
    const response = await authApi.login(credentials);
    if (response.data?.token) {
      const token = response.data.token;
      const decodedToken = jwtDecode<DecodedToken>(token);
      const user: User = { id: decodedToken.userId, email: decodedToken.email, role: decodedToken.role, fullName: '', createdAt: '' };
      localStorage.setItem('jwt', token);
      dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });
      return { success: true, role: user.role };
    } else {
      dispatch({ type: 'AUTH_FAILURE', payload: response.error || 'Login failed' });
      return { success: false };
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    const response = await authApi.register(credentials);
    if (response.error) {
      dispatch({ type: 'AUTH_FAILURE', payload: response.error });
    }
    // After registration, the user still needs to log in.
    // Or you could automatically log them in by calling login() here.
  };

  const logout = () => {
    localStorage.removeItem('jwt');
    dispatch({ type: 'LOGOUT' });
  };

  const value = { ...state, login, register, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};