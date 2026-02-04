'use client';

import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/components/LanguageContext';
import styles from './ChatList.module.css';

interface Conversation {
  id: string;
  updatedAt: string;
  buyer: { id: string; username: string };
  seller: { id: string; username: string };
  product: { id: string; title: string; imageData: string | null; images: { url: string }[] } | null;
  messages: { content: string; type: string; createdAt: string }[];
  unreadCount?: number;
}

interface ChatListProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  currentUserId: string;
  onDeleteConversation?: (id: string) => void;
  pinnedConversationIds?: Set<string>;
  onPinConversation?: (id: string) => void;
  onUnpinConversation?: (id: string) => void;
}

export default function ChatList({
  conversations,
  activeId,
  onSelect,
  currentUserId,
  onDeleteConversation,
  pinnedConversationIds,
  onPinConversation,
  onUnpinConversation,
}: ChatListProps) {
  const { t } = useLanguage();
  const [contextMenu, setContextMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Apply context-menu position without JSX inline styles
  useEffect(() => {
    if (!contextMenu) return;
    if (!menuRef.current) return;

    menuRef.current.style.setProperty('--chat-context-menu-left', `${contextMenu.x}px`);
    menuRef.current.style.setProperty('--chat-context-menu-top', `${contextMenu.y}px`);
  }, [contextMenu]);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };

    if (contextMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [contextMenu]);

  const handleContextMenu = (e: React.MouseEvent, conversationId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      id: conversationId,
      x: e.clientX,
      y: e.clientY
    });
  };

  const handleDelete = (conversationId: string) => {
    if (onDeleteConversation) {
      onDeleteConversation(conversationId);
    }
    setContextMenu(null);
  };

  const handlePin = (conversationId: string) => {
    if (onPinConversation) {
      onPinConversation(conversationId);
    }
    setContextMenu(null);
  };

  const handleUnpin = (conversationId: string) => {
    if (onUnpinConversation) {
      onUnpinConversation(conversationId);
    }
    setContextMenu(null);
  };

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
        <p>{(t as any).chat.noConversations}</p>
      </div>
    );
  }

  return (
    <div
      className="overflow-y-auto h-full p-2 space-y-1 bg-gray-50 relative"
      onScroll={() => setContextMenu(null)}
    >
      {conversations.map((conv) => {
        const otherUser = conv.buyer.id === currentUserId ? conv.seller : conv.buyer;
        const lastMessage = conv.messages[0];
        const productImage = conv.product?.images?.[0]?.url || conv.product?.imageData;
        const isActive = activeId === conv.id;
        const isPinned = pinnedConversationIds?.has(conv.id) ?? false;

        return (
          <div
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            onContextMenu={(e) => handleContextMenu(e, conv.id)}
            className={`py-1.5 px-2 rounded-xl cursor-pointer transition-all duration-200 relative group ${
              isActive
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md shadow-blue-200'
                : isPinned
                  ? 'bg-amber-50 hover:bg-amber-100/60 text-gray-800 border border-amber-200 hover:border-amber-300'
                  : 'bg-white hover:bg-gray-50 text-gray-800 border border-transparent hover:border-gray-100'
            }`}
          >
            {isPinned && !isActive && (
              <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-semibold border border-amber-200 shadow-sm">
                {(t as any).chat?.pinned || '已置顶'}
              </div>
            )}
            <div className="flex gap-2 items-center">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold relative overflow-hidden shadow-sm ${
                  isActive ? 'bg-white/20 text-white border-2 border-white/30' : 'bg-gray-100 text-gray-500'
                }`}>
                  {productImage ? (
                    <img src={productImage} alt="Product" className="w-full h-full object-cover" />
                  ) : (
                    otherUser.username.charAt(0).toUpperCase()
                  )}
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 min-w-0 flex justify-between items-center gap-2">
                {/* Left: Identity (Name + Product) */}
                <div className="flex flex-col justify-center min-w-0">
                   <div className="flex items-baseline gap-2 w-full">
                      <h4 className={`font-bold text-sm truncate ${isActive ? 'text-white' : 'text-gray-900'}`}>
                        {otherUser.username}
                      </h4>
                      {conv.product && (
                        <span className={`text-[10px] truncate max-w-[80px] ${isActive ? 'text-blue-200' : 'text-gray-500'}`}>
                          {conv.product.title}
                        </span>
                      )}
                   </div>
                </div>

                {/* Right: Status (Time + Message) */}
                <div className="flex flex-col items-end flex-shrink-0 gap-0.5">
                  {lastMessage && (
                    <>
                      <span className={`text-[10px] ${isActive ? 'text-blue-100' : 'text-gray-400'}`}>
                        {new Date(lastMessage.createdAt).toLocaleDateString()}
                      </span>
                      <p className={`text-xs truncate max-w-[100px] text-right ${isActive ? 'text-blue-50' : 'text-gray-500'}`}>
                        {lastMessage.type === 'text'
                          ? lastMessage.content
                          : `[${(t as any).chat[lastMessage.type] || lastMessage.type}]`}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
            {typeof conv.unreadCount === 'number' && conv.unreadCount > 0 && (
              <div className="absolute top-2 right-2 min-w-[16px] h-[16px] px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white z-10 shadow-sm">
                {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
              </div>
            )}
          </div>
        );
      })}
      
      {/* Context Menu */}
      {contextMenu && (onDeleteConversation || onPinConversation || onUnpinConversation) && (
        <div
          ref={menuRef}
          className={`fixed bg-white border border-gray-200 rounded-lg shadow-xl py-1 z-50 min-w-[120px] ${styles.contextMenuPosition}`}
        >
          {(() => {
            const isPinned = pinnedConversationIds?.has(contextMenu.id) ?? false;
            return (
              <>
                {!isPinned && onPinConversation && (
                  <button
                    onClick={() => handlePin(contextMenu.id)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 4v4l5 5-4 4-5-5H7V8l8-4zM8 15l-4 5" />
                    </svg>
                    {(t as any).chat?.pin || '置顶'}
                  </button>
                )}

                {isPinned && onUnpinConversation && (
                  <button
                    onClick={() => handleUnpin(contextMenu.id)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 4v4l5 5-4 4-5-5H7V8l8-4zM3 21l6-6" />
                    </svg>
                    {(t as any).chat?.unpin || '取消置顶'}
                  </button>
                )}

                {(onDeleteConversation) && (
                  <>
                    <div className="my-1 border-t border-gray-100" />
                    <button
                      onClick={() => handleDelete(contextMenu.id)}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      {(t as any).chat?.deleteConversation || '删除会话'}
                    </button>
                  </>
                )}
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
