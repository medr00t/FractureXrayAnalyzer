import { Analysis, ApiResponse, FractureAnnotation, User, Report } from '../types';

// Helper to simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock data for analyses
const MOCK_ANALYSES: Analysis[] = [
  {
    id: '1',
    userId: '1',
    patientId: 'P12345',
    patientName: 'Alex Johnson',
    imageUrl: 'https://images.pexels.com/photos/4226901/pexels-photo-4226901.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    annotatedImageUrl: 'https://images.pexels.com/photos/4226901/pexels-photo-4226901.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    originalFilename: 'wrist_xray.jpg',
    uploadDate: '2025-01-15T09:30:00Z',
    processedDate: '2025-01-15T09:32:10Z',
    fractureType: 'Distal radius fracture',
    fractureLocation: 'Right wrist',
    recoveryTimeDays: 42,
    confidence: 0.94,
    notes: 'Clean break, good alignment',
    suspectedFracture: false
  }
];

// Mock annotations for fractures
const MOCK_ANNOTATIONS: Record<string, FractureAnnotation[]> = {
  '1': [
    {
      id: 'a1',
      x: 120,
      y: 150,
      width: 60,
      height: 40,
      fractureType: 'Distal radius fracture',
      confidence: 0.94
    }
  ]
};

// Get all analyses for a user
export const getUserAnalyses = async (userId: string): Promise<ApiResponse<Analysis[]>> => {
  try {
    await delay(800);
    const analyses = MOCK_ANALYSES.filter(analysis => analysis.userId === userId);
    return {
      data: analyses,
      error: null,
      status: 200
    };
  } catch (error) {
    return {
      data: null,
      error: 'Failed to fetch analyses',
      status: 500
    };
  }
};

// Get a single analysis by ID
export const getAnalysisById = async (id: string): Promise<ApiResponse<Analysis>> => {
  try {
    await delay(600);
    const analysis = MOCK_ANALYSES.find(a => a.id === id);
    
    if (!analysis) {
      return {
        data: null,
        error: 'Analysis not found',
        status: 404
      };
    }
    
    return {
      data: analysis,
      error: null,
      status: 200
    };
  } catch (error) {
    return {
      data: null,
      error: 'Failed to fetch analysis',
      status: 500
    };
  }
};

// Get annotations for an analysis
export const getAnnotations = async (analysisId: string): Promise<ApiResponse<FractureAnnotation[]>> => {
  try {
    await delay(500);
    const annotations = MOCK_ANNOTATIONS[analysisId] || [];
    return {
      data: annotations,
      error: null,
      status: 200
    };
  } catch (error) {
    return {
      data: null,
      error: 'Failed to fetch annotations',
      status: 500
    };
  }
};

// Get all patients for the logged-in doctor
export const getPatients = async (token: string): Promise<ApiResponse<User[]>> => {
  try {
    const response = await fetch('http://localhost:3000/api/patients', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) {
      const errorData = await response.json();
      return { data: null, error: errorData.error || 'Failed to fetch patients', status: response.status };
    }
    const data = await response.json();
    return { data, error: null, status: 200 };
  } catch (error) {
    return { data: null, error: 'An unexpected error occurred', status: 500 };
  }
};

// Create a new report by uploading an image and patient data
export const createReport = async (formData: FormData, token: string): Promise<ApiResponse<{ analysis: Analysis; report: Report }>> => {
  try {
    const response = await fetch('http://localhost:3000/api/reports/create', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) {
      return { data: null, error: data.error || 'Failed to create report', status: response.status };
    }
    return { data, error: null, status: response.status };
  } catch (error) {
    return { data: null, error: 'An unexpected error occurred during report creation', status: 500 };
  }
};