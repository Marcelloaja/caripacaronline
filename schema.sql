-- ============================================================
-- SKEMA DATABASE SUPABASE: CARI PACAR ONLINE (PASANGAN SERIUS)
-- Salin dan jalankan seluruh script ini di Supabase SQL Editor:
-- (Buka Supabase > Project > SQL Editor > New Query > Paste > Run)
-- ============================================================

-- 1. Tabel Profil Pengguna (Profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  email TEXT,
  name TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('pria', 'wanita')),
  interested_in TEXT NOT NULL CHECK (interested_in IN ('pria', 'wanita')),
  origin_city TEXT NOT NULL,
  current_city TEXT NOT NULL,
  country TEXT DEFAULT 'Indonesia',
  birth_year INTEGER NOT NULL,
  age INTEGER NOT NULL,
  height_cm INTEGER DEFAULT 165,
  mbti TEXT NOT NULL,
  ethnicity TEXT DEFAULT 'Tionghoa (Chindo)',
  bio TEXT,
  ai_summary TEXT,
  skills TEXT[] DEFAULT '{}',
  hobbies TEXT[] DEFAULT '{}',
  photo_url TEXT,
  is_photo_verified BOOLEAN DEFAULT true,
  has_signed_pledge BOOLEAN DEFAULT true,
  target_marriage TEXT DEFAULT '1_tahun',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Migrasi tambahan untuk tabel profiles yang sudah ada:
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Tabel Interaksi Suka (Interactions: Love & Love Note)
CREATE TABLE IF NOT EXISTS public.interactions (
  id TEXT PRIMARY KEY,
  from_user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('love', 'love_note')),
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Migrasi tambahan untuk tabel profiles yang sudah ada:
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- 3. Tabel Pasangan Cocok (Matches)
CREATE TABLE IF NOT EXISTS public.matches (
  id TEXT PRIMARY KEY,
  user_a_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_b_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_message TEXT,
  last_message_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Migrasi tambahan untuk tabel profiles yang sudah ada:
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- 4. Tabel Pesan Obrolan (Messages)
CREATE TABLE IF NOT EXISTS public.messages (
  id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sending', 'sent', 'delivered', 'read')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Migrasi tambahan untuk tabel profiles yang sudah ada:
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- 5. Tabel Laporan Pelanggaran (Reports: Anti-Selingkuh & Akun Palsu)
CREATE TABLE IF NOT EXISTS public.reports (
  id TEXT PRIMARY KEY,
  reporter_id TEXT,
  reported_user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Migrasi tambahan untuk tabel profiles yang sudah ada:
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Indexing untuk query cepat
CREATE INDEX IF NOT EXISTS idx_profiles_gender ON public.profiles(gender);
CREATE INDEX IF NOT EXISTS idx_profiles_city ON public.profiles(current_city);
CREATE INDEX IF NOT EXISTS idx_interactions_to_user ON public.interactions(to_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_match_id ON public.messages(match_id);

-- Aktifkan Row Level Security (RLS) dengan Akses Terbuka untuk Anon/Publik (Sesuai Kebutuhan Demo/PWA)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow public insert on profiles" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on profiles" ON public.profiles FOR UPDATE USING (true);

CREATE POLICY "Allow public read on interactions" ON public.interactions FOR SELECT USING (true);
CREATE POLICY "Allow public insert on interactions" ON public.interactions FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read on matches" ON public.matches FOR SELECT USING (true);
CREATE POLICY "Allow public insert on matches" ON public.matches FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on matches" ON public.matches FOR UPDATE USING (true);

CREATE POLICY "Allow public read on messages" ON public.messages FOR SELECT USING (true);
CREATE POLICY "Allow public insert on messages" ON public.messages FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public insert on reports" ON public.reports FOR INSERT WITH CHECK (true);

-- 6. Tabel Postingan Komunitas / Ruang Cerita Publik (Posts)
CREATE TABLE IF NOT EXISTS public.posts (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  photo_url TEXT,
  category TEXT DEFAULT 'cerita' CHECK (category IN ('cerita', 'keseharian', 'tips_kencan', 'tanya_jawab')),
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Tabel Komentar Postingan (Post Comments & Replies)
CREATE TABLE IF NOT EXISTS public.post_comments (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  parent_comment_id TEXT REFERENCES public.post_comments(id) ON DELETE CASCADE,
  reply_to_author_name TEXT,
  author_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Tabel Reaksi Suka Postingan (Post Likes)
CREATE TABLE IF NOT EXISTS public.post_likes (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(post_id, user_id)
);

-- Indexing tambahan untuk Ruang Cerita
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON public.post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON public.post_likes(post_id);

-- RLS untuk tabel komunitas
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on posts" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Allow public insert on posts" ON public.posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on posts" ON public.posts FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on posts" ON public.posts FOR DELETE USING (true);

CREATE POLICY "Allow public read on post_comments" ON public.post_comments FOR SELECT USING (true);
CREATE POLICY "Allow public insert on post_comments" ON public.post_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete on post_comments" ON public.post_comments FOR DELETE USING (true);

CREATE POLICY "Allow public read on post_likes" ON public.post_likes FOR SELECT USING (true);
CREATE POLICY "Allow public insert on post_likes" ON public.post_likes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete on post_likes" ON public.post_likes FOR DELETE USING (true);

-- Aktifkan Supabase Realtime agar chat, notifikasi Love, dan Ruang Cerita langsung terupdate seketika
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.interactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_comments;

