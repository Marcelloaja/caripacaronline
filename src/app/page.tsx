'use client';

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Heart, Sparkles, MessageCircle, User, ShieldCheck,
  Video, MapPin, CheckCircle, Bell, ArrowRight,
  Fingerprint, LogOut, CheckCircle2, Loader2, Mail
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import DiscoveryDeck from '@/components/DiscoveryDeck';
import LikesReceivedView from '@/components/LikesReceivedView';
import ChatAndVideoRoom from '@/components/ChatAndVideoRoom';
import OnboardingModal from '@/components/OnboardingModal';
import ReportModal from '@/components/ReportModal';
import AuthModal from '@/components/AuthModal';
import {
  UserProfile, LoveInteraction, Match, AppNotification
} from '@/types';
import * as dataService from '@/lib/data-service';
import { getNotifications, markNotificationsAsRead } from '@/lib/storage';
import { signOutUser } from '@/lib/auth-service';
import { isBiometricsAvailable, registerBiometrics, getSavedBiometricAccount } from '@/lib/biometric-auth';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'discovery' | 'likes' | 'chats' | 'profile'>('discovery');

  // App Data States
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [candidates, setCandidates] = useState<UserProfile[]>([]);
  const [interactions, setInteractions] = useState<LoveInteraction[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Active Chat State
  const [activeMatch, setActiveMatch] = useState<Match | null>(null);

  // Modals & Auth States
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authAccount, setAuthAccount] = useState<{ id: string; email: string } | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [reportedUser, setReportedUser] = useState<UserProfile | null>(null);
  const [matchedCelebrationUser, setMatchedCelebrationUser] = useState<UserProfile | null>(null);

  // Biometrics Hardware & Registration Status
  const [hasBiometricHardware, setHasBiometricHardware] = useState(false);
  const [isBiometricsEnrolled, setIsBiometricsEnrolled] = useState(false);
  const [bioLoading, setBioLoading] = useState(false);
  const [bioStatusMsg, setBioStatusMsg] = useState('');

  // Network Status Simulation (Online, Slow, Offline)
  const [networkStatus, setNetworkStatus] = useState<'online' | 'slow' | 'offline'>('online');

  // Load Client Data & Check Biometrics
  useEffect(() => {
    setMounted(true);
    setNotifications(getNotifications());

    // Cek sensor biometrik perangkat
    isBiometricsAvailable().then((supported) => {
      setHasBiometricHardware(supported);
      if (supported) {
        setIsBiometricsEnrolled(Boolean(getSavedBiometricAccount()));
      }
    });

    // Ambil profil user aktif
    dataService.fetchCurrentUser().then((user) => {
      setCurrentUser(user);
      if (!user) {
        setShowAuthModal(true);
      } else {
        // Ambil kandidat pasangan yang cocok
        dataService.fetchCandidates(user).then(setCandidates);
        dataService.fetchInteractions(user.id).then(setInteractions);
        dataService.fetchMatches(user.id).then(setMatches);
      }
    });

    // Otomatis deteksi konektivitas jaringan perangkat
    const handleOnline = () => setNetworkStatus('online');
    const handleOffline = () => setNetworkStatus('offline');
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handler Berhasil Login / Register
  const handleAuthSuccess = async (
    account: { id: string; email: string },
    isNewUser: boolean
  ) => {
    setAuthAccount(account);
    setShowAuthModal(false);

    if (isNewUser) {
      setShowOnboarding(true);
    } else {
      const profile = await dataService.fetchProfileById(account.id);
      if (profile && profile.hasSignedPledge) {
        setCurrentUser(profile);
        dataService.fetchCandidates(profile).then(setCandidates);
        dataService.fetchInteractions(profile.id).then(setInteractions);
        dataService.fetchMatches(profile.id).then(setMatches);
      } else {
        setShowOnboarding(true);
      }
    }
  };

  // Handler Keluar (Logout)
  const handleSignOut = async () => {
    await signOutUser();
    setCurrentUser(null);
    setCandidates([]);
    setInteractions([]);
    setMatches([]);
    setShowAuthModal(true);
  };

  // Handler Daftarkan Sidik Jari (Biometrik)
  const handleEnrollBiometrics = async () => {
    if (!currentUser) return;
    setBioLoading(true);
    setBioStatusMsg('');

    try {
      const emailToUse = currentUser.email || `${currentUser.name.toLowerCase().replace(/\s+/g, '')}@caripacar.app`;
      const result = await registerBiometrics(currentUser.id, emailToUse);

      if (result.success) {
        setIsBiometricsEnrolled(true);
        setBioStatusMsg('Sensor sidik jari berhasil diaktifkan untuk akun ini!');
      } else {
        setBioStatusMsg(result.error || 'Gagal mengaktifkan sensor sidik jari.');
      }
    } catch (err: any) {
      setBioStatusMsg(err.message || 'Gagal memproses sidik jari.');
    } finally {
      setBioLoading(false);
    }
  };

  // Handler Kirim Love atau Love + Catatan
  const handleSendInteraction = async (toUserId: string, type: 'love' | 'love_note', note?: string) => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    const newInteraction: LoveInteraction = {
      id: `int_${Date.now()}`,
      fromUserId: currentUser.id,
      toUserId,
      type,
      note,
      timestamp: new Date().toISOString()
    };

    await dataService.sendInteraction(newInteraction);
    setInteractions((prev) => [...prev, newInteraction]);

    // Cek apakah calon ini juga sudah menyukai user (Match!)
    const targetLikedMe = interactions.find(
      (i) => i.fromUserId === toUserId && i.toUserId === currentUser.id
    );

    if (targetLikedMe) {
      // Trigger Match!
      const match = await dataService.createNewMatch(currentUser.id, toUserId);
      setMatches((prev) => [match, ...prev.filter((m) => m.id !== match.id)]);
      const targetUser = candidates.find((c) => c.id === toUserId);
      if (targetUser) {
        setMatchedCelebrationUser(targetUser);
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    }
  };

  // Handler Balas Suka dari View "Menyukai Saya"
  const handleReciprocateLove = async (targetUser: UserProfile) => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    await handleSendInteraction(targetUser.id, 'love');
    const match = await dataService.createNewMatch(currentUser.id, targetUser.id);
    setActiveMatch(match);
    setActiveTab('chats');
  };

  if (!mounted) return null;

  const likesToMe = currentUser ? interactions.filter((i) => i.toUserId === currentUser.id) : [];
  const otherChatUser = activeMatch && currentUser
    ? candidates.find(
        (c) =>
          c.id ===
          (activeMatch.userAId === currentUser.id ? activeMatch.userBId : activeMatch.userAId)
      ) || null
    : null;

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col pb-28 md:pb-8">
      {/* Navbar Global */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        likesCount={likesToMe.length}
        unreadMessagesCount={matches.length}
        notifications={notifications}
        onMarkNotificationsRead={() => {
          markNotificationsAsRead();
          setNotifications(getNotifications());
        }}
        networkStatus={networkStatus}
        onOpenOnboarding={() => setShowOnboarding(true)}
        onOpenAuth={() => setShowAuthModal(true)}
        onSignOut={handleSignOut}
      />

      {/* Main Container */}
      <main className="max-w-5xl mx-auto w-full px-4 pt-6 flex-1">
        {/* ================= TAB 1: DISCOVERY (CARI PASANGAN) ================= */}
        {activeTab === 'discovery' && (
          <DiscoveryDeck
            candidates={candidates}
            currentUser={currentUser}
            onSendInteraction={handleSendInteraction}
            onSelectCandidateDetails={() => {}}
            onOpenOnboarding={() => setShowOnboarding(true)}
          />
        )}

        {/* ================= TAB 2: MENYUKAI SAYA ================= */}
        {activeTab === 'likes' && (
          <LikesReceivedView
            interactions={interactions}
            allCandidates={candidates}
            currentUser={currentUser}
            onMatchAndChat={handleReciprocateLove}
            onOpenOnboarding={() => setShowOnboarding(true)}
          />
        )}

        {/* ================= TAB 3: PESAN & KENCAN (CHATS) ================= */}
        {activeTab === 'chats' && (
          <div className="w-full max-w-4xl mx-auto space-y-4">
            {matches.length === 0 ? (
              <div className="bg-white rounded-3xl border border-[#E8E2D8] p-12 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-[#FAF7F2] text-[#BE3A50] flex items-center justify-center mx-auto">
                  <MessageCircle className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-base text-[#1F1A1B]">Belum Ada Pasangan yang Cocok (Match)</h3>
                <p className="text-xs text-[#6B6365] max-w-sm mx-auto">
                  Kirimkan Love atau Love + Catatan kepada calon pasangan di menu Cari Pasangan. Ketika saling menyukai, ruang obrolan dan video call akan langsung terbuka di sini!
                </p>
                <button
                  onClick={() => setActiveTab('discovery')}
                  className="px-5 py-2.5 bg-[#BE3A50] text-white rounded-xl text-xs font-semibold hover:bg-[#a32f42] transition-all"
                >
                  Mulai Cari Pasangan
                </button>
              </div>
            ) : activeMatch && currentUser ? (
              <ChatAndVideoRoom
                activeMatch={activeMatch}
                currentUser={currentUser}
                otherUser={otherChatUser}
                onBackToMatches={() => setActiveMatch(null)}
                networkStatus={networkStatus}
                onReportUser={(u) => setReportedUser(u)}
              />
            ) : (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-2xl border border-[#E8E2D8] flex items-center justify-between">
                  <h2 className="font-bold text-sm text-[#1F1A1B] flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-[#BE3A50]" />
                    Daftar Obrolan Pasangan Cocok ({matches.length})
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {matches.map((match) => {
                    const otherId =
                      match.userAId === currentUser?.id ? match.userBId : match.userAId;
                    const partner = candidates.find((c) => c.id === otherId);
                    if (!partner) return null;

                    return (
                      <div
                        key={match.id}
                        onClick={() => setActiveMatch(match)}
                        className="bg-white p-4 rounded-3xl border border-[#E8E2D8] hover:border-[#BE3A50] hover:shadow-md transition-all cursor-pointer flex items-center gap-3.5"
                      >
                        <img
                          src={partner.photoUrl}
                          alt={partner.name}
                          className="w-14 h-14 rounded-2xl object-cover border border-[#E8E2D8]"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold text-sm text-[#1F1A1B] truncate">{partner.name}</h3>
                            <span className="text-[10px] text-[#6B6365]">
                              {partner.currentCity}
                            </span>
                          </div>
                          <p className="text-xs text-[#BE3A50] font-medium mt-0.5 line-clamp-1">
                            {match.lastMessage || 'Saling menyukai! Mulai obrolan pertama.'}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-[#15803D] mt-1 font-medium">
                            <Video className="w-3 h-3" />
                            <span>Kencan Video Siap</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 4: PROFIL SAYA ================= */}
        {activeTab === 'profile' && (
          currentUser ? (
            <div className="w-full max-w-xl mx-auto bg-white rounded-3xl border border-[#E8E2D8] overflow-hidden shadow-sm p-6 space-y-5">
              <div className="flex items-start gap-4">
                <img
                  src={currentUser.photoUrl}
                  alt={currentUser.name}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-[#15803D] shadow-sm"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-[#1F1A1B]">{currentUser.name}</h2>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#15803D]/10 text-[#15803D] font-bold border border-[#15803D]/20">
                      Lajang & Asli
                    </span>
                  </div>
                  <p className="text-xs text-[#6B6365] mt-1">
                    {currentUser.age} tahun • {currentUser.currentCity} (Asal {currentUser.originCity})
                  </p>
                  <p className="text-xs text-[#BE3A50] font-medium mt-0.5">
                    MBTI: {currentUser.mbti} • Keturunan: {currentUser.ethnicity} • Target: {currentUser.targetMarriage.replace('_', ' ')}
                  </p>
                </div>
              </div>

              {/* AI Summary Card */}
              {currentUser.aiSummary && (
                <div className="p-3.5 bg-[#FAF7F2] rounded-2xl border border-[#BE3A50]/20 space-y-1">
                  <span className="text-[10px] font-bold text-[#BE3A50] uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Ringkasan Karakter (AI Gemini)
                  </span>
                  <p className="text-xs text-[#1F1A1B] italic leading-relaxed">
                    &ldquo;{currentUser.aiSummary}&rdquo;
                  </p>
                </div>
              )}

              {/* Bio & Details */}
              <div className="space-y-2 text-xs">
                <span className="font-semibold text-[#1F1A1B] block">Keterangan Diri:</span>
                <p className="text-[#6B6365] leading-relaxed bg-[#FAF7F2] p-3 rounded-2xl border border-[#E8E2D8]">
                  {currentUser.bio}
                </p>
              </div>

              {/* Hobbies & Skills */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-[#1F1A1B] block">Hobi & Minat:</span>
                <div className="flex flex-wrap gap-1.5">
                  {currentUser.hobbies.map((h) => (
                    <span
                      key={h}
                      className="px-2.5 py-1 rounded-full bg-[#FAF7F2] border border-[#E8E2D8] text-xs text-[#6B6365]"
                    >
                      {h}
                    </span>
                  ))}
                </div>
              </div>

              {/* Informasi Akun Terdaftar */}
              <div className="p-3.5 bg-[#FAF7F2] rounded-2xl border border-[#E8E2D8] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-white border border-[#E8E2D8] flex items-center justify-center text-[#BE3A50]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#6B6365] block">Akun Login:</span>
                    <span className="text-xs font-semibold text-[#1F1A1B]">
                      {currentUser.email || authAccount?.email || 'Akun Terverifikasi'}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-medium">
                  Aktif
                </span>
              </div>

              {/* Pengaturan Login Sidik Jari / Biometrik */}
              <div className="p-4 rounded-2xl border border-[#BE3A50]/20 bg-[#FBEBEE]/50 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#BE3A50]">
                    <Fingerprint className="w-4 h-4" />
                    <span>Login Sidik Jari / Biometrik</span>
                  </div>
                  {isBiometricsEnrolled && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#15803D] text-white font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Aktif di HP/Laptop Ini
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-[#6B6365] leading-relaxed">
                  Gunakan pemindai sidik jari (Fingerprint, Touch ID, Face ID, atau Windows Hello) pada perangkat Anda untuk masuk langsung tanpa repot mengetik kata sandi.
                </p>

                {bioStatusMsg && (
                  <div className="p-2.5 rounded-xl bg-white border border-[#BE3A50]/30 text-xs font-medium text-[#BE3A50]">
                    {bioStatusMsg}
                  </div>
                )}

                {hasBiometricHardware ? (
                  <button
                    type="button"
                    onClick={handleEnrollBiometrics}
                    disabled={bioLoading}
                    className="w-full py-2.5 rounded-xl bg-white hover:bg-[#FAF7F2] border border-[#BE3A50]/30 text-[#BE3A50] text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    {bioLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Memindai Sidik Jari...</span>
                      </>
                    ) : isBiometricsEnrolled ? (
                      <>
                        <Fingerprint className="w-4 h-4" />
                        <span>Daftarkan Ulang Sidik Jari</span>
                      </>
                    ) : (
                      <>
                        <Fingerprint className="w-4 h-4" />
                        <span>Aktifkan Login Sidik Jari Sekarang</span>
                      </>
                    )}
                  </button>
                ) : (
                  <p className="text-[11px] text-[#6B6365] italic">
                    Sensor sidik jari tidak terdeteksi pada peramban/perangkat ini.
                  </p>
                )}
              </div>

              {/* Tombol Aksi: Edit & Logout */}
              <div className="pt-2 space-y-2">
                <button
                  onClick={() => setShowOnboarding(true)}
                  className="w-full py-2.5 bg-[#BE3A50] hover:bg-[#a32f42] text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  <span>Edit Data Profil & Foto</span>
                </button>

                <button
                  onClick={handleSignOut}
                  className="w-full py-2.5 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Keluar dari Akun (Logout)</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-xl mx-auto bg-white rounded-3xl border border-[#E8E2D8] p-10 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-[#FAF7F2] text-[#BE3A50] flex items-center justify-center mx-auto">
                <User className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-base text-[#1F1A1B]">Belum Masuk ke Akun</h3>
              <p className="text-xs text-[#6B6365]">
                Masuk atau daftarkan akun baru untuk mulai mencari pasangan serius dan mengaktifkan login sidik jari.
              </p>
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-6 py-2.5 bg-[#BE3A50] hover:bg-[#a32f42] text-white rounded-xl text-xs font-bold transition-all shadow-sm inline-flex items-center gap-2"
              >
                <Fingerprint className="w-4 h-4" />
                <span>Masuk / Daftar Akun</span>
              </button>
            </div>
          )
        )}
      </main>

      {/* ================= MODAL CELEBRATION (MATCHED!) ================= */}
      {matchedCelebrationUser && currentUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 text-center shadow-2xl border border-[#E8E2D8] space-y-4 animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 rounded-full bg-[#BE3A50] text-white flex items-center justify-center mx-auto shadow-lg shadow-[#BE3A50]/30">
              <Heart className="w-8 h-8 fill-white" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-[#1F1A1B]">Kalian Saling Menyukai!</h3>
              <p className="text-xs text-[#6B6365]">
                Kamu dan <strong>{matchedCelebrationUser.name}</strong> sama-sama mencari pasangan serius.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 py-2">
              <img
                src={currentUser.photoUrl}
                alt="Me"
                className="w-16 h-16 rounded-full object-cover border-2 border-[#BE3A50]"
              />
              <Heart className="w-6 h-6 text-[#BE3A50] fill-[#BE3A50] animate-bounce" />
              <img
                src={matchedCelebrationUser.photoUrl}
                alt={matchedCelebrationUser.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-[#BE3A50]"
              />
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={async () => {
                  const match = await dataService.createNewMatch(currentUser.id, matchedCelebrationUser.id);
                  setActiveMatch(match);
                  setMatchedCelebrationUser(null);
                  setActiveTab('chats');
                }}
                className="w-full py-2.5 bg-[#BE3A50] hover:bg-[#a32f42] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Kirim Pesan Pertama Sekarang</span>
              </button>

              <button
                onClick={() => setMatchedCelebrationUser(null)}
                className="w-full py-2 text-xs text-[#6B6365] hover:text-[#1F1A1B] font-medium"
              >
                Lanjut Mencari Nanti
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Onboarding / Edit Profile Modal */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        initialProfile={currentUser}
        authUserId={authAccount?.id}
        authEmail={authAccount?.email}
        canClose={Boolean(currentUser)}
        onSaveProfile={async (updated) => {
          await dataService.saveProfile(updated);
          setCurrentUser(updated);
          dataService.fetchCandidates(updated).then(setCandidates);
        }}
      />

      {/* Report User Modal */}
      <ReportModal
        isOpen={Boolean(reportedUser)}
        onClose={() => setReportedUser(null)}
        targetUser={reportedUser}
        reporterId={currentUser?.id}
      />

      {/* Auth Modal (Login / Register / Biometrics) */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {
          if (currentUser) setShowAuthModal(false);
        }}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
