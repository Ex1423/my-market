'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

/**
 * 发布商品页
 * 包含一个简单的表单，支持图片选择预览
 */
export default function PublishPage() {
  const router = useRouter();

  // 状态管理
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 引用：用于操作隐藏的文件输入框
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理图片选择
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 1. 创建本地预览 URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);

      // 2. 将图片转换为 Base64 以便存储到 localStorage
      // 注意：localStorage 有大小限制（约5MB），大图片可能会导致存储失败
      // 实际生产环境应该上传到 OSS/S3 服务器
      const reader = new FileReader();
      reader.onloadend = () => {
        // 将 base64 存入 state (如果需要存 localStorage)
        // 这里我们暂时直接用 imagePreview (blob url) 用于显示，
        // 但为了持久化，我们需要 reader.result
        // 为了演示简单，我们直接把 base64 存到 imagePreview 里，替换掉 blob url
        // 这样 handlePublish 时就能直接拿到了
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 触发文件选择框点击
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // 移除图片
  const removeImage = (e: React.MouseEvent) => {
    e.stopPropagation(); // 防止触发父元素的点击事件
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // 清空 input 值
    }
  };

  // 处理发布逻辑
  const handlePublish = async () => {
    if (!title || !price) {
      alert('请填写标题和价格');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. 构建新商品对象
      const newProduct = {
        id: Date.now(), // 使用时间戳作为简单 ID
        title,
        price: `¥ ${price}`,
        description,
        imageColor: 'bg-purple-100', // 默认背景色
        category: '其他',
        imageData: imagePreview, // Base64 图片数据
        publishDate: new Date().toLocaleDateString()
      };

      // 2. 发送到后端 API
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newProduct),
      });

      if (!response.ok) {
        throw new Error('发布失败');
      }

      // 3. 成功提示并跳转
      alert('发布成功！');
      router.push('/');
      router.refresh(); // 强制刷新数据
      
    } catch (error) {
      console.error('发布失败', error);
      alert('发布失败，可能是图片太大了？尝试一张小点的图片吧。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <main className="max-w-2xl mx-auto px-4">
        <Link href="/" className="text-blue-600 hover:underline mb-6 inline-block">
          &larr; 返回首页
        </Link>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">发布新商品</h1>
          
          <form className="space-y-6">
            {/* 标题输入 */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                商品标题
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="例如：99新 iPhone 14，自用闲置"
              />
            </div>

            {/* 价格输入 */}
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                价格 (元)
              </label>
              <input
                type="number"
                id="price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="0.00"
              />
            </div>

            {/* 描述输入 */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                详细描述
              </label>
              <textarea
                id="description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="描述一下商品的成色、入手渠道、转手原因等..."
              ></textarea>
            </div>

            {/* 图片上传区域 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                上传图片
              </label>
              
              {/* 隐藏的文件输入框 */}
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />

              {/* 点击区域 */}
              <div 
                onClick={triggerFileInput}
                className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer relative overflow-hidden group
                  ${imagePreview ? 'border-blue-500 bg-gray-50' : 'border-gray-300 hover:bg-gray-50'}`}
                style={{ minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                {imagePreview ? (
                  // 图片预览状态
                  <div className="relative w-full h-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={imagePreview} 
                      alt="预览" 
                      className="max-h-64 mx-auto object-contain rounded-md"
                    />
                    {/* 移除按钮 */}
                    <button
                      onClick={removeImage}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      title="移除图片"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  // 初始上传状态
                  <div className="space-y-2">
                    <div className="mx-auto h-12 w-12 text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                    </div>
                    <div className="text-gray-600">点击上传图片</div>
                    <div className="text-xs text-gray-400">支持 JPG, PNG, GIF</div>
                  </div>
                )}
              </div>
            </div>

            {/* 提交按钮 */}
            <button
              type="button"
              onClick={handlePublish}
              disabled={isSubmitting}
              className={`w-full text-white font-bold py-3 px-6 rounded-lg transition-colors
                ${isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {isSubmitting ? '发布中...' : '立即发布'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
