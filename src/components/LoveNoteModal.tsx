'use client';

import React, { useState } from 'react';
import { Heart, Send, AlertCircle, X, ShieldCheck } from 'lucide-react';
import { UserProfile } from '@/types';
import { checkContentSafety } from '@/lib/gemini';

interface LoveNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: UserProfile | null;
  onSendLove: (note?: string) => void;
}

export default function LoveNoteModal({
  isOpen,
  onClose,
  targetUser,
  onSendLove
}: LoveNoteModalProps) {
  const [note, setNote] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !targetUser) return null;

  const handleSend = async (withNote: boolean) => {
    if (!withNote) {
      onSendLove();
      onClose();
      return;
    }

    if (!note.trim()) {
      setErrorMsg('Tuliskan catatan singkat atau kirimkan Love saja.');
      return;
    }

    setIsChecking(true);
    setErrorMsg('');

    const safety = await checkContentSafety(note);
    setIsChecking(false);

    if (!safety.isSafe) {
      setErrorMsg(safety.reason || 'Catatan tidak memenuhi standar komunitas (dilarang SARA / 18+).');
      return;
    }

    onSendLove(note.trim());
    setNote('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#E8E2D8] overflow-hidden p-6 space-y-5">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#FAF7F2] text-[#6B6365] hover:text-[#1F1A1B] flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Profil Penerima */}
        <div className="flex items-center gap-3">
          <img
            src={targetUser.photoUrl}
            alt={targetUser.name}
            className="w-14 h-14 rounded-2xl object-cover border border-[#E8E2D8]"
          />
          <div>
            <h3 className="font-bold text-base text-[#1F1A1B]">Kirimkan Rasa Suka ke {targetUser.name}</h3>
            <p className="text-xs text-[#6B6365]">{targetUser.age} tahun • Domisili {targetUser.currentCity}</p>
          </div>
        </div>

        {/* Form Catatan Pembuka */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-[#1F1A1B]">
            Tambahkan Pesan / Catatan Pembuka (Opsional):
          </label>
          <textarea
            rows={3}
            maxLength={200}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={`Contoh: Salam kenal ${targetUser.name}! Tertarik dengan hobi kamu yang suka kopi dan traveling...`}
            className="w-full px-3.5 py-2.5 rounded-2xl border border-[#E8E2D8] text-xs text-[#1F1A1B] outline-none focus:border-[#BE3A50]"
          />
          <div className="flex items-center justify-between text-[11px] text-[#6B6365]">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#15803D]" />
              Dimoderasi AI (Anti-SARA & Anti-18+)
            </span>
            <span>{note.length}/200</span>
          </div>
        </div>

        {errorMsg && (
          <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-600">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Tombol Aksi */}
        <div className="flex flex-col gap-2 pt-2">
          <button
            type="button"
            disabled={isChecking}
            onClick={() => handleSend(true)}
            className="w-full py-3 bg-[#BE3A50] hover:bg-[#a32f42] disabled:bg-gray-300 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <Send className="w-4 h-4" />
            {isChecking ? 'Memeriksa Keamanan Teks...' : 'Kirim Love + Catatan Ini'}
          </button>

          <button
            type="button"
            onClick={() => handleSend(false)}
            className="w-full py-2.5 bg-[#FAF7F2] hover:bg-[#F0EBE1] text-[#1F1A1B] rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 border border-[#E8E2D8]"
          >
            <Heart className="w-4 h-4 text-[#BE3A50] fill-[#BE3A50]" />
            Kirim Love Saja (Tanpa Catatan)
          </button>
        </div>
      </div>
    </div>
  );
}

