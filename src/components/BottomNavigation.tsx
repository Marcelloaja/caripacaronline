'use client';

import React from 'react';
import { Sparkles, Heart, MessageCircle, User } from 'lucide-react';
import { UserProfile } from '@/types';

interface BottomNavigationProps {
  activeTab: 'discovery' | 'likes' | 'chats' | 'profile';
  setActiveTab: (tab: 'discovery' | 'likes' | 'chats' | 'profile') => void;
  likesCount: number;
  unreadMessagesCount: number;
  currentUser: UserProfile | null;
  onOpenAuth?: () => void;
}

/**
 * Komponen Khusus Navigasi Bawah (Bottom Navigation) untuk Layar Ponsel (Mobile)
 * Mengikuti standar ergonomis sentuhan jempol dan safe-area iOS / Android
 */
export default function BottomNavigation({
  activeTab,
  setActiveTab,
  likesCount,
  unreadMessagesCount,
  currentUser,
  onOpenAuth
}: BottomNavigationProps) {
  return (
    <nav
      aria-label="Navigasi Bawah Ponsel"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#FAF7F2]/95 backdrop-blur-lg border-t border-[#E8E2D8] px-3 py-1.5 pb-[max(0.6rem,env(safe-area-inset-bottom))] shadow-[0_-4px_24px_rgba(0,0,0,0.06)] flex items-center justify-around"
    >
      {/* 1. Tab Cari Pasangan */}
      <button
        type="button"
        onClick={() => setActiveTab('discovery')}
        className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] px-2.5 py-1 rounded-2xl transition-all ${
          activeTab === 'discovery'
            ? 'bg-[#BE3A50]/10 text-[#BE3A50]'
            : 'text-[#6B6365] hover:text-[#1F1A1B]'
        }`}
      >
        <Sparkles className={`w-5 h-5 ${activeTab === 'discovery' ? 'stroke-[2.5]' : ''}`} />
        <span
          className={`text-[10px] mt-0.5 tracking-tight ${
            activeTab === 'discovery' ? 'font-bold text-[#BE3A50]' : 'font-medium'
          }`}
        >
          Cari
        </span>
      </button>

      {/* 2. Tab Menyukai Saya */}
      <button
        type="button"
        onClick={() => setActiveTab('likes')}
        className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] px-2.5 py-1 rounded-2xl relative transition-all ${
          activeTab === 'likes'
            ? 'bg-[#BE3A50]/10 text-[#BE3A50]'
            : 'text-[#6B6365] hover:text-[#1F1A1B]'
        }`}
      >
        <div className="relative">
          <Heart className={`w-5 h-5 ${activeTab === 'likes' ? 'fill-[#BE3A50] stroke-[#BE3A50]' : ''}`} />
          {likesCount > 0 && (
            <span className="absolute -top-1 -right-2 px-1.5 min-w-[16px] h-4 rounded-full bg-[#BE3A50] text-white text-[9px] font-bold flex items-center justify-center border-2 border-[#FAF7F2]">
              {likesCount}
            </span>
          )}
        </div>
        <span
          className={`text-[10px] mt-0.5 tracking-tight ${
            activeTab === 'likes' ? 'font-bold text-[#BE3A50]' : 'font-medium'
          }`}
        >
          Disukai
        </span>
      </button>

      {/* 3. Tab Pesan & Kencan */}
      <button
        type="button"
        onClick={() => setActiveTab('chats')}
        className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] px-2.5 py-1 rounded-2xl relative transition-all ${
          activeTab === 'chats'
            ? 'bg-[#BE3A50]/10 text-[#BE3A50]'
            : 'text-[#6B6365] hover:text-[#1F1A1B]'
        }`}
      >
        <div className="relative">
          <MessageCircle className={`w-5 h-5 ${activeTab === 'chats' ? 'fill-[#BE3A50]/20 stroke-[#BE3A50]' : ''}`} />
          {unreadMessagesCount > 0 && (
            <span className="absolute -top-0.5 -right-1 w-2.5 h-2.5 rounded-full bg-[#BE3A50] border-2 border-[#FAF7F2]" />
          )}
        </div>
        <span
          className={`text-[10px] mt-0.5 tracking-tight ${
            activeTab === 'chats' ? 'font-bold text-[#BE3A50]' : 'font-medium'
          }`}
        >
          Obrolan
        </span>
      </button>

      {/* 4. Tab Profil Saya / Masuk */}
      <button
        type="button"
        onClick={() => {
          if (currentUser) {
            setActiveTab('profile');
          } else if (onOpenAuth) {
            onOpenAuth();
          }
        }}
        className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] px-2.5 py-1 rounded-2xl transition-all ${
          activeTab === 'profile'
            ? 'bg-[#BE3A50]/10 text-[#BE3A50]'
            : 'text-[#6B6365] hover:text-[#1F1A1B]'
        }`}
      >
        {currentUser ? (
          <div
            className={`w-6 h-6 rounded-full overflow-hidden border transition-all ${
              activeTab === 'profile'
                ? 'border-[#BE3A50] ring-2 ring-[#BE3A50]/40'
                : 'border-[#E8E2D8]'
            }`}
          >
            <img
              src={currentUser.photoUrl}
              alt={currentUser.name}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <User className={`w-5 h-5 ${activeTab === 'profile' ? 'stroke-[2.5]' : ''}`} />
        )}
        <span
          className={`text-[10px] mt-0.5 tracking-tight ${
            activeTab === 'profile' ? 'font-bold text-[#BE3A50]' : 'font-medium'
          }`}
        >
          {currentUser ? 'Profil' : 'Masuk'}
        </span>
      </button>
    </nav>
  );
}

