'use client';

import React, { useState } from 'react';
import {
  Heart, MessageCircle, User, Bell, Wifi, WifiOff, AlertTriangle,
  Sparkles, LogIn
} from 'lucide-react';
import { AppNotification, UserProfile } from '@/types';

interface NavbarProps {
  activeTab: 'discovery' | 'likes' | 'chats' | 'profile';
  setActiveTab: (tab: 'discovery' | 'likes' | 'chats' | 'profile') => void;
  currentUser: UserProfile | null;
  likesCount: number;
  unreadMessagesCount: number;
  notifications: AppNotification[];
  onMarkNotificationsRead: () => void;
  networkStatus: 'online' | 'slow' | 'offline';
  onOpenOnboarding: () => void;
  onOpenAuth?: () => void;
  onSignOut?: () => void;
}

export default function Navbar({
  activeTab,
  setActiveTab,
  currentUser,
  likesCount,
  unreadMessagesCount,
  notifications,
  onMarkNotificationsRead,
  networkStatus,
  onOpenAuth
}: NavbarProps) {
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const unreadNotifs = notifications.filter((n) => !n.isRead).length;

  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E8E2D8]">
      {/* ================= TOP APP BAR (DESKTOP & MOBILE COMPACT) ================= */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
        {/* Brand Logo & Tagline */}
        <div
          className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none shrink-0"
          onClick={() => setActiveTab('discovery')}
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#BE3A50] flex items-center justify-center text-white shadow-sm shadow-[#BE3A50]/20 shrink-0">
            <Heart className="w-4 h-4 sm:w-5 sm:h-5 fill-white stroke-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-bold text-base sm:text-lg tracking-tight text-[#1F1A1B] leading-none">
                CariPacar
              </span>
              <span className="text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded-full bg-[#15803D]/10 text-[#15803D] font-semibold border border-[#15803D]/20 leading-tight shrink-0">
                Lajang & Asli
              </span>
            </div>
            <p className="text-[11px] text-[#6B6365] mt-0.5 hidden xl:block whitespace-nowrap">
              Komitmen Serius Menuju Masa Depan
            </p>
          </div>
        </div>

        {/* Desktop Navigation Tabs (Hidden on Mobile) */}
        <nav className="hidden md:flex items-center gap-1 bg-[#F0EBE1] p-1 rounded-2xl border border-[#E8E2D8] shrink-0">
          <button
            onClick={() => setActiveTab('discovery')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'discovery'
                ? 'bg-white text-[#BE3A50] shadow-sm'
                : 'text-[#6B6365] hover:text-[#1F1A1B]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Cari Pasangan</span>
          </button>

          <button
            onClick={() => setActiveTab('likes')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap relative ${
              activeTab === 'likes'
                ? 'bg-white text-[#BE3A50] shadow-sm'
                : 'text-[#6B6365] hover:text-[#1F1A1B]'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>Menyukai Saya</span>
            {likesCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#BE3A50] text-white text-[10px] font-bold">
                {likesCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('chats')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap relative ${
              activeTab === 'chats'
                ? 'bg-white text-[#BE3A50] shadow-sm'
                : 'text-[#6B6365] hover:text-[#1F1A1B]'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Pesan & Kencan</span>
            {unreadMessagesCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-[#BE3A50]" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'profile'
                ? 'bg-white text-[#BE3A50] shadow-sm'
                : 'text-[#6B6365] hover:text-[#1F1A1B]'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profil Saya</span>
          </button>
        </nav>

        {/* Right Section (Network Indicator, Notifications, and Desktop Profile) */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Indikator Status Jaringan */}
          <div
            title={`Status Jaringan: ${
              networkStatus === 'online'
                ? 'Sinyal Bagus'
                : networkStatus === 'slow'
                ? 'Jaringan Tidak Stabil'
                : 'Terputus / Offline'
            }`}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${
              networkStatus === 'online'
                ? 'bg-[#DCFCE7] text-[#15803D] border-[#15803D]/20'
                : networkStatus === 'slow'
                ? 'bg-[#FEF3C7] text-[#B45309] border-[#B45309]/30'
                : 'bg-red-100 text-red-700 border-red-200'
            }`}
          >
            {networkStatus === 'online' && <Wifi className="w-3 h-3" />}
            {networkStatus === 'slow' && <AlertTriangle className="w-3 h-3 animate-pulse" />}
            {networkStatus === 'offline' && <WifiOff className="w-3 h-3" />}
            <span className="hidden sm:inline capitalize">
              {networkStatus === 'online' ? 'Online' : networkStatus === 'slow' ? 'Sinyal Lemah' : 'Offline'}
            </span>
          </div>

          {/* Tombol Notifikasi */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifDropdown(!showNotifDropdown);
                if (!showNotifDropdown && unreadNotifs > 0) {
                  onMarkNotificationsRead();
                }
              }}
              className="w-9 h-9 rounded-xl border border-[#E8E2D8] bg-white flex items-center justify-center text-[#1F1A1B] hover:bg-[#F0EBE1] transition-all relative shrink-0"
              aria-label="Notifikasi"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifs > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#BE3A50] text-white text-[10px] font-bold flex items-center justify-center border-2 border-[#FAF7F2]">
                  {unreadNotifs}
                </span>
              )}
            </button>

            {/* Dropdown Notifikasi */}
            {showNotifDropdown && (
              <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white rounded-2xl shadow-xl border border-[#E8E2D8] p-3 z-50">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E8E2D8]">
                  <span className="font-semibold text-xs text-[#1F1A1B]">Notifikasi Love & Catatan</span>
                  <span className="text-[11px] text-[#6B6365]">{notifications.length} pembaruan</span>
                </div>

                {notifications.length === 0 ? (
                  <p className="text-xs text-[#6B6365] text-center py-6">Belum ada notifikasi baru.</p>
                ) : (
                  <div className="space-y-2">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          setShowNotifDropdown(false);
                          setActiveTab('likes');
                        }}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer flex gap-3 ${
                          notif.isRead
                            ? 'bg-[#FAF7F2] border-[#E8E2D8]'
                            : 'bg-[#FBEBEE] border-[#BE3A50]/20'
                        }`}
                      >
                        <img
                          src={notif.fromUser.photoUrl}
                          alt={notif.fromUser.name}
                          className="w-10 h-10 rounded-full object-cover border border-[#E8E2D8] shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-[#1F1A1B]">
                            {notif.fromUser.name}
                            <span className="font-normal text-[#6B6365]">
                              {notif.type === 'love_note' ? ' mengirimkan Love + Catatan' : ' menyukai profil Anda!'}
                            </span>
                          </p>
                          {notif.note && (
                            <p className="text-[11px] text-[#BE3A50] italic bg-white/70 p-1 rounded-md mt-1 line-clamp-2">
                              &ldquo;{notif.note}&rdquo;
                            </p>
                          )}
                          <p className="text-[10px] text-[#6B6365] mt-1">
                            {new Date(notif.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} • {notif.fromUser.city}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Profile Pill / Login Button (Hanya tampil di Desktop, karena di Mobile sudah ada di Navigasi Bawah) */}
          <div className="hidden md:flex items-center">
            {currentUser ? (
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border transition-all shrink-0 ${
                  activeTab === 'profile'
                    ? 'bg-white border-[#BE3A50] ring-2 ring-[#BE3A50]/20 shadow-sm'
                    : 'bg-white border-[#E8E2D8] hover:bg-[#F0EBE1]'
                }`}
                title={`Buka profil ${currentUser.name}`}
              >
                <img
                  src={currentUser.photoUrl}
                  alt={currentUser.name}
                  className="w-7 h-7 rounded-full object-cover border border-[#BE3A50]/30 shrink-0"
                />
                <span className="text-xs font-semibold text-[#1F1A1B] whitespace-nowrap max-w-[110px] truncate">
                  {currentUser.name}
                </span>
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-3.5 py-1.5 rounded-xl bg-[#BE3A50] hover:bg-[#a32f42] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm whitespace-nowrap shrink-0"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Masuk / Daftar</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ================= MOBILE BOTTOM NAVIGATION BAR (KHUSUS PONSEL) ================= */}
      <nav
        aria-label="Navigasi Bawah Layar Ponsel"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#FAF7F2]/95 backdrop-blur-lg border-t border-[#E8E2D8] px-3 py-1.5 pb-[max(0.6rem,env(safe-area-inset-bottom))] shadow-[0_-4px_24px_rgba(0,0,0,0.06)] flex items-center justify-around"
      >
        {/* Tab 1: Cari Pasangan */}
        <button
          onClick={() => setActiveTab('discovery')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] px-2.5 py-1 rounded-2xl transition-all ${
            activeTab === 'discovery'
              ? 'bg-[#BE3A50]/10 text-[#BE3A50]'
              : 'text-[#6B6365] hover:text-[#1F1A1B]'
          }`}
        >
          <Sparkles className={`w-5 h-5 ${activeTab === 'discovery' ? 'stroke-[2.5]' : ''}`} />
          <span className={`text-[10px] mt-0.5 tracking-tight ${activeTab === 'discovery' ? 'font-bold text-[#BE3A50]' : 'font-medium'}`}>
            Cari
          </span>
        </button>

        {/* Tab 2: Menyukai Saya */}
        <button
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
          <span className={`text-[10px] mt-0.5 tracking-tight ${activeTab === 'likes' ? 'font-bold text-[#BE3A50]' : 'font-medium'}`}>
            Disukai
          </span>
        </button>

        {/* Tab 3: Pesan & Kencan */}
        <button
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
          <span className={`text-[10px] mt-0.5 tracking-tight ${activeTab === 'chats' ? 'font-bold text-[#BE3A50]' : 'font-medium'}`}>
            Obrolan
          </span>
        </button>

        {/* Tab 4: Profil Pengguna / Tombol Masuk */}
        <button
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
            <div className={`w-6 h-6 rounded-full overflow-hidden border transition-all ${
              activeTab === 'profile'
                ? 'border-[#BE3A50] ring-2 ring-[#BE3A50]/40'
                : 'border-[#E8E2D8]'
            }`}>
              <img
                src={currentUser.photoUrl}
                alt={currentUser.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <User className={`w-5 h-5 ${activeTab === 'profile' ? 'stroke-[2.5]' : ''}`} />
          )}
          <span className={`text-[10px] mt-0.5 tracking-tight ${activeTab === 'profile' ? 'font-bold text-[#BE3A50]' : 'font-medium'}`}>
            {currentUser ? 'Profil' : 'Masuk'}
          </span>
        </button>
      </nav>
    </header>
  );
}
