'use client';

import React, { useState } from 'react';
import {
  Heart, X, MessageSquarePlus, MapPin, Sparkles,
  ShieldCheck, Globe2, Ruler, CheckCircle2, RefreshCw,
  Search, SlidersHorizontal, Flame
} from 'lucide-react';
import { UserProfile, INDONESIAN_CITIES } from '@/types';
import LoveNoteModal from './LoveNoteModal';

interface DiscoveryDeckProps {
  candidates: UserProfile[];
  currentUser: UserProfile | null;
  onSendInteraction: (toUserId: string, type: 'love' | 'love_note', note?: string) => void;
  onSelectCandidateDetails: (candidate: UserProfile) => void;
  onOpenOnboarding: () => void;
}

export default function DiscoveryDeck({
  candidates,
  currentUser,
  onSendInteraction,
  onSelectCandidateDetails,
  onOpenOnboarding
}: DiscoveryDeckProps) {
  // Filter Domisili Kota
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>('Semua');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedForNote, setSelectedForNote] = useState<UserProfile | null>(null);

  if (!currentUser) {
    return (
      <div className="w-full max-w-xl mx-auto bg-white rounded-3xl border border-[#E8E2D8] p-8 text-center space-y-4 shadow-sm">
        <div className="w-16 h-16 rounded-3xl bg-[#BE3A50] text-white flex items-center justify-center mx-auto shadow-md shadow-[#BE3A50]/20">
          <Heart className="w-8 h-8 fill-white" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-[#1F1A1B]">Selamat Datang di Cari Pacar Online</h2>
          <p className="text-xs text-[#6B6365] max-w-sm mx-auto leading-relaxed">
            Platform pasangan serius berorientasi masa depan & bebas dari perselingkuhan. Daftarkan profil dan foto asli Anda untuk mulai menemukan pasangan yang satu frekuensi.
          </p>
        </div>
        <button
          onClick={onOpenOnboarding}
          className="px-6 py-3 bg-[#BE3A50] hover:bg-[#a32f42] text-white rounded-2xl text-xs font-bold transition-all shadow-md hover:scale-105"
        >
          Daftar & Lengkapi Profil Sekarang
        </button>
      </div>
    );
  }

  // Filter kandidat yang cocok:
  // 1. Strict Straight: Jika user pria -> hanya tampilkan wanita yang tertarik pria.
  // 2. Tidak menampilkan diri sendiri.
  // 3. Filter kota jika dipilih selain "Semua".
  const filteredCandidates = candidates.filter((c) => {
    if (c.id === currentUser.id) return false;
    if (c.gender !== currentUser.interestedIn) return false;
    if (selectedCityFilter !== 'Semua' && c.currentCity !== selectedCityFilter) return false;
    return true;
  });

  const activeCandidate = filteredCandidates[currentIndex];

  const handleSkip = () => {
    if (currentIndex < filteredCandidates.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0); // loop back
    }
  };

  const handleSendLove = (note?: string) => {
    if (!activeCandidate) return;
    const type = note ? 'love_note' : 'love';
    onSendInteraction(activeCandidate.id, type, note);
    handleSkip();
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-3">
      {/* Location & Matching Filter Bar */}
      <div className="bg-white p-3 rounded-2xl border border-[#E8E2D8] shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#1F1A1B]">
          <MapPin className="w-4 h-4 text-[#BE3A50]" />
          <span>Cari di Kota:</span>
          <select
            value={selectedCityFilter}
            onChange={(e) => {
              setSelectedCityFilter(e.target.value);
              setCurrentIndex(0);
            }}
            className="px-2.5 py-1 rounded-xl border border-[#E8E2D8] bg-[#FAF7F2] text-xs font-medium text-[#1F1A1B] outline-none"
          >
            <option value="Semua">Semua Kota Indonesia</option>
            {INDONESIAN_CITIES.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-[#6B6365]">
          <Sparkles className="w-3.5 h-3.5 text-[#BE3A50]" />
          <span>{filteredCandidates.length} Pasangan Tersedia</span>
        </div>
      </div>

      {/* Main Card View: Compact & Responsive */}
      {activeCandidate ? (
        <div className="bg-white rounded-3xl border border-[#E8E2D8] shadow-sm overflow-hidden flex flex-col md:flex-row md:h-[480px]">
          {/* Sisi Kiri: Foto Profil & Badge Overlay */}
          <div className="relative w-full md:w-[42%] h-64 sm:h-72 md:h-full bg-[#FAF7F2] shrink-0 overflow-hidden">
            <img
              src={activeCandidate.photoUrl}
              alt={activeCandidate.name}
              className="w-full h-full object-cover"
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            {/* Badges Top Bar */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
              <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/95 backdrop-blur-md text-[#15803D] text-[11px] font-bold shadow-sm">
                <CheckCircle2 className="w-3 h-3" />
                <span>Foto Asli</span>
              </div>

              <div className="px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-medium">
                MBTI: <strong className="text-[#FBEBEE]">{activeCandidate.mbti}</strong>
              </div>
            </div>

            {/* Bottom Overlay on Image */}
            <div className="absolute bottom-3 left-3 right-3 text-white z-10 space-y-0.5">
              <div className="flex items-baseline gap-2">
                <h2 className="text-xl md:text-2xl font-bold tracking-tight">{activeCandidate.name}</h2>
                <span className="text-lg md:text-xl font-medium opacity-90">{activeCandidate.age} thn</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] opacity-90 font-medium flex-wrap">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#BE3A50]" />
                  {activeCandidate.currentCity}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Ruler className="w-3 h-3" />
                  {activeCandidate.heightCm} cm
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-[#FBEBEE] font-semibold">
                  <Globe2 className="w-3 h-3 text-[#BE3A50]" />
                  {activeCandidate.ethnicity}
                </span>
              </div>
            </div>
          </div>

          {/* Sisi Kanan: Detail Biodata, Ringkasan AI, & Tombol Aksi */}
          <div className="flex-1 p-4 md:p-5 flex flex-col justify-between overflow-y-auto space-y-3">
            {/* Header Deskripsi & Badges */}
            <div className="space-y-2.5">
              {/* Info Badges (Domisili, Keturunan / Etnis, Target Menikah) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div className="p-2 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8]">
                  <span className="text-[#6B6365] block text-[10px]">Keturunan / Etnis:</span>
                  <span className="font-semibold text-[#1F1A1B] text-xs truncate block">
                    {activeCandidate.ethnicity}
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8]">
                  <span className="text-[#6B6365] block text-[10px]">Visi Pernikahan:</span>
                  <span className="font-semibold text-[#1F1A1B] text-xs truncate block capitalize">
                    Target {activeCandidate.targetMarriage.replace('_', ' ')}
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8] col-span-2 sm:col-span-1">
                  <span className="text-[#6B6365] block text-[10px]">Kota Asal:</span>
                  <span className="font-semibold text-[#1F1A1B] text-xs truncate block">
                    {activeCandidate.originCity}
                  </span>
                </div>
              </div>

              {/* Gemini AI Summary Highlight */}
              {activeCandidate.aiSummary && (
                <div className="p-2.5 bg-[#FAF7F2] rounded-xl border border-[#BE3A50]/20 space-y-0.5">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-[#BE3A50] uppercase tracking-wider">
                    <Sparkles className="w-3 h-3" />
                    Ringkasan Karakter (AI Gemini)
                  </div>
                  <p className="text-xs text-[#1F1A1B] leading-relaxed italic line-clamp-2 md:line-clamp-3">
                    &ldquo;{activeCandidate.aiSummary}&rdquo;
                  </p>
                </div>
              )}

              {/* Hobi Tags */}
              <div>
                <span className="text-[11px] font-semibold text-[#1F1A1B] block mb-1">Hobi & Aktivitas:</span>
                <div className="flex flex-wrap gap-1">
                  {activeCandidate.hobbies.slice(0, 4).map((h) => (
                    <span
                      key={h}
                      className="px-2 py-0.5 rounded-full bg-[#FAF7F2] border border-[#E8E2D8] text-[11px] font-medium text-[#6B6365]"
                    >
                      {h}
                    </span>
                  ))}
                  {activeCandidate.hobbies.length > 4 && (
                    <span className="px-1.5 py-0.5 text-[10px] text-[#6B6365]">
                      +{activeCandidate.hobbies.length - 4} lainnya
                    </span>
                  )}
                </div>
              </div>

              {/* Bio Singkat */}
              <div>
                <span className="text-[11px] font-semibold text-[#1F1A1B] block mb-0.5">Tentang Diri:</span>
                <p className="text-xs text-[#6B6365] leading-relaxed line-clamp-2 md:line-clamp-3">
                  {activeCandidate.bio}
                </p>
              </div>
            </div>

            {/* Action Buttons: Skip, Love + Catatan, Love (Selalu Kelihatan di Layar) */}
            <div className="pt-2 border-t border-[#E8E2D8] flex items-center justify-center gap-3">
              {/* Skip */}
              <button
                onClick={handleSkip}
                className="w-12 h-12 rounded-full bg-white border border-[#E8E2D8] text-[#6B6365] hover:text-red-600 hover:border-red-300 hover:bg-red-50 flex items-center justify-center transition-all shadow-sm group shrink-0"
                title="Lewati ke calon berikutnya"
                aria-label="Lewati"
              >
                <X className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </button>

              {/* Love + Catatan */}
              <button
                onClick={() => setSelectedForNote(activeCandidate)}
                className="flex-1 max-w-[200px] py-2.5 px-3 rounded-2xl bg-[#FBEBEE] border border-[#BE3A50]/30 text-[#BE3A50] hover:bg-[#BE3A50] hover:text-white flex items-center justify-center gap-1.5 text-xs font-bold transition-all shadow-sm group"
                title="Kirim Love dengan catatan perkenalan"
              >
                <MessageSquarePlus className="w-4 h-4 shrink-0" />
                <span>Beri Catatan</span>
              </button>

              {/* Direct Love */}
              <button
                onClick={() => handleSendLove()}
                className="w-12 h-12 rounded-full bg-[#BE3A50] hover:bg-[#a32f42] text-white flex items-center justify-center transition-all shadow-md hover:scale-105 group shrink-0"
                title="Beri Love"
                aria-label="Beri Love"
              >
                <Heart className="w-5 h-5 fill-white group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-[#E8E2D8] p-10 text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-[#FBEBEE] text-[#BE3A50] flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-base text-[#1F1A1B]">Belum Ada Calon Pasangan Lain</h3>
            <p className="text-xs text-[#6B6365] mt-1 max-w-sm mx-auto leading-relaxed">
              Profilmu sudah aktif dan siap ditemukan! Belum ada calon pasangan lain yang terdaftar di kota ini. Bagikan link website ini untuk mengajak lebih banyak orang menemukan pasangan serius.
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedCityFilter('Semua');
              setCurrentIndex(0);
            }}
            className="px-4 py-2 bg-[#FAF7F2] border border-[#E8E2D8] hover:bg-[#F0EBE1] text-[#1F1A1B] rounded-xl text-xs font-semibold transition-all"
          >
            Refresh Pencarian
          </button>
        </div>
      )}

      {/* Modal Love + Catatan */}
      <LoveNoteModal
        isOpen={Boolean(selectedForNote)}
        onClose={() => setSelectedForNote(null)}
        targetUser={selectedForNote}
        onSendLove={handleSendLove}
      />
    </div>
  );
}
