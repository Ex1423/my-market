'use client'; // 声明这是一个客户端组件，处理点击和输入
import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

// 用户名校验：仅字母、数字、下划线，长度 3-15 位
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,15}$/;

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  useEffect(() => {
    const err = searchParams.get('error');
    if (err) setUrlError(decodeURIComponent(err));
  }, [searchParams]);

  // 获取当前站点 URL（用于邮箱确认重定向）
  const getRedirectUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/auth/callback`;
    }
    return process.env.NEXT_PUBLIC_SITE_URL
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
      : 'http://localhost:3000/auth/callback';
  };

  // 处理注册逻辑
  const handleSignUp = async () => {
    const trimmed = username.trim();
    if (!USERNAME_REGEX.test(trimmed)) {
      alert('用户名需 3-15 位，仅支持字母、数字和下划线');
      return;
    }
    setLoading(true);
    const { supabase } = await import('@/lib/supabase');
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username: trimmed },
        emailRedirectTo: getRedirectUrl(),
      },
    });
    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }
    alert('注册成功！请登录');
    setLoading(false);
  };

  // 处理登录逻辑
  const handleLogin = async () => {
    setLoading(true);
    const { supabase } = await import('@/lib/supabase');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }
    setLoading(false);
    router.push('/');
    router.refresh();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-4 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center">用户中心</h1>
        <p className="text-center text-sm text-gray-500">登录或注册以继续</p>
        {urlError && (
          <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
            {urlError}
          </div>
        )}
        <input
          type="text"
          placeholder="用户名（3-15位，仅字母数字下划线）"
          className="w-full p-2 border rounded"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="email"
          placeholder="邮箱"
          className="w-full p-2 border rounded"
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="密码"
          className="w-full p-2 border rounded"
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="flex space-x-4">
          <button
            onClick={handleLogin}
            disabled={loading}
            className="flex-1 p-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? '提交中...' : '登录'}
          </button>
          <button
            onClick={handleSignUp}
            disabled={loading}
            className="flex-1 p-2 text-white bg-green-500 rounded-lg hover:bg-green-600 disabled:opacity-50"
          >
            注册
          </button>
        </div>
        <Link href="/" className="block text-center text-sm text-gray-500 hover:text-blue-600">
          返回首页
        </Link>
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