'use client';

import { useState } from 'react';
import { useLanguage } from '@/components/LanguageContext';

export default function CacheCleaner() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);

  // Mock native bridge interfaces
  interface NativeBridge {
    getCacheSize: () => Promise<number>;
    clearCache: () => Promise<void>;
  }

  const calculateSize = async (): Promise<string> => {
    let totalSize = 0;

    // 1. Web: LocalStorage & SessionStorage
    try {
      if (typeof window !== 'undefined') {
        for (let x in localStorage) {
          if (Object.prototype.hasOwnProperty.call(localStorage, x)) {
            totalSize += ((localStorage[x].length + x.length) * 2);
          }
        }
        for (let x in sessionStorage) {
          if (Object.prototype.hasOwnProperty.call(sessionStorage, x)) {
            totalSize += ((sessionStorage[x].length + x.length) * 2);
          }
        }
      }
    } catch (e) {
      console.error('Storage access error:', e);
    }

    // 2. Web: IndexedDB (Estimate)
    try {
      if (navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        if (estimate.usage) {
          totalSize += estimate.usage;
        }
      }
    } catch (e) {
      console.error('IndexedDB estimate error:', e);
    }

    // 3. Native (Mobile/Desktop) - if available
    try {
      // Mobile (Capacitor)
      if ((window as any).Capacitor && (window as any).NativeBridge?.getCacheSize) {
         const nativeSize = await (window as any).NativeBridge.getCacheSize();
         totalSize += nativeSize || 0;
      }
      // PC (Electron)
      if ((window as any).electronAPI?.getCacheSize) {
         const electronSize = await (window as any).electronAPI.getCacheSize();
         totalSize += electronSize || 0;
      }
    } catch (e) {
      console.error('Native size estimate error:', e);
    }

    // Convert to MB
    return (totalSize / 1024 / 1024).toFixed(2);
  };

  const clearCache = async () => {
    setLoading(true);
    try {
      // 1. Calculate size first
      const size = await calculateSize();

      // 2. Confirm
      const confirmMsg = (t as any).cache?.confirmMessage?.replace('{size}', size) || `Clear ${size} MB cache?`;
      if (!window.confirm(confirmMsg)) {
        setLoading(false);
        return;
      }

      // 3. Clear Web Cache
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear IndexedDB
      if (window.indexedDB && window.indexedDB.databases) {
        const dbs = await window.indexedDB.databases();
        for (const db of dbs) {
          if (db.name) {
            window.indexedDB.deleteDatabase(db.name);
          }
        }
      }

      // 4. Clear Mobile Cache (Capacitor)
      if ((window as any).Capacitor) {
        console.log('Cleaning Mobile Cache...');
        // Call native interface to clean Cache Directory and reset WebView
        if ((window as any).NativeBridge?.clearCache) {
           await (window as any).NativeBridge.clearCache();
        } else {
           console.warn('NativeBridge.clearCache not found. Ensure native code exposes this method.');
        }
      }

      // 5. Clear Desktop Cache (Electron)
      if ((window as any).electronAPI) {
        console.log('Cleaning Desktop Cache...');
        // Clean AppData/Local cache and logs
        if ((window as any).electronAPI.clearCache) {
          await (window as any).electronAPI.clearCache();
        } else {
           console.warn('electronAPI.clearCache not found. Ensure preload script exposes this method.');
        }
      }

      // Simulate a small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 800));

      alert((t as any).cache?.success || 'Cleared successfully');
      
      // Optional: Reload to reflect changes
      // window.location.reload(); 
      
    } catch (error) {
      console.error('Clear cache error:', error);
      alert('Failed to clear cache');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 border-t border-gray-200">
      <dt className="text-sm font-medium text-gray-500 flex items-center">
        {(t as any).cache?.clean || 'Cache'}
      </dt>
      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 flex items-center">
        <button
          onClick={clearCache}
          disabled={loading}
          className={`
            inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white 
            bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500
            disabled:opacity-50 disabled:cursor-not-allowed transition-colors
          `}
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {(t as any).cache?.clearing || 'Cleaning...'}
            </>
          ) : (
            <>
              <svg className="mr-2 -ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {(t as any).cache?.clean || 'Clean'}
            </>
          )}
        </button>
      </dd>
    </div>
  );
}
