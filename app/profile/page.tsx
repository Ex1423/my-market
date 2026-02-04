'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import CacheCleaner from '@/components/CacheCleaner';
import { useLanguage } from '@/components/LanguageContext';
import { useNotification } from '@/components/NotificationContext';
import FavoriteItem from '@/components/FavoriteItem';
import { supabase } from '@/lib/supabase';

interface FavoriteItem {
  id: string;
  productId: string;
  category: string;
  createdAt: string;
  product: {
    id: string;
    title: string;
    price: string;
    imageData: string | null;
    location: string | null;
    images: { url: string }[];
  };
}

const AVATAR_PRESETS = [
  'https://api.dicebear.com/9.x/notionists/svg?seed=Leo',
  'https://api.dicebear.com/9.x/notionists/svg?seed=Bella',
  'https://api.dicebear.com/9.x/notionists/svg?seed=Max',
  'https://api.dicebear.com/9.x/notionists/svg?seed=Zoe',
  'https://api.dicebear.com/9.x/notionists/svg?seed=Kai',
  'https://api.dicebear.com/9.x/notionists/svg?seed=Mia'
];

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t, language, setLanguage } = useLanguage();
  const { playSound } = useNotification();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const initialTab = (searchParams.get('tab') as 'info' | 'favorites' | 'orders') || 'info';
  const [activeTab, setActiveTab] = useState<'info' | 'favorites' | 'orders'>(initialTab);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ username: '', avatar: '', phone: '', notificationSound: 'default', receiverName: '', address: '' });
  const [addressSaving, setAddressSaving] = useState(false);
  const [addressSaveMsg, setAddressSaveMsg] = useState<'success' | 'error' | null>(null);
  const [addressSaveErr, setAddressSaveErr] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    if (!(await ensureSessionAndRedirect())) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('File size too large (max 2MB)');
      return;
    }
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    setAvatarUploading(true);
    try {
      const { error } = await supabase.storage.from('avatars').upload(path, file, {
        cacheControl: '3600',
        upsert: true,
      });
      if (error) throw error;
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      setEditForm(prev => ({ ...prev, avatar: data.publicUrl }));
    } catch (err) {
      console.error('Avatar upload error:', err);
      const msg = err instanceof Error ? err.message : '';
      const isAuthErr = /unauthorized|jwt|session|401/i.test(msg);
      alert(isAuthErr ? '请重新登录' : (msg || '上传失败，请重试'));
      if (isAuthErr) router.push('/auth');
    } finally {
      setAvatarUploading(false);
      e.target.value = '';
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    
    const timer = setTimeout(() => {
      fetch('/api/auth/me', { signal: controller.signal, credentials: 'include' })
        .then((res) => res.json())
        .then((data) => {
          if (!controller.signal.aborted) {
            if (!data.user) {
              router.push('/auth');
            } else {
              setUser(data.user);
              setEditForm({
                username: data.user.username || '',
                avatar: data.user.avatar || '',
                phone: data.user.phone || '',
                notificationSound: data.user.notificationSound || 'default',
                receiverName: data.user.receiverName || '',
                address: data.user.address || ''
              });
            }
          }
        })
        .catch((err) => {
          if (err.name !== 'AbortError') {
            console.error(err);
            router.push('/auth');
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setLoading(false);
          }
        });
    }, 50);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [router]);

  useEffect(() => {
    const controller = new AbortController();
    if (activeTab === 'favorites' && user) {
      setFavoritesLoading(true);
      fetch(`/api/favorites?userId=${user.id}`, { signal: controller.signal, credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          if (!controller.signal.aborted && data.favorites) {
            setFavorites(data.favorites);
          }
        })
        .catch(err => {
          if (err.name !== 'AbortError') console.error(err);
        })
        .finally(() => {
          if (!controller.signal.aborted) setFavoritesLoading(false);
        });
    } else if (activeTab === 'orders' && user) {
      setOrdersLoading(true);
      fetch('/api/orders', { signal: controller.signal, credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          if (!controller.signal.aborted && data.orders) {
            setOrders(data.orders);
          }
        })
        .catch(err => {
          if (err.name !== 'AbortError') console.error(err);
        })
        .finally(() => {
          if (!controller.signal.aborted) setOrdersLoading(false);
        });
    }
    return () => controller.abort();
  }, [activeTab, user]);

  const getAuthHeaders = async (): Promise<HeadersInit> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    try {
      await supabase.auth.refreshSession();
      const { data } = await supabase.auth.getSession();
      if (data?.session?.access_token) {
        headers['Authorization'] = `Bearer ${data.session.access_token}`;
      }
    } catch (_) {}
    return headers;
  };

  const ensureSessionAndRedirect = async (): Promise<boolean> => {
    try {
      const { data } = await supabase.auth.getSession();
      if (!data?.session?.access_token) {
        alert('请重新登录');
        router.push('/auth');
        return false;
      }
      return true;
    } catch {
      alert('请重新登录');
      router.push('/auth');
      return false;
    }
  };

  const handleAuthError = (res: Response, data: { error?: string }) => {
    const msg = res.status === 401 ? '请重新登录' : (data?.error || '操作失败');
    alert(msg);
    if (res.status === 401) router.push('/auth');
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(await ensureSessionAndRedirect())) return;
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify(editForm)
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setUser(data.user);
        setIsEditing(false);
        alert('Profile updated successfully');
      } else {
        handleAuthError(res, data);
      }
    } catch (error) {
      console.error('Update profile error', error);
      alert('请重新登录');
      router.push('/auth');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    window.location.href = '/auth';
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(await ensureSessionAndRedirect())) return;
    setAddressSaving(true);
    setAddressSaveMsg(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          phone: editForm.phone,
          receiverName: editForm.receiverName,
          address: editForm.address
        })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setUser(data.user);
        setAddressSaveMsg('success');
        setTimeout(() => setAddressSaveMsg(null), 3000);
      } else {
        const errMsg = res.status === 401 ? '请重新登录' : (data?.error || `HTTP ${res.status}`);
        setAddressSaveMsg('error');
        setAddressSaveErr(errMsg);
        setTimeout(() => { setAddressSaveMsg(null); setAddressSaveErr(''); }, 5000);
        if (res.status === 401) router.push('/auth');
      }
    } catch (err) {
      console.error('Save address error:', err);
      setAddressSaveMsg('error');
      setAddressSaveErr('请重新登录');
      setTimeout(() => { setAddressSaveMsg(null); setAddressSaveErr(''); }, 5000);
      router.push('/auth');
    } finally {
      setAddressSaving(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">{(t as any).profilePage?.loading || '加载中...'}</div>;
  }

  if (!user) return null;

  // Group favorites by category
  const groupedFavorites = favorites.reduce((acc, fav) => {
    const cat = fav.category || (t as any).favorites.defaultCategory;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(fav);
    return acc;
  }, {} as Record<string, FavoriteItem[]>);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Tabs */}
          <div className="flex space-x-4 mb-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('info')}
              className={`pb-2 px-4 font-medium transition-colors ${
                activeTab === 'info' 
                  ? 'border-b-2 border-blue-600 text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.profile}
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`pb-2 px-4 font-medium transition-colors ${
                activeTab === 'orders' 
                  ? 'border-b-2 border-blue-600 text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {(t as any).profilePage?.myOrders || '我的订单'}
            </button>
            <button
              onClick={() => setActiveTab('favorites')}
              className={`pb-2 px-4 font-medium transition-colors ${
                activeTab === 'favorites' 
                  ? 'border-b-2 border-blue-600 text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {(t as any).favorites.myFavorites}
            </button>
            <Link 
              href="/chat"
              className="pb-2 px-4 font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              {(t as any).chat.title}
            </Link>
          </div>

          {activeTab === 'info' ? (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">{t.profile}</h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">{(t as any).profilePage?.viewDetails || '详情'}</p>
                </div>
                <div className="flex gap-2">
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      {(t as any).profilePage?.edit || '编辑'}
                    </button>
                  )}
                  <button
                    onClick={handleLogout}
                    className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    {(t as any).profilePage?.logout || '退出'}
                  </button>
                </div>
              </div>



              <div className="border-t border-gray-200">
                {isEditing ? (
                  <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">{(t as any).profilePage?.username || '用户名'}</label>
                      <input
                        type="text"
                        value={editForm.username}
                        onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                        placeholder={(t as any).profilePage?.usernamePlaceholder || '请输入用户名'}
                        title={(t as any).profilePage?.username || '用户名'}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">{(t as any).profilePage?.avatar || '头像'}</label>
                      <div className="mt-2 space-y-4">
                        <div className="flex items-center gap-4">
                          {editForm.avatar ? (
                            <img src={editForm.avatar} alt="Preview" className="h-16 w-16 rounded-full border object-cover" />
                          ) : (
                            <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-xl">
                              {editForm.username?.[0]?.toUpperCase()}
                            </div>
                          )}
                          <div className="flex flex-col gap-2">
                            <button
                              type="button"
                              disabled={avatarUploading}
                              onClick={() => fileInputRef.current?.click()}
                              className="text-sm bg-white border border-gray-300 py-1 px-3 rounded-md hover:bg-gray-50 disabled:opacity-50"
                            >
                              {avatarUploading ? '上传中...' : ((t as any).profilePage?.uploadImage || '上传图片')}
                            </button>
                            <input
                              type="file"
                              ref={fileInputRef}
                              hidden
                              accept="image/*"
                              onChange={handleAvatarUpload}
                            />
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-xs text-gray-500 mb-2">{(t as any).profilePage?.choosePreset || '选择预设'}</p>
                          <div className="flex gap-2 flex-wrap">
                            {AVATAR_PRESETS.map((preset, index) => (
                              <button
                                key={index}
                                type="button"
                                onClick={() => setEditForm({ ...editForm, avatar: preset })}
                                className={`h-10 w-10 rounded-full overflow-hidden border-2 transition-all ${
                                  editForm.avatar === preset ? 'border-blue-500 ring-2 ring-blue-200' : 'border-transparent hover:border-gray-300'
                                }`}
                              >
                                <img src={preset} alt={`头像预设 ${index + 1}`} className="w-full h-full object-cover" />
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">{(t as any).profilePage?.notificationSound || '音效'}</label>
                      <div className="flex gap-2 mt-1">
                        <select
                          value={editForm.notificationSound}
                          onChange={(e) => setEditForm({ ...editForm, notificationSound: e.target.value })}
                          title={(t as any).profilePage?.notificationSound || '音效'}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                        >
                          <option value="default">Default (Standard)</option>
                          <option value="chime">Chime (Soft)</option>
                          <option value="alert">Alert (Loud)</option>
                          <option value="none">None (Mute)</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => playSound(editForm.notificationSound)}
                          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors flex items-center justify-center"
                          title="Test sound"
                        >
                          🔊
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-4 py-2 rounded-md text-sm font-medium"
                      >
                        {(t as any).profilePage?.cancel || '取消'}
                      </button>
                      <button
                        type="submit"
                        className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium"
                      >
                        {(t as any).profilePage?.save || '保存'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <dl>
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">{(t as any).profilePage?.avatar || '头像'}</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {user.avatar ? (
                          <img src={user.avatar} alt="Avatar" className="h-10 w-10 rounded-full" />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">
                            {user.username?.[0]?.toUpperCase()}
                          </div>
                        )}
                      </dd>
                    </div>
                    <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">{(t as any).profilePage?.username || '用户名'}</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{user.username}</dd>
                    </div>
                    <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">{(t as any).profilePage?.notificationSound || '消息提示音'}</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 capitalize">{user.notificationSound || 'default'}</dd>
                    </div>
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">{(t as any).profilePage?.role || '角色'}</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                          {user.role === 'admin' 
                            ? ((t as any).profilePage?.adminRole || '管理员') 
                            : ((t as any).profilePage?.userRole || '普通用户')}
                        </span>
                      </dd>
                    </div>
                    <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">{(t as any).profilePage?.language || '语言'}</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        <select
                          value={language}
                          onChange={(e) => setLanguage(e.target.value as any)}
                          title={(t as any).profilePage?.language || '语言'}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md max-w-xs"
                        >
                          <option value="zh">简体中文</option>
                          <option value="en">English</option>
                          <option value="ru">Русский</option>
                          <option value="kk">Қазақша</option>
                        </select>
                      </dd>
                    </div>
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">{(t as any).profilePage?.registeredAt || '注册时间'}</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {new Date(user.createdAt).toLocaleString()}
                      </dd>
                    </div>
                    <CacheCleaner />
                  </dl>
                )}
              </div>

              {/* 收货信息设置 */}
              <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-4 sm:px-6 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">{(t as any).profilePage?.shippingInfo || '收货信息'}</h3>
                  <p className="mt-1 text-sm text-gray-500">{(t as any).profilePage?.shippingInfoDesc || '用于订单配送，结算时自动带入'}</p>
                </div>
                <form onSubmit={handleSaveAddress} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{(t as any).profilePage?.receiverName || '收货人'}</label>
                    <input
                      type="text"
                      value={editForm.receiverName}
                      onChange={(e) => setEditForm({ ...editForm, receiverName: e.target.value })}
                      placeholder={(t as any).profilePage?.receiverNamePlaceholder || '请输入收货人姓名'}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                      aria-label="收货人"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{(t as any).profilePage?.contactPhone || '联系人电话'}</label>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      placeholder={(t as any).profilePage?.phonePlaceholder || '请输入手机号'}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                      aria-label="联系人电话"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{(t as any).profilePage?.address || '收货地址'}</label>
                    <textarea
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      placeholder={(t as any).profilePage?.addressPlaceholder || '省市区+详细地址'}
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border resize-none"
                      aria-label="收货地址"
                    />
                  </div>
                  <div className="pt-2 flex items-center gap-3">
                    <button
                      type="submit"
                      disabled={addressSaving}
                      className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                    >
                      {addressSaving ? '保存中...' : ((t as any).profilePage?.save || '保存')}
                    </button>
                    {addressSaveMsg === 'success' && (
                      <span className="text-sm text-green-600 font-medium">{(t as any).profilePage?.saveSuccess || '保存成功'}</span>
                    )}
                    {addressSaveMsg === 'error' && (
                      <span className="text-sm text-red-600 font-medium" title={addressSaveErr}>
                        {(t as any).profilePage?.saveFailed || '保存失败'}
                        {addressSaveErr && `: ${addressSaveErr}`}
                      </span>
                    )}
                  </div>
                </form>
              </div>
            </div>
          ) : activeTab === 'orders' ? (
            <div className="space-y-6">
              {ordersLoading ? (
                 <div className="text-center py-12 text-gray-500">{(t as any).profilePage?.loadingOrders || '加载订单中...'}</div>
              ) : orders.length === 0 ? (
                 <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                   <p className="text-gray-500">{(t as any).profilePage?.noOrders || '暂无订单'}</p>
                   <Link href="/" className="text-blue-600 hover:underline mt-2 inline-block">
                     {(t as any).profilePage?.browse || '去逛逛'}
                   </Link>
                 </div>
              ) : (
                 orders.map((order) => (
                   <div key={order.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                     <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                        <div>
                          <span className="font-bold text-gray-900">{(t as any).order?.orderId || '订单号'}: {order.id.slice(-8)}</span>
                          <span className="ml-4 text-sm text-gray-500">{new Date(order.createdAt).toLocaleString()}</span>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 
                          order.status === 'PAID' ? 'bg-blue-100 text-blue-800' : 
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.status}
                        </span>
                     </div>
                     <div className="p-6">
                        {order.items.map((item: any) => (
                          <div key={item.id} className="flex gap-4 mb-4 last:mb-0">
                             <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                               {item.product.imageData ? (
                                  <img src={item.product.imageData} alt={item.product.title || '商品图片'} className="w-full h-full object-cover" />
                               ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400">No Img</div>
                               )}
                             </div>
                             <div className="flex-1">
                                <h4 className="font-medium text-gray-900">{item.product.title}</h4>
                                <div className="text-sm text-gray-500 mt-1">x {item.quantity}</div>
                             </div>
                             <div className="text-right">
                                <div className="font-bold text-gray-900">¥ {item.price}</div>
                             </div>
                          </div>
                        ))}
                        <div className="border-t border-gray-100 mt-4 pt-4 flex justify-end">
                           <span className="text-gray-600 mr-2">{(t as any).order?.total || '合计'}:</span>
                           <span className="text-xl font-bold text-red-600">¥ {order.total}</span>
                        </div>
                     </div>
                   </div>
                 ))
              )}
            </div>
          ) : (
            <div className="space-y-8">
              {favoritesLoading ? (
                <div className="text-center py-12 text-gray-500">{(t as any).profilePage?.loadingFavorites || '加载'}</div>
              ) : favorites.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                  <p className="text-gray-500">{(t as any).profilePage?.noFavorites || '暂无'}</p>
                  <Link href="/" className="text-blue-600 hover:underline mt-2 inline-block">
                    {(t as any).profilePage?.browse || '逛逛'}
                  </Link>
                </div>
              ) : (
                Object.entries(groupedFavorites).map(([category, items]) => (
                  <div key={category} className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                      <h3 className="font-bold text-gray-900">{category}</h3>
                      <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full border border-gray-200">
                        {items.length}
                      </span>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {items.map((fav) => (
                        <FavoriteItem key={fav.id} fav={fav} />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">加载中...</div>}>
      <ProfileContent />
    </Suspense>
  );
}
