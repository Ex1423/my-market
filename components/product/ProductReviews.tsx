'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/components/LanguageContext';
import Navbar from '@/components/Navbar';

// Reuse the mock data structure
const JIANXU_DATA = {
  reviews: [
    { id: 1, user: "林**", avatar: "L", content: "安装师傅上门很快，安装很专业。桌子很有质感，岩板摸起来很舒服。", rating: 5, date: "2023-10-15", tags: ["安装专业", "材质好"], images: [] },
    { id: 2, user: "Zhang", avatar: "Z", content: "椅子坐了一整天腰都不酸，确实符合人体工学。颜色也很正。", rating: 5, date: "2023-10-18", tags: ["舒适度高", "颜值高"], images: [] }
  ]
};

interface ProductReviewsProps {
  productId?: string;
}

export default function ProductReviews({ productId }: ProductReviewsProps) {
  const { t } = useLanguage();
  const router = useRouter();
  
  const demo = (t as any).product?.demo;
  const demoData = {
    reviews: demo?.reviews || JIANXU_DATA.reviews,
  };

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
             <div className="flex justify-between items-center mb-6">
               <h3 className="font-bold text-gray-900 text-lg">{(t as any).product?.realReviews || '真实评价'} <span className="text-gray-400 text-sm font-normal">({demoData.reviews.length})</span></h3>
               <div className="flex gap-2">
                 <button className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full transition-colors">{(t as any).product?.all || '全部'}</button>
                 <button className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full transition-colors">{(t as any).product?.withImages || '有图'}</button>
                 <button className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full transition-colors">{(t as any).product?.good || '好评'}</button>
               </div>
             </div>
             
             <div className="space-y-6">
                {demoData.reviews.map((review: any) => (
                  <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3 mb-2">
                       <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                         {review.avatar}
                       </div>
                       <div>
                         <div className="text-sm font-medium text-gray-900">{review.user}</div>
                         <div className="flex text-yellow-400 text-xs">
                           {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                         </div>
                       </div>
                       <div className="ml-auto text-xs text-gray-400">{review.date}</div>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed mb-3">{review.content}</p>
                    <div className="flex flex-wrap gap-2">
                      {review.tags && review.tags.map((tag: string, idx: number) => (
                        <span key={idx} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
             </div>
        </div>
      </div>
    </div>
  );
}
