import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getReports, deleteReport } from '../api/analysis';
import { useAuth } from '../context/AuthContext';
import { EnrichedReport } from '../types';
import PageContainer from '../components/layout/PageContainer';
import { History, Eye, User as UserIcon, Activity } from 'lucide-react';

const HistoryPage: React.FC = () => {
  const [history, setHistory] = useState<EnrichedReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      if (!token) {
        setError("No authentication token found.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const response = await getReports(token);
        if (response.data) {
          setHistory(response.data);
          setError(null);
        } else {
          setError(response.error || 'Failed to fetch history.');
        }
      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchHistory();
    }
  }, [token]);

  // Use toLocaleString for a more detailed date and time
  const formatDate = (dateString: string) => new Date(dateString).toLocaleString();

  const handleViewDetails = (reportId: string) => {
    navigate(`/results/${reportId}`);
  };

  const handleDelete = async (reportId: string) => {
    if (!token) {
      setError("Authentication token not found.");
      return;
    }
    if (window.confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      const { error: deleteError } = await deleteReport(reportId, token);
      if (deleteError) {
        setError(deleteError);
      } else {
        setHistory(prevHistory => prevHistory.filter(report => report.id !== reportId));
        setError(null);
      }
    }
  };

  if (loading) {
    return <PageContainer><p>Loading history...</p></PageContainer>;
  }

  return (
    <PageContainer title="Analysis History" subtitle="Review past fracture detection reports">
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doctor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fracture Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Confidence</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {history.length > 0 ? (
              history.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatDate(report.createdAt)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{report.patientName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{report.doctorName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{report.fractureType || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{report.confidence ? `${Math.round(report.confidence * 100)}%` : 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleViewDetails(report.id)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDelete(report.id)}
                      className="ml-4 text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="text-center py-10 text-gray-500">
                  <History className="mx-auto h-12 w-12" />
                  <p className="mt-2">No reports found.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </PageContainer>
  );
};

export default HistoryPage;