/**
 * Integrasi Google Gemini API untuk:
 * 1. Pembuatan ringkasan profil otomatis yang menarik & sopan
 * 2. Moderasi konten (Filter anti-SARA, kata kasar, 18+, penipuan)
 * 3. Pembuat topik obrolan pembuka (Icebreaker) ramah
 */

import { UserProfile } from '@/types';

export function getGeminiApiKey(): string {
  if (typeof window !== 'undefined') {
    const savedKey = localStorage.getItem('cari_pacar_gemini_api_key');
    if (savedKey && savedKey.trim().length > 0) return savedKey;
  }
  return process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
}

export function setGeminiApiKey(key: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('cari_pacar_gemini_api_key', key.trim());
  }
}

/**
 * Filter Mandiri / Local Guardrail untuk kata-kata terlarang (SARA, 18+, Penipuan)
 */
const BANNED_PATTERNS = [
  // 18+ / Pornografi / Asusila
  /\b(vcs|open bo|bo|bispak|bispun|colmek|ngentot|sex|bugil|porn|mesum|lendir)\b/i,
  // SARA & Ujaran Kebencian
  /\b(kafir|pribumi|cina anjing|teroris|sesat|bunuh|antek)\b/i,
  // Penipuan / Transaksional
  /\b(dana kaget|pinjol|transfer dulu|pulsa gratis|judi|slot|gacor)\b/i
];

export async function checkContentSafety(text: string): Promise<{ isSafe: boolean; reason?: string }> {
  // 1. Cek regex lokal instan
  for (const pattern of BANNED_PATTERNS) {
    if (pattern.test(text)) {
      return {
        isSafe: false,
        reason: 'Konten terdeteksi mengandung unsur 18+, SARA, atau konten terlarang.'
      };
    }
  }

  // 2. Jika ada API Key Gemini, gunakan model untuk analisis konteks yang lebih dalam
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return { isSafe: true };
  }

  try {
    const prompt = `Analisis teks berikut untuk website cari jodoh/pacar serius Indonesia. Pastikan teks TIDAK mengandung pornografi, ajakan mesum, unsur 18+, SARA, penipuan, atau kata kasar.
Teks: "${text}"

Jawab HANYA dalam format JSON valid:
{"isSafe": true|false, "reason": "alasan jika tidak aman"}`;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' }
      })
    });

    if (!res.ok) {
      return { isSafe: true }; // Fallback jika kuota habis
    }

    const data = await res.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (resultText) {
      const parsed = JSON.parse(resultText);
      return {
        isSafe: parsed.isSafe ?? true,
        reason: parsed.reason
      };
    }
  } catch {
    // Lewat ke safe jika terjadi kendala jaringan
  }

  return { isSafe: true };
}

/**
 * Membuat ringkasan profil menarik dan sopan
 */
export async function generateProfileSummaryWithGemini(profile: Partial<UserProfile>): Promise<string> {
  const apiKey = getGeminiApiKey();

  // Smart fallback jika tidak ada API key
  const fallback = `Pribadi ${profile.mbti || 'ramah'} dari ${profile.originCity || 'Indonesia'} yang kini berdomisili di ${profile.currentCity || 'Indonesia'}. Menyukai ${profile.hobbies?.slice(0, 3).join(', ') || 'berdiskusi santai'} dan memiliki komitmen mencari pasangan untuk tujuan pernikahan yang langgeng.`;

  if (!apiKey) return fallback;

  try {
    const prompt = `Kamu adalah copywriter pencocokan jodoh profesional untuk aplikasi Cari Pacar Online Indonesia yang berorientasi pernikahan/hubungan serius.
Buatkan 2 kalimat ringkasan profil yang hangat, memikat, sopan, dan mencerminkan keseriusan calon pasangan ini:
- Nama: ${profile.name}
- Umur: ${profile.age} tahun
- Domisili: ${profile.currentCity} (Asal: ${profile.originCity})
- MBTI: ${profile.mbti}
- Hobi: ${profile.hobbies?.join(', ')}
- Keterangan Diri: ${profile.bio}
- Keturunan / Etnis: ${profile.ethnicity || 'Indonesia'}
- Target Hubungan: ${profile.targetMarriage}

Tulis langsung dalam bahasa Indonesia yang elegan dan personal tanpa tanda petik pembuka.`;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!res.ok) return fallback;

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return text || fallback;
  } catch {
    return fallback;
  }
}

/**
 * Menghasilkan ide pertanyaan pembuka (Icebreaker) untuk chat
 */
export async function generateIcebreakerSuggestions(
  userA: UserProfile,
  userB: UserProfile
): Promise<string[]> {
  const defaultIcebreakers = [
    `Hai ${userB.name}, salam kenal ya! Aku lihat kamu suka ${userB.hobbies[0] || 'kegiatan seru'}, biasanya sering dilakukan saat weekend kah?`,
    `Halo ${userB.name}, sebagai sesama yang domisili di ${userB.currentCity}, ada tempat favorit yang wajib dikunjungi di sini menurutmu?`,
    `Hai ${userB.name}, menarik banget profil MBTI kamu (${userB.mbti}). Boleh cerita apa hal yang paling kamu prioritaskan dalam mencari pasangan hidup?`
  ];

  const apiKey = getGeminiApiKey();
  if (!apiKey) return defaultIcebreakers;

  try {
    const prompt = `Berikan 3 pertanyaan pembuka obrolan kencan pertama (icebreaker) yang sopan, hangat, dan tidak membosankan antara ${userA.name} dan ${userB.name}.
Data User B: Hobi: ${userB.hobbies.join(', ')}, Domisili: ${userB.currentCity}, MBTI: ${userB.mbti}.
Jawab dalam format JSON array of string: ["pertanyaan 1", "pertanyaan 2", "pertanyaan 3"]`;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' }
      })
    });

    if (!res.ok) return defaultIcebreakers;

    const data = await res.json();
    const jsonStr = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (jsonStr) {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    return defaultIcebreakers;
  } catch {
    return defaultIcebreakers;
  }
}

