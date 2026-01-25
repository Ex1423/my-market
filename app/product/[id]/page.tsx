import React from 'react';
import Link from 'next/link';

/**
 * 商品详情页组件
 * 动态路由: /product/[id]
 */
export default async function ProductDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // 获取路由参数中的 id
  const { id } = await params;

  // 模拟根据 ID 获取商品数据的逻辑
  // 实际项目中这里应该请求后端 API
  const product = {
    id: id,
    title: id === '1' ? '99新 iPhone 14' : '示例商品',
    price: id === '1' ? '¥ 3,500' : '¥ ???',
    description: '这是一段关于商品的详细描述。卖家很懒，什么都没写...',
    seller: '张三',
    publishDate: '2023-10-25',
    imageColor: 'bg-gray-200'
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <main className="max-w-4xl mx-auto px-4">
        {/* 返回按钮 */}
        <Link href="/" className="text-blue-600 hover:underline mb-6 inline-block">
          &larr; 返回首页
        </Link>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* 商品图片区域 */}
          <div className={`h-64 sm:h-80 ${product.imageColor} flex items-center justify-center`}>
            <span className="text-gray-400 text-2xl">商品大图预览</span>
          </div>

          {/* 商品详细信息 */}
          <div className="p-6 sm:p-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  {product.title}
                </h1>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>卖家: {product.seller}</span>
                  <span>发布于: {product.publishDate}</span>
                </div>
              </div>
              <span className="text-2xl sm:text-3xl font-bold text-red-600">
                {product.price}
              </span>
            </div>

            <div className="mt-8">
              <h2 className="text-lg font-medium text-gray-900 mb-3">商品描述</h2>
              <p className="text-gray-600 leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* 底部操作按钮 */}
            <div className="mt-10 pt-6 border-t border-gray-100 flex gap-4">
              <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors">
                我想要
              </button>
              <button className="flex-1 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-3 px-6 rounded-lg transition-colors">
                收藏
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
