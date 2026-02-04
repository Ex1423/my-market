'use client';

import { useLanguage } from '@/components/LanguageContext';
import { useState } from 'react';
import ImageModal from './ImageModal';

interface Message {
  id: string;
  content: string | null;
  type: string;
  mediaUrl: string | null;
  senderId: string;
  createdAt: string;
}

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

export default function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const { t, language } = useLanguage();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewType, setPreviewType] = useState<'image' | 'video'>('image');
  
  const [showOriginal, setShowOriginal] = useState(false);

  const time = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const handlePreview = (type: 'image' | 'video') => {
    setPreviewType(type);
    setIsPreviewOpen(true);
  };

  return (
    <>
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2 items-end gap-2`}>
        {!isOwn && (
           <span className="text-[10px] text-gray-400 mb-1">{time}</span>
        )}
        <div className={`relative max-w-[70%] rounded-2xl px-4 py-3 shadow-sm ${
          isOwn ? 'bg-[#0047AB] text-white mr-2' : 'bg-white text-gray-800 ml-2'
        }`}>
          {/* Bubble Tail */}
          {!isOwn && (
            <div className="absolute bottom-[10px] -left-[6px] w-4 h-4 bg-white transform rotate-45 rounded-bl-[2px]"></div>
          )}
          {isOwn && (
            <div className="absolute bottom-[10px] -right-[6px] w-4 h-4 bg-[#0047AB] transform rotate-45 rounded-tr-[2px]"></div>
          )}

          {message.type === 'text' && (
            <div className="flex flex-col min-w-[40px] relative z-10">
              <p className="whitespace-pre-wrap break-words text-sm">
                {message.content}
              </p>
            </div>
          )}
          
          {message.type === 'image' && message.mediaUrl && (
            <div className="">
              <img 
                src={message.mediaUrl} 
                alt="Sent image" 
                className="rounded-lg max-w-[200px] max-h-40 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => handlePreview('image')}
              />
            </div>
          )}

          {message.type === 'audio' && message.mediaUrl && (
            <div className="flex items-center gap-2 min-w-[150px]">
              <audio controls src={message.mediaUrl} className="w-full h-8" />
            </div>
          )}

          {message.type === 'video' && message.mediaUrl && (
            <div className="group relative cursor-pointer" onClick={() => handlePreview('video')}>
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors rounded-lg z-10">
                <div className="w-12 h-12 bg-white/80 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-6 h-6 text-gray-800 ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
              <video 
                src={message.mediaUrl} 
                className="rounded-lg max-w-[200px] max-h-40 bg-black object-contain" 
              />
            </div>
          )}
        </div>
        {isOwn && (
           <span className="text-[10px] text-gray-400 mb-1">{time}</span>
        )}
      </div>

      {(message.type === 'image' || message.type === 'video') && message.mediaUrl && (
        <ImageModal 
          isOpen={isPreviewOpen} 
          onClose={() => setIsPreviewOpen(false)} 
          mediaUrl={message.mediaUrl} 
          type={previewType}
        />
      )}
    </>
  );
}
