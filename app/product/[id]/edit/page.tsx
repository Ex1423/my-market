'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useLanguage } from '@/components/LanguageContext';
import ProductDetailClient from '@/components/ProductDetailClient';

interface Category {
  id: string;
  name: string;
  children?: Category[];
}

export default function ProductEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { t } = useLanguage();

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('其他');
  const [condition, setCondition] = useState('全新');
  const [location, setLocation] = useState('');
  const [size, setSize] = useState('');
  const [material, setMaterial] = useState('');
  const [weight, setWeight] = useState('');
  const [packaging, setPackaging] = useState('');
  const [otherSpecs, setOtherSpecs] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [productSellerId, setProductSellerId] = useState<string | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [l1Id, setL1Id] = useState('');
  const [l2Id, setL2Id] = useState('');
  const [l3Id, setL3Id] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const conditionKeys = ['new', 'c99', 'c95', 'c90', 'c80', 'damaged'];
  const getConditionValue = (key: string) => {
    const map: Record<string, string> = { new: '全新', c99: '99新', c95: '95新', c90: '9成', c80: '8成', damaged: '战损' };
    return map[key] || '全新';
  };

  const l1Options = categories;
  const l2Options = categories.find(c => c.id === l1Id)?.children || [];
  const l3Options = categories.find(c => c.id === l1Id)?.children?.find(c => c.id === l2Id)?.children || [];

  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => { if (data.categories) setCategories(data.categories); })
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data?.user) setCurrentUserId(data.user.id); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const l1 = categories.find(c => c.id === l1Id);
    const l2 = l1?.children?.find(c => c.id === l2Id);
    const l3 = l2?.children?.find(c => c.id === l3Id);
    if (l3) setCategory(l3.name);
    else if (l2) setCategory(l2.name);
    else if (l1) setCategory(l1.name);
  }, [l1Id, l2Id, l3Id, categories]);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/products/${id}`)
      .then(res => res.json())
      .then(data => {
        const p = data;
        if (!p) {
          setError('商品不存在');
          setLoading(false);
          return;
        }
        setProductSellerId(p.seller?.id || p.sellerId || null);
        setTitle(p.title || '');
        setPrice(String(p.price || '').replace(/[^\d.]/g, '') || '');
        setDescription(p.description || '');
        setCategory(p.category || '其他');
        setCondition(p.condition || '全新');
        setLocation(p.location || '');
        const specs = Array.isArray(p.specs) ? p.specs : (p.specs ? JSON.parse(p.specs) : []);
        specs.forEach((s: any) => {
          if (s.label === '尺寸') setSize(s.value || '');
          if (s.label === '材质') setMaterial(s.value || '');
          if (s.label === '重量') setWeight(s.value || '');
          if (s.label === '包装') setPackaging(s.value || '');
          if (s.label === '其他') setOtherSpecs(s.value || '');
        });
        const imgList = Array.isArray(p.images) ? p.images : [];
        if (imgList.length) {
          setImages(imgList.map((img: any) => (typeof img === 'string' ? img : img.url) || ''));
        } else if (p.imageData) {
          setImages([p.imageData]);
        } else {
          setImages([]);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('加载失败');
        setLoading(false);
      });
  }, [id]);

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let w = img.width, h = img.height;
          const MAX = 1200;
          if (w > h && w > MAX) { h *= MAX / w; w = MAX; }
          else if (h > MAX) { w *= MAX / h; h = MAX; }
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (ctx) { ctx.drawImage(img, 0, 0, w, h); resolve(canvas.toDataURL('image/jpeg', 0.6)); }
          else resolve(e.target?.result as string);
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && images.length + files.length <= 9) {
      setIsSubmitting(true);
      try {
        const newImages: string[] = [];
        for (let i = 0; i < files.length; i++) newImages.push(await compressImage(files[i]));
        setImages(prev => [...prev, ...newImages]);
      } catch (err) { alert('处理失败'); }
      finally { setIsSubmitting(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!title || !price) {
      alert(t.publishPage?.fillRequired || '请填写标题和价格');
      return;
    }
    setIsSubmitting(true);
    try {
      const specsArray = [
        { label: '尺寸', value: size },
        { label: '材质', value: material },
        { label: '重量', value: weight },
        { label: '包装', value: packaging },
        { label: '其他', value: otherSpecs },
      ].filter(spec => spec.value.trim() !== '');

      const payload = {
        title,
        price: price.startsWith('¥') ? price : `¥ ${price}`,
        description,
        imageColor: 'bg-purple-100',
        category,
        condition,
        location,
        specs: JSON.stringify(specsArray),
        imageData: images[0] || null,
        images,
      };

      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || '更新失败');

      alert('修改成功！');
      router.push(`/product/${id}`);
      router.refresh();
    } catch (err: any) {
      alert(err.message || '修改失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-12 text-center text-gray-500">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-12 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/" className="text-blue-600 hover:underline">返回首页</Link>
        </div>
      </div>
    );
  }

  if (currentUserId && productSellerId && currentUserId !== productSellerId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-12 text-center">
          <p className="text-red-600 mb-4">无权编辑此商品</p>
          <Link href={`/product/${id}`} className="text-blue-600 hover:underline">返回商品页</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8">
          <div className="flex justify-between items-center mb-8">
            <Link href={`/product/${id}`} className="text-gray-600 hover:text-gray-900">取消</Link>
            <h1 className="text-xl font-bold text-gray-900">编辑商品</h1>
            <div className="flex gap-3">
              <button onClick={() => setShowPreview(true)} className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-1.5 px-4 rounded-lg">
                👁️ 预览
              </button>
              <button onClick={handleSubmit} disabled={isSubmitting} className={`bg-blue-600 hover:bg-blue-700 text-white font-medium py-1.5 px-4 rounded-lg ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {isSubmitting ? '保存中...' : '保存修改'}
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              {images.map((img, i) => (
                <div key={i} className="aspect-square relative rounded-lg overflow-hidden border border-gray-200 group">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => removeImage(i)} aria-label="删除此图片" title="删除此图片" className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full hover:bg-black/70 opacity-0 group-hover:opacity-100">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ))}
              {images.length < 9 && (
                <div onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50">
                  <span className="text-xl">📷</span>
                  <span className="text-xs text-gray-500 mt-1">上传图片 {images.length}/9</span>
                </div>
              )}
            </div>
            <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" multiple className="hidden" aria-label="上传商品图片" />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">标题</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" aria-label="标题" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">价格</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">¥</span>
                <input type="text" value={price} onChange={e => setPrice(e.target.value.replace(/[^\d.]/g, ''))} placeholder="0" className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">成色</label>
              <select value={condition} onChange={e => setCondition(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" aria-label="成色">
                {conditionKeys.map(k => <option key={k} value={getConditionValue(k)}>{(t.publishPage?.conditions as any)?.[k] || getConditionValue(k)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">发货地</label>
              <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="如：北京" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
              <div className="grid grid-cols-3 gap-3">
                <select value={l1Id} onChange={e => { setL1Id(e.target.value); setL2Id(''); setL3Id(''); }} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg" aria-label="一级分类">
                  <option value="">一级</option>
                  {l1Options.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select value={l2Id} onChange={e => { setL2Id(e.target.value); setL3Id(''); }} disabled={!l1Id} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg disabled:opacity-50" aria-label="二级分类">
                  <option value="">二级</option>
                  {l2Options.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select value={l3Id} onChange={e => setL3Id(e.target.value)} disabled={!l2Id} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg disabled:opacity-50" aria-label="三级分类">
                  <option value="">三级</option>
                  {l3Options.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="mt-2 text-sm text-gray-500">已选: <span className="font-medium text-blue-600">{category || '未选'}</span></div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-bold text-gray-900 mb-4">规格</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs text-gray-500 mb-1">尺寸</label><input type="text" value={size} onChange={e => setSize(e.target.value)} placeholder="120x60x75cm" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-sm" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">材质</label><input type="text" value={material} onChange={e => setMaterial(e.target.value)} placeholder="北美白蜡木" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-sm" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">重量</label><input type="text" value={weight} onChange={e => setWeight(e.target.value)} placeholder="25kg" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-sm" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">包装</label><input type="text" value={packaging} onChange={e => setPackaging(e.target.value)} placeholder="纸箱" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-sm" /></div>
                <div className="col-span-2"><label className="block text-xs text-gray-500 mb-1">其他</label><input type="text" value={otherSpecs} onChange={e => setOtherSpecs(e.target.value)} placeholder="颜色、风格等" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-sm" /></div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="详细描述商品" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
            </div>
          </div>
        </div>
      </div>

      {showPreview && (
        <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
          <div className="sticky top-0 z-[60] bg-white/90 backdrop-blur border-b px-6 py-4 flex justify-between items-center">
            <span className="font-bold">预览</span>
            <button onClick={() => setShowPreview(false)} className="bg-gray-900 text-white px-6 py-2 rounded-full">关闭</button>
          </div>
          <ProductDetailClient
            product={{
              id: 'preview',
              title: title || '无题',
              price: price ? `¥ ${price}` : '¥ 0',
              description: description || '无述',
              views: 0,
              condition,
              location: location || '未设',
              category,
              imageData: images[0] || null,
              publishDate: new Date().toISOString(),
              seller: { id: '', username: '预览', createdAt: new Date().toISOString() }
            }}
            imageList={images}
            specs={[
              { label: '尺寸', value: size },
              { label: '材质', value: material },
              { label: '重量', value: weight },
              { label: '包装', value: packaging },
              { label: '其他', value: otherSpecs },
            ].filter(s => s.value.trim() !== '')}
          />
        </div>
      )}
    </div>
  );
}
