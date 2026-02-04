'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useLanguage } from '@/components/LanguageContext';

type Category = {
  id: string;
  name: string;
  description?: string;
  keywords?: string;
  level: number;
  children?: Category[];
};

export default function AdminCategoriesPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Edit/Delete State
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  // Form State
  const [formData, setFormData] = useState({ name: '', description: '', keywords: '' });

  useEffect(() => {
    const controller = new AbortController();
    
    const timer = setTimeout(() => {
      fetch('/api/auth/me', { signal: controller.signal })
        .then(async (res) => {
          if (!controller.signal.aborted) {
            if (res.ok) {
               const data = await res.json();
               if (data.user?.role !== 'admin') {
                   router.push('/');
               } else {
                   setCurrentUser(data.user);
               }
            } else {
                router.push('/auth');
            }
          }
        })
        .catch((err) => {
          if (err.name !== 'AbortError') {
            router.push('/auth');
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setLoading(false);
          }
        });
    }, 50);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [router]);

  const fetchCategories = () => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
          if (data.categories) {
              setCategories(data.categories);
          }
      })
      .catch(console.error);
  };

  useEffect(() => {
    if (currentUser) {
      fetchCategories();
    }
  }, [currentUser]);

  const handleEditClick = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      keywords: category.keywords || ''
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category);
    setIsDeleteModalOpen(true);
  };

  const handleAddClick = () => {
    setEditingCategory(null);
    setFormData({ name: '', description: '', keywords: '' });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingCategory) {
        // Update existing category
        const res = await fetch(`/api/categories/${editingCategory.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        if (res.ok) {
          setIsEditModalOpen(false);
          setEditingCategory(null);
          fetchCategories();
        } else {
          alert('Update failed');
        }
      } else {
        // Create new root category
        const res = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, level: 1 })
        });

        if (res.ok) {
          setIsEditModalOpen(false);
          fetchCategories();
        } else {
          alert('Create failed');
        }
      }
    } catch (error) {
      console.error(error);
      alert('Error saving category');
    }
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;

    try {
      const res = await fetch(`/api/categories/${categoryToDelete.id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setIsDeleteModalOpen(false);
        setCategoryToDelete(null);
        fetchCategories(); // Refresh list
      } else {
        const data = await res.json();
        alert(data.error || 'Delete failed');
      }
    } catch (error) {
      console.error(error);
      alert('Error deleting category');
    }
  };

  // Helper hook (now returns original text without auto-translation)
  const useCategoryTranslation = (category: Category) => {
    return {
      translatedName: category.name,
      translatedDesc: category.description,
      translatedKeywords: category.keywords,
    };
  };

  // Component for recursive display with translation support
  const CategoryItem = ({ category }: { category: Category }) => {
    const { translatedName, translatedDesc, translatedKeywords } = useCategoryTranslation(category);

    return (
      <div className="ml-4 border-l-2 border-gray-100 pl-4 py-2 group/item">
        <div className="flex justify-between items-start">
          <div>
             <div className="font-medium text-gray-800 flex items-center">
               <span className={`inline-block w-2 h-2 rounded-full mr-2 ${category.level === 1 ? 'bg-blue-500' : category.level === 2 ? 'bg-green-500' : 'bg-purple-500'}`}></span>
               {translatedName}
               <span className="text-xs text-gray-400 ml-2">{t.adminCategories?.level} {category.level}</span>
             </div>
             {translatedKeywords && (
               <p className="text-xs text-gray-400 mt-0.5">{t.adminCategories?.keywords}: {translatedKeywords}</p>
             )}
          </div>
          <div className="flex gap-2 text-xs opacity-0 group-hover/item:opacity-100 transition-opacity">
             <button 
               onClick={() => handleEditClick(category)}
               className="text-blue-600 hover:underline"
             >
               {t.adminCategories?.edit}
             </button>
             <button 
               onClick={() => handleDeleteClick(category)}
               className="text-red-600 hover:underline"
             >
               {t.adminCategories?.delete}
             </button>
          </div>
        </div>
        {category.children && category.children.length > 0 && (
          <div className="mt-1">
            {category.children.map(child => (
               <CategoryItem key={child.id} category={child} />
            ))}
          </div>
        )}
      </div>
    );
  };

  // Root Category Item Component
  const RootCategoryItem = ({ category }: { category: Category }) => {
    const { translatedName } = useCategoryTranslation(category);
    
    return (
      <div className="border border-gray-200 rounded p-4 group">
         <div className="flex justify-between items-center mb-2">
             <h3 className="font-bold text-lg text-gray-900">{translatedName}</h3>
             <div className="flex gap-2 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                 <button 
                   onClick={() => handleEditClick(category)}
                   className="text-blue-600 hover:underline"
                 >
                   {t.adminCategories?.edit}
                 </button>
                 <button 
                   onClick={() => handleDeleteClick(category)}
                   className="text-red-600 hover:underline"
                 >
                   {t.adminCategories?.delete}
                 </button>
             </div>
         </div>
         {category.children && category.children.map(child => (
             <CategoryItem key={child.id} category={child} />
         ))}
      </div>
    );
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
           <h1 className="text-2xl font-bold text-gray-900 mb-6">{t.adminCategories?.title}</h1>
           <p className="mb-4 text-sm text-gray-600">
             {t.adminCategories?.autoMatched}
           </p>
           
           <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between mb-6">
                  <h2 className="text-lg font-medium">{t.adminCategories?.treeTitle}</h2>
                  <button 
                    onClick={handleAddClick}
                    className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
                  >
                      {t.adminCategories?.addRoot}
                  </button>
              </div>
              
              <div className="space-y-4">
                 {categories.map(cat => (
                     <RootCategoryItem key={cat.id} category={cat} />
                 ))}
              </div>
           </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">{editingCategory ? t.adminCategories?.editModalTitle : t.adminCategories?.addModalTitle}</h3>
            <form onSubmit={handleUpdate}>
              <div className="mb-4">
                <label htmlFor="category-name" className="block text-sm font-medium text-gray-700 mb-1">{t.adminCategories?.name}</label>
                <input
                  id="category-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  placeholder={t.adminCategories?.name}
                  required
                />
              </div>

              <div className="mb-6">
                <label htmlFor="category-keywords" className="block text-sm font-medium text-gray-700 mb-1">{t.adminCategories?.keywords}</label>
                <input
                  id="category-keywords"
                  type="text"
                  value={formData.keywords}
                  onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  placeholder={t.adminCategories?.keywords}
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                >
                  {t.adminCategories?.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {t.adminCategories?.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && categoryToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-2 text-red-600">{t.adminCategories?.confirmDeleteTitle}</h3>
            <p className="text-gray-600 mb-6">
              {t.adminCategories?.confirmDeleteMessage?.replace('{name}', categoryToDelete.name)}
              {categoryToDelete.children && categoryToDelete.children.length > 0 && (
                <span className="block mt-2 text-red-500 text-sm">
                  {t.adminCategories?.deleteWarning}
                </span>
              )}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                {t.adminCategories?.cancel}
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                {t.adminCategories?.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
