'use client';

import React, { useState, useEffect } from 'react';

/** 调试面板 - 所有选项默认闭合，用于手动调试界面参数 */
export default function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // 从 localStorage 恢复调试值
  useEffect(() => {
    const stored = localStorage.getItem('debug_panel_values');
    if (stored) {
      try {
        const obj = JSON.parse(stored);
        Object.entries(obj).forEach(([key, value]) => {
          if (typeof value === 'string') {
            document.documentElement.style.setProperty(key, value);
          }
        });
      } catch (_) {}
    }
  }, []);

  const setVar = (name: string, value: string) => {
    document.documentElement.style.setProperty(name, value);
    const stored = localStorage.getItem('debug_panel_values') || '{}';
    const obj = { ...JSON.parse(stored), [name]: value };
    localStorage.setItem('debug_panel_values', JSON.stringify(obj));
  };

  const getVar = (name: string, fallback: string) => {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
  };

  const resetVar = (name: string, fallback: string) => {
    document.documentElement.style.removeProperty(name);
    const stored = localStorage.getItem('debug_panel_values') || '{}';
    const obj = JSON.parse(stored);
    delete obj[name];
    localStorage.setItem('debug_panel_values', JSON.stringify(obj));
  };

  const Section = ({
    id,
    title,
    children,
  }: {
    id: string;
    title: string;
    children: React.ReactNode;
  }) => {
    const isExpanded = expandedSections[id] ?? false;
    return (
      <div className="border-b border-gray-200 last:border-0">
        <button
          type="button"
          onClick={() => toggleSection(id)}
          className="w-full flex items-center justify-between px-3 py-2.5 text-left text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          {title}
          <svg
            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isExpanded && <div className="px-3 pb-3 space-y-2">{children}</div>}
      </div>
    );
  };

  const ColorInput = ({
    label,
    varName,
    fallback,
  }: {
    label: string;
    varName: string;
    fallback: string;
  }) => (
    <div className="flex items-center gap-2">
      <label className="text-xs text-gray-600 w-24 shrink-0">{label}</label>
      <input
        type="color"
        value={getVar(varName, fallback)}
        onChange={(e) => setVar(varName, e.target.value)}
        className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
        title={label}
        aria-label={label}
      />
      <input
        type="text"
        value={getVar(varName, fallback)}
        onChange={(e) => setVar(varName, e.target.value)}
        className="flex-1 text-xs px-2 py-1 border border-gray-200 rounded"
        title={label}
        aria-label={label}
      />
      <button
        type="button"
        onClick={() => resetVar(varName, fallback)}
        className="text-xs text-gray-500 hover:text-red-600"
      >
        重置
      </button>
    </div>
  );

  const NumberInput = ({
    label,
    varName,
    fallback,
    unit = '',
    min,
    max,
    step = 1,
  }: {
    label: string;
    varName: string;
    fallback: string;
    unit?: string;
    min?: number;
    max?: number;
    step?: number;
  }) => (
    <div className="flex items-center gap-2">
      <label className="text-xs text-gray-600 w-24 shrink-0">{label}</label>
      <input
        type="number"
        value={parseFloat(getVar(varName, fallback)) || 0}
        onChange={(e) => setVar(varName, e.target.value + unit)}
        min={min}
        max={max}
        step={step}
        className="flex-1 text-xs px-2 py-1 border border-gray-200 rounded"
        title={label}
        aria-label={label}
      />
      <button
        type="button"
        onClick={() => resetVar(varName, fallback)}
        className="text-xs text-gray-500 hover:text-red-600"
      >
        重置
      </button>
    </div>
  );

  const TextInput = ({
    label,
    varName,
    fallback,
  }: {
    label: string;
    varName: string;
    fallback: string;
  }) => (
    <div className="flex items-center gap-2">
      <label className="text-xs text-gray-600 w-24 shrink-0">{label}</label>
      <input
        type="text"
        value={getVar(varName, fallback)}
        onChange={(e) => setVar(varName, e.target.value)}
        className="flex-1 text-xs px-2 py-1 border border-gray-200 rounded"
        title={label}
        aria-label={label}
      />
      <button
        type="button"
        onClick={() => resetVar(varName, fallback)}
        className="text-xs text-gray-500 hover:text-red-600"
      >
        重置
      </button>
    </div>
  );

  return (
    <>
      {/* 悬浮按钮 */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 right-4 z-[9999] w-10 h-10 rounded-full bg-gray-800 text-white shadow-lg flex items-center justify-center hover:bg-gray-700 md:bottom-4"
        title="调试面板"
        aria-label="打开调试面板"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {/* 面板 */}
      {isOpen && (
        <div className="fixed top-16 right-4 bottom-20 w-[320px] max-h-[calc(100vh-8rem)] z-[9998] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col md:bottom-4 md:top-4 md:max-h-[calc(100vh-2rem)]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h2 className="font-bold text-gray-800">调试面板</h2>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded"
              aria-label="关闭调试面板"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            <Section id="global" title="全局颜色">
              <ColorInput label="背景" varName="--background" fallback="#ffffff" />
              <ColorInput label="前景色" varName="--foreground" fallback="#171717" />
              <ColorInput label="页面背景" varName="--page-bg" fallback="#F7F9FC" />
            </Section>

            <Section id="primary" title="主题色">
              <ColorInput label="主色" varName="--color-primary" fallback="#2563eb" />
              <ColorInput label="主色悬停" varName="--color-primary-hover" fallback="#1d4ed8" />
              <ColorInput label="强调色" varName="--color-accent" fallback="#FF6B00" />
            </Section>

            <Section id="card" title="商品卡片">
              <ColorInput label="价格颜色" varName="--card-price-color" fallback="#2BFF00" />
              <TextInput
                label="阴影"
                varName="--card-shadow"
                fallback="0 2px 15px rgba(0,0,0,0.05)"
              />
              <TextInput
                label="悬停阴影"
                varName="--card-shadow-hover"
                fallback="0 8px 30px rgba(0,0,0,0.12)"
              />
              <NumberInput label="圆角" varName="--card-radius" fallback="24" unit="" min={0} max={48} />
            </Section>

            <Section id="nav" title="底部导航">
              <ColorInput label="激活色" varName="--nav-active-color" fallback="#FF6B00" />
              <ColorInput label="未激活色" varName="--nav-inactive-color" fallback="#6b7280" />
            </Section>

            <Section id="chat" title="聊天">
              <ColorInput label="消息蓝" varName="--chat-bubble-color" fallback="#0047AB" />
              <ColorInput label="输入框背景" varName="--chat-input-bg" fallback="#0047AB" />
            </Section>

            <Section id="button" title="按钮">
              <ColorInput label="发布按钮" varName="--btn-publish-bg" fallback="#10B981" />
              <ColorInput label="发布悬停" varName="--btn-publish-hover" fallback="#059669" />
              <NumberInput label="圆角" varName="--btn-radius" fallback="8" unit="" min={0} max={24} />
            </Section>

            <Section id="spacing" title="间距与布局">
              <NumberInput label="容器最大宽" varName="--container-max-w" fallback="1280" unit="" min={320} max={1920} />
              <NumberInput label="网格间距" varName="--grid-gap" fallback="8" unit="" min={0} max={32} />
              <NumberInput label="内边距" varName="--page-padding" fallback="24" unit="" min={0} max={64} />
            </Section>

            <Section id="search" title="搜索框">
              <TextInput
                label="阴影"
                varName="--search-shadow"
                fallback="0 4px 20px rgba(0,0,0,0.03)"
              />
            </Section>

            <Section id="category" title="分类按钮">
              <ColorInput label="选中背景" varName="--category-selected-bg" fallback="#2563eb" />
              <ColorInput label="选中文字" varName="--category-selected-text" fallback="#ffffff" />
              <NumberInput label="圆角" varName="--category-radius" fallback="9999" unit="" />
            </Section>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem('debug_panel_values');
                  document.documentElement.querySelectorAll('style[data-debug-panel]').forEach((s) => s.remove());
                  const vars = [
                    '--background', '--foreground', '--page-bg',
                    '--color-primary', '--color-primary-hover', '--color-accent',
                    '--card-price-color', '--card-shadow', '--card-shadow-hover', '--card-radius',
                    '--nav-active-color', '--nav-inactive-color',
                    '--chat-bubble-color', '--chat-input-bg',
                    '--btn-publish-bg', '--btn-publish-hover', '--btn-radius',
                    '--container-max-w', '--grid-gap', '--page-padding',
                    '--search-shadow',
                    '--category-selected-bg', '--category-selected-text', '--category-radius',
                  ];
                  vars.forEach((v) => document.documentElement.style.removeProperty(v));
                  window.location.reload();
                }}
                className="w-full py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg border border-red-200"
              >
                清除所有调试并刷新
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
