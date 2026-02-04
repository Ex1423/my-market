'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/components/LanguageContext';

interface FavoriteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (category: string) => void;
  existingCategories: string[];
}

export default function FavoriteModal({ isOpen, onClose, onConfirm, existingCategories }: FavoriteModalProps) {
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string>('default');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedCategory(existingCategories.length > 0 ? existingCategories[0] : 'default');
      setNewCategoryName('');
      setIsCreatingNew(false);
    }
  }, [isOpen, existingCategories]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    const category = isCreatingNew ? newCategoryName : selectedCategory;
    if (!category.trim()) return;
    onConfirm(category);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-fade-in-up">
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            {(t as any).favorites.title}
          </h3>

          <div className="space-y-4">
            {/* Category Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {(t as any).favorites.selectCategory}
              </label>
              
              {!isCreatingNew ? (
                <div className="space-y-2">
                  <select
                    value={selectedCategory}
                    onChange={(e) => {
                      if (e.target.value === '___create_new___') {
                        setIsCreatingNew(true);
                      } else {
                        setSelectedCategory(e.target.value);
                      }
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    {existingCategories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    {existingCategories.length === 0 && (
                      <option value="default">{(t as any).favorites.defaultCategory}</option>
                    )}
                    <option value="___create_new___">+ {(t as any).favorites.createCategory}</option>
                  </select>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder={(t as any).favorites.newCategoryPlaceholder}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    autoFocus
                  />
                  <button
                    onClick={() => setIsCreatingNew(false)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    ← {(t as any).favorites.selectCategory}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
          >
            {(t as any).favorites.cancel}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isCreatingNew && !newCategoryName.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {(t as any).favorites.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}
