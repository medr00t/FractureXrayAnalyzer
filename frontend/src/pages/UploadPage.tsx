import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PageContainer from '../components/layout/PageContainer';
import ImageUploader from '../components/upload/ImageUploader';
import PatientInfoForm from '../components/upload/PatientInfoForm';
import { createReport, getPatients } from '../api/analysis';
import { AlertCircle, UserPlus, UserCheck } from 'lucide-react';
import { User } from '../types';

const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // New state for patient selection
  const [patientMode, setPatientMode] = useState<'existing' | 'new'>('existing');
  const [patients, setPatients] = useState<User[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');

  useEffect(() => {
    const fetchPatients = async () => {
      if (token) {
        const response = await getPatients(token);
        if (response.data) {
          setPatients(response.data);
          if (response.data.length > 0) {
            setSelectedPatientId(response.data[0].id);
          }
        }
      }
    };
    fetchPatients();
  }, [token]);

  const handleImageSelect = (file: File) => {
    setSelectedFile(file);
    setError(null);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreview(null);
  };

  const handleSubmit = async (patientInfo: { fullName?: string; email?: string }) => {
    if (!selectedFile || !token) {
      setError('Please select an X-ray image.');
      return;
    }
    if (patientMode === 'existing' && !selectedPatientId) {
      setError('Please select a patient.');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('image', selectedFile);

    if (patientMode === 'existing') {
      formData.append('existingPatientId', selectedPatientId);
    } else {
      formData.append('fullName', patientInfo.fullName || '');
      formData.append('email', patientInfo.email || '');
    }

    try {
      const response = await createReport(formData, token);
      if (response.error || !response.data) {
        setError(response.error || 'Failed to create report.');
      } else {
        // Navigate to the results page for the new report
        navigate(`/results/${response.data.report.id}`);
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer title="Upload X-ray" subtitle="Select a patient and upload an image for analysis">
      <div className="max-w-4xl mx-auto">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md mb-8">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">1. Select Patient</h2>
          </div>
          <div className="p-6">
            <div className="flex border border-gray-200 rounded-md overflow-hidden w-min mb-4">
              <button onClick={() => setPatientMode('existing')} className={`px-4 py-2 text-sm flex items-center gap-2 ${patientMode === 'existing' ? 'bg-primary-500 text-white' : 'bg-white hover:bg-gray-50'}`}>
                <UserCheck size={16} /> Existing Patient
              </button>
              <button onClick={() => setPatientMode('new')} className={`px-4 py-2 text-sm flex items-center gap-2 ${patientMode === 'new' ? 'bg-primary-500 text-white' : 'bg-white hover:bg-gray-50'}`}>
                <UserPlus size={16} /> New Patient
              </button>
            </div>
            {patientMode === 'existing' ? (
              <div>
                <label htmlFor="patient-select" className="block text-sm font-medium text-gray-700 mb-1">Select an existing patient</label>
                <select id="patient-select" value={selectedPatientId} onChange={e => setSelectedPatientId(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md">
                  {patients.map(p => <option key={p.id} value={p.id}>{p.fullName} ({p.email})</option>)}
                </select>
              </div>
            ) : (
              <PatientInfoForm onSubmit={handleSubmit} isSubmitting={loading} />
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">2. Upload Image</h2>
          </div>
          <div className="p-6">
            <ImageUploader onImageSelect={handleImageSelect} preview={preview} isUploading={loading} onRemove={handleRemoveImage} />
          </div>
        </div>
        
        {patientMode === 'existing' && (
          <div className="mt-8">
            <button onClick={() => handleSubmit({})} disabled={loading || !selectedFile} className="w-full bg-primary-600 text-white font-semibold py-3 rounded-md hover:bg-primary-700 disabled:bg-gray-400">
              {loading ? 'Analyzing...' : 'Analyze and Create Report'}
            </button>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default UploadPage;