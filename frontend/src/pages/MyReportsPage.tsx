import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyReports, getReportById } from '../api/analysis';
import { useAuth } from '../context/AuthContext';
import { EnrichedReport } from '../types';
import PageContainer from '../components/layout/PageContainer';
import { FileText, Download, Calendar, User, AlertCircle, Loader } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import PdfReportTemplate from '../components/results/PdfReportTemplate';

const MyReportsPage: React.FC = () => {
  const [reports, setReports] = useState<EnrichedReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { token, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [reportForPdf, setReportForPdf] = useState<EnrichedReport | null>(null);
  const pdfRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    const fetchReports = async () => {
      if (!token || !user) {
        setError("Authentication is required to view reports. Please log in.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const response = await getMyReports(user.id, token);
        if (response.data) {
          setReports(response.data);
          setError(null);
        } else {
          setError(response.error || 'An error occurred while fetching your reports.');
        }
      } catch (err: any) {
        setError(err.message || 'A network error occurred.');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [token, user, authLoading]);
  
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

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  if (loading || authLoading) {
    return (
      <PageContainer>
        <div className="flex justify-center items-center h-64">
          <Loader className="animate-spin h-8 w-8 text-primary-600" />
          <span className="ml-4 text-lg text-gray-600">Loading your reports...</span>
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center h-64 bg-red-50 border border-red-200 rounded-lg p-8">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-red-800">Could not load reports</h2>
          <p className="text-red-600 mt-2">{error}</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer 
      title="My Medical Reports"
      subtitle="Access and download your X-ray analysis reports."
    >
      <div className="mt-8">
        {reports.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => (
              <div key={report.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
                <div className="p-6 flex flex-col h-full">
                  <div className="flex items-center mb-4">
                    <FileText className="h-6 w-6 text-primary-500 mr-3 flex-shrink-0" />
                    <h3 className="text-lg font-bold text-gray-800 truncate" title={report.fractureType || 'Report'}>
                      {report.fractureType || 'General Report'}
                    </h3>
                  </div>
                  
                  <div className="space-y-3 text-sm text-gray-600 flex-grow">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>{formatDate(report.createdAt)}</span>
                    </div>
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>Doctor: {report.doctorName}</span>
                    </div>
                    {report.confidence && (
                      <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                        Confidence: {Math.round(report.confidence * 100)}%
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => handleDownload(report.id)}
                      disabled={!!downloadingId}
                      className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-400 transition-colors duration-200"
                    >
                      {downloadingId === report.id ? (
                        <>
                          <Loader className="animate-spin h-5 w-5 mr-2" />
                          Generating PDF...
                        </>
                      ) : (
                        <>
                          <Download className="h-5 w-5 mr-2" />
                          Download Report
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-gray-50 rounded-lg">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No Reports Found</h3>
            <p className="mt-1 text-sm text-gray-500">You do not have any analysis reports yet.</p>
          </div>
        )}
      </div>
      {/* Hidden container for PDF generation */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        {reportForPdf && <PdfReportTemplate ref={pdfRef} report={reportForPdf} />}
      </div>
    </PageContainer>
  );
};

export default MyReportsPage; 