# Cari Pacar Online (Platform Pasangan Serius & Masa Depan)

Aplikasi web modern untuk pencarian pasangan hidup yang berorientasi pernikahan, bebas dari akun palsu dan perselingkuhan. Dibangun menggunakan **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, dan **PWA (Progressive Web App)**, siap untuk dideploy langsung ke **Vercel**.

---

## 🌟 Fitur Utama & Kepatuhan Spesifikasi

1. **Biodata Lengkap & Verifikasi Otomatis:**
   - Nama asli panggilan, kota asal, domisili saat ini, dan negara.
   - Perhitungan umur otomatis dari tahun kelahiran.
   - Pilihan kepribadian MBTI lengkap dengan **Kuis Cepat MBTI (4 pertanyaan interaktif)** bagi yang belum tahu tipe kepribadiannya.
   - Upload foto maksimal 5MB dengan **verifikasi deteksi wajah di browser** (mencegah foto kartun, anime, atau pemandangan).
   - Keterangan diri (bio), hobi, keahlian, tinggi badan, status keturunan (anak), dan preferensi **Strict Straight** (Pria mencari Wanita, Wanita mencari Pria).
   - Ringkasan profil otomatis dan moderasi konten anti-SARA/18+ ditenagai **Google Gemini AI**.

2. **AI Matchmaking 1-1 (Straight):**
   - Menampilkan profil lawan jenis yang relevan dan kompatibel.

3. **Tampilan Kartu Interaktif (Card Deck):**
   - Tombol **Lewati (Skip)**, **Love (Suka)**, dan **Love + Catatan** (pesan pembuka dengan moderasi teks real-time).

4. **Sistem Notifikasi Love & Catatan:**
   - Dropdown notifikasi real-time yang memuat pengirim love, catatan perkenalan, dan waktu kirim.

5. **Tab "Menyukai Saya":**
   - Melihat daftar siapa saja yang telah memberikan Love kepada Anda.
   - Tombol langsung **"Balas Suka & Hubungkan"** untuk otomatis menjadi Match.

6. **Kencan Virtual Terintegrasi (Jitsi Meet):**
   - Panggilan video 1-on-1 langsung di browser menggunakan Jitsi Meet terenkripsi tanpa biaya.

7. **Obrolan Realtime dengan Indikator Sinyal/Jaringan:**
   - Obrolan pesan dengan centang status (mengirim, terkirim, dibaca).
   - Indikator sinyal visual (Online, Sinyal Lemah, Offline) dan banner peringatan saat jaringan bermasalah.

8. **Inovasi AI & Komitmen Serius:**
   - **Ikrar Integritas Lajang (*Single's Pledge*):** Pernyataan wajib tidak terikat pernikahan sah demi mencegah perselingkuhan.
   - **Fitur Pelaporan Akun:** Laporkan dugaan perselingkuhan atau akun palsu.
   - **AI Icebreaker Generator:** Ditenagai Gemini untuk membuat pertanyaan pembuka kencan yang sopan dan tidak membosankan.

9. **Progressive Web App (PWA):**
   - File `manifest.json` dan `sw.js` (Service Worker) terpasang, aplikasi dapat di-install di layar utama ponsel/desktop dan mendukung push notification.

10. **Filter Domisili Kota:**
    - Filter pencarian pasangan berdasarkan kota domisili di seluruh Indonesia.

---

## 🚀 Cara Menjalankan Proyek Secara Lokal

1. Jalankan server pengembangan:
   ```bash
   npm run dev
   ```
2. Buka browser di [http://localhost:3000](http://localhost:3000).

---

## ☁️ Panduan Deploy ke Vercel

1. **Push ke GitHub:**
   ```bash
   git add .
   git commit -m "feat: complete Cari Pacar Online web app"
   git push origin main
   ```
2. **Deploy di Vercel:**
   - Buka [vercel.com](https://vercel.com) dan buat **New Project**.
   - Import repositori GitHub Anda.
   - (Opsional) Tambahkan Environment Variable:
     - `NEXT_PUBLIC_GEMINI_API_KEY`: API Key gratisan dari [Google AI Studio](https://aistudio.google.com).
   - Klik **Deploy**.

---

## 🎨 Standar Desain Anti-Slop

Desain aplikasi ini dibuat dengan palet warna bernuansa hangat, elegan, dan manusiawi (*Human-Crafted*):
- **Primary:** Rosewood Terracotta (`#BE3A50`)
- **Background Canvas:** Warm Linen Cream (`#FAF7F2`)
- **Text:** Deep Charcoal High Contrast (`#1F1A1B` - Rasio WCAG 16.08:1)
- Bebas dari gradien ungu generik AI, shadow berlebihan, maupun teks klise.
