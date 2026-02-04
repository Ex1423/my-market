'use client';

import { useLanguage } from '@/components/LanguageContext';
import { useEffect } from 'react';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaUrl: string;
  type?: 'image' | 'video';
}

export default function ImageModal({ isOpen, onClose, mediaUrl, type = 'image' }: ImageModalProps) {
  const { t } = useLanguage();

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDownload = async () => {
    try {
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = mediaUrl;
      link.download = `chat-${type}-${Date.now()}.${type === 'image' ? 'jpg' : 'mp4'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
      <div className="relative max-w-full max-h-full flex flex-col items-center" onClick={e => e.stopPropagation()}>
        {type === 'image' ? (
          <img 
            src={mediaUrl} 
            alt="Full screen preview" 
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
          />
        ) : (
          <video 
            src={mediaUrl} 
            controls 
            autoPlay
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl bg-black"
          />
        )}
        
        <div className="absolute -top-12 right-0 flex gap-4">
          <button
            onClick={handleDownload}
            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm transition-colors"
            title={(t as any).chat.download}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
          
          <button
            onClick={onClose}
            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm transition-colors"
            title={(t as any).chat.close}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
