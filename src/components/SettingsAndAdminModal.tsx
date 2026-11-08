'use client';

import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, Key, Wifi, RefreshCw, X, Check, Sparkles, UserCheck } from 'lucide-react';
import { getGeminiApiKey, setGeminiApiKey } from '@/lib/gemini';
import { UserProfile } from '@/types';
import { saveCurrentUser, resetDemoData } from '@/lib/storage';

interface SettingsAndAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onUserChanged: (newUser: UserProfile) => void;
  networkStatus: 'online' | 'slow' | 'offline';
  setNetworkStatus: (status: 'online' | 'slow' | 'offline') => void;
}

export default function SettingsAndAdminModal({
  isOpen,
  onClose,
  currentUser,
  onUserChanged,
  networkStatus,
  setNetworkStatus
}: SettingsAndAdminModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setApiKey(getGeminiApiKey());
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveApiKey = () => {
    setGeminiApiKey(apiKey);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  // Switch demo persona
  const handleSwitchPersona = (gender: 'pria' | 'wanita') => {
    let newProfile: UserProfile;

    if (gender === 'pria') {
      newProfile = {
        id: 'current_user_me',
        name: 'Budi Kurniawan',
        gender: 'pria',
        interestedIn: 'wanita',
        originCity: 'Bandung',
        currentCity: 'Jakarta',
        country: 'Indonesia',
        birthYear: 1996,
        age: 30,
        heightCm: 176,
        mbti: 'INFJ',
        bio: 'Pria sederhana yang bekerja di bidang teknologi finansial di Jakarta Pusat. Gemar membaca buku di akhir pekan, jogging di GBK, dan mencoba kedai kopi baru. Mencari calon istri yang siap bersama menuju pernikahan.',
        aiSummary: 'Pribadi INFJ asal Bandung yang berkarier di Jakarta. Mencari teman hidup sejati yang siap melangkah ke pernikahan penuh berkah dan saling melengkapi.',
        skills: ['Komunikasi Empatis', 'Mengelola Finansial', 'Mendengarkan Cerita'],
        hobbies: ['Membaca Buku', 'Olahraga / Gym', 'Kopi & Nongkrong'],
        ethnicity: 'Sunda',
        photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80',
        isPhotoVerified: true,
        hasSignedPledge: true,
        targetMarriage: '1_tahun',
        occupation: 'Financial Analyst',
        education: 'S1 Manajemen Keuangan',
        religion: 'Islam',
        createdAt: '2026-01-01T00:00:00Z'
      };
    } else {
      newProfile = {
        id: 'current_user_siti',
        name: 'Siti Rahma',
        gender: 'wanita',
        interestedIn: 'pria',
        originCity: 'Surabaya',
        currentCity: 'Surabaya',
        country: 'Indonesia',
        birthYear: 1998,
        age: 28,
        heightCm: 162,
        mbti: 'ENFJ',
        bio: 'Wanita pekerja mandiri yang menyukai kuliner nusantara dan berkebun bunga. Mencari pria bertanggung jawab, penyayang keluarga, dan siap melangkah ke jenjang pernikahan.',
        aiSummary: 'Pribadi ENFJ hangat dari Surabaya yang siap berumah tangga dengan pasangan yang saling mendukung dan bertanggung jawab.',
        skills: ['Memasak Makanan Rumah', 'Komunikasi Empatis', 'Perencanaan Masa Depan'],
        hobbies: ['Memasak', 'Kulineran', 'Membaca Buku'],
        ethnicity: 'Jawa',
        photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80',
        isPhotoVerified: true,
        hasSignedPledge: true,
        targetMarriage: '1_tahun',
        occupation: 'Brand Specialist',
        education: 'S1 Ilmu Komunikasi',
        religion: 'Islam',
        createdAt: '2026-01-01T00:00:00Z'
      };
    }

    saveCurrentUser(newProfile);
    onUserChanged(newProfile);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#E8E2D8] overflow-hidden p-6 space-y-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#FAF7F2] text-[#6B6365] hover:text-[#1F1A1B] flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-[#BE3A50]" />
          <h3 className="font-bold text-base text-[#1F1A1B]">Pengaturan & Simulasi Demo</h3>
        </div>

        {/* Gemini API Key */}
        <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#E8E2D8] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#1F1A1B] flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-[#BE3A50]" />
              Google Gemini API Key (Gratisan)
            </span>
            <span className="text-[10px] text-[#15803D] font-medium">Opsional</span>
          </div>
          <p className="text-[11px] text-[#6B6365]">
            Digunakan untuk pembuatan ringkasan bio cerdas, filter SARA/18+, dan AI Icebreaker topik obrolan. (Bisa didapat gratis di aistudio.google.com).
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Masukkan API Key Gemini..."
              className="flex-1 px-3 py-1.5 rounded-xl border border-[#E8E2D8] text-xs bg-white outline-none focus:border-[#BE3A50]"
            />
            <button
              onClick={handleSaveApiKey}
              className="px-3 py-1.5 bg-[#BE3A50] hover:bg-[#a32f42] text-white rounded-xl text-xs font-semibold flex items-center gap-1"
            >
              {savedSuccess ? <Check className="w-3.5 h-3.5" /> : 'Simpan'}
            </button>
          </div>
          {savedSuccess && (
            <p className="text-[10px] text-[#15803D] font-medium">API Key berhasil disimpan di browser!</p>
          )}
        </div>

        {/* Simulasi Jaringan / Sinyal Trouble */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-[#1F1A1B]">
            Simulasi Status Jaringan / Sinyal (Fitur #7):
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'online', label: 'Online Bagus', color: 'text-green-700 bg-green-50 border-green-200' },
              { id: 'slow', label: 'Sinyal Lemah', color: 'text-amber-700 bg-amber-50 border-amber-200' },
              { id: 'offline', label: 'Offline / Putus', color: 'text-red-700 bg-red-50 border-red-200' }
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setNetworkStatus(s.id as any)}
                className={`py-2 px-2 rounded-xl border text-[11px] font-medium transition-all ${
                  networkStatus === s.id ? `${s.color} font-bold ring-2 ring-[#BE3A50]` : 'border-[#E8E2D8] bg-white text-[#6B6365]'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Switch Demo Persona */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-[#1F1A1B]">
            Ganti Akun Demo (Uji Coba Dua Arah):
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleSwitchPersona('pria')}
              className={`p-2.5 rounded-xl border text-xs text-left transition-all ${
                currentUser?.gender === 'pria'
                  ? 'border-[#BE3A50] bg-[#FBEBEE] font-bold text-[#BE3A50]'
                  : 'border-[#E8E2D8] bg-white text-[#6B6365]'
              }`}
            >
              <div className="font-semibold text-[#1F1A1B]">Budi (Pria)</div>
              <div className="text-[10px] text-[#6B6365]">Mencari Wanita (Straight)</div>
            </button>

            <button
              onClick={() => handleSwitchPersona('wanita')}
              className={`p-2.5 rounded-xl border text-xs text-left transition-all ${
                currentUser?.gender === 'wanita'
                  ? 'border-[#BE3A50] bg-[#FBEBEE] font-bold text-[#BE3A50]'
                  : 'border-[#E8E2D8] bg-white text-[#6B6365]'
              }`}
            >
              <div className="font-semibold text-[#1F1A1B]">Siti (Wanita)</div>
              <div className="text-[10px] text-[#6B6365]">Mencari Pria (Straight)</div>
            </button>
          </div>
        </div>

        {/* Reset Data Button */}
        <div className="pt-2 border-t border-[#E8E2D8]">
          <button
            onClick={resetDemoData}
            className="w-full py-2 bg-[#FAF7F2] hover:bg-red-50 hover:text-red-600 text-[#6B6365] rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1.5 border border-[#E8E2D8]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Seluruh Data & Interaksi Demo</span>
          </button>
        </div>
      </div>
    </div>
  );
}

