'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/components/LanguageContext';
import { useNotification } from '@/components/NotificationContext';

export default function Navbar() {
  const { t } = useLanguage();
  const { unreadCount } = useNotification();
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const controller = new AbortController();
    
    // Use a small timeout to prevent double-fetch in React Strict Mode (Development)
    // This avoids the "net::ERR_ABORTED" error in the console when the component mounts/unmounts rapidly
    const timer = setTimeout(() => {
      async function fetchUser() {
        try {
          const res = await fetch('/api/auth/me', { signal: controller.signal });
          if (res.ok) {
            const data = await res.json();
            if (!controller.signal.aborted) {
              setCurrentUser(data.user);
            }
          }
        } catch (error: any) {
          if (error.name !== 'AbortError') {
            console.error('获取用户失败:', error);
          }
        }
      }
      fetchUser();
    }, 50);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, []);

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50 hidden md:block">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
           {/* Logo / 标题 */}
          <Link
            href="/"
            onClick={(e) => {
              if (pathname === '/') {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <Image 
              src="/logo.png" 
              alt={t.title} 
              width={40} 
              height={40} 
              className="object-contain"
              priority
            />
            <span className="text-xl font-bold text-gray-800 hidden sm:inline">{t.title}</span>
          </Link>

          {/* Center: Navigation & Search (Desktop) */}
          <div className="hidden md:flex items-center gap-6 flex-1 mx-8 justify-center">
            <Link href="/" className="text-gray-600 hover:text-gray-900 font-medium">
              {(t as any).nav?.home || '首页'}
            </Link>


            
            <div className="relative w-full max-w-[200px]">
              <input 
                type="text" 
                placeholder={(t as any).nav?.search || '搜索'}
                className="w-full pl-9 pr-4 py-1.5 bg-gray-100 border-transparent focus:bg-white focus:border-blue-500 rounded-full text-sm transition-all"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">🔍</span>
            </div>
          </div>
           
           {/* User Actions */}
           <div className="flex items-center gap-4 text-sm">
            <Link href="/cart" className="text-xl text-gray-600 hover:text-blue-600 relative">
               🛒
            </Link>
            
            {currentUser ? (
              <>
                <span className="text-gray-600 hidden sm:inline">{t.hello}, {currentUser.username}</span>
                <Link href="/chat" className="text-gray-600 hover:text-blue-600 relative group">
                  {(t as any).chat.title}
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-3 bg-red-500 text-white text-[10px] font-bold px-1 min-w-[14px] h-[14px] flex items-center justify-center rounded-full shadow-sm animate-pulse">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>
                <Link href="/profile" className="text-blue-600 hover:underline">{t.profile}</Link>
                {currentUser.role === 'admin' && (
                  <>
                    <Link href="/admin/users" className="text-purple-600 hover:underline">{t.admin}</Link>
                    <Link href="/admin/categories" className="text-purple-600 hover:underline ml-2 text-xs">
                       {(t as any).adminNav?.categories || '分类'}
                    </Link>
                  </>
                )}
              </>
            ) : (
              <>
                <Link href="/auth" className="text-gray-600 hover:text-blue-600">{t.login}</Link>
                <Link href="/auth" className="text-blue-600 hover:underline">{t.register}</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
