'use client';

import React, { useState } from 'react';
import {
  Heart, MessageCircle, User, Bell, Wifi, WifiOff, AlertTriangle,
  Sparkles, CheckCircle2, LogIn, LogOut
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
  onOpenOnboarding,
  onOpenAuth,
  onSignOut
}: NavbarProps) {
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const unreadNotifs = notifications.filter(n => !n.isRead).length;

  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E8E2D8]">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('discovery')}>
          <div className="w-10 h-10 rounded-2xl bg-[#BE3A50] flex items-center justify-center text-white shadow-sm shadow-[#BE3A50]/20">
            <Heart className="w-5 h-5 fill-white stroke-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg tracking-tight text-[#1F1A1B]">CariPacar</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#15803D]/10 text-[#15803D] font-medium border border-[#15803D]/20">
                Lajang & Asli
              </span>
            </div>
            <p className="text-[11px] text-[#6B6365] hidden sm:block">Komitmen Serius Menuju Masa Depan</p>
          </div>
        </div>

        {/* Navigation Tabs (Desktop & Tablet) */}
        <nav className="hidden md:flex items-center gap-1 bg-[#F0EBE1] p-1 rounded-2xl border border-[#E8E2D8]">
          <button
            onClick={() => setActiveTab('discovery')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'discovery'
                ? 'bg-white text-[#BE3A50] shadow-sm'
                : 'text-[#6B6365] hover:text-[#1F1A1B]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Cari Pasangan
          </button>

          <button
            onClick={() => setActiveTab('likes')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 relative ${
              activeTab === 'likes'
                ? 'bg-white text-[#BE3A50] shadow-sm'
                : 'text-[#6B6365] hover:text-[#1F1A1B]'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            Menyukai Saya
            {likesCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#BE3A50] text-white text-[10px] font-bold">
                {likesCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('chats')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 relative ${
              activeTab === 'chats'
                ? 'bg-white text-[#BE3A50] shadow-sm'
                : 'text-[#6B6365] hover:text-[#1F1A1B]'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Pesan & Kencan
            {unreadMessagesCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-[#BE3A50]" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'bg-white text-[#BE3A50] shadow-sm'
                : 'text-[#6B6365] hover:text-[#1F1A1B]'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Profil Saya
          </button>
        </nav>

        {/* Right Section: Status Jaringan, Notifikasi, Settings */}
        <div className="flex items-center gap-2">
          {/* Indikator Sinyal / Jaringan */}
          <div
            title={`Status Jaringan: ${
              networkStatus === 'online'
                ? 'Sinyal Bagus'
                : networkStatus === 'slow'
                ? 'Jaringan Tidak Stabil'
                : 'Terputus / Offline'
            }`}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
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
              className="w-9 h-9 rounded-xl border border-[#E8E2D8] bg-white flex items-center justify-center text-[#1F1A1B] hover:bg-[#F0EBE1] transition-all relative"
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
                          className="w-10 h-10 rounded-full object-cover border border-[#E8E2D8]"
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

          {/* User Auth Action Button */}
          {currentUser ? (
            <div className="flex items-center gap-1.5 pl-1">
              <button
                onClick={() => setActiveTab('profile')}
                className="flex items-center gap-2 p-1 pr-2.5 rounded-full border border-[#E8E2D8] bg-white hover:bg-[#F0EBE1] transition-all"
                title={`Profil ${currentUser.name}`}
              >
                <img
                  src={currentUser.photoUrl}
                  alt={currentUser.name}
                  className="w-7 h-7 rounded-full object-cover border border-[#BE3A50]/30"
                />
                <span className="text-xs font-semibold text-[#1F1A1B] hidden lg:inline max-w-[80px] truncate">
                  {currentUser.name}
                </span>
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-3 py-1.5 rounded-xl bg-[#BE3A50] hover:bg-[#a32f42] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Masuk / Daftar</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-t border-[#E8E2D8] px-4 py-2 flex items-center justify-around">
        <button
          onClick={() => setActiveTab('discovery')}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium py-1 px-3 rounded-xl ${
            activeTab === 'discovery' ? 'text-[#BE3A50]' : 'text-[#6B6365]'
          }`}
        >
          <Sparkles className="w-5 h-5" />
          <span>Cari</span>
        </button>

        <button
          onClick={() => setActiveTab('likes')}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium py-1 px-3 rounded-xl relative ${
            activeTab === 'likes' ? 'text-[#BE3A50]' : 'text-[#6B6365]'
          }`}
        >
          <Heart className="w-5 h-5" />
          <span>Disukai</span>
          {likesCount > 0 && (
            <span className="absolute top-0 right-2 px-1 rounded-full bg-[#BE3A50] text-white text-[9px] font-bold">
              {likesCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('chats')}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium py-1 px-3 rounded-xl relative ${
            activeTab === 'chats' ? 'text-[#BE3A50]' : 'text-[#6B6365]'
          }`}
        >
          <MessageCircle className="w-5 h-5" />
          <span>Obrolan</span>
          {unreadMessagesCount > 0 && (
            <span className="absolute top-1 right-3 w-2 h-2 rounded-full bg-[#BE3A50]" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium py-1 px-3 rounded-xl ${
            activeTab === 'profile' ? 'text-[#BE3A50]' : 'text-[#6B6365]'
          }`}
        >
          <User className="w-5 h-5" />
          <span>Profil</span>
        </button>
      </div>
    </header>
  );
}

