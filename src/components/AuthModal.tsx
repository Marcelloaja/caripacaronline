'use client';

import React, { useState, useEffect } from 'react';
import {
  Heart, Mail, Lock, Eye, EyeOff, Fingerprint,
  ArrowRight, ShieldCheck, AlertCircle, CheckCircle2, Sparkles, Loader2
} from 'lucide-react';
import { signInWithEmail, signUpWithEmail } from '@/lib/auth-service';
import {
  isBiometricsAvailable,
  getSavedBiometricAccount,
  authenticateWithBiometrics,
  BiometricRecord
} from '@/lib/biometric-auth';
import { fetchProfileById } from '@/lib/data-service';
import { UserProfile } from '@/types';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onAuthSuccess: (user: { id: string; email: string }, isNewUser: boolean) => void;
}

export default function AuthModal({
  isOpen,
  onClose,
  onAuthSuccess
}: AuthModalProps) {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pledgeChecked, setPledgeChecked] = useState(true);

  // Biometrics State
  const [hasBiometricSensor, setHasBiometricSensor] = useState(false);
  const [savedBioAccount, setSavedBioAccount] = useState<BiometricRecord | null>(null);
  const [isBiometricScanning, setIsBiometricScanning] = useState(false);

  // Feedback & Loading States
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      setSuccessNotice('');
      // Cek sensor biometrik perangkat
      isBiometricsAvailable().then((supported) => {
        setHasBiometricSensor(supported);
        if (supported) {
          const acc = getSavedBiometricAccount();
          setSavedBioAccount(acc);
        }
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Login / Register Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessNotice('');

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Harap masukkan alamat email Anda.');
      return;
    }

    if (!password) {
      setErrorMessage('Harap masukkan kata sandi.');
      return;
    }

    if (tab === 'register') {
      if (password !== confirmPassword) {
        setErrorMessage('Konfirmasi kata sandi tidak cocok.');
        return;
      }
      if (!pledgeChecked) {
        setErrorMessage('Anda wajib menyetujui komitmen status lajang untuk mendaftar.');
        return;
      }
    }

    setLoading(true);

    try {
      if (tab === 'login') {
        const result = await signInWithEmail(cleanEmail, password);
        if (!result.success || !result.user) {
          setErrorMessage(result.error || 'Gagal masuk. Periksa email dan kata sandi Anda.');
          setLoading(false);
          return;
        }

        // Cek apakah profil sudah lengkap di Supabase
        const profile = await fetchProfileById(result.user.id);
        const isNew = !profile || !profile.hasSignedPledge;

        setSuccessNotice('Berhasil masuk! Menyiapkan profil Anda...');
        setTimeout(() => {
          onAuthSuccess(result.user!, isNew);
        }, 500);
      } else {
        // Register Akun Baru
        const result = await signUpWithEmail(cleanEmail, password);
        if (!result.success || !result.user) {
          setErrorMessage(result.error || 'Gagal mendaftarkan akun baru.');
          setLoading(false);
          return;
        }

        setSuccessNotice('Akun berhasil didaftarkan! Mengalihkan ke formulir biodata...');
        setTimeout(() => {
          onAuthSuccess(result.user!, true);
        }, 600);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi gangguan jaringan. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Login Cepat dengan Sidik Jari (WebAuthn)
  const handleBiometricLogin = async () => {
    setErrorMessage('');
    setIsBiometricScanning(true);

    try {
      const bioResult = await authenticateWithBiometrics();
      if (!bioResult.success || !bioResult.userId) {
        setErrorMessage(bioResult.error || 'Pemindaian sidik jari dibatalkan.');
        setIsBiometricScanning(false);
        return;
      }

      setSuccessNotice('Sidik jari terverifikasi! Masuk ke akun Anda...');
      const profile = await fetchProfileById(bioResult.userId);
      const isNew = !profile || !profile.hasSignedPledge;

      setTimeout(() => {
        onAuthSuccess(
          { id: bioResult.userId!, email: bioResult.email || savedBioAccount?.email || '' },
          isNew
        );
      }, 500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memproses sidik jari.');
    } finally {
      setIsBiometricScanning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#E8E2D8] overflow-hidden my-6">
        {/* Brand Header */}
        <div className="bg-[#FAF7F2] p-6 text-center border-b border-[#E8E2D8]">
          <div className="w-12 h-12 rounded-2xl bg-[#BE3A50] text-white flex items-center justify-center mx-auto shadow-md shadow-[#BE3A50]/20 mb-3">
            <Heart className="w-6 h-6 fill-white" />
          </div>
          <h2 className="text-xl font-bold text-[#1F1A1B] tracking-tight">CariPacar</h2>
          <p className="text-xs text-[#6B6365] mt-1">
            Platform Pencarian Pasangan Hidup Serius & Asli
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#15803D]/10 text-[#15803D] text-[11px] font-semibold border border-[#15803D]/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verifikasi Wajah & Komitmen Lajang</span>
          </div>
        </div>

        {/* Tab Switcher: Masuk vs Daftar */}
        <div className="p-6 pt-5">
          <div className="grid grid-cols-2 p-1 bg-[#F0EBE1] rounded-2xl border border-[#E8E2D8] mb-5">
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setErrorMessage('');
              }}
              className={`py-2 rounded-xl text-xs font-bold transition-all ${
                tab === 'login'
                  ? 'bg-white text-[#BE3A50] shadow-sm'
                  : 'text-[#6B6365] hover:text-[#1F1A1B]'
              }`}
            >
              Masuk ke Akun
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('register');
                setErrorMessage('');
              }}
              className={`py-2 rounded-xl text-xs font-bold transition-all ${
                tab === 'register'
                  ? 'bg-white text-[#BE3A50] shadow-sm'
                  : 'text-[#6B6365] hover:text-[#1F1A1B]'
              }`}
            >
              Daftar Akun Baru
            </button>
          </div>

          {/* Opsi Login Cepat dengan Sidik Jari (Jika Terdaftar) */}
          {tab === 'login' && hasBiometricSensor && savedBioAccount && (
            <div className="mb-5 p-3.5 rounded-2xl bg-[#FBEBEE] border border-[#BE3A50]/25 text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#BE3A50]">
                <Fingerprint className="w-4 h-4" />
                <span>Masuk Cepat dengan Sidik Jari</span>
              </div>
              <p className="text-[11px] text-[#6B6365]">
                Akun terdaftar: <strong>{savedBioAccount.email}</strong>
              </p>
              <button
                type="button"
                onClick={handleBiometricLogin}
                disabled={isBiometricScanning}
                className="w-full py-2.5 rounded-xl bg-[#BE3A50] hover:bg-[#a32f42] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                {isBiometricScanning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Tempelkan Jari ke Sensor...</span>
                  </>
                ) : (
                  <>
                    <Fingerprint className="w-4 h-4" />
                    <span>Pindai Sidik Jari / Touch ID</span>
                  </>
                )}
              </button>
              <div className="relative flex items-center justify-center pt-2">
                <span className="w-full border-t border-[#BE3A50]/20" />
                <span className="bg-[#FBEBEE] px-2 text-[10px] text-[#6B6365] absolute">
                  atau gunakan email & kata sandi
                </span>
              </div>
            </div>
          )}

          {/* Alert Error / Success */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successNotice && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-start gap-2.5 text-xs text-green-700">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* Form Utama */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#1F1A1B] mb-1">
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#6B6365] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8E2D8] bg-[#FAF7F2] text-xs text-[#1F1A1B] focus:outline-none focus:border-[#BE3A50] focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1F1A1B] mb-1">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#6B6365] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={tab === 'register' ? 'Minimal 6 karakter' : 'Masukkan kata sandi'}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#E8E2D8] bg-[#FAF7F2] text-xs text-[#1F1A1B] focus:outline-none focus:border-[#BE3A50] focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6365] hover:text-[#1F1A1B]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {tab === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-[#1F1A1B] mb-1">
                    Konfirmasi Kata Sandi
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#6B6365] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ulangi kata sandi"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8E2D8] bg-[#FAF7F2] text-xs text-[#1F1A1B] focus:outline-none focus:border-[#BE3A50] focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <label className="flex items-start gap-2 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pledgeChecked}
                    onChange={(e) => setPledgeChecked(e.target.checked)}
                    className="mt-0.5 rounded text-[#BE3A50] focus:ring-[#BE3A50]"
                  />
                  <span className="text-[11px] text-[#6B6365] leading-tight">
                    Saya menyatakan lajang (tanpa ikatan pernikahan sah) dan bersedia akun ditutup permanen jika terbukti selingkuh atau memalsukan identitas.
                  </span>
                </label>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-[#BE3A50] hover:bg-[#a32f42] text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : tab === 'login' ? (
                <>
                  <span>Masuk Sekarang</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Daftar & Lengkapi Biodata</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Switching Note */}
          <div className="mt-5 text-center text-xs text-[#6B6365]">
            {tab === 'login' ? (
              <p>
                Belum punya akun?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setTab('register');
                    setErrorMessage('');
                  }}
                  className="text-[#BE3A50] font-bold hover:underline"
                >
                  Daftar di sini
                </button>
              </p>
            ) : (
              <p>
                Sudah memiliki akun?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setTab('login');
                    setErrorMessage('');
                  }}
                  className="text-[#BE3A50] font-bold hover:underline"
                >
                  Masuk di sini
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

