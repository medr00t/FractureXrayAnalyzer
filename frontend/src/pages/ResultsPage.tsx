import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, FileDown, AlertCircle, Clock } from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import AnnotatedImage from '../components/results/AnnotatedImage';
import { getAnalysisById, getAnnotations } from '../api/analysis';
import { Analysis, FractureAnnotation } from '../types';

const ResultsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [annotations, setAnnotations] = useState<FractureAnnotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!id) return;

      setLoading(true);
      setError(null);

      try {
        // Fetch analysis details
        const analysisResponse = await getAnalysisById(id);
        
        if (analysisResponse.error || !analysisResponse.data) {
          setError(analysisResponse.error || 'Failed to load analysis');
          setLoading(false);
          return;
        }
        
        setAnalysis(analysisResponse.data);
        
        // Fetch annotations
        const annotationsResponse = await getAnnotations(id);
        
        if (annotationsResponse.data) {
          setAnnotations(annotationsResponse.data);
        }
      } catch (err) {
        console.error('Error fetching analysis:', err);
        setError('An unexpected error occurred. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [id]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          <span className="ml-3 text-gray-600">Loading analysis results...</span>
        </div>
      </PageContainer>
    );
  }

  if (error || !analysis) {
    return (
      <PageContainer>
        <div className="min-h-[50vh] flex flex-col items-center justify-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Error Loading Results</h2>
            <p className="text-gray-600 mb-6">{error || 'Analysis not found'}</p>
            <Link
              to="/history"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to History
            </Link>
          </div>
        </div>
      </PageContainer>
    );
  }

  const fractureDetected = !!analysis.fractureType;

  return (
    <PageContainer>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            <span>Back</span>
          </button>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mt-2">Analysis Results</h1>
          <p className="text-gray-600">{formatDate(analysis.processedDate)}</p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={handlePrint}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print Results
          </button>
          <button
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <FileDown className="h-4 w-4 mr-2" />
            Download Report
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          {/* Main X-ray image with annotations */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">X-ray Analysis</h2>
            </div>
            <div id="annotated-image-container" className="relative">
              <AnnotatedImage 
                imageUrl={analysis.annotatedImageUrl} 
                annotations={annotations}
              />
            </div>
          </div>
          
          {/* Analysis summary */}
          <div className="mt-6 bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Analysis Summary</h2>
            </div>
            <div className="p-6">
              <div className={`p-4 rounded-md ${
                fractureDetected 
                  ? 'bg-red-50 border border-red-200' 
                  : 'bg-green-50 border border-green-200'
              }`}>
                <div className="flex">
                  <div className={`flex-shrink-0 ${
                    fractureDetected ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {fractureDetected ? (
                      <AlertCircle className="h-5 w-5" />
                    ) : (
                      <Clock className="h-5 w-5" />
                    )}
                  </div>
                  <div className="ml-3">
                    <h3 className={`text-sm font-medium ${
                      fractureDetected ? 'text-red-800' : 'text-green-800'
                    }`}>
                      {fractureDetected 
                        ? `Fracture Detected: ${analysis.fractureType}` 
                        : 'No Fractures Detected'
                      }
                    </h3>
                    <div className="mt-2 text-sm">
                      <p className={fractureDetected ? 'text-red-700' : 'text-green-700'}>
                        {fractureDetected
                          ? `A ${analysis.fractureType} was detected in the ${analysis.fractureLocation} with ${Math.round(analysis.confidence * 100)}% confidence.`
                          : 'The AI analysis did not detect any fractures in this X-ray image.'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {fractureDetected && analysis.recoveryTimeWeeks && (
                <div className="mt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <h3 className="text-sm font-medium text-gray-700">Estimated Recovery Time</h3>
                  </div>
                  <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="h-2 bg-gray-200 rounded-full">
                          <div 
                            className="h-2 bg-primary-600 rounded-full transition-all duration-500" 
                            style={{ width: `${Math.min(100, (analysis.recoveryTimeWeeks / 12) * 100)}%` }}
                          ></div>
                        </div>
                        <div className="mt-2 flex justify-between text-xs text-gray-500">
                          <span>0 weeks</span>
                          <span>12+ weeks</span>
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <span className="text-lg font-semibold text-gray-900">{analysis.recoveryTimeWeeks}</span>
                        <span className="text-gray-600 text-sm ml-1">weeks</span>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                      Estimated recovery time based on fracture type, location, and severity. Individual healing times may vary.
                    </p>
                  </div>
                </div>
              )}
              
              {analysis.notes && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Clinical Notes</h3>
                  <div className="bg-gray-50 p-3 rounded border border-gray-200">
                    <p className="text-sm text-gray-700">{analysis.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Right sidebar with metadata */}
        <div>
          <div className="bg-white rounded-lg shadow-md overflow-hidden sticky top-6">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Image Details</h2>
            </div>
            <div className="p-4">
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">File Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{analysis.originalFilename}</dd>
                </div>
                
                {analysis.patientName && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Patient Name</dt>
                    <dd className="mt-1 text-sm text-gray-900">{analysis.patientName}</dd>
                  </div>
                )}
                
                {analysis.patientId && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Patient ID</dt>
                    <dd className="mt-1 text-sm text-gray-900">{analysis.patientId}</dd>
                  </div>
                )}
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Upload Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(analysis.uploadDate)}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Processing Time</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {Math.round((new Date(analysis.processedDate).getTime() - new Date(analysis.uploadDate).getTime()) / 1000)} seconds
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">AI Confidence</dt>
                  <dd className="mt-1">
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            analysis.confidence > 0.9 
                              ? 'bg-green-500' 
                              : analysis.confidence > 0.7 
                                ? 'bg-yellow-500' 
                                : 'bg-red-500'
                          }`}
                          style={{ width: `${analysis.confidence * 100}%` }}
                        ></div>
                      </div>
                      <span className="ml-2 text-sm text-gray-700">
                        {Math.round(analysis.confidence * 100)}%
                      </span>
                    </div>
                  </dd>
                </div>
              </dl>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Actions</h3>
                <div className="space-y-2">
                  <Link
                    to="/upload"
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Upload Another X-ray
                  </Link>
                  <Link
                    to="/history"
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                  >
                    View Analysis History
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default ResultsPage;