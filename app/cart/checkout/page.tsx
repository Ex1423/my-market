'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useLanguage } from '@/components/LanguageContext';
import { useRouter } from 'next/navigation';

interface CartItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    title: string;
    price: string;
    imageData: string | null;
    images: { url: string }[];
  };
}

export default function CheckoutPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [phone, setPhone] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(false);

  useEffect(() => {
    fetchCartAndUser();
  }, []);

  const fetchCartAndUser = async () => {
    try {
      const [cartRes, userRes] = await Promise.all([
        fetch('/api/cart'),
        fetch('/api/auth/me')
      ]);

      if (cartRes.status === 401 || userRes.status === 401) {
        router.replace('/auth?from=/cart/checkout');
        return;
      }

      const cartData = await cartRes.json();
      const userData = await userRes.json();

      if (cartData.cart?.items?.length) {
        setCartItems(cartData.cart.items);
        const sum = cartData.cart.items.reduce((acc: number, item: CartItem) => {
          const priceStr = item.product.price.replace(/[^\d.]/g, '');
          return acc + (parseFloat(priceStr) || 0) * item.quantity;
        }, 0);
        setTotal(sum);
      }

      if (userData.user?.phone) setPhone(userData.user.phone);
      if (userData.user?.receiverName) setReceiverName(userData.user.receiverName);
      if (userData.user?.address) setAddress(userData.user.address);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '下单失败');
        setSubmitting(false);
        return;
      }

      const updates: Record<string, string> = {};
      if (phone.trim()) updates.phone = phone.trim();
      if (receiverName.trim()) updates.receiverName = receiverName.trim();
      if (address.trim()) updates.address = address.trim();
      if (Object.keys(updates).length > 0) {
        await fetch('/api/users/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });
      }
      setOrderSuccess(true);
    } catch (err) {
      console.error('Submit error:', err);
      setError('网络错误，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">{(t as any).profilePage?.loading || '加载...'}</div>
      </div>
    );
  }

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center text-3xl">✓</div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">{(t as any).cart?.orderSuccess || '下单成功'}</h1>
            <p className="text-gray-500 mb-6">{(t as any).order?.success || '订单已提交'}</p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/profile?tab=orders"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
              >
                {(t as any).cart?.viewOrders || '查看订单'}
              </Link>
              <Link
                href="/"
                className="inline-block bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                {(t as any).profilePage?.browse || '继续逛逛'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <div className="text-6xl mb-4">🛒</div>
            <p className="text-gray-500 mb-6">{(t as any).cart?.empty || '购物车为空'}</p>
            <Link href="/cart" className="inline-block bg-blue-600 text-white px-6 py-2 rounded-full font-medium hover:bg-blue-700 transition-colors">
              {(t as any).cart?.backToCart || '返回购物车'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">{(t as any).cart?.checkoutTitle || '确认订单'}</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Order Summary */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <h2 className="px-6 py-4 border-b border-gray-100 font-semibold text-gray-900">
              {(t as any).cart?.orderSummary || '订单摘要'}
            </h2>
            <div className="divide-y divide-gray-100">
              {cartItems.map((item) => (
                <div key={item.id} className="p-6 flex gap-4">
                  <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {item.product.images?.[0]?.url ? (
                      <img src={item.product.images[0].url} alt={item.product.title} className="w-full h-full object-cover" />
                    ) : item.product.imageData ? (
                      <img src={item.product.imageData} alt={item.product.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">图</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 line-clamp-2">{item.product.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">x {item.quantity}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-red-600 font-bold">{item.product.price}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
              <span className="text-gray-600 font-medium">{(t as any).cart?.total || '合计'}</span>
              <span className="text-2xl font-bold text-red-600">¥ {total.toLocaleString()}</span>
            </div>
          </div>

          {/* Contact & Address */}
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-gray-900 mb-2">{(t as any).cart?.contactInfo || '联系信息'}</h2>
            <div>
              <label className="block text-sm text-gray-600 mb-1">{(t as any).profilePage?.receiverName || '收货人'}</label>
              <input
                type="text"
                value={receiverName}
                onChange={e => setReceiverName(e.target.value)}
                placeholder={(t as any).profilePage?.receiverNamePlaceholder || '请输入收货人姓名'}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                aria-label="收货人"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">{(t as any).cart?.contactPhone || '联系电话'}</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder={(t as any).cart?.contactPhonePlaceholder || '用于卖家联系您'}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                aria-label="联系电话"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">{(t as any).profilePage?.address || '收货地址'}</label>
              <textarea
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder={(t as any).profilePage?.addressPlaceholder || '省市区+详细地址'}
                rows={3}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                aria-label="收货地址"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-4">
            <Link
              href="/cart"
              className="flex-1 py-3 rounded-xl font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors text-center"
            >
              {(t as any).cart?.backToCart || '返回购物车'}
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? '提交中...' : ((t as any).cart?.confirmOrder || '提交订单')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
