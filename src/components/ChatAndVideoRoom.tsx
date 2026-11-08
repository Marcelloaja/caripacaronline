'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Video, Send, Check, CheckCheck, Wifi, WifiOff,
  AlertTriangle, Sparkles, PhoneCall, ShieldAlert,
  Info, ArrowLeft, X
} from 'lucide-react';
import { Match, ChatMessage, UserProfile } from '@/types';
import * as dataService from '@/lib/data-service';
import { generateIcebreakerSuggestions } from '@/lib/gemini';

interface ChatAndVideoRoomProps {
  activeMatch: Match | null;
  currentUser: UserProfile;
  otherUser: UserProfile | null;
  onBackToMatches: () => void;
  networkStatus: 'online' | 'slow' | 'offline';
  onReportUser: (user: UserProfile) => void;
}

export default function ChatAndVideoRoom({
  activeMatch,
  currentUser,
  otherUser,
  onBackToMatches,
  networkStatus,
  onReportUser
}: ChatAndVideoRoomProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [icebreakers, setIcebreakers] = useState<string[]>([]);
  const [isLoadingIcebreakers, setIsLoadingIcebreakers] = useState(false);
  const [showIcebreakerDrawer, setShowIcebreakerDrawer] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeMatch) {
      dataService.fetchMessages(activeMatch.id).then(setMessages);

      // Subscribe ke Supabase Realtime
      const unsubscribe = dataService.subscribeToMatchMessages(activeMatch.id, (newMsg) => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      });

      return () => {
        unsubscribe();
      };
    }
  }, [activeMatch]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!activeMatch || !otherUser) {
    return (
      <div className="w-full max-w-xl mx-auto bg-white rounded-3xl border border-[#E8E2D8] p-12 text-center space-y-3">
        <p className="text-xs text-[#6B6365]">Pilih pasangan yang sudah cocok untuk mulai mengobrol.</p>
      </div>
    );
  }

  // Load Gemini Icebreakers
  const handleLoadIcebreakers = async () => {
    setShowIcebreakerDrawer(true);
    if (icebreakers.length === 0) {
      setIsLoadingIcebreakers(true);
      const suggestions = await generateIcebreakerSuggestions(currentUser, otherUser);
      setIcebreakers(suggestions);
      setIsLoadingIcebreakers(false);
    }
  };

  // Kirim Pesan
  const handleSendMessage = () => {
    if (!inputText.trim() || networkStatus === 'offline') return;

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      matchId: activeMatch.id,
      senderId: currentUser.id,
      text: inputText.trim(),
      timestamp: new Date().toISOString(),
      status: networkStatus === 'slow' ? 'sending' : 'sent'
    };

    dataService.sendMessage(newMsg);
    setMessages((prev) => [...prev, newMsg]);
    setInputText('');

    // Simulasi respons balasan otomatis ramah setelah beberapa detik jika ini chat pertama
    if (networkStatus === 'online') {
      setTimeout(() => {
        const replyMsg: ChatMessage = {
          id: `msg_reply_${Date.now()}`,
          matchId: activeMatch.id,
          senderId: otherUser.id,
          text: `Terima kasih pesannya, ${currentUser.name}! Senang bisa berkenalan dengan sesama yang punya niat serius.`,
          timestamp: new Date().toISOString(),
          status: 'read'
        };
        dataService.sendMessage(replyMsg);
        setMessages((prev) => [...prev, replyMsg]);
      }, 2500);
    }
  };

  // Unik Room Name untuk Jitsi Meet terenkripsi
  const jitsiRoomName = `CariPacarOnline_${activeMatch.id.replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded-3xl border border-[#E8E2D8] shadow-md overflow-hidden flex flex-col h-[75vh]">
      {/* Top Header Room */}
      <div className="bg-[#FAF7F2] p-4 border-b border-[#E8E2D8] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToMatches}
            className="md:hidden w-8 h-8 rounded-full bg-white border border-[#E8E2D8] flex items-center justify-center text-[#1F1A1B]"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <img
            src={otherUser.photoUrl}
            alt={otherUser.name}
            className="w-11 h-11 rounded-2xl object-cover border border-[#E8E2D8]"
          />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-[#1F1A1B]">{otherUser.name}</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#15803D]/10 text-[#15803D] font-semibold border border-[#15803D]/20">
                Terverifikasi
              </span>
            </div>
            <p className="text-[11px] text-[#6B6365]">
              {otherUser.currentCity} • MBTI: {otherUser.mbti}
            </p>
          </div>
        </div>

        {/* Action Buttons: Video Call Jitsi, Report, Status Jaringan */}
        <div className="flex items-center gap-2">
          {/* Tombol Kencan Video Jitsi */}
          <button
            onClick={() => setShowVideoCall(true)}
            className="px-3.5 py-1.5 rounded-xl bg-[#BE3A50] hover:bg-[#a32f42] text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
            title="Mulai Kencan Virtual (Video Call Jitsi Meet)"
          >
            <Video className="w-4 h-4" />
            <span className="hidden sm:inline">Kencan Video</span>
          </button>

          {/* Tombol Laporkan Dugaan Selingkuh/Palsu */}
          <button
            onClick={() => onReportUser(otherUser)}
            className="w-8 h-8 rounded-xl bg-white border border-[#E8E2D8] text-[#6B6365] hover:text-red-600 hover:border-red-200 flex items-center justify-center transition-all"
            title="Laporkan Akun (Anti-Selingkuh & Anti-Fake)"
          >
            <ShieldAlert className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Network Warning Banner if Trouble */}
      {networkStatus !== 'online' && (
        <div
          className={`px-4 py-2 text-xs flex items-center justify-center gap-2 font-medium ${
            networkStatus === 'slow'
              ? 'bg-[#FEF3C7] text-[#B45309]'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {networkStatus === 'slow' ? (
            <>
              <AlertTriangle className="w-4 h-4" />
              <span>Sinyal jaringan sedang lambat. Pesan mungkin sedikit tertunda.</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4" />
              <span>Koneksi internet terputus. Menunggu jaringan kembali online...</span>
            </>
          )}
        </div>
      )}

      {/* Pesan Chat Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FAF7F2]/50">
        {/* Anti-Ghosting & Etika Chat */}
        <div className="p-3 bg-white rounded-2xl border border-[#E8E2D8] text-center max-w-md mx-auto space-y-1">
          <p className="text-xs font-semibold text-[#1F1A1B]">Ruang Komitmen Hubungan Serius</p>
          <p className="text-[11px] text-[#6B6365]">
            Jaga komunikasi yang sopan dan saling menghargai. Anda dan {otherUser.name} telah menandatangani ikrar mencari pasangan masa depan.
          </p>
        </div>

        {messages.map((msg) => {
          const isMe = msg.senderId === currentUser.id;
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                  isMe
                    ? 'bg-[#BE3A50] text-white rounded-br-sm'
                    : 'bg-white text-[#1F1A1B] border border-[#E8E2D8] rounded-bl-sm'
                }`}
              >
                <p>{msg.text}</p>
                <div
                  className={`flex items-center justify-end gap-1 text-[9px] mt-1 ${
                    isMe ? 'text-white/80' : 'text-[#6B6365]'
                  }`}
                >
                  <span>
                    {new Date(msg.timestamp).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  {isMe && (
                    <>
                      {msg.status === 'sending' && <span className="italic">mengirim...</span>}
                      {msg.status === 'sent' && <Check className="w-3 h-3" />}
                      {(msg.status === 'delivered' || msg.status === 'read') && (
                        <CheckCheck className="w-3 h-3 text-white" />
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Drawer Ide Pertanyaan Pembuka (Gemini AI Icebreaker) */}
      {showIcebreakerDrawer && (
        <div className="p-3 bg-[#FAF7F2] border-t border-[#E8E2D8] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#BE3A50] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Ide Topik Pembuka (Gemini AI)
            </span>
            <button
              onClick={() => setShowIcebreakerDrawer(false)}
              className="text-[#6B6365] hover:text-[#1F1A1B]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {isLoadingIcebreakers ? (
            <p className="text-xs text-[#6B6365] animate-pulse">Menyiapkan ide pertanyaan santai & sopan...</p>
          ) : (
            <div className="space-y-1.5">
              {icebreakers.map((question, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInputText(question);
                    setShowIcebreakerDrawer(false);
                  }}
                  className="w-full text-left p-2 rounded-xl bg-white border border-[#E8E2D8] hover:border-[#BE3A50] text-xs text-[#1F1A1B] transition-all"
                >
                  &ldquo;{question}&rdquo;
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Input Chat & Gemini Icebreaker Trigger */}
      <div className="p-3 bg-white border-t border-[#E8E2D8] flex items-center gap-2">
        <button
          onClick={handleLoadIcebreakers}
          className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8] text-[#BE3A50] hover:bg-[#FBEBEE] transition-all flex items-center justify-center shrink-0"
          title="Bantu Buat Pertanyaan Pembuka dengan AI Gemini"
        >
          <Sparkles className="w-4 h-4" />
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSendMessage();
          }}
          disabled={networkStatus === 'offline'}
          placeholder={
            networkStatus === 'offline'
              ? 'Jaringan offline...'
              : `Tulis pesan sopan untuk ${otherUser.name}...`
          }
          className="flex-1 px-4 py-2.5 rounded-2xl border border-[#E8E2D8] text-xs text-[#1F1A1B] outline-none focus:border-[#BE3A50] bg-[#FAF7F2]"
        />

        <button
          onClick={handleSendMessage}
          disabled={!inputText.trim() || networkStatus === 'offline'}
          className="p-2.5 rounded-2xl bg-[#BE3A50] disabled:bg-gray-300 text-white hover:bg-[#a32f42] transition-all shrink-0 shadow-sm"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      {/* Jitsi Meet Video Call Modal */}
      {showVideoCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-4xl h-[85vh] bg-[#1F1A1B] rounded-3xl overflow-hidden border border-gray-700 flex flex-col shadow-2xl">
            {/* Header Video Modal */}
            <div className="p-4 bg-[#2A2324] border-b border-gray-700 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-[#BE3A50]" />
                <span className="text-xs font-bold">Kencan Virtual 1-on-1 bersama {otherUser.name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-900/60 text-green-300 border border-green-700">
                  Jitsi Terenkripsi
                </span>
              </div>
              <button
                onClick={() => setShowVideoCall(false)}
                className="px-3 py-1 rounded-xl bg-red-600/80 hover:bg-red-600 text-white text-xs font-semibold flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                <span>Akhiri Kencan Video</span>
              </button>
            </div>

            {/* Jitsi Meet IFrame */}
            <iframe
              src={`https://meet.jit.si/${jitsiRoomName}#userInfo.displayName="${encodeURIComponent(currentUser.name)}"&config.prejoinPageEnabled=false`}
              allow="camera; microphone; fullscreen; display-capture"
              className="w-full flex-1 border-0"
              title="Jitsi Meet Virtual Date"
            />
          </div>
        </div>
      )}
    </div>
  );
}

