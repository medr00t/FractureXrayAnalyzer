import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, XCircle, Image as ImageIcon, CheckCircle2 } from 'lucide-react';

interface ImageUploaderProps {
  onImageSelect: (file: File) => void;
  preview: string | null;
  isUploading: boolean;
  onRemove: () => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  onImageSelect, 
  preview, 
  isUploading,
  onRemove 
}) => {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Reset error state
    setError(null);

    // Validate file
    if (acceptedFiles.length === 0) {
      return;
    }

    const file = acceptedFiles[0];
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }
    
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File is too large. Maximum size is 10MB');
      return;
    }
    
    // Pass the file to parent component
    onImageSelect(file);
  }, [onImageSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.tiff', '.dicom']
    },
    maxFiles: 1,
    disabled: isUploading || !!preview
  });

  return (
    <div className="w-full">
      {!preview ? (
        <div 
          {...getRootProps()} 
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'}
            ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />
          <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm font-medium text-gray-700">
            {isDragActive ? 'Drop the X-ray image here' : 'Drag & drop an X-ray image, or click to select'}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Supports JPEG, PNG, TIFF, and DICOM files up to 10MB
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <div className="relative">
            <img 
              src={preview} 
              alt="X-ray preview" 
              className="w-full h-auto max-h-96 object-contain bg-black"
            />
            <button
              onClick={onRemove}
              disabled={isUploading}
              className="absolute top-2 right-2 bg-white rounded-full shadow-md p-1 hover:bg-gray-100 transition-colors"
              title="Remove image"
            >
              <XCircle className="h-5 w-5 text-gray-600" />
            </button>
            {isUploading && (
              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mx-auto"></div>
                  <p className="mt-2 text-sm">Analyzing X-ray...</p>
                </div>
              </div>
            )}
          </div>
          <div className="p-3 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center">
              <ImageIcon className="h-4 w-4 text-gray-500 mr-2" />
              <span className="text-sm text-gray-700 truncate">X-ray image selected</span>
              {!isUploading && (
                <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto" />
              )}
            </div>
          </div>
        </div>
      )}
      
      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;