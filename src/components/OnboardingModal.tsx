'use client';

import React, { useState } from 'react';
import {
  User, MapPin, Calendar, Heart, Sparkles, ShieldCheck,
  Upload, CheckCircle, AlertCircle, HelpCircle, ArrowRight,
  ShieldAlert, Camera
} from 'lucide-react';
import {
  UserProfile, Gender, MBTIType, INDONESIAN_CITIES,
  MBTI_OPTIONS, POPULAR_HOBBIES, COMMON_SKILLS, ETHNICITY_OPTIONS
} from '@/types';
import { validateAndProcessProfilePhoto } from '@/lib/face-detection';
import { generateProfileSummaryWithGemini, checkContentSafety } from '@/lib/gemini';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveProfile: (profile: UserProfile) => void;
  initialProfile?: UserProfile | null;
  canClose?: boolean;
}

export default function OnboardingModal({
  isOpen,
  onClose,
  onSaveProfile,
  initialProfile,
  canClose = true
}: OnboardingModalProps) {
  const currentYear = new Date().getFullYear();

  // Step wizard: 1 (Ikrar Lajang), 2 (Biodata Dasar), 3 (Kepribadian & MBTI), 4 (Foto & Validasi Wajah), 5 (Bio & AI Summary)
  const [step, setStep] = useState<number>(1);

  // Form States
  const [name, setName] = useState(initialProfile?.name || '');
  const [gender, setGender] = useState<Gender>(initialProfile?.gender || 'pria');
  const [originCity, setOriginCity] = useState(initialProfile?.originCity || 'Bandung');
  const [currentCity, setCurrentCity] = useState(initialProfile?.currentCity || 'Jakarta');
  const [country] = useState('Indonesia');
  const [birthYear, setBirthYear] = useState<number>(initialProfile?.birthYear || 1998);
  const [heightCm, setHeightCm] = useState<number>(initialProfile?.heightCm || 170);
  const [mbti, setMbti] = useState<MBTIType>(initialProfile?.mbti || 'INFJ');
  const [ethnicity, setEthnicity] = useState<string>(initialProfile?.ethnicity || 'Tionghoa (Chindo)');
  const [targetMarriage, setTargetMarriage] = useState<'6_bulan' | '1_tahun' | '2_tahun' | 'santai_tapi_serius'>(
    initialProfile?.targetMarriage || '1_tahun'
  );
  const [bio, setBio] = useState(initialProfile?.bio || '');
  const [aiSummary, setAiSummary] = useState(initialProfile?.aiSummary || '');
  const [selectedHobbies, setSelectedHobbies] = useState<string[]>(initialProfile?.hobbies || ['Membaca Buku', 'Kopi & Nongkrong']);
  const [selectedSkills, setSelectedSkills] = useState<string[]>(initialProfile?.skills || ['Komunikasi Empatis']);
  const [photoUrl, setPhotoUrl] = useState<string>(initialProfile?.photoUrl || '');
  const [isPhotoVerified, setIsPhotoVerified] = useState<boolean>(initialProfile?.isPhotoVerified || false);
  const [hasSignedPledge, setHasSignedPledge] = useState<boolean>(initialProfile?.hasSignedPledge || false);

  // Loading & Error States
  const [photoError, setPhotoError] = useState<string>('');
  const [isProcessingPhoto, setIsProcessingPhoto] = useState<boolean>(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string>('');

  // MBTI Mini Quiz State
  const [showMbtiQuiz, setShowMbtiQuiz] = useState<boolean>(false);
  const [quizAnswers, setQuizAnswers] = useState<{ [key: string]: string }>({});

  // Kalkulasi Umur Otomatis
  const calculatedAge = currentYear - birthYear;

  // Strict Straight: Pria hanya mencari Wanita, Wanita hanya mencari Pria
  const interestedIn: Gender = gender === 'pria' ? 'wanita' : 'pria';

  if (!isOpen) return null;

  // Handler Upload Foto dengan Deteksi Wajah
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoError('');
    setIsProcessingPhoto(true);

    const result = await validateAndProcessProfilePhoto(file);
    setIsProcessingPhoto(false);

    if (!result.isValid) {
      setPhotoError(result.error || 'Foto tidak memenuhi syarat.');
      setIsPhotoVerified(false);
    } else {
      setPhotoUrl(result.base64Url || '');
      setIsPhotoVerified(true);
    }
  };

  // Handler Generator Ringkasan AI
  const handleGenerateSummary = async () => {
    if (!bio.trim()) {
      setValidationError('Silakan isi keterangan diri (bio) terlebih dahulu.');
      return;
    }

    // Cek keamanan konten (Anti-SARA & Anti-18+)
    const safetyCheck = await checkContentSafety(bio);
    if (!safetyCheck.isSafe) {
      setValidationError(safetyCheck.reason || 'Keterangan diri mengandung kata-kata yang tidak diizinkan.');
      return;
    }

    setValidationError('');
    setIsGeneratingSummary(true);

    const summary = await generateProfileSummaryWithGemini({
      name,
      originCity,
      currentCity,
      age: calculatedAge,
      mbti,
      bio,
      hobbies: selectedHobbies,
      ethnicity,
      targetMarriage
    });

    setAiSummary(summary);
    setIsGeneratingSummary(false);
  };

  // Selesaikan Quiz MBTI Mini (4 pertanyaan ringkas)
  const calculateMbtiFromQuiz = () => {
    const eOrI = quizAnswers['ei'] === 'E' ? 'E' : 'I';
    const sOrN = quizAnswers['sn'] === 'S' ? 'S' : 'N';
    const tOrF = quizAnswers['tf'] === 'T' ? 'T' : 'F';
    const jOrP = quizAnswers['jp'] === 'J' ? 'J' : 'P';
    const resultMbti = `${eOrI}${sOrN}${tOrF}${jOrP}` as MBTIType;
    setMbti(resultMbti);
    setShowMbtiQuiz(false);
  };

  // Simpan Seluruh Profil
  const handleSubmit = async () => {
    if (!hasSignedPledge) {
      setValidationError('Anda wajib menyetujui Ikrar Integritas Lajang.');
      return;
    }
    if (!name.trim()) {
      setValidationError('Nama asli panggilan tidak boleh kosong.');
      return;
    }
    if (!photoUrl) {
      setValidationError('Harap unggah foto asli Anda (maksimal 5MB).');
      return;
    }
    if (!bio.trim()) {
      setValidationError('Harap isi keterangan diri (bio) singkat Anda.');
      return;
    }

    // Safety check final
    const safety = await checkContentSafety(`${name} ${bio} ${aiSummary}`);
    if (!safety.isSafe) {
      setValidationError(safety.reason || 'Profil mengandung konten terlarang.');
      return;
    }

    const finalProfile: UserProfile = {
      id: initialProfile?.id || `user_${Date.now()}`,
      name: name.trim(),
      gender,
      interestedIn,
      originCity,
      currentCity,
      country,
      birthYear,
      age: calculatedAge,
      heightCm,
      mbti,
      bio: bio.trim(),
      aiSummary: aiSummary || bio.trim(),
      skills: selectedSkills,
      hobbies: selectedHobbies,
      ethnicity,
      photoUrl,
      isPhotoVerified: true,
      hasSignedPledge: true,
      targetMarriage,
      createdAt: initialProfile?.createdAt || new Date().toISOString()
    };

    onSaveProfile(finalProfile);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-[#E8E2D8] overflow-hidden my-8">
        {/* Header Modal */}
        <div className="bg-[#FAF7F2] p-6 border-b border-[#E8E2D8] flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#1F1A1B] flex items-center gap-2">
              <Heart className="w-5 h-5 text-[#BE3A50] fill-[#BE3A50]" />
              {initialProfile ? 'Edit Profil Pasangan' : 'Daftar Profil Pasangan Serius'}
            </h2>
            <p className="text-xs text-[#6B6365] mt-1">Langkah {step} dari 5: Mengutamakan Keaslian & Komitmen</p>
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <span
                key={s}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  step === s ? 'bg-[#BE3A50] w-6' : step > s ? 'bg-[#15803D]' : 'bg-[#E8E2D8]'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Isi Form per Step */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
          {validationError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{validationError}</span>
            </div>
          )}

          {/* ================= STEP 1: IKRAR INTEGRITAS LAJANG ================= */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#E8E2D8]">
                <div className="flex items-center gap-2 text-[#BE3A50] font-bold text-sm mb-2">
                  <ShieldCheck className="w-5 h-5" />
                  <span>Komitmen Hubungan Bermartabat</span>
                </div>
                <p className="text-xs text-[#6B6365] leading-relaxed">
                  Aplikasi ini dirancang khusus bagi individu yang <strong>benar-benar berstatus lajang (tidak sedang terikat pernikahan yang sah)</strong> dan berniat mencari pendamping hidup sejati. Platform ini <strong>melarang keras perselingkuhan</strong>, akun palsu, serta perilaku yang merugikan orang lain.
                </p>
              </div>

              <div className="border border-[#BE3A50]/20 bg-[#FBEBEE] p-4 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-[#BE3A50] uppercase tracking-wider">
                  Ikrar Integritas Calon Pasangan
                </h4>
                <ul className="text-xs text-[#1F1A1B] space-y-2 list-disc list-inside">
                  <li>Saya menyatakan bahwa saat ini saya tidak memiliki ikatan perkawinan dengan pihak mana pun.</li>
                  <li>Saya menggunakan data diri, foto, dan informasi asli tanpa rekayasa.</li>
                  <li>Saya tidak akan menggunakan aplikasi ini untuk tujuan perselingkuhan, asusila (18+), maupun SARA.</li>
                  <li>Saya bersedia akun saya ditutup secara permanen jika terbukti melanggar komitmen ini.</li>
                </ul>

                <label className="flex items-start gap-2.5 pt-2 cursor-pointer border-t border-[#BE3A50]/20">
                  <input
                    type="checkbox"
                    checked={hasSignedPledge}
                    onChange={(e) => setHasSignedPledge(e.target.checked)}
                    className="mt-0.5 rounded text-[#BE3A50] focus:ring-[#BE3A50]"
                  />
                  <span className="text-xs font-semibold text-[#1F1A1B]">
                    Saya menyetujui ikrar ini dan bersungguh-sungguh mencari pasangan hidup.
                  </span>
                </label>
              </div>

              {/* Target Waktu Menikah */}
              <div>
                <label className="block text-xs font-semibold text-[#1F1A1B] mb-1.5">
                  Target Waktu Menuju Pernikahan:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: '6_bulan', label: '6 Bulan ke Depan' },
                    { id: '1_tahun', label: '1 Tahun' },
                    { id: '2_tahun', label: '2 Tahun' },
                    { id: 'santai_tapi_serius', label: 'Santai Tapi Pasti Serius' }
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setTargetMarriage(opt.id as any)}
                      className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-all ${
                        targetMarriage === opt.id
                          ? 'border-[#BE3A50] bg-[#FBEBEE] text-[#BE3A50] font-semibold'
                          : 'border-[#E8E2D8] hover:bg-[#FAF7F2] text-[#6B6365]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 2: BIODATA DASAR ================= */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Nama Asli Panggilan */}
              <div>
                <label className="block text-xs font-semibold text-[#1F1A1B] mb-1">
                  Nama Asli Panggilan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Budi, Anindya, Rian"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D8] focus:border-[#BE3A50] focus:ring-1 focus:ring-[#BE3A50] text-xs text-[#1F1A1B] outline-none"
                />
              </div>

              {/* Gender & Preferensi Straight */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1F1A1B] mb-1">
                    Jenis Kelamin Anda <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as Gender)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E2D8] text-xs text-[#1F1A1B] outline-none bg-white"
                  >
                    <option value="pria">Laki-laki (Pria)</option>
                    <option value="wanita">Perempuan (Wanita)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1F1A1B] mb-1">
                    Tertarik dengan (Pasangan)
                  </label>
                  <div className="px-3 py-2 rounded-xl border border-[#E8E2D8] bg-[#F0EBE1] text-xs text-[#1F1A1B] font-medium">
                    {gender === 'pria' ? 'Perempuan (Wanita)' : 'Laki-laki (Pria)'}
                  </div>
                  <p className="text-[10px] text-[#6B6365] mt-1">Platform khusus pasangan straight.</p>
                </div>
              </div>

              {/* Tahun Lahir & Umur Otomatis */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1F1A1B] mb-1">
                    Tahun Kelahiran <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1960"
                    max={currentYear - 18}
                    value={birthYear}
                    onChange={(e) => setBirthYear(parseInt(e.target.value) || 2000)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E8E2D8] text-xs text-[#1F1A1B] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1F1A1B] mb-1">
                    Umur Anda (Otomatis)
                  </label>
                  <div className="px-3 py-2 rounded-xl border border-[#15803D]/20 bg-[#DCFCE7] text-xs text-[#15803D] font-bold">
                    {calculatedAge} Tahun
                  </div>
                </div>
              </div>

              {/* Domisili & Asli Mana */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1F1A1B] mb-1">
                    Domisili Kota Saat Ini <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={currentCity}
                    onChange={(e) => setCurrentCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E2D8] text-xs text-[#1F1A1B] outline-none bg-white"
                  >
                    {INDONESIAN_CITIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1F1A1B] mb-1">
                    Kota Asal / Asli Mana <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={originCity}
                    onChange={(e) => setOriginCity(e.target.value)}
                    placeholder="Contoh: Yogyakarta, Medan, Solo"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E8E2D8] text-xs text-[#1F1A1B] outline-none"
                  />
                </div>
              </div>

              {/* Tinggi Badan & Keturunan */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1F1A1B] mb-1">
                    Tinggi Badan (cm)
                  </label>
                  <input
                    type="number"
                    min="130"
                    max="220"
                    value={heightCm}
                    onChange={(e) => setHeightCm(parseInt(e.target.value) || 165)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E8E2D8] text-xs text-[#1F1A1B] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1F1A1B] mb-1">
                    Latar Belakang Keturunan / Etnis <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={ethnicity}
                    onChange={(e) => setEthnicity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E2D8] text-xs text-[#1F1A1B] outline-none bg-white"
                  >
                    {ETHNICITY_OPTIONS.map((eth) => (
                      <option key={eth} value={eth}>{eth}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-[#6B6365] mt-0.5">
                    Misal: Tionghoa (Chindo), Jawa, Sunda, Minang, dll.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 3: MBTI & KEPRIBADIAN ================= */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#1F1A1B]">
                  Tipe Kepribadian (MBTI)
                </label>
                <button
                  type="button"
                  onClick={() => setShowMbtiQuiz(!showMbtiQuiz)}
                  className="text-xs text-[#BE3A50] hover:underline flex items-center gap-1 font-medium"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  Belum tahu MBTI kamu? Cek di sini
                </button>
              </div>

              {/* MBTI Mini Quiz Bawaan */}
              {showMbtiQuiz && (
                <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#BE3A50]/30 space-y-3">
                  <h4 className="text-xs font-bold text-[#BE3A50]">Kuis Cepat MBTI (4 Pertanyaan)</h4>
                  
                  <div className="space-y-2 text-xs">
                    <div>
                      <p className="text-[#1F1A1B] font-medium mb-1">1. Saat lelah setelah seminggu beraktivitas, kamu lebih pulih dengan:</p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setQuizAnswers({ ...quizAnswers, ei: 'I' })}
                          className={`px-3 py-1.5 rounded-lg border text-left ${quizAnswers['ei'] === 'I' ? 'bg-[#BE3A50] text-white' : 'bg-white'}`}
                        >
                          Sendirian / Istirahat tenang (Introvert)
                        </button>
                        <button
                          type="button"
                          onClick={() => setQuizAnswers({ ...quizAnswers, ei: 'E' })}
                          className={`px-3 py-1.5 rounded-lg border text-left ${quizAnswers['ei'] === 'E' ? 'bg-[#BE3A50] text-white' : 'bg-white'}`}
                        >
                          Nongkrong bersama teman (Extrovert)
                        </button>
                      </div>
                    </div>

                    <div>
                      <p className="text-[#1F1A1B] font-medium mb-1">2. Dalam menyerap informasi, kamu lebih berfokus pada:</p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setQuizAnswers({ ...quizAnswers, sn: 'S' })}
                          className={`px-3 py-1.5 rounded-lg border text-left ${quizAnswers['sn'] === 'S' ? 'bg-[#BE3A50] text-white' : 'bg-white'}`}
                        >
                          Fakta konkret & detail (Sensing)
                        </button>
                        <button
                          type="button"
                          onClick={() => setQuizAnswers({ ...quizAnswers, sn: 'N' })}
                          className={`px-3 py-1.5 rounded-lg border text-left ${quizAnswers['sn'] === 'N' ? 'bg-[#BE3A50] text-white' : 'bg-white'}`}
                        >
                          Pola masa depan & filosofi (Intuition)
                        </button>
                      </div>
                    </div>

                    <div>
                      <p className="text-[#1F1A1B] font-medium mb-1">3. Saat mengambil keputusan penting dalam hubungan:</p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setQuizAnswers({ ...quizAnswers, tf: 'T' })}
                          className={`px-3 py-1.5 rounded-lg border text-left ${quizAnswers['tf'] === 'T' ? 'bg-[#BE3A50] text-white' : 'bg-white'}`}
                        >
                          Logika & keadilan objektif (Thinking)
                        </button>
                        <button
                          type="button"
                          onClick={() => setQuizAnswers({ ...quizAnswers, tf: 'F' })}
                          className={`px-3 py-1.5 rounded-lg border text-left ${quizAnswers['tf'] === 'F' ? 'bg-[#BE3A50] text-white' : 'bg-white'}`}
                        >
                          Perasaan & harmoni bersama (Feeling)
                        </button>
                      </div>
                    </div>

                    <div>
                      <p className="text-[#1F1A1B] font-medium mb-1">4. Menghadapi rencana jalan-jalan atau kencan:</p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setQuizAnswers({ ...quizAnswers, jp: 'J' })}
                          className={`px-3 py-1.5 rounded-lg border text-left ${quizAnswers['jp'] === 'J' ? 'bg-[#BE3A50] text-white' : 'bg-white'}`}
                        >
                          Tersusun rapi & terjadwal (Judging)
                        </button>
                        <button
                          type="button"
                          onClick={() => setQuizAnswers({ ...quizAnswers, jp: 'P' })}
                          className={`px-3 py-1.5 rounded-lg border text-left ${quizAnswers['jp'] === 'P' ? 'bg-[#BE3A50] text-white' : 'bg-white'}`}
                        >
                          Spontan & fleksibel (Perceiving)
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={calculateMbtiFromQuiz}
                    disabled={Object.keys(quizAnswers).length < 4}
                    className="w-full py-2 bg-[#BE3A50] disabled:bg-gray-300 text-white rounded-xl text-xs font-semibold mt-2"
                  >
                    Terapkan Hasil MBTI ke Profil
                  </button>
                </div>
              )}

              {/* Selector MBTI */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {MBTI_OPTIONS.map((opt) => (
                  <button
                    key={opt.code}
                    type="button"
                    onClick={() => setMbti(opt.code)}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      mbti === opt.code
                        ? 'border-[#BE3A50] bg-[#FBEBEE] text-[#BE3A50] font-bold'
                        : 'border-[#E8E2D8] bg-white text-[#6B6365] hover:bg-[#FAF7F2]'
                    }`}
                  >
                    <div className="text-xs font-bold">{opt.code}</div>
                    <div className="text-[10px] truncate">{opt.label.split(' ')[0]}</div>
                  </button>
                ))}
              </div>

              {/* Hobi Pilihan */}
              <div>
                <label className="block text-xs font-semibold text-[#1F1A1B] mb-1.5">
                  Pilih Hobi & Aktivitas Favorit:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_HOBBIES.map((h) => {
                    const isSelected = selectedHobbies.includes(h);
                    return (
                      <button
                        key={h}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedHobbies(selectedHobbies.filter((item) => item !== h));
                          } else {
                            setSelectedHobbies([...selectedHobbies, h]);
                          }
                        }}
                        className={`px-3 py-1 rounded-full text-xs transition-all ${
                          isSelected
                            ? 'bg-[#BE3A50] text-white font-medium'
                            : 'bg-white border border-[#E8E2D8] text-[#6B6365] hover:border-[#BE3A50]'
                        }`}
                      >
                        {h}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Keahlian & Nilai Diri */}
              <div>
                <label className="block text-xs font-semibold text-[#1F1A1B] mb-1.5">
                  Keahlian & Kelebihan Diri:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_SKILLS.map((s) => {
                    const isSelected = selectedSkills.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedSkills(selectedSkills.filter((item) => item !== s));
                          } else {
                            setSelectedSkills([...selectedSkills, s]);
                          }
                        }}
                        className={`px-3 py-1 rounded-full text-xs transition-all ${
                          isSelected
                            ? 'bg-[#15803D] text-white font-medium'
                            : 'bg-white border border-[#E8E2D8] text-[#6B6365] hover:border-[#15803D]'
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 4: UPLOAD FOTO ASLI (MAKS 5MB + FACE CHECK) ================= */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#E8E2D8]">
                <p className="text-xs text-[#1F1A1B] font-medium flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-[#BE3A50]" />
                  Ketentuan Foto Profil Wajib:
                </p>
                <ul className="text-[11px] text-[#6B6365] mt-1 space-y-0.5 list-disc list-inside">
                  <li>Wajib foto asli wajah Anda sendiri (Bukan foto AI, kartun, anime, atau pemandangan).</li>
                  <li>Ukuran maksimal 5MB (Format JPG, PNG, atau WebP).</li>
                  <li>Sistem otomatis mendeteksi karakteristik wajah manusia sebelum foto diterima.</li>
                </ul>
              </div>

              <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#E8E2D8] rounded-3xl bg-[#FAF7F2]/50 hover:bg-[#FAF7F2] transition-all">
                {photoUrl ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative">
                      <img
                        src={photoUrl}
                        alt="Foto Profil"
                        className="w-36 h-36 rounded-2xl object-cover border-2 border-[#15803D] shadow-md"
                      />
                      {isPhotoVerified && (
                        <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-[#15803D] text-white text-[10px] font-bold flex items-center gap-1 shadow-sm">
                          <CheckCircle className="w-3 h-3" />
                          Terverifikasi Asli
                        </div>
                      )}
                    </div>

                    <label className="cursor-pointer text-xs text-[#BE3A50] font-semibold hover:underline">
                      Ganti Foto Lain
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                ) : (
                  <label className="flex flex-col items-center cursor-pointer text-center">
                    <div className="w-14 h-14 rounded-2xl bg-[#BE3A50]/10 text-[#BE3A50] flex items-center justify-center mb-2">
                      <Upload className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-[#1F1A1B]">Klik untuk Unggah Foto Asli</span>
                    <span className="text-[11px] text-[#6B6365] mt-0.5">Maksimal 5MB • JPG, PNG, WebP</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                )}

                {isProcessingPhoto && (
                  <p className="text-xs text-[#BE3A50] font-medium mt-3 animate-pulse">
                    Memvalidasi ukuran dan mendeteksi wajah asli...
                  </p>
                )}

                {photoError && (
                  <p className="text-xs text-red-600 font-medium mt-3 text-center">
                    {photoError}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ================= STEP 5: KETERANGAN DIRI & GEMINI AI SUMMARY ================= */}
          {step === 5 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1F1A1B] mb-1">
                  Keterangan Diri (Ceritakan tentang dirimu dan harapan pasangan) <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Ceritakan tentang pekerjaan, keseharian, nilai hidup yang kamu pegang, dan kriteria calon pasangan yang kamu dambakan..."
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-[#E8E2D8] text-xs text-[#1F1A1B] outline-none focus:border-[#BE3A50]"
                />
                <p className="text-[10px] text-[#6B6365] mt-0.5">
                  Catatan: Dilarang memuat unsur SARA, kata kasar, atau konten dewasa (18+).
                </p>
              </div>

              {/* Gemini AI Bio Summarizer */}
              <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#BE3A50]/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#BE3A50]">
                    <Sparkles className="w-4 h-4" />
                    <span>Ringkasan Profil Menarik oleh Gemini AI</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateSummary}
                    disabled={isGeneratingSummary || !bio.trim()}
                    className="px-3 py-1 bg-[#BE3A50] disabled:bg-gray-300 text-white rounded-xl text-xs font-semibold hover:bg-[#a32f42] transition-all flex items-center gap-1"
                  >
                    {isGeneratingSummary ? 'Memproses...' : 'Buat Ringkasan AI'}
                  </button>
                </div>

                {aiSummary ? (
                  <div className="p-3 bg-white rounded-xl border border-[#E8E2D8] text-xs text-[#1F1A1B] italic leading-relaxed">
                    &ldquo;{aiSummary}&rdquo;
                  </div>
                ) : (
                  <p className="text-[11px] text-[#6B6365]">
                    Klik tombol di atas untuk membuat rangkuman kartu perkenalan yang memikat calon pasangan secara sopan.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        <div className="bg-[#FAF7F2] px-6 py-4 border-t border-[#E8E2D8] flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => {
                setValidationError('');
                setStep(step - 1);
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B6365] hover:bg-[#E8E2D8] transition-all"
            >
              Kembali
            </button>
          ) : canClose ? (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B6365] hover:bg-[#E8E2D8] transition-all"
            >
              Batal
            </button>
          ) : (
            <span className="text-[11px] text-[#6B6365] italic">
              Lengkapi profil untuk mulai
            </span>
          )}

          {step < 5 ? (
            <button
              type="button"
              onClick={() => {
                setValidationError('');
                if (step === 1 && !hasSignedPledge) {
                  setValidationError('Anda wajib menyetujui Ikrar Integritas Lajang untuk melanjutkan.');
                  return;
                }
                if (step === 2 && !name.trim()) {
                  setValidationError('Harap isi nama asli panggilan Anda.');
                  return;
                }
                if (step === 4 && !photoUrl) {
                  setValidationError('Harap unggah foto asli wajah Anda.');
                  return;
                }
                setStep(step + 1);
              }}
              className="px-5 py-2.5 rounded-xl bg-[#BE3A50] text-white text-xs font-bold hover:bg-[#a32f42] transition-all flex items-center gap-1.5 shadow-sm"
            >
              Lanjutkan
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              className="px-6 py-2.5 rounded-xl bg-[#15803D] text-white text-xs font-bold hover:bg-green-800 transition-all flex items-center gap-1.5 shadow-sm"
            >
              Simpan & Aktifkan Profil
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

