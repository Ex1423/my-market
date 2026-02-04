'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLanguage } from '@/components/LanguageContext';
import { useNotification } from '@/components/NotificationContext';
import { useEffect, useState } from 'react';
import styles from './MobileBottomNav.module.css';

export default function MobileBottomNav() {
  const { t } = useLanguage();
  const { unreadCount } = useNotification();
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [categoryList, setCategoryList] = useState<any[]>([]);

  const CATEGORY_ICONS: Record<string, string> = {
    '家居生活': '🏠',
    '日用百货': '🧻',
    '数码家电': '📱',
    '服饰鞋包': '👕',
    '美妆个护': '💄',
    '食品生鲜': '🍎',
    '酒水饮料': '🍷',
    '运动户外': '🏀',
    '母婴用品': '🍼',
    '图书文创': '📚',
    '农资园艺': '🌻',
    '宠物用品': '🐶',
    '汽车用品': '🚗',
    '医药健康': '💊',
  };

  useEffect(() => {
    // Initial static list
    const staticList = [
      { key: 'all', icon: '🔍', label: (t as any).categories?.all || '全部' },
      ...Object.keys(CATEGORY_ICONS).map(key => ({
        key,
        icon: CATEGORY_ICONS[key],
        label: key
      }))
    ];
    setCategoryList(staticList);

    // Fetch dynamic list
    fetch('/api/categories')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.categories) {
          const dynamicList = data.categories.map((cat: any) => ({
            key: cat.name,
            icon: CATEGORY_ICONS[cat.name] || '📦',
            label: cat.name
          }));
          setCategoryList([
            { key: 'all', icon: '🔍', label: (t as any).categories?.all || '全部' },
            ...dynamicList
          ]);
        }
      })
      .catch(console.error);
  }, [t]);

  useEffect(() => {
    const controller = new AbortController();
    
    const timer = setTimeout(() => {
      fetch('/api/auth/me', { signal: controller.signal })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (!controller.signal.aborted && data?.user) setCurrentUser(data.user);
        })
        .catch((e) => {
          if (e.name !== 'AbortError') console.error(e);
        });
    }, 50);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, []);

  const isActive = (path: string) => pathname === path;

  return (
    <>
      {/* Category Modal Overlay */}
      {isCategoryOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-end md:hidden animate-in fade-in duration-200" onClick={() => setIsCategoryOpen(false)}>
          <div 
            className={`bg-white w-full rounded-t-2xl p-6 max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom duration-300 ${styles.categoryModal}`}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">{(t as any).category || '分类'}</h2>
              <button 
                onClick={() => setIsCategoryOpen(false)}
                className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                aria-label="关闭"
                title="关闭"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {categoryList.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => {
                    router.push(`/?category=${cat.key}`);
                    setIsCategoryOpen(false);
                  }}
                  className="flex flex-col items-center justify-center gap-2 p-2 rounded-xl active:scale-95 transition-transform"
                >
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-2xl shadow-sm border border-gray-100">
                    {cat.icon}
                  </div>
                  <span className="text-xs font-medium text-gray-700">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe z-50 md:hidden">
        <div className="flex justify-around items-center h-16">
        {/* Home */}
        <Link 
          href="/" 
          onClick={() => setIsCategoryOpen(false)}
          className={`flex flex-col items-center justify-center w-full h-full ${isActive('/') ? styles.navItemActive : styles.navItemInactive}`}
        >
          {isActive('/') ? (
            <svg className="w-6 h-6 mb-1" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z"/></svg>
          ) : (
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
          )}
          <span className="text-[10px] font-medium">{(t as any).nav?.home || '首页'}</span>
        </Link>

        {/* Category (Replaces Messages) */}
        <button 
          onClick={() => setIsCategoryOpen(true)}
          className={`flex flex-col items-center justify-center w-full h-full ${isCategoryOpen ? styles.navItemActive : styles.navItemInactive}`}
        >
          <div className="relative">
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </div>
          <span className="text-[10px] font-medium">{(t as any).category || '分类'}</span>
        </button>

        {/* Cart */}
        <Link 
          href="/cart" 
          onClick={() => setIsCategoryOpen(false)}
          className={`flex flex-col items-center justify-center w-full h-full ${isActive('/cart') ? styles.navItemActive : styles.navItemInactive}`}
        >
          {isActive('/cart') ? (
            <svg className="w-6 h-6 mb-1" viewBox="0 0 24 24" fill="currentColor"><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/></svg>
          ) : (
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          )}
          <span className="text-[10px] font-medium">{(t as any).cart?.title || '购物车'}</span>
        </Link>

        {/* Profile (Me) */}
        <Link 
          href={currentUser ? "/profile" : "/auth"} 
          onClick={() => setIsCategoryOpen(false)}
          className={`flex flex-col items-center justify-center w-full h-full ${(isActive('/profile') || isActive('/auth')) ? styles.navItemActive : styles.navItemInactive}`}
        >
          {isActive('/profile') || isActive('/auth') ? (
            <svg className="w-6 h-6 mb-1" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
          ) : (
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          )}
          <span className="text-[10px] font-medium">{t.profile || '我的'}</span>
        </Link>
      </div>
    </div>
    </>
  );
}
