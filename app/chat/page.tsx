'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import ChatList from '@/components/Chat/ChatList';
import ChatWindow from '@/components/Chat/ChatWindow';
import { useLanguage } from '@/components/LanguageContext';

function ChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  
  const [user, setUser] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [contactSearchQuery, setContactSearchQuery] = useState('');
  const [isProcessingParams, setIsProcessingParams] = useState(false);
  const [pinnedConversationIds, setPinnedConversationIds] = useState<Set<string>>(new Set());

  // Load pinned conversations for current user
  useEffect(() => {
    if (!user?.id) return;
    try {
      const key = `pinnedConversations:${user.id}`;
      const raw = localStorage.getItem(key);
      if (!raw) {
        setPinnedConversationIds(new Set());
        return;
      }
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        setPinnedConversationIds(new Set(arr.filter((x) => typeof x === 'string' && x.length > 0)));
      } else {
        setPinnedConversationIds(new Set());
      }
    } catch {
      setPinnedConversationIds(new Set());
    }
  }, [user?.id]);

  // Persist pinned conversations for current user
  useEffect(() => {
    if (!user?.id) return;
    try {
      const key = `pinnedConversations:${user.id}`;
      localStorage.setItem(key, JSON.stringify(Array.from(pinnedConversationIds)));
    } catch {
      // ignore
    }
  }, [pinnedConversationIds, user?.id]);

  // Initial setup: get user, then conversations
  useEffect(() => {
    const controller = new AbortController();
    
    const timer = setTimeout(() => {
      fetch('/api/auth/me', { signal: controller.signal })
        .then((res) => res.json())
        .then((data) => {
          if (!controller.signal.aborted) {
            if (!data.user) {
              router.push('/auth');
            } else {
              setUser(data.user);
              fetchConversations(data.user.id, controller.signal);
            }
          }
        })
        .catch((e) => {
          if (e.name !== 'AbortError') router.push('/auth');
        });
    }, 50);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, []);

  // Poll for conversation updates
  useEffect(() => {
    if (!user) return;
    
    const controller = new AbortController();
    const interval = setInterval(() => {
      fetchConversations(user.id, controller.signal);
    }, 5000);
    
    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [user]);

  // Handle "start chat" from product page
  useEffect(() => {
    const newChatUserId = searchParams.get('userId');
    const newChatProductId = searchParams.get('productId');

    if (user && newChatUserId && !isProcessingParams) {
      setIsProcessingParams(true);
      // Use undefined if productId is missing
      createConversation(newChatUserId, newChatProductId || undefined);
    }
  }, [user, searchParams]); // Remove isProcessingParams from dep to avoid loop

  const fetchConversations = async (userId: string, signal?: AbortSignal) => {
    try {
      const res = await fetch(`/api/conversations?userId=${userId}`, { signal });
      const data = await res.json();
      if (data.conversations) {
        setConversations(data.conversations);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error('Fetch conversations error', error);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  const createConversation = async (sellerId: string, productId?: string) => {
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerId: user.id,
          sellerId,
          productId
        })
      });
      const data = await res.json();
      if (data.conversation) {
        // Optimistic update: Add to list immediately
        const newConv = { ...data.conversation, unreadCount: 0 };
        setConversations(prev => {
          // Check if already exists to avoid dupes
          const exists = prev.find(c => c.id === newConv.id);
          if (exists) return prev;
          return [newConv, ...prev];
        });
        
        setActiveConversationId(data.conversation.id);
        
        // Clean URL params to prevent re-triggering
        router.replace('/chat');
      }
    } catch (error) {
      console.error('Create conversation failed', error);
    } finally {
      setIsProcessingParams(false);
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      const res = await fetch('/api/conversations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId }),
      });

      if (!res.ok) {
        console.error('Failed to delete conversation');
        return;
      }

      setConversations(prev => prev.filter(c => c.id !== conversationId));
      setPinnedConversationIds(prev => {
        if (!prev.has(conversationId)) return prev;
        const next = new Set(prev);
        next.delete(conversationId);
        return next;
      });

      if (activeConversationId === conversationId) {
        setActiveConversationId(null);
      }
    } catch (error) {
      console.error('Delete conversation request failed', error);
    }
  };

  const handlePinConversation = (conversationId: string) => {
    setPinnedConversationIds(prev => {
      if (prev.has(conversationId)) return prev;
      const next = new Set(prev);
      next.add(conversationId);
      return next;
    });
  };

  const handleUnpinConversation = (conversationId: string) => {
    setPinnedConversationIds(prev => {
      if (!prev.has(conversationId)) return prev;
      const next = new Set(prev);
      next.delete(conversationId);
      return next;
    });
  };

  if (loading || !user || isProcessingParams) {
    return <div className="min-h-screen flex items-center justify-center">{(t as any).loading || 'Loading...'}</div>;
  }

  const activeConversation = conversations.find(c => c.id === activeConversationId);
  const otherUser = activeConversation 
    ? (activeConversation.buyerId === user.id ? activeConversation.seller : activeConversation.buyer)
    : null;

  const visibleConversations = conversations
    .filter(c => {
      if (!contactSearchQuery) return true;
      const other = c.buyerId === user.id ? c.seller : c.buyer;
      return other.username.toLowerCase().includes(contactSearchQuery.toLowerCase());
    })
    .slice()
    .sort((a, b) => {
      const aPinned = pinnedConversationIds.has(a.id);
      const bPinned = pinnedConversationIds.has(b.id);
      if (aPinned !== bPinned) return aPinned ? -1 : 1;
      const at = new Date(a.updatedAt).getTime();
      const bt = new Date(b.updatedAt).getTime();
      return bt - at;
    });

  return (
    <div className="h-screen overflow-hidden bg-gray-50 flex flex-col">
      <Navbar />

      {/* Profile-style tabs: 我的 / 订单 / 收藏 / 消息 */}
      <div className="py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex space-x-4 mb-2 border-b border-gray-200">
            <Link
              href="/profile?tab=info"
              className="pb-2 px-4 font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              {t.profile}
            </Link>
            <Link
              href="/profile?tab=orders"
              className="pb-2 px-4 font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              {(t as any).profilePage?.myOrders || '我的订单'}
            </Link>
            <Link
              href="/profile?tab=favorites"
              className="pb-2 px-4 font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              {(t as any).favorites.myFavorites}
            </Link>
            <Link
              href="/chat"
              className="pb-2 px-4 font-medium transition-colors border-b-2 border-blue-600 text-blue-600"
            >
              {(t as any).chat.title}
            </Link>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 w-full max-w-6xl mx-auto px-4 pb-4 sm:px-6 sm:pb-6 lg:px-8 lg:pb-8">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex h-full border border-gray-200">
          {/* Sidebar */}
          <div className={`w-full md:w-1/4 border-r border-gray-200 flex flex-col ${activeConversationId ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center mb-3">
                <h2 className="font-bold text-gray-800 text-lg">{(t as any).chat.conversations}</h2>
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder={(t as any).chat.searchContacts || "Search contacts"}
                  value={contactSearchQuery}
                  onChange={(e) => setContactSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
                <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <ChatList 
                conversations={visibleConversations} 
                activeId={activeConversationId} 
                onSelect={setActiveConversationId}
                currentUserId={user.id}
                onDeleteConversation={handleDeleteConversation}
                pinnedConversationIds={pinnedConversationIds}
                onPinConversation={handlePinConversation}
                onUnpinConversation={handleUnpinConversation}
              />
            </div>
          </div>

          {/* Main Chat Area */}
          <div className={`w-full md:w-3/4 flex flex-col ${!activeConversationId ? 'hidden md:flex' : 'flex'}`}>
            {activeConversationId && otherUser ? (
              <>
                {/* Mobile Back Button */}
                <div className="md:hidden bg-white px-4 py-2 border-b border-gray-200 flex items-center">
                  <button
                    onClick={() => setActiveConversationId(null)}
                    className="text-gray-700 font-medium px-2 py-1 -ml-2 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors"
                    aria-label={(t as any).chat?.back || (t as any).chat?.backToList || '返回上一页'}
                    title={(t as any).chat?.back || (t as any).chat?.backToList || '返回上一页'}
                  >
                    {(t as any).chat?.back || '返回上一页'}
                  </button>
                  <span className="ml-2 text-sm text-gray-400">{(t as any).chat?.title || '消息'}</span>
                </div>
                <ChatWindow 
                  conversationId={activeConversationId}
                  currentUserId={user.id}
                  recipientName={otherUser.username}
                  product={activeConversation.product}
                />
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400 bg-gray-50">
                <div className="text-center">
                  <div className="text-6xl mb-4">💬</div>
                  <p>{(t as any).chat.selectConversation}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">加载中...</div>}>
      <ChatContent />
    </Suspense>
  );
}
