'use client';

import React, { useState, useRef, useEffect } from 'react';

interface ProductImageGalleryProps {
  imageList: string[];
  title: string;
}

export default function ProductImageGallery({ imageList, title }: ProductImageGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Interaction state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const lastPositionRef = useRef({ x: 0, y: 0 });

  // Touch handling refs
  const lastTouchDistance = useRef<number | null>(null);
  const lastTapTimeRef = useRef(0); // For double tap detection
  const ignoreNextDoubleClickRef = useRef(false);

  // Reset state when switching images or closing fullscreen
  useEffect(() => {
    resetZoom();
  }, [currentImageIndex, isFullscreen]);

  // Handle wheel zoom (only in fullscreen)
  useEffect(() => {
    if (!isFullscreen) return;
    
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = -e.deltaY * 0.005;
      setScale(prevScale => {
        const newScale = Math.min(Math.max(1, prevScale + delta), 5);
        return newScale;
      });
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    return () => container.removeEventListener('wheel', onWheel);
  }, [isFullscreen]);

  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setIsDragging(false);
  };

  // --- Mouse Events ---
  const handleDoubleClick = () => {
    if (ignoreNextDoubleClickRef.current) {
      ignoreNextDoubleClickRef.current = false;
      return;
    }
    setIsFullscreen(prev => !prev);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isFullscreen) return; // Only allow panning in fullscreen

    if (e.button === 0 || e.button === 2) {
      // Left or Right click to start dragging in fullscreen
      // Only allow dragging if zoomed in? Or always allow panning if image > screen?
      // For simplicity, allow dragging if scale > 1
      if (scale > 1) {
        setIsDragging(true);
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        lastPositionRef.current = { ...position };
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isFullscreen && isDragging && scale > 1) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      setPosition({
        x: lastPositionRef.current.x + dx,
        y: lastPositionRef.current.y + dy
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (isFullscreen) {
      e.preventDefault();
    }
  };

  // --- Touch Events (Mobile) ---
  const getDistance = (touches: React.TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      // Check for double tap
      const now = Date.now();
      if (now - lastTapTimeRef.current < 300) {
        // Double tap detected
        setIsFullscreen(!isFullscreen);
        lastTapTimeRef.current = 0; // Reset
      } else {
        lastTapTimeRef.current = now;
        
        // Drag logic (only in fullscreen)
        if (isFullscreen && scale > 1) {
          setIsDragging(true);
          dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
          lastPositionRef.current = { ...position };
        }
      }
    } else if (e.touches.length === 2 && isFullscreen) {
      // Pinch logic (only in fullscreen)
      setIsDragging(true);
      lastTouchDistance.current = getDistance(e.touches);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isFullscreen) return;

    if (e.touches.length === 1) {
      if (isDragging && scale > 1) {
        if (e.cancelable) e.preventDefault();
        const dx = e.touches[0].clientX - dragStartRef.current.x;
        const dy = e.touches[0].clientY - dragStartRef.current.y;
        setPosition({
          x: lastPositionRef.current.x + dx,
          y: lastPositionRef.current.y + dy
        });
      }
    } else if (e.touches.length === 2) {
      if (e.cancelable) e.preventDefault();
      const currentDistance = getDistance(e.touches);
      if (lastTouchDistance.current !== null) {
        const ratio = currentDistance / lastTouchDistance.current;
        setScale(prevScale => Math.min(Math.max(1, prevScale * ratio), 5));
        lastTouchDistance.current = currentDistance;
      }
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    lastTouchDistance.current = null;
    
    // Auto-reset position if scale is 1 (optional cleanup)
    if (scale <= 1) {
      setPosition({ x: 0, y: 0 });
    }
  };

  // Render the image with common props
  const renderImage = (isOverlay: boolean) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img 
      src={imageList[currentImageIndex]} 
      alt={title} 
      className={`${isOverlay ? 'w-full h-full' : 'w-[538px] h-[302px]'} object-contain transition-transform duration-200 ease-out ${isOverlay ? '' : 'cursor-pointer'}`}
      style={isOverlay ? {
        transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
        transition: isDragging ? 'none' : 'transform 0.2s ease-out',
        cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
      } : {}}
      draggable={false}
    />
  );

  return (
    <div className="space-y-4">
      {/* Inline Main Image (Click to open fullscreen) */}
      <div 
        className="w-[538px] aspect-video rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 flex items-center justify-center relative cursor-zoom-in"
        onDoubleClick={handleDoubleClick}
        onTouchStart={handleTouchStart} // Use shared handler for double tap detection
      >
        {imageList.length > 0 ? renderImage(false) : (
          <div className="flex flex-col items-center opacity-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/logo.png" 
              alt="U-Goods Logo" 
              className="w-32 h-32 object-contain mb-2"
            />
            <span className="text-gray-400 text-sm">卖家未上传图片</span>
          </div>
        )}
        
        {imageList.length > 0 && (
          <div className="absolute bottom-4 right-4 bg-black/50 text-white text-xs px-2 py-1 rounded pointer-events-none">
            双击全屏查看
          </div>
        )}
      </div>

      {/* Fullscreen Overlay */}
      {isFullscreen && imageList.length > 0 && (
        <div 
          ref={containerRef}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center touch-none"
          onDoubleClick={handleDoubleClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onContextMenu={handleContextMenu}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Close Button */}
          <button 
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 text-white p-2 bg-white/20 rounded-full hover:bg-white/30 z-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="w-full h-full p-4 flex items-center justify-center">
             {renderImage(true)}
          </div>
          
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white/70 text-sm pointer-events-none">
            双击退出 · 滚轮/双指缩放 · 拖拽平移
          </div>
        </div>
      )}

      {/* Thumbnails */}
      {imageList.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
          {imageList.map((img: string, index: number) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${
                currentImageIndex === index ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt={`Thumbnail ${index}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
