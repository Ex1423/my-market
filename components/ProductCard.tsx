'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/components/LanguageContext';

export interface Product {
  id: number | string;
  title: string;
  price: string;
  imageColor?: string;
  category: string;
  imageData?: string;
  location?: string;
  condition?: string;
  specs?: { label: string; value: string }[];
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { t } = useLanguage();

  // Helper to translate category
  const getTranslatedCategory = (cat: string) => {
    const map: Record<string, string> = {
      '手机': 'phone',
      '数码': 'digital',
      '家具': 'furniture',
      '服饰': 'clothing',
      '书籍': 'books',
      '其他': 'other',
      '全部': 'all'
    };
    
    // Check if it's already a key or mapped key
    const key = map[cat] || cat;
    // @ts-ignore
    return t.categories[key] || cat;
  };

  return (
    <Link 
      href={`/product/${product.id}`}
      className="group block bg-white transition-all duration-300 overflow-hidden border border-gray-50 flex flex-col h-full transform hover:-translate-y-1"
      style={{
        borderRadius: 'calc(var(--card-radius, 24) * 1px)',
        boxShadow: 'var(--card-shadow)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = 'var(--card-shadow-hover)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'var(--card-shadow)';
      }}
    >
      {/* Image - next/image 优化加载 */}
      <div className={`h-40 ${product.imageColor || 'bg-gray-50'} flex items-center justify-center relative overflow-hidden bg-gray-50`}>
        {product.imageData ? (
          <Image
            src={product.imageData}
            alt={product.title}
            width={300}
            height={160}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            unoptimized={product.imageData.startsWith('data:')}
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-4 group-hover:scale-105 transition-transform duration-500">
            <Image
              src="/logo.png"
              alt="U-Goods Logo"
              width={80}
              height={80}
              className="max-w-full max-h-full object-contain opacity-80"
            />
          </div>
        )}

        {/* Price and Add to Cart (Overlay - Bottom) */}
        <div className="absolute bottom-0 left-0 right-0 p-2 flex items-center justify-between bg-gradient-to-t from-black/60 via-black/30 to-transparent pt-6">
            <div className="font-extrabold text-base whitespace-nowrap drop-shadow-md" style={{ color: 'var(--card-price-color)' }}>
              {product.price.startsWith('¥') ? product.price : `¥ ${product.price}`}
            </div>
        </div>
      </div>
    </Link>
  );
}
