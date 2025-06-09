import { LoginCredentials, RegisterCredentials, ApiResponse, User } from '../types';
import { isTokenValid, getUserDataFromToken } from '../utils/jwt';

// Mock storage for JWT token
const TOKEN_KEY = 'radiofracture_auth_token';

// Mock user data for demonstration
const MOCK_USERS = [
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
export const login = async (credentials: LoginCredentials): Promise<ApiResponse<{ user: User; token: string }>> => {
  try {
    // Simulate API call
    await delay(1000);
    
    const user = MOCK_USERS.find(u => u.email === credentials.email);
    
    if (!user || user.password !== credentials.password) {
      return {
        data: null,
        error: 'Invalid email or password',
        status: 401
      };
    }
    
    // Create a user object without the password
    const { password, ...userWithoutPassword } = user;
    const token = generateToken(userWithoutPassword as User);
    
    // Save token to local storage
    localStorage.setItem(TOKEN_KEY, token);
    
    return {
      data: {
        user: userWithoutPassword as User,
        token
      },
      error: null,
      status: 200
    };
  } catch (error) {
    return {
      data: null,
      error: 'An error occurred during login',
      status: 500
    };
  }
};

// Register API
export const register = async (credentials: RegisterCredentials): Promise<ApiResponse<{ user: User; token: string }>> => {
  try {
    // Simulate API call
    await delay(1500);
    
    // Check if user already exists
    if (MOCK_USERS.some(u => u.email === credentials.email)) {
      return {
        data: null,
        error: 'User with this email already exists',
        status: 409
      };
    }
    
    // Create new user
    const newUser = {
      id: `${MOCK_USERS.length + 1}`,
      email: credentials.email,
      password: credentials.password,
      name: credentials.name,
      role: credentials.role,
      specialty: credentials.specialty || '',
      hospital: credentials.hospital || ''
    };
    
    // Create a user object without the password
    const { password, ...userWithoutPassword } = newUser;
    const token = generateToken(userWithoutPassword as User);
    
    // Save token to local storage
    localStorage.setItem(TOKEN_KEY, token);
    
    return {
      data: {
        user: userWithoutPassword as User,
        token
      },
      error: null,
      status: 201
    };
  } catch (error) {
    return {
      data: null,
      error: 'An error occurred during registration',
      status: 500
    };
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
};

// Get current auth state
export const getCurrentAuth = (): { user: User | null; token: string | null } => {
  const token = localStorage.getItem(TOKEN_KEY);
  
  if (!token || !isTokenValid(token)) {
    return { user: null, token: null };
  }
  
  const userData = getUserDataFromToken(token);
  if (!userData) {
    return { user: null, token: null };
  }
  
  const user = MOCK_USERS.find(u => u.id === userData.sub);
  if (!user) {
    return { user: null, token: null };
  }
  
  const { password, ...userWithoutPassword } = user;
  
  return {
    user: userWithoutPassword as User,
    token
  };
};