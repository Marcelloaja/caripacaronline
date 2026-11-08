'use client';

import React, { useState } from 'react';
import { ShieldAlert, AlertCircle, CheckCircle, X } from 'lucide-react';
import { UserProfile } from '@/types';
import { submitReport } from '@/lib/data-service';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: UserProfile | null;
  reporterId?: string;
}

export default function ReportModal({
  isOpen,
  onClose,
  targetUser,
  reporterId = 'anonymous'
}: ReportModalProps) {
  const [reason, setReason] = useState<string>('sudah_berkeluarga');
  const [details, setDetails] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  if (!isOpen || !targetUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    await submitReport(reporterId, targetUser.id, reason, details);
    setTimeout(() => {
      setIsSubmitted(false);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#E8E2D8] overflow-hidden p-6 space-y-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#FAF7F2] text-[#6B6365] hover:text-[#1F1A1B] flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 text-red-600 font-bold text-sm">
          <ShieldAlert className="w-5 h-5" />
          <span>Laporkan Akun {targetUser.name}</span>
        </div>

        {isSubmitted ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle className="w-12 h-12 text-[#15803D] mx-auto" />
            <h4 className="font-bold text-sm text-[#1F1A1B]">Laporan Berhasil Dikirim</h4>
            <p className="text-xs text-[#6B6365]">
              Tim verifikasi kami akan meninjau laporan ini secara prioritas demi menjaga ekosistem bebas perselingkuhan.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs text-[#6B6365]">
              Komitmen kami adalah melindungi ruang pencarian pasangan dari perselingkuhan, penipuan, dan akun palsu.
            </p>

            <div>
              <label className="block text-xs font-semibold text-[#1F1A1B] mb-1">
                Alasan Pelaporan:
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E8E2D8] text-xs text-[#1F1A1B] outline-none bg-white"
              >
                <option value="sudah_berkeluarga">Terindikasi sudah beristri/bersuami (Selingkuh)</option>
                <option value="foto_palsu">Foto palsu / bukan foto diri sendiri</option>
                <option value="kata_kasar_sara">Mengirim pesan SARA / kata kasar / 18+</option>
                <option value="penipuan_finansial">Meminta uang / penipuan finansial</option>
                <option value="lainnya">Lainnya</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1F1A1B] mb-1">
                Keterangan Tambahan:
              </label>
              <textarea
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Jelaskan bukti atau kronologi secara singkat..."
                className="w-full px-3 py-2 rounded-xl border border-[#E8E2D8] text-xs text-[#1F1A1B] outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              Kirim Laporan Pelanggaran
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

