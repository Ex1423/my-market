'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import { useLanguage } from '@/components/LanguageContext';

export default function AboutPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* Header Banner */}
          <div className="bg-blue-600 px-8 py-12 text-center">
            <h1 className="text-4xl font-bold text-white mb-2">{t.about?.title}</h1>
            <p className="text-blue-100 text-lg">{t.title} - {t.description}</p>
          </div>

          <div className="p-8 md:p-12 space-y-12">
            {/* Mission Section */}
            <section className="text-center">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                🚀
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t.about?.missionTitle}</h2>
              <p className="text-gray-600 leading-relaxed text-lg max-w-2xl mx-auto">
                {t.about?.missionContent}
              </p>
            </section>

            <hr className="border-gray-100" />

            {/* Vision Section */}
            <section className="text-center">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                🌍
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t.about?.visionTitle}</h2>
              <p className="text-gray-600 leading-relaxed text-lg max-w-2xl mx-auto">
                {t.about?.visionContent}
              </p>
            </section>

            <hr className="border-gray-100" />

            {/* Values Section */}
            <section className="text-center">
               <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                💎
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t.about?.valuesTitle}</h2>
              <p className="text-gray-600 leading-relaxed text-lg max-w-2xl mx-auto">
                {t.about?.valuesContent}
              </p>
            </section>

             <hr className="border-gray-100" />

            {/* Contact Section */}
            <section className="bg-gray-50 rounded-xl p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t.about?.contactTitle}</h2>
              <p className="text-gray-600 mb-6">
                {t.about?.contactContent}
              </p>
              <a 
                href="mailto:support@u-goods.com" 
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                support@u-goods.com
              </a>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
