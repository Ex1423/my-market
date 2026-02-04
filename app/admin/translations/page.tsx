'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

type Translation = {
  id: string;
  sourceText: string;
  targetLang: string;
  translatedText: string;
  updatedAt: string;
};

export default function AdminTranslationsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [search, setSearch] = useState('');
  
  // Edit State
  const [editingItem, setEditingItem] = useState<Translation | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    
    const timer = setTimeout(() => {
      fetch('/api/auth/me', { signal: controller.signal })
        .then(async (res) => {
          if (!controller.signal.aborted) {
            if (res.ok) {
               const data = await res.json();
               if (data.user?.role !== 'admin') {
                   router.push('/');
               } else {
                   setCurrentUser(data.user);
               }
            } else {
                router.push('/auth');
            }
          }
        })
        .catch((e) => {
          if (e.name !== 'AbortError') router.push('/auth');
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 50);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [router]);

  const fetchTranslations = (query = '') => {
    fetch(`/api/admin/translations?search=${encodeURIComponent(query)}`)
      .then(res => res.json())
      .then(data => {
          if (data.translations) {
              setTranslations(data.translations);
          }
      })
      .catch(console.error);
  };

  useEffect(() => {
    if (currentUser) {
      fetchTranslations(search);
    }
  }, [currentUser, search]);

  const handleSave = async (id: string) => {
    try {
      const res = await fetch('/api/admin/translations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, translatedText: editValue })
      });

      if (res.ok) {
        setEditingItem(null);
        fetchTranslations(search);
      } else {
        alert('Update failed');
      }
    } catch (e) {
      console.error(e);
      alert('Update failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除这条翻译缓存吗？')) return;
    try {
      const res = await fetch(`/api/admin/translations?id=${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchTranslations(search);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;
  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">翻译缓存管理 (Translation Memory)</h1>
        
        <div className="mb-6">
          <input
            type="text"
            placeholder="搜索原文 or 译文..."
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">原文 (Source)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">语言</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">译文 (Translation)</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-32">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {translations.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 text-sm text-gray-900 break-words">{item.sourceText}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{item.targetLang}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {editingItem?.id === item.id ? (
                      <div className="flex gap-2">
                        <textarea
                          className="w-full border rounded p-1"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          rows={2}
                          aria-label="编辑译文"
                          placeholder="输入译文"
                          title="编辑译文"
                        />
                      </div>
                    ) : (
                      <span className="break-words">{item.translatedText}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {editingItem?.id === item.id ? (
                      <div className="flex flex-col gap-2">
                        <button onClick={() => handleSave(item.id)} className="text-green-600 hover:text-green-900">保存</button>
                        <button onClick={() => setEditingItem(null)} className="text-gray-600 hover:text-gray-900">取消</button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <button 
                          onClick={() => { setEditingItem(item); setEditValue(item.translatedText); }} 
                          className="text-blue-600 hover:text-blue-900"
                        >
                          编辑
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900">删除</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {translations.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">暂无数据</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
