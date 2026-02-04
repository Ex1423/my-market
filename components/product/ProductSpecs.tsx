'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/components/LanguageContext';
import Navbar from '@/components/Navbar';

interface ProductSpecsProps {
  product: any;
  specs: { label: string; value: string }[];
}

export default function ProductSpecs({ product, specs }: ProductSpecsProps) {
  const { t, language } = useLanguage();
  const router = useRouter();
  const [translatedLocation, setTranslatedLocation] = useState(product.location);

  // Simple translation for location if needed
  useEffect(() => {
    const translateText = async (text: string | null) => {
      if (!text || language === 'zh') return text;
      try {
        const res = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, targetLang: language }),
        });
        const data = await res.json();
        return data.translatedText;
      } catch (error) {
        return text;
      }
    };

    if (language !== 'zh') {
        translateText(product.location).then(setTranslatedLocation);
    } else {
        setTranslatedLocation(product.location);
    }
  }, [language, product.location]);

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-0">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Back Button */}
        <div className="mb-4">
            <button 
                onClick={() => router.back()}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                <span className="font-medium">{(t as any).product?.back || '返回'}</span>
            </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-bold text-gray-900 text-lg mb-6">{(t as any).product?.specs || '规格与参数'}</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm text-left">
                <tbody className="divide-y divide-gray-100">
                  {specs.map((spec, i) => {
                    const labelMap: Record<string, string> = {
                      '材质': (t as any).product?.specLabels?.material,
                      '尺寸': (t as any).product?.specLabels?.size,
                      '尺寸 (桌)': (t as any).product?.specLabels?.sizeDesk,
                      '尺寸 (椅)': (t as any).product?.specLabels?.sizeChair,
                      '重量': (t as any).product?.specLabels?.weight,
                      '包装': (t as any).product?.specLabels?.package,
                      '其他': (t as any).product?.specLabels?.other,
                    };
                    return (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-500 w-1/3 bg-gray-50/50">{labelMap[spec.label] || spec.label}</td>
                        <td className="px-4 py-3 text-gray-900">{spec.value}</td>
                      </tr>
                    );
                  })}
                  <tr className="hover:bg-gray-50">
                     <td className="px-4 py-3 font-medium text-gray-500 bg-gray-50/50">{(t as any).product?.condition || '成色'}</td>
                     <td className="px-4 py-3 text-gray-900">
                       {(() => {
                         const conditionMap: Record<string, string> = {
                           '全新': 'new',
                           '99新': 'c99',
                           '95新': 'c95',
                           '9成新': 'c90',
                           '8成新': 'c80',
                           '战损版': 'damaged',
                           'Brand New': 'new',
                           'Like New': 'c99',
                           'Excellent': 'c95',
                           'Very Good': 'c90',
                           'Good': 'c80',
                           'For Parts': 'damaged'
                         };
                         const key = conditionMap[product.condition as string] || product.condition;
                         return (t as any).publishPage?.conditions?.[key as string] || product.condition;
                       })()}
                     </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                     <td className="px-4 py-3 font-medium text-gray-500 bg-gray-50/50">{(t as any).product?.location || '所在地'}</td>
                     <td className="px-4 py-3 text-gray-900">{translatedLocation}</td>
                  </tr>
                </tbody>
              </table>
            </div>
        </div>
      </div>
    </div>
  );
}
