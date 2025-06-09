import React, { useState } from 'react';
import { Analysis } from '../../types';
import ResultCard from '../results/ResultCard';
import { Search, Filter, Calendar, XCircle } from 'lucide-react';

interface HistoryListProps {
  analyses: Analysis[];
  onSelectAnalysis: (analysisId: string) => void;
}

const HistoryList: React.FC<HistoryListProps> = ({ analyses, onSelectAnalysis }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'fracture' | 'no-fracture'>('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc'>('date-desc');
  const [showFilters, setShowFilters] = useState(false);

  // Filter and sort analyses
  const filteredAnalyses = analyses
    .filter((analysis) => {
      // Apply search
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        searchTerm === '' ||
        analysis.originalFilename.toLowerCase().includes(searchLower) ||
        (analysis.patientName && analysis.patientName.toLowerCase().includes(searchLower)) ||
        (analysis.patientId && analysis.patientId.toLowerCase().includes(searchLower)) ||
        (analysis.fractureType && analysis.fractureType.toLowerCase().includes(searchLower));
      
      // Apply filter
      const matchesFilter = 
        filter === 'all' ||
        (filter === 'fracture' && analysis.fractureType) ||
        (filter === 'no-fracture' && !analysis.fractureType);
      
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      // Apply sorting
      const dateA = new Date(a.processedDate).getTime();
      const dateB = new Date(b.processedDate).getTime();
      
      return sortBy === 'date-desc' ? dateB - dateA : dateA - dateB;
    });

  return (
    <div>
      {/* Search and filter */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by patient name, file name, or fracture type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {searchTerm && (
              <button
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setSearchTerm('')}
                title="Clear search"
              >
                <XCircle className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="md:flex-shrink-0 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <Filter className="h-5 w-5 text-gray-600" />
            <span className="font-medium text-gray-700">Filters</span>
          </button>
        </div>
        
        {/* Advanced filters */}
        {showFilters && (
          <div className="mt-3 p-4 bg-gray-50 rounded-md border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Diagnosis Filter
                </label>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      checked={filter === 'all'}
                      onChange={() => setFilter('all')}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">All</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      checked={filter === 'fracture'}
                      onChange={() => setFilter('fracture')}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Fractures Only</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      checked={filter === 'no-fracture'}
                      onChange={() => setFilter('no-fracture')}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">No Fractures</span>
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sort By
                </label>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setSortBy('date-desc')}
                    className={`flex items-center space-x-1 px-3 py-1.5 rounded 
                      ${sortBy === 'date-desc' ? 'bg-primary-100 text-primary-800' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">Newest First</span>
                  </button>
                  <button
                    onClick={() => setSortBy('date-asc')}
                    className={`flex items-center space-x-1 px-3 py-1.5 rounded
                      ${sortBy === 'date-asc' ? 'bg-primary-100 text-primary-800' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">Oldest First</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Results list */}
      {filteredAnalyses.length > 0 ? (
        <div className="space-y-6">
          {filteredAnalyses.map((analysis) => (
            <ResultCard
              key={analysis.id}
              analysis={analysis}
              onClick={() => onSelectAnalysis(analysis.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
            <Search className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No results found</h3>
          <p className="mt-2 text-sm text-gray-500">
            {searchTerm || filter !== 'all' 
              ? 'Try adjusting your search or filters' 
              : 'No analyses have been performed yet'}
          </p>
        </div>
      )}
    </div>
  );
};

export default HistoryList;