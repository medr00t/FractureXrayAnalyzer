import { LoginCredentials, RegisterCredentials, ApiResponse, User } from '../types';
import { isTokenValid, getUserDataFromToken } from '../utils/jwt';

// Mock storage for JWT token
const TOKEN_KEY = 'radiofracture_auth_token';
const USER_KEY = 'radiofracture_user'; // New key for storing user data

// Mock user data for demonstration
const MOCK_USERS = [
  {
    id: '1',
    email: 'doctor@example.com',
    password: '1',
    name: 'Dr. John Smith',
    role: 'doctor',
    specialty: 'Orthopedics',
    hospital: 'Central Hospital'
  },
  {
    id: '1',
    email: 'doctor@example.com',
    password: 'password123',
    name: 'Dr. John Smith',
    role: 'doctor',
    specialty: 'Orthopedics',
    hospital: 'Central Hospital'
  },
  {
    id: '2',
    email: 'radiologist@example.com',
    password: 'password123',
    name: 'Dr. Emily Johnson',
    role: 'radiologist',
    specialty: 'Diagnostic Radiology',
    hospital: 'Medical Center'
  }
];

// Helper to simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock JWT token generation
const generateToken = (user: Omit<User, 'password'>) => {
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = 60 * 60; // 1 hour
  
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    iat: now,
    exp: now + expiresIn
  };
  
  // In a real app, this would use a proper JWT library
  return btoa(JSON.stringify(payload));
};

// Login API
export const login = async (credentials: LoginCredentials): Promise<ApiResponse<{ token: string }>> => {
  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    const data = await response.json();
    if (!response.ok) {
      return { data: null, error: data.error || 'Login failed', status: response.status };
    }
    return { data, error: null, status: 200 };
  } catch (error) {
    return { data: null, error: 'An unexpected error occurred', status: 500 };
  }
};

// Register API
export const register = async (credentials: RegisterCredentials): Promise<ApiResponse<{ message: string }>> => {
  try {
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    const data = await response.json();
    if (!response.ok) {
      return { data: null, error: data.error || 'Registration failed', status: response.status };
    }
    return { data, error: null, status: 200 };
  } catch (error) {
    return { data: null, error: 'An unexpected error occurred', status: 500 };
  }
};

// Refresh token API
export const refreshToken = async (): Promise<ApiResponse<{ token: string }>> => {
  try {
    // Simulate API call
    await delay(500);
    
    const currentToken = localStorage.getItem(TOKEN_KEY);
    if (!currentToken) {
      return {
        data: null,
        error: 'No token found',
        status: 401
      };
    }
    
    const userData = getUserDataFromToken(currentToken);
    if (!userData) {
      return {
        data: null,
        error: 'Invalid token',
        status: 401
      };
    }
    
    // Generate new token
    const newToken = generateToken(userData as User);
    
    // Save new token
    localStorage.setItem(TOKEN_KEY, newToken);
    // No need to update user data here unless user data itself changes with token refresh
    
    return {
      data: { token: newToken },
      error: null,
      status: 200
    };
  } catch (error) {
    return {
      data: null,
      error: 'Failed to refresh token',
      status: 500
    };
  }
};

// Logout
export const logout = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY); // Remove user data on logout
};

// Get current auth state
export const getCurrentAuth = (): { user: User | null; token: string | null } => {
  const token = localStorage.getItem(TOKEN_KEY);
  const userJson = localStorage.getItem(USER_KEY); // Retrieve user data
  
  if (!token || !userJson || !isTokenValid(token)) {
    return { user: null, token: null };
  }
  
  try {
    const user: User = JSON.parse(userJson); // Parse user data
    // Optionally, you might want to re-validate user data against the token here
    // For now, we trust the stored user data if the token is valid
    
    return {
      user,
      token
    };
  } catch (error) {
    console.error('Error parsing user data from local storage:', error);
    return { user: null, token: null };
  }
};