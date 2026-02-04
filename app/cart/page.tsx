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

export default function CartPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const res = await fetch('/api/cart');
      if (res.status === 401) {
        // Not logged in
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (data.cart && data.cart.items) {
        setCartItems(data.cart.items);
        calculateTotal(data.cart.items);
      }
    } catch (error) {
      console.error('Failed to fetch cart', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = (items: CartItem[]) => {
    const sum = items.reduce((acc, item) => {
      // Parse price "¥ 4000" -> 4000
      const priceStr = item.product.price.replace(/[^\d.]/g, '');
      const price = parseFloat(priceStr) || 0;
      return acc + price * item.quantity;
    }, 0);
    setTotal(sum);
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    // Optimistic update
    const oldItems = [...cartItems];
    const newItems = cartItems.map(item => 
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    );
    setCartItems(newItems);
    calculateTotal(newItems);

    try {
      const res = await fetch(`/api/cart/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQuantity })
      });
      if (!res.ok) {
        // Revert
        setCartItems(oldItems);
        calculateTotal(oldItems);
      }
    } catch (error) {
      console.error('Failed to update quantity', error);
      setCartItems(oldItems);
      calculateTotal(oldItems);
    }
  };

  const deleteItem = async (itemId: string) => {
    if (!confirm('Are you sure?')) return;

    // Optimistic update
    const oldItems = [...cartItems];
    const newItems = cartItems.filter(item => item.id !== itemId);
    setCartItems(newItems);
    calculateTotal(newItems);

    try {
      const res = await fetch(`/api/cart/${itemId}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        // Revert
        setCartItems(oldItems);
        calculateTotal(oldItems);
      }
    } catch (error) {
      console.error('Failed to delete item', error);
      setCartItems(oldItems);
      calculateTotal(oldItems);
    }
  };

  const handleCheckout = () => {
    router.push('/cart/checkout');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">{(t as any).profilePage?.loading || '加载...'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">{(t as any).cart?.title || 'Shopping Cart'}</h1>
        
        {cartItems.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">🛒</div>
            <p className="text-gray-500 text-lg mb-6">{(t as any).cart?.empty || '暂无'}</p>
            <Link href="/" className="inline-block bg-blue-600 text-white px-6 py-2 rounded-full font-medium hover:bg-blue-700 transition-colors">
              {(t as any).profilePage?.browse || '逛逛'}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items List */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="bg-white rounded-xl shadow-sm p-4 flex gap-4">
                  {/* Image */}
                  <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {item.product.images && item.product.images.length > 0 ? (
                      <img src={item.product.images[0].url} alt={item.product.title} className="w-full h-full object-cover" />
                    ) : item.product.imageData ? (
                      <img src={item.product.imageData} alt={item.product.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">No Img</div>
                    )}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900 line-clamp-2">{item.product.title}</h3>
                      <p className="text-red-600 font-bold mt-1">{item.product.price}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center border border-gray-200 rounded-lg">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-3 py-1 text-gray-500 hover:bg-gray-50 border-r border-gray-200"
                          disabled={item.quantity <= 1}
                        >
                          -
                        </button>
                        <span className="px-3 py-1 text-gray-900 min-w-[2rem] text-center">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-3 py-1 text-gray-500 hover:bg-gray-50 border-l border-gray-200"
                        >
                          +
                        </button>
                      </div>
                      <button 
                        onClick={() => deleteItem(item.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        {(t as any).cart?.delete || 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
                <h2 className="text-lg font-bold text-gray-900 mb-4">{(t as any).order?.total || 'Summary'}</h2>
                <div className="flex justify-between items-center mb-6">
                  <span className="text-gray-600">{(t as any).cart?.total || 'Total'}:</span>
                  <span className="text-2xl font-bold text-red-600">¥ {total.toLocaleString()}</span>
                </div>
                <button 
                  onClick={handleCheckout}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
                  aria-label={(t as any).cart?.checkout || '结算'}
                >
                  {(t as any).cart?.checkout || 'Checkout'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
