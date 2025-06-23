import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getReports, getReportById } from '../api/analysis';
import { useAuth } from '../context/AuthContext';
import { EnrichedReport } from '../types';
import PageContainer from '../components/layout/PageContainer';
import { History, Download, Loader, AlertCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import PdfReportTemplate from '../components/results/PdfReportTemplate';

const HistoryPage: React.FC = () => {
  const [history, setHistory] = useState<EnrichedReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { token, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [reportForPdf, setReportForPdf] = useState<EnrichedReport | null>(null);
  const pdfRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if(authLoading) return;

    const fetchHistory = async () => {
      if (!token) {
        setError("Authentication is required to view history.");
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

    fetchHistory();
  }, [token, authLoading]);

  useEffect(() => {
    if (reportForPdf && pdfRef.current) {
      html2canvas(pdfRef.current, { scale: 2 })
        .then((canvas) => {
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF('p', 'mm', 'a4');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
          pdf.save(`report-${reportForPdf.patient.fullName?.replace(/\s/g, '_') || reportForPdf.id}.pdf`);
        })
        .finally(() => {
          setDownloadingId(null);
          setReportForPdf(null);
        });
    }
  }, [reportForPdf]);

  const handleDownload = async (reportId: string) => {
    if (!token) {
      setError("Authentication required.");
      return;
    }
    setDownloadingId(reportId);
    try {
      const response = await getReportById(reportId, token);
      if (response.data) {
        setReportForPdf(response.data);
      } else {
        setError(response.error || 'Could not fetch report details.');
        setDownloadingId(null);
      }
    } catch (err) {
      setError('A network error occurred while fetching the report.');
      setDownloadingId(null);
    }
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleString();

  if (loading || authLoading) {
    return (
      <PageContainer>
        <div className="flex justify-center items-center h-64">
          <Loader className="animate-spin h-8 w-8 text-primary-600" />
          <span className="ml-4 text-lg text-gray-600">Loading history...</span>
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center h-64 bg-red-50 border border-red-200 rounded-lg p-8">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-red-800">Could not load history</h2>
            <p className="text-red-600 mt-2">{error}</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Analysis History" subtitle="Review all past fracture detection reports">
      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doctor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fracture Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Confidence</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {history.length > 0 ? (
              history.map((report: any) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatDate(report.createdAt)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{report.patientName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{report.doctorName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{report.fractureType || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{report.confidence ? `${Math.round(report.confidence * 100)}%` : 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <button
                      onClick={() => handleDownload(report.id)}
                      disabled={!!downloadingId}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400"
                    >
                      {downloadingId === report.id ? (
                        <Loader className="animate-spin h-4 w-4 mr-1.5" />
                      ) : (
                        <Download className="h-4 w-4 mr-1.5" />
                      )}
                      {downloadingId === report.id ? 'Downloading' : 'Download'}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="text-center py-10 text-gray-500">
                  <History className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm">No history found.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Hidden container for PDF generation */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        {reportForPdf && <PdfReportTemplate ref={pdfRef} report={reportForPdf} />}
      </div>
    </PageContainer>
  );
};

export default HistoryPage;