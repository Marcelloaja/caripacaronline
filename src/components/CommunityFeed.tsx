'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Heart, MessageCircle, Send, Image as ImageIcon, Camera,
  Sparkles, ShieldCheck, X, MoreHorizontal, CornerDownRight,
  UserCheck, AlertCircle, RefreshCw, Share2
} from 'lucide-react';
import { CommunityPost, PostComment, UserProfile } from '@/types';
import * as dataService from '@/lib/data-service';
import { checkContentSafety } from '@/lib/gemini';

interface CommunityFeedProps {
  currentUser: UserProfile | null;
  onViewProfile: (profile: any) => void;
  onOpenAuth: () => void;
}

export default function CommunityFeed({
  currentUser,
  onViewProfile,
  onOpenAuth
}: CommunityFeedProps) {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Composer States
  const [content, setContent] = useState<string>('');
  const [category, setCategory] = useState<'cerita' | 'keseharian' | 'tips_kencan' | 'tanya_jawab'>('cerita');
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorNotice, setErrorNotice] = useState<string>('');
  const [isComposerFocused, setIsComposerFocused] = useState<boolean>(false);

  // Comments / Thread States
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [commentsMap, setCommentsMap] = useState<{ [postId: string]: PostComment[] }>({});
  const [commentInputs, setCommentInputs] = useState<{ [postId: string]: string }>({});
  const [replyTargetMap, setReplyTargetMap] = useState<{ [postId: string]: { commentId: string; authorName: string } | null }>({});
  const [isSubmittingComment, setIsSubmittingComment] = useState<boolean>(false);

  // File Inputs Ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  // Load Posts on Mount
  useEffect(() => {
    loadPosts();
  }, [currentUser?.id]);

  const loadPosts = async () => {
    setIsLoading(true);
    try {
      const data = await dataService.fetchCommunityPosts(currentUser?.id);
      setPosts(data);
    } catch (err) {
      console.error('Gagal memuat feed cerita:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Upload Foto Handler
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorNotice('Ukuran foto maksimal 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoPreview(reader.result as string);
        setErrorNotice('');
      };
      reader.readAsDataURL(file);
    }
  };

  // Kirim Postingan Baru
  const handleCreatePost = async () => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (!content.trim()) {
      setErrorNotice('Tuliskan cerita atau pemikiranmu terlebih dahulu.');
      return;
    }

    setIsSubmitting(true);
    setErrorNotice('');

    // Safety check kata-kata tak pantas lewat AI
    const safety = await checkContentSafety(content);
    if (!safety.isSafe) {
      setErrorNotice(safety.reason || 'Cerita mengandung kata yang tidak sesuai norma komunitas.');
      setIsSubmitting(false);
      return;
    }

    const newPost: CommunityPost = {
      id: `post_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      authorId: currentUser.id,
      author: {
        id: currentUser.id,
        name: currentUser.name,
        photoUrl: currentUser.photoUrl,
        gender: currentUser.gender,
        currentCity: currentUser.currentCity,
        age: currentUser.age,
        mbti: currentUser.mbti,
        isPhotoVerified: currentUser.isPhotoVerified
      },
      content: content.trim(),
      photoUrl: photoPreview || undefined,
      category,
      likesCount: 0,
      commentsCount: 0,
      hasLiked: false,
      createdAt: new Date().toISOString()
    };

    try {
      await dataService.createCommunityPost(newPost);
      setPosts(prev => [newPost, ...prev]);
      setContent('');
      setPhotoPreview('');
      setIsComposerFocused(false);
    } catch (err) {
      setErrorNotice('Gagal membagikan cerita. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Suka / Like
  const handleToggleLike = async (post: CommunityPost) => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    // Optimistic UI update
    const currentlyLiked = !!post.hasLiked;
    const newLikesCount = Math.max(0, post.likesCount + (currentlyLiked ? -1 : 1));

    setPosts(prev =>
      prev.map(p =>
        p.id === post.id
          ? { ...p, hasLiked: !currentlyLiked, likesCount: newLikesCount }
          : p
      )
    );

    try {
      await dataService.togglePostLike(post.id, currentUser.id);
    } catch (err) {
      // Revert jika gagal
      setPosts(prev =>
        prev.map(p =>
          p.id === post.id
            ? { ...p, hasLiked: currentlyLiked, likesCount: post.likesCount }
            : p
        )
      );
    }
  };

  // Buka / Tutup Komentar
  const handleToggleComments = async (postId: string) => {
    if (activeCommentsPostId === postId) {
      setActiveCommentsPostId(null);
      return;
    }

    setActiveCommentsPostId(postId);

    if (!commentsMap[postId]) {
      try {
        const comments = await dataService.fetchPostComments(postId);
        setCommentsMap(prev => ({ ...prev, [postId]: comments }));
      } catch (err) {
        console.error('Gagal memuat komentar:', err);
      }
    }
  };

  // Mulai Reply Komentar Tertentu
  const handleStartReply = (postId: string, commentId: string, authorName: string) => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    setReplyTargetMap(prev => ({
      ...prev,
      [postId]: { commentId, authorName }
    }));
  };

  // Batalkan Reply
  const handleCancelReply = (postId: string) => {
    setReplyTargetMap(prev => ({
      ...prev,
      [postId]: null
    }));
  };

  // Kirim Komentar atau Balasan (Reply)
  const handleSendComment = async (postId: string) => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    const text = (commentInputs[postId] || '').trim();
    if (!text) return;

    setIsSubmittingComment(true);

    const replyTarget = replyTargetMap[postId];

    const newComment: PostComment = {
      id: `comm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      postId,
      parentCommentId: replyTarget?.commentId,
      replyToAuthorName: replyTarget?.authorName,
      authorId: currentUser.id,
      author: {
        id: currentUser.id,
        name: currentUser.name,
        photoUrl: currentUser.photoUrl,
        gender: currentUser.gender,
        currentCity: currentUser.currentCity,
        age: currentUser.age,
        isPhotoVerified: currentUser.isPhotoVerified
      },
      content: text,
      createdAt: new Date().toISOString()
    };

    try {
      await dataService.createPostComment(newComment);

      setCommentsMap(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), newComment]
      }));

      // Update counter di list post
      setPosts(prev =>
        prev.map(p =>
          p.id === postId ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p
        )
      );

      // Reset input
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
      setReplyTargetMap(prev => ({ ...prev, [postId]: null }));
    } catch (err) {
      console.error('Gagal mengirim balasan:', err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'cerita': return '📖 Cerita Hidup';
      case 'keseharian': return '☕ Keseharian';
      case 'tips_kencan': return '💡 Tips & Nilai';
      case 'tanya_jawab': return '❓ Tanya Komunitas';
      default: return '💬 Cerita';
    }
  };

  const formatTimeAgo = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 1) return 'Baru saja';
      if (diffMins < 60) return `${diffMins} mnt lalu`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} jam lalu`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} hari lalu`;
    } catch {
      return 'Baru saja';
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header Banner Komunitas */}
      <div className="bg-gradient-to-r from-[#BE3A50] to-[#962638] rounded-2xl p-5 text-white shadow-sm flex items-center justify-between">
        <div>
          <span className="inline-block bg-white/20 backdrop-blur-xs text-xs font-semibold px-2.5 py-0.5 rounded-full mb-1">
            Ruang Cerita & Momen
          </span>
          <h1 className="text-xl font-bold tracking-tight">Kanal Komunitas Lajang</h1>
          <p className="text-sm text-white/85 mt-0.5">
            Berbagi cerita keseharian, sudut pandang, dan mengobrol santai secara terbuka.
          </p>
        </div>
        <button
          onClick={loadPosts}
          disabled={isLoading}
          aria-label="Segarkan postingan"
          className="p-2.5 bg-white/15 hover:bg-white/25 active:scale-95 transition-all rounded-full text-white"
          title="Segarkan feed"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Kotak Buat Cerita Baru (Composer) */}
      <div className="bg-white rounded-2xl border border-[#E8E2D8] p-4 shadow-xs">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-[#FAF7F2] shrink-0 border border-[#E8E2D8]">
            {currentUser?.photoUrl ? (
              <img
                src={currentUser.photoUrl}
                alt={currentUser.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#BE3A50] font-bold text-sm">
                {currentUser?.name?.[0] || 'CP'}
              </div>
            )}
          </div>

          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={() => setIsComposerFocused(true)}
              placeholder={
                currentUser
                  ? `Apa yang sedang kamu pikirkan hari ini, ${currentUser.name}?`
                  : 'Masuk untuk berbagi cerita dengan teman-teman lajang...'
              }
              rows={isComposerFocused || content ? 3 : 2}
              className="w-full text-sm text-[#1F1A1B] placeholder-[#6B6365] bg-transparent border-0 resize-none focus:outline-hidden focus:ring-0"
            />

            {/* Preview Foto yang diunggah */}
            {photoPreview && (
              <div className="relative mt-2 mb-3 rounded-xl overflow-hidden border border-[#E8E2D8] max-h-60 bg-[#FAF7F2]">
                <img
                  src={photoPreview}
                  alt="Preview foto cerita"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setPhotoPreview('')}
                  className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition-all"
                  aria-label="Hapus foto"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Pilihan Kategori Postingan (Saat Terbuka) */}
            {isComposerFocused && (
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[#F0EBE1] mb-3">
                {[
                  { id: 'cerita', label: '📖 Cerita' },
                  { id: 'keseharian', label: '☕ Keseharian' },
                  { id: 'tips_kencan', label: '💡 Nilai & Tips' },
                  { id: 'tanya_jawab', label: '❓ Tanya Jawab' }
                ].map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.id as any)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      category === c.id
                        ? 'bg-[#BE3A50] text-white shadow-xs'
                        : 'bg-[#FAF7F2] text-[#6B6365] hover:bg-[#F3ECE0]'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            )}

            {/* Error Notice */}
            {errorNotice && (
              <div className="flex items-center gap-1.5 text-xs text-[#BE3A50] bg-[#FBEBEE] p-2 rounded-lg mb-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorNotice}</span>
              </div>
            )}

            {/* Baris Tombol Aksi Media & Submit */}
            <div className="flex items-center justify-between pt-2 border-t border-[#F0EBE1]">
              <div className="flex items-center gap-1">
                {/* Tombol Unggah Foto */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-[#6B6365] hover:text-[#BE3A50] hover:bg-[#FAF7F2] rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium"
                  title="Lampirkan foto"
                >
                  <ImageIcon className="w-4 h-4 text-[#15803d]" />
                  <span className="hidden sm:inline">Foto</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />

                {/* Tombol Jepret Kamera Langsung */}
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="p-2 text-[#6B6365] hover:text-[#BE3A50] hover:bg-[#FAF7F2] rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium"
                  title="Ambil foto kamera"
                >
                  <Camera className="w-4 h-4 text-[#b45309]" />
                  <span className="hidden sm:inline">Kamera</span>
                </button>
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />

                <span className="text-[11px] text-[#8C8385] pl-2 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-[#15803d]" /> Anti-SARA
                </span>
              </div>

              <button
                type="button"
                onClick={handleCreatePost}
                disabled={isSubmitting || (!content.trim() && !photoPreview)}
                className="px-4 py-1.5 bg-[#BE3A50] hover:bg-[#A32F42] active:scale-95 disabled:opacity-50 text-white rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Mengirim...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Bagikan Cerita</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Feed List Postingan */}
      {isLoading ? (
        <div className="py-12 text-center space-y-3">
          <RefreshCw className="w-6 h-6 animate-spin text-[#BE3A50] mx-auto" />
          <p className="text-xs text-[#6B6365]">Memuat cerita komunitas...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E8E2D8] p-8 text-center space-y-3">
          <Sparkles className="w-8 h-8 text-[#BE3A50] mx-auto opacity-75" />
          <h2 className="text-base font-bold text-[#1F1A1B]">Belum Ada Cerita</h2>
          <p className="text-xs text-[#6B6365] max-w-sm mx-auto">
            Jadilah yang pertama menyapa komunitas! Bagikan cerita santaimu di kotak di atas.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => {
            const isCommentsOpen = activeCommentsPostId === post.id;
            const postComments = commentsMap[post.id] || [];
            const replyTarget = replyTargetMap[post.id];

            return (
              <article
                key={post.id}
                className="bg-white rounded-2xl border border-[#E8E2D8] p-4 sm:p-5 shadow-xs space-y-3 transition-shadow hover:shadow-sm"
              >
                {/* Header Penulis Postingan */}
                <div className="flex items-start justify-between gap-3">
                  <div
                    onClick={() => onViewProfile(post.author)}
                    className="flex items-center gap-3 cursor-pointer group"
                    role="button"
                    tabIndex={0}
                  >
                    <div className="w-11 h-11 rounded-full overflow-hidden bg-[#FAF7F2] border-2 border-[#15803d]/30 shrink-0 group-hover:border-[#BE3A50] transition-colors">
                      {post.author.photoUrl ? (
                        <img
                          src={post.author.photoUrl}
                          alt={post.author.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-sm text-[#BE3A50]">
                          {post.author.name[0]}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-sm text-[#1F1A1B] group-hover:text-[#BE3A50] transition-colors">
                          {post.author.name}
                        </span>
                        {post.author.isPhotoVerified && (
                          <span className="inline-flex items-center gap-0.5 bg-[#DCFCE7] text-[#15803d] text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                            <ShieldCheck className="w-2.5 h-2.5" /> Lajang
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#6B6365]">
                        {post.author.currentCity} • {post.author.age} thn • {post.author.mbti} •{' '}
                        <span className="text-[#8C8385]">{formatTimeAgo(post.createdAt)}</span>
                      </p>
                    </div>
                  </div>

                  {/* Tombol Cepat Ajak Kenalan */}
                  {currentUser?.id !== post.authorId && (
                    <button
                      type="button"
                      onClick={() => onViewProfile(post.author)}
                      className="px-3 py-1 bg-[#FBEBEE] hover:bg-[#F3D5DB] text-[#BE3A50] rounded-full text-xs font-semibold flex items-center gap-1 transition-all shrink-0"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Kenalan</span>
                    </button>
                  )}
                </div>

                {/* Badge Kategori */}
                <div className="pt-1">
                  <span className="inline-block bg-[#FAF7F2] text-[#6B6365] text-[11px] font-medium px-2.5 py-0.5 rounded-md border border-[#E8E2D8]">
                    {getCategoryLabel(post.category)}
                  </span>
                </div>

                {/* Konten Teks Cerita */}
                <p className="text-sm text-[#1F1A1B] leading-relaxed whitespace-pre-line">
                  {post.content}
                </p>

                {/* Foto Lampiran Jika Ada */}
                {post.photoUrl && (
                  <div className="rounded-xl overflow-hidden border border-[#E8E2D8] bg-[#FAF7F2] max-h-96">
                    <img
                      src={post.photoUrl}
                      alt="Foto cerita"
                      className="w-full h-full object-cover max-h-96"
                    />
                  </div>
                )}

                {/* Baris Tombol Interaksi (Like, Komentar, Share) */}
                <div className="flex items-center justify-between pt-2 border-t border-[#F0EBE1] text-xs text-[#6B6365]">
                  <div className="flex items-center gap-4">
                    {/* Tombol Like */}
                    <button
                      type="button"
                      onClick={() => handleToggleLike(post)}
                      className={`flex items-center gap-1.5 transition-colors font-medium ${
                        post.hasLiked
                          ? 'text-[#BE3A50] font-semibold'
                          : 'hover:text-[#BE3A50]'
                      }`}
                    >
                      <Heart
                        className={`w-4 h-4 transition-transform active:scale-125 ${
                          post.hasLiked ? 'fill-[#BE3A50] text-[#BE3A50]' : ''
                        }`}
                      />
                      <span>{post.likesCount || 0} Suka</span>
                    </button>

                    {/* Tombol Komentar & Reply */}
                    <button
                      type="button"
                      onClick={() => handleToggleComments(post.id)}
                      className={`flex items-center gap-1.5 transition-colors font-medium ${
                        isCommentsOpen ? 'text-[#BE3A50]' : 'hover:text-[#BE3A50]'
                      }`}
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{post.commentsCount || 0} Balasan</span>
                    </button>
                  </div>

                  {/* Tombol Salin Tautan */}
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof navigator !== 'undefined' && navigator.clipboard) {
                        navigator.clipboard.writeText(window.location.href);
                        alert('Tautan postingan berhasil disalin!');
                      }
                    }}
                    className="hover:text-[#1F1A1B] transition-colors p-1"
                    title="Bagikan"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Kolom Thread Komentar & Balasan (Saat Terbuka) */}
                {isCommentsOpen && (
                  <div className="pt-3 border-t border-[#F0EBE1] space-y-3 bg-[#FAF7F2]/50 p-3 rounded-xl mt-2">
                    {/* Daftar Balasan Sebelumnya */}
                    {postComments.length === 0 ? (
                      <p className="text-xs text-[#8C8385] text-center py-2">
                        Belum ada balasan. Jadilah yang pertama menyapa dan membalas cerita ini!
                      </p>
                    ) : (
                      <div className="space-y-2.5">
                        {postComments.map((comment) => {
                          const isReply = !!comment.parentCommentId;

                          return (
                            <div
                              key={comment.id}
                              className={`flex items-start gap-2.5 ${
                                isReply ? 'ml-6 sm:ml-8 pl-2.5 border-l-2 border-[#BE3A50]/30' : ''
                              }`}
                            >
                              <div
                                onClick={() => onViewProfile(comment.author)}
                                className="w-7 h-7 rounded-full overflow-hidden bg-white border border-[#E8E2D8] shrink-0 cursor-pointer"
                              >
                                {comment.author.photoUrl ? (
                                  <img
                                    src={comment.author.photoUrl}
                                    alt={comment.author.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center font-bold text-[10px] text-[#BE3A50]">
                                    {comment.author.name[0]}
                                  </div>
                                )}
                              </div>

                              <div className="flex-1 bg-white p-2.5 rounded-xl border border-[#E8E2D8] shadow-2xs">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span
                                      onClick={() => onViewProfile(comment.author)}
                                      className="font-semibold text-xs text-[#1F1A1B] cursor-pointer hover:text-[#BE3A50]"
                                    >
                                      {comment.author.name}
                                    </span>
                                    {comment.author.isPhotoVerified && (
                                      <ShieldCheck className="w-3 h-3 text-[#15803d]" />
                                    )}
                                    {comment.replyToAuthorName && (
                                      <span className="text-[10px] text-[#BE3A50] bg-[#FBEBEE] px-1.5 py-0.2 rounded-full font-medium">
                                        membalas @{comment.replyToAuthorName}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-[#8C8385]">
                                    {formatTimeAgo(comment.createdAt)}
                                  </span>
                                </div>

                                <p className="text-xs text-[#1F1A1B] leading-relaxed">
                                  {comment.content}
                                </p>

                                {/* Tombol Balas (Reply to this specific comment) */}
                                <div className="flex items-center justify-end pt-1">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleStartReply(post.id, comment.id, comment.author.name)
                                    }
                                    className="text-[11px] text-[#BE3A50] hover:underline font-medium flex items-center gap-0.5"
                                  >
                                    <CornerDownRight className="w-3 h-3" />
                                    <span>Balas</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Target Reply Indicator */}
                    {replyTarget && (
                      <div className="flex items-center justify-between bg-[#FBEBEE] text-[#BE3A50] px-3 py-1.5 rounded-lg text-xs font-medium">
                        <span className="flex items-center gap-1">
                          <CornerDownRight className="w-3.5 h-3.5" />
                          Membalas pesan <strong>@{replyTarget.authorName}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCancelReply(post.id)}
                          className="hover:bg-white/50 p-0.5 rounded-sm"
                          aria-label="Batalkan balasan"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Input Kolom Balasan Baru */}
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={commentInputs[post.id] || ''}
                        onChange={(e) =>
                          setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendComment(post.id);
                          }
                        }}
                        placeholder={
                          replyTarget
                            ? `Tulis balasan untuk @${replyTarget.authorName}...`
                            : 'Tulis balasan atau sapaan...'
                        }
                        className="flex-1 text-xs text-[#1F1A1B] bg-white border border-[#E8E2D8] rounded-full px-3.5 py-2 focus:outline-hidden focus:border-[#BE3A50]"
                      />
                      <button
                        type="button"
                        onClick={() => handleSendComment(post.id)}
                        disabled={isSubmittingComment || !(commentInputs[post.id] || '').trim()}
                        className="p-2 bg-[#BE3A50] hover:bg-[#A32F42] active:scale-95 disabled:opacity-50 text-white rounded-full transition-all shrink-0"
                        title="Kirim balasan"
                        aria-label="Kirim balasan"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
