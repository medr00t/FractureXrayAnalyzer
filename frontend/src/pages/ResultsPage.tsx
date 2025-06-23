import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Printer, FileDown, AlertCircle, Clock } from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import AnnotatedImage from '../components/results/AnnotatedImage';
import { getReportById } from '../api/analysis';
import { useAuth } from '../context/AuthContext';
import { EnrichedReport as Report } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const ResultsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token, user } = useAuth();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notifyStatus, setNotifyStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const reportContentRef = useRef<HTMLDivElement>(null);
  const hasDownloadedRef = useRef(false);

  useEffect(() => {
    const fetchReport = async () => {
      if (!id || !token) return;

      setLoading(true);
      setError(null);

      try {
        const response = await getReportById(id, token);
        
        if (response.error || !response.data) {
          setError(response.error || 'Failed to load report');
        } else {
          setReport(response.data);
        }
      } catch (err) {
        setError('An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [id, token]);

  useEffect(() => {
    const shouldDownload = searchParams.get('download') === 'true';
    if (shouldDownload && report && reportContentRef.current && !hasDownloadedRef.current) {
      hasDownloadedRef.current = true; // Prevent re-download on re-renders
      handleDownloadPdf();
    }
  }, [report, searchParams]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    if (reportContentRef.current) {
      html2canvas(reportContentRef.current, { scale: 2 }).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`report-${report?.patient.fullName?.replace(/\s/g, '_') || report?.id}.pdf`);
      });
    }
  };

  const handleNotifyPatient = async () => {
    if (!id || !token) return;
    setNotifyStatus(null);
    try {
      const response = await fetch(`http://localhost:3000/api/reports/${id}/notify`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setNotifyStatus({ message: 'Notification email sent successfully!', type: 'success' });
      } else {
        setNotifyStatus({ message: data.error || 'Failed to send notification.', type: 'error' });
      }
    } catch (err) {
      setNotifyStatus({ message: 'An unexpected network error occurred.', type: 'error' });
    }
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

  if (error || !report) {
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

  const fractureDetected = !!report.fractureType;

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
          <p className="text-gray-600">{formatDate(report.createdAt)}</p>
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
            onClick={handleDownloadPdf}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <FileDown className="h-4 w-4 mr-2" />
            Download Report
          </button>
          <button
            onClick={handleNotifyPatient}
            className="inline-flex items-center px-4 py-2 border border-primary-600 rounded-md shadow-sm text-sm font-medium text-primary-700 bg-white hover:bg-primary-50"
          >
            Notify patient by email
          </button>
        </div>
        {notifyStatus && (
          <div className={`mt-2 text-sm ${notifyStatus.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{notifyStatus.message}</div>
        )}
      </div>
      
      <div ref={reportContentRef} className="bg-white p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md overflow-hidden">
            {report.annotatedImage && (
              <div className="w-full bg-black flex justify-center items-center h-[438px] overflow-hidden">
                <img 
                  src={`data:image/jpeg;base64,${report.annotatedImage}`}
                  alt="Annotated X-ray"
                  className="h-full w-auto object-contain"
                />
              </div>
            )}
            
            <div className="p-6">
              <h3 className="text-lg font-semibold">{report.fractureType || 'No Fracture Detected'}</h3>
              <p className="text-sm text-gray-600">
                Confidence: {report.confidence ? `${Math.round(report.confidence * 100)}%` : 'N/A'}
              </p>
              <p className="text-sm text-gray-600">
                Estimated Recovery: {report.recoveryTime}
              </p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 h-fit">
            <h2 className="text-xl font-bold mb-4">Report Details</h2>
            <dl>
              <dt className="font-semibold">Image Name</dt>
              <dd className="mb-2">{report.imageName}</dd>
              <dt className="font-semibold">Report Date</dt>
              <dd>{formatDate(report.createdAt)}</dd>
              <dt className="font-semibold mt-4">Patient Information</dt>
              <dd>Name: {report.patient.fullName}</dd>
              <dd>Email: {report.patient.email}</dd>
              <dt className="font-semibold mt-4">Doctor Information</dt>
              <dd>Name: {report.doctor.fullName}</dd>
              <dd>Email: {report.doctor.email}</dd>
            </dl>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default ResultsPage;