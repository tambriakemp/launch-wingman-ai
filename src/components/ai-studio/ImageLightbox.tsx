import React from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { GeneratedMedia } from './types';

interface ImageLightboxProps {
  index: number;
  media: Record<number, GeneratedMedia>;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

const ImageLightbox: React.FC<ImageLightboxProps> = ({ index, media, onClose, onNavigate }) => {
  const total = Object.keys(media).length;
  const currentMedia = media[index];

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <button className="absolute top-4 right-4 text-white hover:text-muted-foreground z-[110]">
        <X className="h-8 w-8" />
      </button>

      <button
        onClick={(e) => { e.stopPropagation(); if (index > 0) onNavigate(index - 1); }}
        className={`absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-white/10 text-white transition-all ${index === 0 ? 'opacity-30 cursor-not-allowed' : 'opacity-100'}`}
        disabled={index === 0}
      >
        <ChevronLeft className="h-8 w-8" />
      </button>

      <button
        onClick={(e) => { e.stopPropagation(); if (index < total - 1) onNavigate(index + 1); }}
        className={`absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-white/10 text-white transition-all ${index >= total - 1 ? 'opacity-30 cursor-not-allowed' : 'opacity-100'}`}
        disabled={index >= total - 1}
      >
        <ChevronRight className="h-8 w-8" />
      </button>

      <div onClick={(e) => e.stopPropagation()} className="max-w-4xl max-h-[90vh]">
        {currentMedia?.imageUrl ? (
          <img
            src={currentMedia.imageUrl}
            alt={`Scene ${index + 1}`}
            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
          />
        ) : (
          <div className="text-muted-foreground text-center p-12">No image available</div>
        )}
        <p className="text-center text-white/70 text-sm mt-3">Scene {index + 1} of {total}</p>
      </div>
    </div>
  );
};

export default ImageLightbox;
