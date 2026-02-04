'use client';

import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/components/LanguageContext';

interface ChatInputProps {
  onSend: (content: string, type: 'text' | 'image' | 'audio' | 'video', mediaUrl?: string) => Promise<void>;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const { t } = useLanguage();
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [sending, setSending] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const shouldStopRef = useRef(false);

  // Keep mobile menu open when recording
  useEffect(() => {
    if (isRecording) {
      setMobileMenuOpen(true);
    }
  }, [isRecording]);

  const handleSend = async () => {
    if (!message.trim() || sending) return;
    setSending(true);
    await onSend(message, 'text');
    setMessage('');
    setSending(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'video' && file.size > 20 * 1024 * 1024) {
      alert((t as any).chat.videoTooLarge);
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setSending(true);
      await onSend(type === 'image' ? 'Image' : 'Video', type, base64);
      setSending(false);
    };
    reader.readAsDataURL(file);
    // Reset input
    e.target.value = '';
  };

  const handleScreenshotClick = () => {
    const textarea = document.querySelector('textarea');
    if(textarea) textarea.focus();
    
    // Show temporary tooltip or instruction if needed
    // For now, we rely on the tooltip already in JSX
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        const blob = items[i].getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64 = reader.result as string;
            setSending(true);
            await onSend('Screenshot', 'image', base64);
            setSending(false);
          };
          reader.readAsDataURL(blob);
        }
        return;
      }
    }
  };

  const startRecording = async () => {
    shouldStopRef.current = false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      if (shouldStopRef.current) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = reader.result as string;
          setSending(true);
          await onSend('Audio message', 'audio', base64);
          setSending(false);
        };
        reader.readAsDataURL(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err: any) {
      console.error('Error accessing microphone:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        alert((t as any).chat.microphoneDenied);
      } else {
        alert((t as any).chat.microphoneError);
      }
    }
  };

  const stopRecording = () => {
    shouldStopRef.current = true;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const renderActionButtons = () => (
    <>
      {/* Image Upload */}
      <button 
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="p-2 text-gray-500 hover:text-[#0047AB] hover:bg-blue-50 rounded-xl transition-all"
        title={(t as any).chat.image}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>

      {/* Video Upload */}
      <button 
        type="button"
        onClick={() => videoInputRef.current?.click()}
        className="p-2 text-gray-500 hover:text-[#0047AB] hover:bg-blue-50 rounded-xl transition-all"
        title={(t as any).chat.video}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </button>

      {/* Screenshot Tool */}
      <div className="relative group">
        <button
          type="button"
          className="p-2 text-gray-500 hover:text-[#0047AB] hover:bg-blue-50 rounded-xl transition-all focus:outline-none"
          onClick={handleScreenshotClick}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.829 2.829a2.5 2.5 0 01-3.535 0L2.829 12.828a2.5 2.5 0 010-3.535l2.829-2.829a2.5 2.5 0 013.535 0L12 12m0 0l2.121 2.121" />
          </svg>
        </button>
        <div className="hidden md:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
          {(t as any).chat.screenshot || "Screenshot (Win+Shift+S) Paste (Ctrl+V)"}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
        </div>
      </div>

      {/* Audio Recording */}
      <button
        type="button"
        onClick={isRecording ? stopRecording : startRecording}
        className={`p-2 rounded-xl transition-all ${
          isRecording 
            ? 'text-red-500 bg-red-50 animate-pulse' 
            : 'text-gray-500 hover:text-[#0047AB] hover:bg-blue-50'
        }`}
        title={isRecording ? 'Stop recording' : (t as any).chat.record}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      </button>
    </>
  );

  return (
    <div className="bg-white px-4 py-3 border-t border-gray-100 shadow-[0_-2px_10px_rgba(0,0,0,0.03)] z-10">
      <input 
        type="file" 
        ref={fileInputRef}
        className="hidden" 
        accept="image/*"
        onChange={(e) => handleFileSelect(e, 'image')}
      />
      <input 
        type="file" 
        ref={videoInputRef}
        className="hidden" 
        accept="video/*"
        onChange={(e) => handleFileSelect(e, 'video')}
      />

      <div className="flex items-end gap-3 max-w-full">
        {/* Desktop: Horizontal List */}
        <div className="hidden md:flex items-center gap-1 pb-2">
           {renderActionButtons()}
        </div>

        {/* Mobile: Plus Button & Popup */}
        <div className="md:hidden relative pb-2">
           <button
             type="button"
             onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
             className={`p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-all ${mobileMenuOpen || isRecording ? 'bg-gray-100 text-[#0047AB]' : ''}`}
           >
             <svg className={`w-6 h-6 transition-transform ${mobileMenuOpen ? 'rotate-45' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
             </svg>
           </button>
           
           {mobileMenuOpen && (
             <div className="absolute bottom-full left-0 mb-3 bg-white shadow-xl border border-gray-100 rounded-2xl p-3 flex gap-4 z-50 animate-in slide-in-from-bottom-2 fade-in duration-200 min-w-max">
               {renderActionButtons()}
             </div>
           )}
        </div>

        {/* Text Input */}
        <div className="flex-1 relative bg-[#0047AB] rounded-2xl p-1 transition-all">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={(t as any).chat.typeMessage}
            className="w-full pl-4 pr-12 py-2.5 bg-[#0047AB] text-white placeholder-blue-200 border-none rounded-xl focus:ring-0 focus:outline-none resize-none max-h-32 min-h-[44px] scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-transparent"
            rows={1}
            style={{ minHeight: '44px' }} 
          />
          
          <button
            onClick={handleSend}
            disabled={!message.trim()}
            className="absolute right-2 bottom-2 p-1.5 bg-white text-[#0047AB] rounded-lg shadow-sm hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <svg className="w-5 h-5 transform rotate-90" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </div>
      </div>

      {showError && (
        <div className="absolute bottom-full left-0 right-0 bg-red-50 text-red-600 px-4 py-2 text-sm text-center border-t border-red-100">
          {errorMessage}
        </div>
      )}
    </div>
  );
}
