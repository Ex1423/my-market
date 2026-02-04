'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

type AuthMode = 'login' | 'register';

function AuthForm() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<AuthMode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  useEffect(() => {
    const err = searchParams.get('error');
    if (err) setUrlError(decodeURIComponent(err));
  }, [searchParams]);

  const handleLogin = async (e: React.MouseEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    if (!username.trim()) {
      setError('请输入用户名');
      return;
    }
    if (!password) {
      setError('请输入密码');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || '登录失败');
        setLoading(false);
        return;
      }
      setSuccess(true);
      setLoading(false);
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '登录失败，请稍后重试');
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.MouseEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    const trimmed = username.trim();
    if (trimmed.length < 3 || trimmed.length > 20) {
      setError('用户名长度必须在3-20个字符之间');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      setError('用户名只能包含字母、数字和下划线');
      return;
    }
    if (password.length < 6) {
      setError('密码长度至少6位');
      return;
    }
    if (password !== confirmPassword) {
      setError('两次密码输入不一致');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: trimmed, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || '注册失败');
        setLoading(false);
        return;
      }
      setSuccess(true);
      setLoading(false);
      // 注册成功后自动登录
      try {
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: trimmed, password }),
        });
        if (loginRes.ok) {
          setTimeout(() => {
            window.location.href = '/';
          }, 1000);
        } else {
          setTimeout(() => { window.location.href = '/login'; }, 1500);
        }
      } catch {
        setTimeout(() => { window.location.href = '/login'; }, 1500);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '注册失败，请稍后重试');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md p-8 space-y-4 bg-white rounded-xl shadow-lg">
          <h1 className="text-2xl font-bold text-center">用户中心</h1>
          <p className="text-center text-sm text-gray-500">登录或注册以继续</p>

          {/* 模式切换 */}
          <div className="flex rounded-lg border border-gray-200 p-1">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); setSuccess(false); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                mode === 'login' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              登录
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(''); setSuccess(false); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                mode === 'register' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              注册
            </button>
          </div>

          {(urlError || error) && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
              {urlError || error}
            </div>
          )}
          {success && (
            <div className="p-3 text-sm text-green-600 bg-green-50 rounded-lg">
              {mode === 'login' ? '登录成功！正在跳转...' : '注册成功！正在自动登录...'}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="auth-username" className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
              <input
                id="auth-username"
                type="text"
                placeholder="请输入用户名"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="auth-password" className="block text-sm font-medium text-gray-700 mb-1">密码</label>
              <input
                id="auth-password"
                type="password"
                placeholder="请输入密码"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {mode === 'register' && (
              <div>
                <label htmlFor="auth-confirm-password" className="block text-sm font-medium text-gray-700 mb-1">确认密码</label>
                <input
                  id="auth-confirm-password"
                  type="password"
                  placeholder="请再次输入密码"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={mode === 'login' ? handleLogin : handleRegister}
              disabled={loading}
              className="flex-1 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {loading ? '提交中...' : mode === 'login' ? '登录' : '注册'}
            </button>
          </div>

          <Link href="/" className="block text-center text-sm text-gray-500 hover:text-blue-600">
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">加载中...</div>}>
      <AuthForm />
    </Suspense>
  );
}
