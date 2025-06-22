import React, { useState, useEffect } from 'react';
import { FractureAnnotation } from '../../types';
import { Info } from 'lucide-react';

interface AnnotatedImageProps {
  imageUrl: string;
  annotations: FractureAnnotation[];
  onAnnotationUpdate?: (annotation: FractureAnnotation) => void;
  editable?: boolean;
}

const AnnotatedImage: React.FC<AnnotatedImageProps> = ({ 
  imageUrl, 
  annotations,
  onAnnotationUpdate,
  editable = false
}) => {
  const [selectedAnnotation, setSelectedAnnotation] = useState<FractureAnnotation | null>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageSize({
      width: img.naturalWidth,
      height: img.naturalHeight
    });
    setImageLoaded(true);
  };

  useEffect(() => {
    const handleResize = () => {
      setImageLoaded(false);
      setTimeout(() => setImageLoaded(true), 100);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMouseDown = (e: React.MouseEvent, annotation: FractureAnnotation) => {
    if (!editable) return;
    
    setIsDragging(true);
    setSelectedAnnotation(annotation);
    setDragStart({
      x: e.clientX,
      y: e.clientY
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedAnnotation || !onAnnotationUpdate) return;

    const containerRect = document.getElementById('annotated-image-container')?.getBoundingClientRect();
    if (!containerRect) return;

    const scaleRatio = containerRect.width / imageSize.width;
    const dx = (e.clientX - dragStart.x) / scaleRatio;
    const dy = (e.clientY - dragStart.y) / scaleRatio;

    const updatedAnnotation = {
      ...selectedAnnotation,
      x: selectedAnnotation.x + dx,
      y: selectedAnnotation.y + dy
    };

    onAnnotationUpdate(updatedAnnotation);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('mouseleave', handleMouseUp);
      return () => {
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('mouseleave', handleMouseUp);
      };
    }
  }, [isDragging]);

  return (
    <div 
      id="annotated-image-container"
      className="relative bg-black rounded-lg overflow-hidden h-[438px] flex justify-center items-center"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <img 
        src={imageUrl} 
        alt="X-ray with annotations" 
        className="h-full w-auto object-contain"
        onLoad={handleImageLoad}
      />
      
      {imageLoaded && annotations.map((annotation) => {
        const containerRect = document.getElementById('annotated-image-container')?.getBoundingClientRect();
        const containerWidth = containerRect?.width || imageSize.width;
        
        const scaleRatio = containerWidth / imageSize.width;
        
        const scaledX = annotation.x * scaleRatio;
        const scaledY = annotation.y * scaleRatio;
        const scaledWidth = annotation.width * scaleRatio;
        const scaledHeight = annotation.height * scaleRatio;
        
        const isSelected = selectedAnnotation?.id === annotation.id;
        
        return (
          <React.Fragment key={annotation.id}>
            {/* Fracture detection box */}
            <div
              className={`absolute border-4 ${isSelected ? 'border-red-600' : 'border-red-500'} 
                transition-all ${editable ? 'cursor-move' : 'cursor-pointer'}
                ${annotation.confidence > 0.5 ? 'bg-red-500/10' : 'bg-yellow-500/10'}`}
              style={{
                left: `${scaledX}px`,
                top: `${scaledY}px`,
                width: `${scaledWidth}px`,
                height: `${scaledHeight}px`,
                boxShadow: isSelected ? '0 0 0 2px rgba(220, 38, 38, 0.5)' : 'none'
              }}
              onClick={() => !editable && setSelectedAnnotation(isSelected ? null : annotation)}
              onMouseDown={(e) => editable && handleMouseDown(e, annotation)}
            >
              {/* Confidence indicator */}
              <div 
                className={`absolute -top-3 -right-3 h-6 px-2 rounded-full 
                  ${annotation.confidence > 0.5 ? 'bg-red-500' : 'bg-yellow-500'}
                  flex items-center justify-center shadow-md text-white text-xs font-medium`}
              >
                {Math.round(annotation.confidence * 100)}%
              </div>
              
              {/* Resize handles when editable */}
              {editable && isSelected && (
                <>
                  <div className="absolute -top-1 -left-1 w-3 h-3 bg-white border-2 border-red-500 rounded-full cursor-nw-resize" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-white border-2 border-red-500 rounded-full cursor-ne-resize" />
                  <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-white border-2 border-red-500 rounded-full cursor-sw-resize" />
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border-2 border-red-500 rounded-full cursor-se-resize" />
                </>
              )}
            </div>
            
            {/* Annotation tooltip */}
            {isSelected && (
              <div
                className="absolute bg-white p-3 rounded-lg shadow-lg text-sm z-10 w-64"
                style={{
                  left: `${scaledX + scaledWidth / 2}px`,
                  top: `${scaledY + scaledHeight + 10}px`,
                  transform: 'translateX(-50%)'
                }}
              >
                <div className="font-medium text-gray-800">{annotation.fractureType}</div>
                <div className="text-xs text-gray-600 mt-1">
                  Confidence: {Math.round(annotation.confidence * 100)}%
                </div>
                {editable && (
                  <div className="mt-2 text-xs text-gray-500">
                    Drag to reposition • Drag corners to resize
                  </div>
                )}
                <div className="absolute -top-2 left-1/2 w-4 h-4 bg-white transform rotate-45 -translate-x-1/2 -translate-y-1/2"></div>
              </div>
            )}
          </React.Fragment>
        );
      })}
      
      {/* Instructions overlay */}
      {imageLoaded && annotations.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-center py-2 text-sm">
          {editable 
            ? 'Click and drag to adjust fracture detection boxes'
            : 'Click on a highlighted area to view fracture details'
          }
        </div>
      )}
    </div>
  );
};

export default AnnotatedImage;