'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/components/LanguageContext';

export default function ProductNotFound() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">{t.productNotFound}</h1>
      <p className="text-gray-600 mb-8">{t.productNotFoundTip}</p>
      <Link href="/" className="text-blue-600 hover:underline">
        &larr; {t.backHome}
      </Link>
    </div>
  );
}
