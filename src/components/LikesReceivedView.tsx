'use client';

import React from 'react';
import { Heart, MessageSquare, MapPin, Sparkles, UserCheck, MessageCircle } from 'lucide-react';
import { UserProfile, LoveInteraction } from '@/types';

interface LikesReceivedViewProps {
  interactions: LoveInteraction[];
  allCandidates: UserProfile[];
  currentUser: UserProfile | null;
  onMatchAndChat: (targetUser: UserProfile) => void;
  onOpenOnboarding?: () => void;
}

export default function LikesReceivedView({
  interactions,
  allCandidates,
  currentUser,
  onMatchAndChat,
  onOpenOnboarding
}: LikesReceivedViewProps) {
  // Ambil hanya interaksi yang ditujukan ke user saat ini
  const likesToMe = currentUser ? interactions.filter(i => i.toUserId === currentUser.id) : [];

  if (!currentUser) {
    return (
      <div className="w-full max-w-xl mx-auto bg-white rounded-3xl border border-[#E8E2D8] p-10 text-center space-y-3">
        <Heart className="w-12 h-12 text-[#BE3A50] mx-auto" />
        <h3 className="font-bold text-base text-[#1F1A1B]">Belum Memiliki Profil</h3>
        <p className="text-xs text-[#6B6365]">
          Lengkapi profil dan foto aslimu terlebih dahulu agar orang lain dapat menemukan dan menyukaimu.
        </p>
        {onOpenOnboarding && (
          <button
            onClick={onOpenOnboarding}
            className="px-5 py-2.5 bg-[#BE3A50] text-white rounded-xl text-xs font-semibold"
          >
            Lengkapi Profil Sekarang
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header Info */}
      <div className="bg-white p-5 rounded-3xl border border-[#E8E2D8] shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#1F1A1B] flex items-center gap-2">
            <Heart className="w-5 h-5 text-[#BE3A50] fill-[#BE3A50]" />
            Daftar Calon yang Menyukai Kamu
          </h2>
          <p className="text-xs text-[#6B6365] mt-0.5">
            {likesToMe.length} orang telah memberikan Love atau Catatan pembuka untuk berkenalan secara serius.
          </p>
        </div>
      </div>

      {likesToMe.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#E8E2D8] p-12 text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-[#FAF7F2] text-[#6B6365] flex items-center justify-center mx-auto">
            <Heart className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-base text-[#1F1A1B]">Belum Ada yang Mengirimkan Love</h3>
          <p className="text-xs text-[#6B6365] max-w-sm mx-auto">
            Lengkapi profil dan foto aslimu agar lebih banyak calon pasangan yang tertarik untuk memulai perkenalan!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {likesToMe.map((item) => {
            const sender = allCandidates.find(c => c.id === item.fromUserId);
            if (!sender) return null;

            return (
              <div
                key={item.id}
                className="bg-white rounded-3xl border border-[#E8E2D8] overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="p-4 space-y-3">
                  <div className="flex items-start gap-3.5">
                    <img
                      src={sender.photoUrl}
                      alt={sender.name}
                      className="w-16 h-16 rounded-2xl object-cover border border-[#E8E2D8] shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-base text-[#1F1A1B] truncate">{sender.name}</h3>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#FAF7F2] text-[#6B6365] font-semibold border border-[#E8E2D8]">
                          {sender.mbti}
                        </span>
                      </div>
                      <p className="text-xs text-[#6B6365] mt-0.5">
                        {sender.age} thn • {sender.currentCity} • Keturunan {sender.ethnicity}
                      </p>
                      <p className="text-[11px] text-[#15803D] font-medium mt-0.5">
                        Target Menikah: {sender.targetMarriage.replace('_', ' ')}
                      </p>
                    </div>
                  </div>

                  {/* Jika mengirimkan Love + Catatan */}
                  {item.note ? (
                    <div className="p-3 bg-[#FBEBEE] rounded-2xl border border-[#BE3A50]/20 space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#BE3A50]">
                        <MessageSquare className="w-3.5 h-3.5" />
                        Pesan Pembuka dari {sender.name}:
                      </div>
                      <p className="text-xs text-[#1F1A1B] italic leading-relaxed">
                        &ldquo;{item.note}&rdquo;
                      </p>
                    </div>
                  ) : (
                    <div className="p-2.5 bg-[#FAF7F2] rounded-xl border border-[#E8E2D8] text-xs text-[#6B6365] flex items-center gap-2">
                      <Heart className="w-3.5 h-3.5 text-[#BE3A50] fill-[#BE3A50]" />
                      <span>{sender.name} menyukai profil dan keseriusanmu.</span>
                    </div>
                  )}

                  {/* Ringkasan Singkat */}
                  <p className="text-xs text-[#6B6365] line-clamp-2">
                    {sender.bio}
                  </p>
                </div>

                {/* Footer Action: Balas Suka & Mulai Chat */}
                <div className="p-3.5 bg-[#FAF7F2] border-t border-[#E8E2D8] flex items-center justify-between gap-3">
                  <span className="text-[11px] text-[#6B6365]">
                    {new Date(item.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                  </span>

                  <button
                    onClick={() => onMatchAndChat(sender)}
                    className="px-4 py-2 bg-[#BE3A50] hover:bg-[#a32f42] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm hover:scale-105"
                  >
                    <Heart className="w-3.5 h-3.5 fill-white" />
                    <span>Balas Suka & Hubungkan</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

