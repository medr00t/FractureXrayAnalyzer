import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PageContainer from '../components/layout/PageContainer';
import HistoryList from '../components/history/HistoryList';
import { getUserAnalyses } from '../api/analysis';
import { Analysis } from '../types';
import { AlertCircle } from 'lucide-react';

const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalyses = async () => {
      if (!user) return;

      setLoading(true);
      setError(null);

      try {
        const response = await getUserAnalyses(user.id);
        
        if (response.error || !response.data) {
          setError(response.error || 'Failed to load analyses');
          setLoading(false);
          return;
        }
        
        setAnalyses(response.data);
      } catch (err) {
        console.error('Error fetching analyses:', err);
        setError('An unexpected error occurred. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyses();
  }, [user]);

  const handleSelectAnalysis = (analysisId: string) => {
    navigate(`/results/${analysisId}`);
  };

  return (
    <PageContainer
      title="Analysis History"
      subtitle="View and manage your X-ray analysis history"
    >
      {loading ? (
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          <span className="ml-3 text-gray-600">Loading analysis history...</span>
        </div>
      ) : error ? (
        <div className="min-h-[30vh] flex items-center justify-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Error Loading History</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            >
              Try Again
            </button>
          </div>
        </div>
      ) : (
        <HistoryList
          analyses={analyses}
          onSelectAnalysis={handleSelectAnalysis}
        />
      )}
    </PageContainer>
  );
};

export default HistoryPage;