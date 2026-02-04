'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ProductImageGallery from '@/components/ProductImageGallery';
import { useLanguage } from '@/components/LanguageContext';
import FavoriteModal from '@/components/FavoriteModal';

interface Product {
  id: string;
  title: string;
  price: string;
  description: string | null;
  views: number;
  condition: string | null;
  location: string | null;
  category: string | null;
  imageData: string | null;
  publishDate: string;
  seller: {
    id: string;
    username: string;
    createdAt: string;
  };
}

interface ProductDetailClientProps {
  product: Product;
  imageList: string[];
  specs?: { label: string; value: string }[];
}

export default function ProductDetailClient({ product, imageList, specs }: ProductDetailClientProps) {
  const { t, language } = useLanguage();
  const router = useRouter();

  // Check if this is the demo product (Jianxu Series)
  // This allows us to use high-quality static translations for the demo product
  // Also include the specific ID 'cmku3xods002ridaz6luh6d1v' which is the '桌椅' product used for testing
  const isDemoProduct = product.title.includes('简序') || product.title.includes('Jianxu') || product.id === 'cmku3xods002ridaz6luh6d1v';
  
  const displayDescription = isDemoProduct && (t as any).product?.demo?.description_full
    ? (t as any).product.demo.description_full
    : (product.description || (t as { noDescription?: string }).noDescription || '暂无描述');
  
  // UI States
  const [isFavoriteModalOpen, setIsFavoriteModalOpen] = useState(false);
  const [userCategories, setUserCategories] = useState<string[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Check login status
  useEffect(() => {
    const controller = new AbortController();
    
    const timer = setTimeout(() => {
      fetch('/api/auth/me', { signal: controller.signal })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (!controller.signal.aborted && data?.user) {
            setCurrentUserId(data.user.id);
          }
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

  // Fetch categories
  const fetchCategories = async () => {
    if (!currentUserId) return;
    try {
      const res = await fetch(`/api/favorites/categories?userId=${currentUserId}`);
      if (res.ok) {
        const data = await res.json();
        setUserCategories(data.categories);
      }
    } catch (error) {
      console.error('Failed to fetch categories', error);
    }
  };

  const handleAddToCart = async () => {
    if (!currentUserId) {
      if (confirm((t as any).auth?.loginToContinue || 'Login required')) {
         router.push('/auth');
      }
      return;
    }
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, quantity: 1 })
      });
      if (res.ok) {
        alert((t as any).product?.addedToCart || 'Added');
      } else {
        alert((t as any).product?.addFailed || 'Failed');
      }
    } catch (error) {
      console.error('Add to cart error', error);
    }
  };

  const handleBuyNow = async () => {
    if (!currentUserId) {
        if (confirm('请先登录 / Please login first')) {
           router.push('/auth');
        }
        return;
    }
     // For now, just add to cart and go to cart page
     try {
        const res = await fetch('/api/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId: product.id, quantity: 1 })
        });
        if (res.ok) {
            router.push('/cart');
        } else {
            alert('Error processing request');
        }
     } catch (e) {
         console.error(e);
     }
  };

  const handleFavoriteClick = () => {
    if (!currentUserId) {
      alert('请先登录');
      window.location.href = '/auth';
      return;
    }
    fetchCategories();
    setIsFavoriteModalOpen(true);
  };

  const handleConfirmFavorite = async (category: string) => {
    if (!currentUserId) return;
    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          productId: product.id,
          category
        })
      });

      if (res.ok) {
        alert((t as any).favorites?.success || 'Success');
        setIsFavoriteModalOpen(false);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed');
      }
    } catch (error) {
      console.error('Favorite error', error);
      alert('Error adding to favorites');
    }
  };

  const dateLocale = language === 'zh' ? 'zh-CN' : language === 'ru' ? 'ru-RU' : language === 'kk' ? 'kk-KZ' : 'en-US';
  const sellerJoinDate = new Date(product.seller.createdAt).toLocaleDateString(dateLocale);

  const sellerInfoContent = (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-14 h-14 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold text-2xl shrink-0 border-2 border-white shadow-sm">
             {product.seller.username[0].toUpperCase()}
          </div>
          <div className="absolute -bottom-1 -right-1 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full border border-white shadow-sm">
             {(t as any).seller?.verified || '✓'}
          </div>
        </div>
        <div className="min-w-0 flex-1">
           <div className="flex items-center justify-between">
              <div className="font-bold text-gray-900 truncate text-lg">{product.seller.username}</div>
              <button className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full transition-colors font-medium">
                  {(t as any).seller?.visitStore || 'Visit'}
              </button>
           </div>
           <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
              <span>{(t as any).joined || 'Joined'} {sellerJoinDate}</span>
              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
              <span>1.2k {(t as any).seller?.followers || 'Followers'}</span>
           </div>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-2 bg-gray-50 rounded-lg p-3">
         <div className="text-center border-r border-gray-200 last:border-0">
            <div className="text-xs text-gray-500 mb-1">{(t as any).seller?.rating || 'Rating'}</div>
            <div className="font-bold text-gray-900 text-sm">4.9</div>
         </div>
         <div className="text-center border-r border-gray-200 last:border-0">
            <div className="text-xs text-gray-500 mb-1">{(t as any).seller?.responseRate || 'Resp.'}</div>
            <div className="font-bold text-gray-900 text-sm">100%</div>
         </div>
         <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">{(t as any).seller?.sold || 'Sold'}</div>
            <div className="font-bold text-gray-900 text-sm">350+</div>
         </div>
      </div>
    </div>
  );

  const purchaseCardContent = (
    <>
      <div className="mb-4">
        <span className="text-3xl font-bold text-red-600">
          {product.price.startsWith('¥') ? product.price : `¥ ${product.price}`}
        </span>
        <span className="ml-2 text-sm text-gray-400 line-through">¥ {parseInt(product.price.replace(/\D/g, '')) * 1.2}</span>
      </div>
      
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between text-sm">
           <span className="text-gray-500">{(t as any).product?.stock || '库存'}</span>
           <span className="text-gray-900 font-medium">{(t as any).product?.inStock || '现货'}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
           <span className="text-gray-500">{(t as any).product?.service || '服务'}</span>
           <span className="text-gray-900">{(t as any).product?.serviceDesc || '送货上门 · 运费险'}</span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex gap-2">
          <button 
            onClick={handleAddToCart}
            className="flex-1 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            {(t as any).product?.addToCart || '加购'}
          </button>
          <button 
            onClick={handleBuyNow}
            className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            {(t as any).product?.buyNow || '购买'}
          </button>
        </div>
        {currentUserId === product.seller.id && (
          <Link
            href={`/product/${product.id}/edit`}
            className="flex items-center justify-center gap-2 py-2.5 mb-3 bg-amber-50 hover:bg-amber-100 text-amber-700 font-medium rounded-lg transition-colors border border-amber-200"
          >
            <span>✏️</span> {(t as any).product?.edit || '编辑商品'}
          </Link>
        )}
        <div className="grid grid-cols-3 gap-2">
           <Link 
              href={`/chat?userId=${product.seller.id}&productId=${product.id}`}
              className="flex items-center justify-center gap-2 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium rounded-lg transition-colors"
           >
              <span>💬</span> {(t as any).product?.contact || '客服'}
           </Link>
           <button 
              onClick={handleFavoriteClick}
              className="flex items-center justify-center gap-2 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium rounded-lg transition-colors"
           >
              <span>⭐</span> {(t as any).collect || '收藏'}
           </button>
           <button 
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: product.title,
                    text: 'Check out this product!',
                    url: window.location.href,
                  }).catch(console.error);
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  alert((t as any).product?.linkCopied || 'Copied');
                }
              }}
              className="flex items-center justify-center gap-2 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium rounded-lg transition-colors"
           >
              <span>🔗</span> {(t as any).product?.share || '分享'}
           </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 md:pb-0">
      <Navbar />
      
      {/* 1. Gallery Section */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
          <div className="w-full">
            <ProductImageGallery imageList={imageList} title={product.title} />
          </div>
        </div>

        {/* Mobile Purchase Card & Seller Info (lg:hidden) */}
        <div className="mt-4 lg:hidden grid grid-cols-2 gap-4">
           <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              {purchaseCardContent}
           </div>
           <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              {sellerInfoContent}
           </div>
        </div>
        
        {/* Title & Slogan Section */}
        <div className="mt-6 mb-2">
           <div className="flex items-start justify-between gap-4">
             <div className="flex-1">
               <h1 className="text-2xl md:text-4xl font-bold text-gray-900 leading-tight">
                {product.title}
               </h1>
             </div>
           </div>
        </div>

        {/* NEW: Navigation Cells for Mobile/Desktop Split View */}
        <div className="mt-8 bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
            <Link href={`/product/${product.id}/specs`} className="flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                    <span className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    </span>
                    <span className="font-medium text-gray-900 text-lg">{(t as any).product?.specs || '规格'}</span>
                </div>
                <span className="text-gray-400 text-xl">›</span>
            </Link>
            <Link href={`/product/${product.id}/reviews`} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                    <span className="bg-yellow-100 text-yellow-600 p-2 rounded-lg">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
                    </span>
                    <span className="font-medium text-gray-900 text-lg">{(t as any).product?.reviews || '评价'}</span>
                </div>
                <span className="text-gray-400 text-xl">›</span>
            </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Main Content Column (Left) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Description Text */}
          <div className="bg-white rounded-xl shadow-sm p-6">
             <h3 className="font-bold text-gray-900 mb-4">{(t as any).product?.description || '描述'}</h3>
             <div className="text-gray-600 leading-relaxed whitespace-pre-wrap min-h-[100px]">
               {displayDescription}
             </div>
          </div>

          {/* Image Atlas (Graphic Details) */}
          {imageList.length > 0 && (
            <div className="space-y-6">
              <h3 className="font-bold text-gray-900 text-lg">{(t as any).product?.gallery || '图册'}</h3>
              <div className="grid grid-cols-1 gap-4">
                {imageList.map((img, index) => (
                  <div key={index} className="relative group rounded-xl overflow-hidden shadow-sm bg-white">
                    <img 
                      src={img} 
                      alt={`Detail ${index}`} 
                      className="w-full h-auto object-cover"
                      loading="lazy"
                    />
                    <div className="absolute bottom-4 left-4 bg-black/60 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                       {index === 0 ? ((t as any).product?.scene || '场景') : ((t as any).product?.detail || '细节')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Column (Right) - Sticky */}
        <div className="lg:col-span-4 space-y-6">
          <div className="sticky top-24 space-y-6">
            
            {/* Purchase Card (Desktop) */}
            <div className="hidden lg:block bg-white rounded-xl shadow-sm p-6 border border-gray-100">
               {purchaseCardContent}
            </div>

            {/* Seller Info */}
            <div className="hidden lg:block bg-white rounded-xl shadow-sm p-6">
              {sellerInfoContent}
            </div>

          </div>
        </div>
      </div>

      {/* Mobile Fixed Bottom Bar - Removed as per user request */}

      <FavoriteModal
        isOpen={isFavoriteModalOpen}
        onClose={() => setIsFavoriteModalOpen(false)}
        onConfirm={handleConfirmFavorite}
        existingCategories={userCategories}
      />
    </div>
  );
}
