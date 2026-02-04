'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useLanguage } from '@/components/LanguageContext';

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      let data;
      try {
        data = await res.json();
      } catch (e) {
        // 如果解析 JSON 失败（比如返回了 404/500 HTML 页面）
        console.error('JSON 解析失败:', e);
        throw new Error('服务器响应错误，请稍后重试');
      }

      if (!res.ok) {
        throw new Error(data.error || (t.auth?.loginTitle || '登录') + '失败');
      }

      // 登录成功
      setSuccess(true);
      setLoading(false);
      
      // 延迟跳转，让用户看到成功提示
      setTimeout(() => {
        router.push('/');
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }, 500);
    } catch (err: any) {
      setError(err.message || '登录失败，请稍后重试');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-md">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">{t.auth?.loginTitle || '登录'}</h2>
          <p className="mt-2 text-sm text-gray-600">
            {t.auth?.noAccount || '还没有账号？'}
            <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
              {t.auth?.registerNow || '立即注册'}
            </Link>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md text-sm">
              {t.auth?.loginSuccess || '登录成功！正在跳转...'}
            </div>
          )}
          
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">{t.auth?.username || '用户名'}</label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder={t.auth?.username || '用户名'}
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">{t.auth?.password || '密码'}</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder={t.auth?.password || '密码'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? (t.auth?.loggingIn || '登录中...') : (t.auth?.loginButton || '登录')}
            </button>
          </div>
        </form>
      </div>
    </div>
    </div>
  );
}
