'use client';

import React, { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/components/LanguageContext';
import { useNotification } from '@/components/NotificationContext';
import ProductCard, { Product } from '@/components/ProductCard';

/**
 * 首页 - 展示真实商品列表
 * 从 products 表读取，按时间倒序，响应式网格布局
 */
function HomeContent() {
  const { t, language, setLanguage } = useLanguage();
  const { unreadCount } = useNotification();
  const pathname = usePathname();
  const [products, setProducts] = useState<Product[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      Promise.all([
        fetch('/api/products', { signal: controller.signal }),
        fetch('/api/auth/me', { signal: controller.signal }),
      ])
        .then(async ([prodRes, userRes]) => {
          if (controller.signal.aborted) return;
          const list = prodRes.ok ? await prodRes.json() : [];
          setProducts(Array.isArray(list) ? list : []);
          if (userRes.ok) {
            const data = await userRes.json();
            setCurrentUser(data.user ?? null);
          }
        })
        .catch((e) => {
          if (e.name !== 'AbortError') console.error(e);
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 50);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-500 text-sm">加载中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 顶部导航 */}
      <nav className="bg-white sticky top-0 z-50 h-16 shadow-sm border-b border-slate-100 flex items-center px-4 sm:px-8">
        <div className="w-full max-w-7xl mx-auto flex justify-between items-center">
          <Link
            href="/"
            onClick={(e) => {
              if (pathname === '/') {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            className="text-xl font-bold text-slate-900 tracking-tight hover:opacity-80 transition-opacity"
          >
            {t.title}
          </Link>

          <div className="flex items-center gap-6 sm:gap-8">
            <Link href="/publish" className="flex flex-col items-center text-slate-600 hover:text-blue-600 transition-colors group">
              <svg className="w-6 h-6 mb-0.5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-xs font-medium">{t.publish || '发布'}</span>
            </Link>
            <Link href="/chat" className="flex flex-col items-center text-slate-600 hover:text-blue-600 transition-colors group relative">
              <svg className="w-6 h-6 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold px-1 min-w-[16px] h-[16px] flex items-center justify-center rounded-full ring-2 ring-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
              <span className="text-xs font-medium">{(t as any).chat?.title || '消息'}</span>
            </Link>
            <Link href="/cart" className="flex flex-col items-center text-slate-600 hover:text-blue-600 transition-colors group">
              <svg className="w-6 h-6 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-xs font-medium">{(t as any).cart?.title || '购物车'}</span>
            </Link>
            {currentUser ? (
              <Link href="/profile" className="flex flex-col items-center text-slate-600 hover:text-blue-600 transition-colors">
                {currentUser.avatar ? (
                  <img src={currentUser.avatar} alt={currentUser.username} className="w-6 h-6 rounded-full object-cover mb-0.5" />
                ) : (
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mb-0.5">
                    {currentUser.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                <span className="text-xs font-medium">{t.profile || '我的'}</span>
              </Link>
            ) : (
              <Link href="/auth" className="flex flex-col items-center text-slate-600 hover:text-blue-600 transition-colors group">
                <svg className="w-6 h-6 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-xs font-medium">{t.login || '登录'}</span>
              </Link>
            )}
            <div className="ml-4 border-l border-slate-200 pl-4">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                aria-label="选择语言"
                className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-md py-1.5 pl-3 pr-8 cursor-pointer hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="zh">CN</option>
                <option value="en">EN</option>
                <option value="ru">RU</option>
                <option value="kk">KZ</option>
              </select>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto py-8 px-4 sm:px-6 max-w-7xl">
        {products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <span className="text-4xl">📦</span>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">暂无宝贝，快去发布吧！</h3>
            <p className="text-slate-500 text-sm mb-6">发布你的第一件商品，让更多人看到</p>
            <Link
              href="/publish"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
            >
              去发布
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50">加载中...</div>}>
      <HomeContent />
    </Suspense>
  );
}
