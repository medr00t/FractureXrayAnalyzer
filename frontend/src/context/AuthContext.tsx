import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { AuthState, LoginCredentials, RegisterCredentials, User } from '../types';
import * as authApi from '../api/auth';
import { isTokenValid } from '../utils/jwt';

// Define the shape of the context
interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Action types
type AuthAction = 
  | { type: 'LOGIN_REQUEST' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'REGISTER_REQUEST' }
  | { type: 'REGISTER_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'REGISTER_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'RESTORE_AUTH'; payload: { user: User | null; token: string | null } };

// Initial state
const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: true,
  error: null
};

// Reducer function
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_REQUEST':
    case 'REGISTER_REQUEST':
      return {
        ...state,
        loading: true,
        error: null
      };
    case 'LOGIN_SUCCESS':
    case 'REGISTER_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
        error: null
      };
    case 'LOGIN_FAILURE':
    case 'REGISTER_FAILURE':
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    case 'LOGOUT':
      return {
        ...initialState,
        loading: false
      };
    case 'RESTORE_AUTH':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: !!action.payload.user && !!action.payload.token,
        loading: false
      };
    default:
      return state;
  }
};

// Token refresh interval (5 minutes)
const TOKEN_REFRESH_INTERVAL = 5 * 60 * 1000;

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing auth on mount and validate token
  useEffect(() => {
    const { user, token } = authApi.getCurrentAuth();
    
    if (token && !isTokenValid(token)) {
      // Token is invalid or expired, log out
      logout();
      return;
    }
    
    dispatch({ type: 'RESTORE_AUTH', payload: { user, token } });
  }, []);

  // Set up token refresh interval
  useEffect(() => {
    if (!state.isAuthenticated) return;

    const refreshToken = async () => {
      try {
        const response = await authApi.refreshToken();
        if (response.data?.token) {
          dispatch({ 
            type: 'LOGIN_SUCCESS', 
            payload: { 
              user: state.user!, 
              token: response.data.token 
            } 
          });
        } else {
          logout();
        }
      } catch (error) {
        console.error('Error refreshing token:', error);
        logout();
      }
    };

    const intervalId = setInterval(refreshToken, TOKEN_REFRESH_INTERVAL);

    return () => clearInterval(intervalId);
  }, [state.isAuthenticated]);

  // Login function
  const login = async (credentials: LoginCredentials) => {
    dispatch({ type: 'LOGIN_REQUEST' });
    const response = await authApi.login(credentials);
    
    if (response.error || !response.data) {
      dispatch({ type: 'LOGIN_FAILURE', payload: response.error || 'Unknown error' });
      return;
    }
    
    dispatch({ type: 'LOGIN_SUCCESS', payload: response.data });
  };

  // Register function
  const register = async (credentials: RegisterCredentials) => {
    dispatch({ type: 'REGISTER_REQUEST' });
    const response = await authApi.register(credentials);
    
    if (response.error || !response.data) {
      dispatch({ type: 'REGISTER_FAILURE', payload: response.error || 'Unknown error' });
      return;
    }
    
    dispatch({ type: 'REGISTER_SUCCESS', payload: response.data });
  };

  // Logout function
  const logout = () => {
    authApi.logout();
    dispatch({ type: 'LOGOUT' });
  };

  const value = {
    ...state,
    login,
    register,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook for using the auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};