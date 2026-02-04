'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

interface NotificationContextType {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
  playSound: (type: string) => void;
}

const NotificationContext = createContext<NotificationContextType>({
  unreadCount: 0,
  refreshUnreadCount: async () => {},
  playSound: () => {},
});

export const useNotification = () => useContext(NotificationContext);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [soundType, setSoundType] = useState('default');
  const pathname = usePathname();
  const prevCountRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize AudioContext
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }, []);

  const playSound = (type: string) => {
    if (type === 'none' || !audioContextRef.current) return;
    
    // Resume context if suspended (browser policy)
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    const ctx = audioContextRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'chime') {
      // Ding-Dong style
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    } else if (type === 'alert') {
      // Urgent beep
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.setValueAtTime(0.1, now + 0.1);
      gain.gain.setValueAtTime(0, now + 0.1);
      
      osc.start(now);
      osc.stop(now + 0.15);
      
      // Second beep
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.type = 'square';
      osc2.frequency.setValueAtTime(800, now + 0.2);
      gain2.gain.setValueAtTime(0.1, now + 0.2);
      gain2.gain.setValueAtTime(0, now + 0.3);
      osc2.start(now + 0.2);
      osc2.stop(now + 0.35);

    } else {
      // Default: Simple "Ding"
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now); // A5
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    }
  };

  const fetchUnreadCount = async (signal?: AbortSignal) => {
    try {
      const res = await fetch('/api/messages/unread', { signal });
      if (res.ok) {
        const data = await res.json();
        const newCount = data.count || 0;
        const sound = data.sound || 'default';
        
        setSoundType(sound);

        // If count increased, play sound
        // Only play if we are NOT on the chat page (optional preference, but usually good UX)
        // Or play anyway. User requested notification.
        if (newCount > prevCountRef.current && newCount > 0) {
          // Check if we are already chatting with the person? 
          // For global notification, just play sound.
          playSound(sound);
        }

        setUnreadCount(newCount);
        prevCountRef.current = newCount;
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error('Failed to fetch unread count', error);
    }
  };

  // Poll every 5 seconds
  useEffect(() => {
    const controller = new AbortController();
    
    // Initial fetch with delay to avoid strict mode double-fetch aborts
    const timer = setTimeout(() => {
        fetchUnreadCount(controller.signal);
    }, 50);

    const interval = setInterval(() => fetchUnreadCount(controller.signal), 5000);
    return () => {
      clearTimeout(timer);
      controller.abort();
      clearInterval(interval);
    };
  }, []);

  // Refresh when pathname changes (e.g. leaving chat page might update status)
  useEffect(() => {
    const controller = new AbortController();
    
    const timer = setTimeout(() => {
        fetchUnreadCount(controller.signal);
    }, 50);
    
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [pathname]);

  return (
    <NotificationContext.Provider value={{ unreadCount, refreshUnreadCount: fetchUnreadCount, playSound }}>
      {children}
    </NotificationContext.Provider>
  );
}
