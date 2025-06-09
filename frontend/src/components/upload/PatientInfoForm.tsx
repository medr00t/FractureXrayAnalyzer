import React, { useState } from 'react';

interface PatientInfoFormProps {
  onSubmit: (patientInfo: { patientId?: string; patientName?: string; notes?: string }) => void;
  isSubmitting: boolean;
}

const PatientInfoForm: React.FC<PatientInfoFormProps> = ({ onSubmit, isSubmitting }) => {
  const [patientId, setPatientId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      patientId: patientId || undefined,
      patientName: patientName || undefined,
      notes: notes || undefined
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div>
          <label htmlFor="patientId" className="block text-sm font-medium text-gray-700 mb-1">
            Patient ID (optional)
          </label>
          <input
            id="patientId"
            type="text"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="e.g., P12345"
            disabled={isSubmitting}
          />
        </div>
        
        <div>
          <label htmlFor="patientName" className="block text-sm font-medium text-gray-700 mb-1">
            Patient Name (optional)
          </label>
          <input
            id="patientName"
            type="text"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="e.g., John Smith"
            disabled={isSubmitting}
          />
        </div>
        
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Clinical Notes (optional)
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            placeholder="Enter any relevant clinical information"
            rows={3}
            disabled={isSubmitting}
          />
        </div>
        
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full bg-primary-600 text-white py-3 px-4 rounded-md font-medium ${
            isSubmitting
              ? 'opacity-70 cursor-not-allowed'
              : 'hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
          }`}
        >
          {isSubmitting ? 'Analyzing X-ray...' : 'Analyze X-ray'}
        </button>
      </div>
    </form>
  );
};

export default PatientInfoForm;