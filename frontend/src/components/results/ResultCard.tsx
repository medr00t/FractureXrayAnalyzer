import React from 'react';
import { Analysis } from '../../types';
import { Clock, Calendar, CheckCircle2, AlertTriangle } from 'lucide-react';

interface ResultCardProps {
  analysis: Analysis;
  detailed?: boolean;
  onClick?: () => void;
}

const ResultCard: React.FC<ResultCardProps> = ({ analysis, detailed = false, onClick }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatConfidence = (confidence: number) => {
    return `${Math.round(confidence * 100)}%`;
  };

  const fractureDetected = analysis.fractureType || analysis.suspectedFracture;

  return (
    <div 
      className={`bg-white rounded-lg shadow border ${
        fractureDetected ? 'border-error-500/30' : 'border-success-500/30'
      } overflow-hidden transition-all hover:shadow-md ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex flex-col md:flex-row">
        {/* Image preview */}
        <div className="md:w-1/3 bg-black flex items-center justify-center overflow-hidden">
          <img 
            src={analysis.annotatedImageUrl} 
            alt="X-ray result" 
            className="w-full h-auto max-h-60 md:max-h-full object-contain"
          />
        </div>
        
        {/* Analysis details */}
        <div className="p-4 md:w-2/3">
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-semibold text-gray-800 truncate">
              {analysis.originalFilename}
            </h3>
            <div 
              className={`${
                analysis.suspectedFracture
                  ? 'bg-warning-500/10 text-warning-500'
                  : fractureDetected 
                    ? 'bg-error-500/10 text-error-500' 
                    : 'bg-success-500/10 text-success-500'
              } px-2 py-1 rounded text-xs font-medium flex items-center space-x-1`}
            >
              {analysis.suspectedFracture ? (
                <>
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Suspected Fracture</span>
                </>
              ) : fractureDetected ? (
                <>
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Fracture Detected</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>No Fracture Detected</span>
                </>
              )}
            </div>
          </div>
          
          <div className="mt-2 text-sm text-gray-600 flex flex-wrap gap-x-4 gap-y-1">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              <span>{formatDate(analysis.processedDate)}</span>
            </div>
            {analysis.patientName && (
              <div>
                <span className="font-medium">Patient:</span> {analysis.patientName}
              </div>
            )}
            {analysis.patientId && (
              <div>
                <span className="font-medium">ID:</span> {analysis.patientId}
              </div>
            )}
          </div>
          
          {fractureDetected && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {analysis.fractureType && (
                  <div>
                    <p className="text-xs text-gray-500">Fracture Type</p>
                    <p className="font-medium text-gray-800">{analysis.fractureType}</p>
                  </div>
                )}
                {analysis.fractureLocation && (
                  <div>
                    <p className="text-xs text-gray-500">Location</p>
                    <p className="font-medium text-gray-800">{analysis.fractureLocation}</p>
                  </div>
                )}
                {analysis.recoveryTimeDays && (
                  <div>
                    <p className="text-xs text-gray-500 flex items-center">
                      <Clock className="h-3.5 w-3.5 mr-1" /> 
                      Estimated Recovery
                    </p>
                    <p className="font-medium text-gray-800">{analysis.recoveryTimeDays} days</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500">Confidence</p>
                  <div className="mt-1 h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${
                        analysis.confidence > 0.9 
                          ? 'bg-success-500' 
                          : analysis.confidence > 0.7 
                            ? 'bg-warning-500' 
                            : 'bg-error-500'
                      }`}
                      style={{ width: `${analysis.confidence * 100}%` }}
                    ></div>
                  </div>
                  <p className="mt-1 text-xs text-gray-600 text-right">{formatConfidence(analysis.confidence)}</p>
                </div>
              </div>
            </div>
          )}
          
          {detailed && analysis.notes && (
            <div className="mt-4 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-1">Clinical Notes</p>
              <p className="text-sm text-gray-700">{analysis.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultCard;