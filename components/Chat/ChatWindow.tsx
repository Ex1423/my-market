'use client';

import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/components/LanguageContext';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';

interface ChatWindowProps {
  conversationId: string;
  currentUserId: string;
  recipientName: string;
  product?: { id: string; title: string; price: string };
}

export default function ChatWindow({ conversationId, currentUserId, recipientName, product }: ChatWindowProps) {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async (signal?: AbortSignal) => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, { signal });
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error('Fetch messages error', error);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  const markAsRead = async (signal?: AbortSignal) => {
    try {
      await fetch(`/api/conversations/${conversationId}/read`, { method: 'POST', signal });
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error('Mark read error', error);
    }
  };

  // Poll for new messages
  useEffect(() => {
    const controller = new AbortController();
    fetchMessages(controller.signal);
    markAsRead(controller.signal); // Mark as read on mount/change
    
    const interval = setInterval(() => {
      fetchMessages(controller.signal);
      markAsRead(controller.signal); // Keep marking as read while open
    }, 3000);
    
    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [conversationId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (
    content: string,
    type: 'text' | 'image' | 'audio' | 'video',
    mediaUrl?: string
  ) => {
    try {
      // 3. 成功提示并跳转
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUserId,
          content: type === 'text' ? content : undefined,
          type,
          mediaUrl
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Send message failed:', response.status, errorData);
        throw new Error(errorData.error || '发送失败');
      }
      
      fetchMessages(); // Refresh immediately
    } catch (error) {
      console.error('Send message error', error);
    }
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedMessageIds(new Set());
  };

  const toggleMessageSelection = (id: string) => {
    const newSelected = new Set(selectedMessageIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedMessageIds(newSelected);
  };

  const selectAllMessages = () => {
    if (selectedMessageIds.size === messages.length) {
      setSelectedMessageIds(new Set());
    } else {
      setSelectedMessageIds(new Set(messages.map(m => m.id)));
    }
  };

  const deleteSelectedMessages = async () => {
    if (selectedMessageIds.size === 0) return;
    
    if (!confirm((t as any).chat.confirmDelete || 'Delete selected messages?')) return;

    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageIds: Array.from(selectedMessageIds) })
      });

      if (res.ok) {
        setIsSelectionMode(false);
        setSelectedMessageIds(new Set());
        fetchMessages();
      }
    } catch (error) {
      console.error('Delete messages error', error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="bg-blue-50/80 backdrop-blur-sm px-4 py-2.5 flex justify-between items-center z-10 sticky top-0">
        <div className="flex items-center gap-3">
          {isSelectionMode ? (
             <div className="flex items-center gap-3">
               <button 
                 onClick={toggleSelectionMode}
                 className="text-gray-500 hover:text-gray-700 font-medium"
               >
                 {(t as any).chat.cancel || 'Cancel'}
               </button>
               <span className="text-gray-400">|</span>
               <span className="text-gray-700 font-medium">
                 {selectedMessageIds.size} {(t as any).chat.select || 'Selected'}
               </span>
             </div>
          ) : (
            <div className="flex flex-col">
              <h3 className="font-bold text-sm text-gray-900">{recipientName}</h3>
              {product && (
                <div className="text-[11px] text-gray-500 flex items-center gap-1">
                  <span>{product.title}</span>
                  <span className="font-bold text-red-600">{product.price}</span>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {isSelectionMode ? (
            <>
              <button
                onClick={selectAllMessages}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                {selectedMessageIds.size === messages.length ? (t as any).chat.cancel : (t as any).chat.selectAll}
              </button>
              <button
                onClick={deleteSelectedMessages}
                disabled={selectedMessageIds.size === 0}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedMessageIds.size > 0 
                    ? 'bg-red-600 text-white hover:bg-red-700' 
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {(t as any).chat.delete || 'Delete'}
              </button>
            </>
          ) : (
            <>
              {/* Search Input */}
              <div className="relative">
                <input
                   type="text"
                   placeholder={(t as any).chat.search || "Search"} 
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className="pl-8 pr-4 py-1.5 bg-gray-100 border-transparent rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white w-24 focus:w-48 transition-all outline-none"
                />
                <svg className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Clear History Button */}
              <button
                onClick={toggleSelectionMode}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title={(t as any).chat.clearHistory || 'Clear History'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
        {loading ? (
          <div className="text-center text-gray-400 mt-10">Loading...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-400 mt-10">{(t as any).chat.noConversations}</div>
        ) : (
          messages
          .filter(msg => !searchQuery || (msg.type === 'text' && msg.content?.toLowerCase().includes(searchQuery.toLowerCase())))
          .map((msg) => (
            <div key={msg.id} className="flex items-end gap-3 mb-1 group">
               {isSelectionMode && (
               <div className="mb-4">
               <input 
                     type="checkbox" 
                     checked={selectedMessageIds.has(msg.id)}
                     onChange={() => toggleMessageSelection(msg.id)}
                     className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                     aria-label={(t as any).chat.selectMessage || 'Select message'}
                   />
                 </div>
               )}
               <div className={`flex-1 ${isSelectionMode ? 'pointer-events-none' : ''}`}>
                 <MessageBubble 
                   message={msg} 
                   isOwn={msg.senderId === currentUserId} 
                 />
               </div>
            </div>
          ))
        )}
        {messages.length > 0 && searchQuery && messages.filter(msg => msg.type === 'text' && msg.content?.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
           <div className="text-center text-gray-400 mt-10">
             {(t as any).noResults || 'No results found'}
           </div>
        )}
      </div>

      {/* Input - Hide when in selection mode */}
      {!isSelectionMode && <ChatInput onSend={handleSendMessage} />}
    </div>
  );
}
