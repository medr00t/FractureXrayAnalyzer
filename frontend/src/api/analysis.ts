import { Analysis, ApiResponse, FractureAnnotation } from '../types';

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
    recoveryTimeWeeks: 6,
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

// Upload and analyze an X-ray image
export const uploadAndAnalyzeImage = async (
  file: File, 
  userId: string,
  patientInfo?: { patientId?: string; patientName?: string; notes?: string }
): Promise<ApiResponse<Analysis>> => {
  try {
    // Create a file reader to get a data URL for preview
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        // Here you would normally send the image to your API
        // const formData = new FormData();
        // formData.append('image', file);
        // const response = await fetch('YOUR_API_ENDPOINT', {
        //   method: 'POST',
        //   body: formData
        // });
        
        // Simulate API response delay
        await delay(2000);
        
        // Mock API response
        const confidence = 0.94;
        const newAnalysis: Analysis = {
          id: `${Date.now()}`,
          userId,
          patientId: patientInfo?.patientId || undefined,
          patientName: patientInfo?.patientName || undefined,
          imageUrl: reader.result as string,
          annotatedImageUrl: reader.result as string,
          originalFilename: file.name,
          uploadDate: new Date().toISOString(),
          processedDate: new Date().toISOString(),
          fractureType: 'Distal radius fracture',
          fractureLocation: 'Right wrist',
          recoveryTimeWeeks: 6,
          confidence,
          notes: patientInfo?.notes || 'Clean break, good alignment',
          suspectedFracture: false
        };
        
        // Mock annotation
        MOCK_ANNOTATIONS[newAnalysis.id] = [{
          id: `a${Date.now()}`,
          x: 120,
          y: 150,
          width: 60,
          height: 40,
          fractureType: newAnalysis.fractureType!,
          confidence: newAnalysis.confidence
        }];
        
        // Add to mock data
        MOCK_ANALYSES.push(newAnalysis);
        
        resolve({
          data: newAnalysis,
          error: null,
          status: 201
        });
      };
      
      reader.onerror = () => {
        resolve({
          data: null,
          error: 'Failed to read file',
          status: 400
        });
      };
      
      reader.readAsDataURL(file);
    });
  } catch (error) {
    return {
      data: null,
      error: 'Failed to upload and analyze image',
      status: 500
    };
  }
};