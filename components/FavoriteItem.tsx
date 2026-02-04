'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useLanguage } from '@/components/LanguageContext';

interface FavoriteItemProps {
  fav: {
    id: string;
    productId: string;
    createdAt: string;
    product: {
      id: string;
      title: string;
      price: string;
      imageData: string | null;
      location: string | null;
      images: { url: string }[];
    };
  };
}

export default function FavoriteItem({ fav }: FavoriteItemProps) {
  const { t, language } = useLanguage();
  const [translatedTitle, setTranslatedTitle] = useState(fav.product.title);
  const [translatedLocation, setTranslatedLocation] = useState(fav.product.location);

  useEffect(() => {
    const translateText = async (text: string | null | undefined) => {
      if (!text) return text;
      try {
        const res = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, targetLang: language }),
        });
        const data = await res.json();
        return data.translatedText;
      } catch (error) {
        console.error('Translation failed', error);
        return text;
      }
    };

    const performTranslation = async () => {
      if (language === 'zh') {
        setTranslatedTitle(fav.product.title);
        setTranslatedLocation(fav.product.location);
        return;
      }

      const [title, loc] = await Promise.all([
        translateText(fav.product.title),
        translateText(fav.product.location)
      ]);

      setTranslatedTitle(title || fav.product.title);
      setTranslatedLocation(loc || fav.product.location);
    };

    performTranslation();
  }, [language, fav.product.title, fav.product.location]);

  return (
    <div className="p-4 flex gap-4 hover:bg-gray-50 transition-colors group relative">
      <Link href={`/product/${fav.productId}`} className="flex gap-4 flex-1">
        <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
          {fav.product.images && fav.product.images.length > 0 ? (
            <img src={fav.product.images[0].url} alt={translatedTitle} className="w-full h-full object-cover" />
          ) : fav.product.imageData ? (
            <img src={fav.product.imageData} alt={translatedTitle} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">📦</div>
          )}
        </div>
        <div className="flex-1 py-1">
          <h4 className="font-medium text-gray-900 line-clamp-2 mb-1 group-hover:text-blue-600 transition-colors">
            {translatedTitle}
          </h4>
          <div className="text-red-600 font-bold">
            {fav.product.price.startsWith('¥') ? fav.product.price : `¥ ${fav.product.price}`}
          </div>
          {translatedLocation && (
            <div className="text-xs text-gray-400 mt-2">
              📍 {translatedLocation}
            </div>
          )}
        </div>
      </Link>
      <div className="text-xs text-gray-400 self-end">
        {(t as any).profilePage?.collectedAt || '收藏于'} {new Date(fav.createdAt).toLocaleDateString()}
      </div>
    </div>
  );
}
