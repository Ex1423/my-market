'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

// 定义商品接口
interface Product {
  id: number | string;
  title: string;
  price: string;
  imageColor: string;
  category: string;
  imageData?: string; // 可选的 Base64 图片数据
}

/**
 * 首页组件
 * 展示网站标题、发布按钮和商品列表
 */
export default function Home() {
  // 默认模拟数据
  const defaultProducts: Product[] = [
    {
      id: 1,
      title: '99新 iPhone 14',
      price: '¥ 3,500',
      imageColor: 'bg-blue-100',
      category: '手机'
    },
    {
      id: 2,
      title: '捷安特山地自行车',
      price: '¥ 800',
      imageColor: 'bg-green-100',
      category: '自行车'
    },
    {
      id: 3,
      title: '小米护眼台灯',
      price: '¥ 60',
      imageColor: 'bg-yellow-100',
      category: '台灯'
    }
  ];

  // 状态管理：商品列表
  const [products, setProducts] = useState<Product[]>(defaultProducts);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // 在组件挂载后，从 API 获取数据
  useEffect(() => {
    async function fetchData() {
      // 获取商品
      try {
        const response = await fetch('/api/products');
        if (response.ok) {
          const storedProducts = await response.json();
          setProducts([...storedProducts, ...defaultProducts]);
        }
      } catch (error) {
        console.error('获取数据失败:', error);
      }

      // 获取当前用户
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
        }
      } catch (error) {
        console.error('获取用户失败:', error);
      }
    }
    
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-end items-center gap-4 text-sm">
          {currentUser ? (
            <>
              <span className="text-gray-600">你好, {currentUser.username}</span>
              <Link href="/profile" className="text-blue-600 hover:underline">个人中心</Link>
              {currentUser.role === 'admin' && (
                <Link href="/admin/users" className="text-purple-600 hover:underline">管理后台</Link>
              )}
            </>
          ) : (
            <>
              <Link href="/login" className="text-gray-600 hover:text-blue-600">登录</Link>
              <Link href="/register" className="text-blue-600 hover:underline">注册</Link>
            </>
          )}
        </div>
      </nav>

      {/* 
        主要内容容器 
        mx-auto: 水平居中
        max-w-6xl: 最大宽度限制
        px-4: 水平内边距
        py-8: 垂直内边距
      */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        
        {/* 
          顶部区域：包含标题和发布按钮 
          flex: 启用 Flexbox 布局
          justify-between: 两端对齐
          items-center: 垂直居中
        */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">我的二手市集</h1>
            <p className="text-gray-500 mt-1">发现好物，循环利用</p>
          </div>
          
          {/* 发布产品按钮 */}
          <Link href="/publish" className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg shadow-sm transition-colors duration-200 flex items-center gap-2">
            <span>+</span> 发布产品
          </Link>
        </div>

        {/* 
          商品网格布局
          grid: 启用 Grid 布局
          grid-cols-1: 移动端默认 1 列
          sm:grid-cols-2: 小屏幕 2 列
          lg:grid-cols-3: 大屏幕 3 列
          gap-6: 网格间距
        */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            // 商品卡片
            <div 
              key={product.id} 
              className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden group"
            >
              {/* 
                图片占位区域 
                aspect-video: 保持 16:9 比例
                flex/items-center/justify-center: 内容居中
              */}
              <div className={`aspect-[4/3] ${product.imageColor} flex items-center justify-center relative overflow-hidden`}>
                {product.imageData ? (
                  // 如果有上传的图片，显示真实图片
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={product.imageData} 
                    alt={product.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  // 否则显示默认占位文字
                  <span className="text-gray-400 font-medium text-lg group-hover:scale-110 transition-transform duration-300">
                    {product.category}图片
                  </span>
                )}
              </div>
              
              {/* 商品信息区域 */}
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-medium text-gray-900 line-clamp-1" title={product.title}>
                    {product.title}
                  </h3>
                </div>
                
                <div className="flex justify-between items-center mt-4">
                  <span className="text-xl font-bold text-red-600">
                    {product.price}
                  </span>
                  <Link href={`/product/${product.id}`} className="text-sm text-gray-500 hover:text-blue-600 font-medium">
                    查看详情
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
