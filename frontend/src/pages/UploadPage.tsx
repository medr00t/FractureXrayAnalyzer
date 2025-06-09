import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PageContainer from '../components/layout/PageContainer';
import ImageUploader from '../components/upload/ImageUploader';
import PatientInfoForm from '../components/upload/PatientInfoForm';
import { uploadAndAnalyzeImage } from '../api/analysis';
import { AlertCircle } from 'lucide-react';

const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageSelect = (file: File) => {
    setSelectedFile(file);
    setError(null);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreview(null);
    setError(null);
  };

  const handleSubmit = async (patientInfo: { patientId?: string; patientName?: string; notes?: string }) => {
    if (!selectedFile || !user) {
      setError('Please select an X-ray image first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await uploadAndAnalyzeImage(selectedFile, user.id, patientInfo);
      
      if (response.error || !response.data) {
        setError(response.error || 'Failed to analyze the X-ray');
        setLoading(false);
        return;
      }
      
      // Navigate to results page
      navigate(`/results/${response.data.id}`);
    } catch (err) {
      console.error('Error analyzing X-ray:', err);
      setError('An unexpected error occurred. Please try again later.');
      setLoading(false);
    }
  };

  return (
    <PageContainer
      title="Upload X-ray"
      subtitle="Upload an X-ray image for AI-powered fracture detection"
    >
      <div className="max-w-4xl mx-auto">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">X-ray Image</h2>
            <p className="text-sm text-gray-600 mt-1">
              Upload a clear X-ray image in JPEG, PNG, or DICOM format
            </p>
          </div>
          
          <div className="p-6">
            <ImageUploader
              onImageSelect={handleImageSelect}
              preview={preview}
              isUploading={loading}
              onRemove={handleRemoveImage}
            />
          </div>
        </div>
        
        <div className="mt-8 bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Patient Information</h2>
            <p className="text-sm text-gray-600 mt-1">
              Optional information to associate with this analysis
            </p>
          </div>
          
          <div className="p-6">
            <PatientInfoForm onSubmit={handleSubmit} isSubmitting={loading} />
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default UploadPage;