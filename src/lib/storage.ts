import { UserProfile, LoveInteraction, Match, ChatMessage, AppNotification, CommunityPost, PostComment } from '@/types';

// STORAGE KEYS
const KEYS = {
  USER: 'cpo_current_user',
  CANDIDATES: 'cpo_candidates',
  INTERACTIONS: 'cpo_interactions',
  MATCHES: 'cpo_matches',
  MESSAGES: 'cpo_messages',
  NOTIFICATIONS: 'cpo_notifications',
  COMMUNITY_POSTS: 'cpo_community_posts',
  COMMUNITY_COMMENTS: 'cpo_community_comments',
  COMMUNITY_LIKES: 'cpo_community_likes',
  APP_VERSION: 'cpo_app_version'
};

const CURRENT_VERSION = 'v2_launch_clean';

// Bersihkan data dummy lama otomatis saat versi baru dibuka
if (typeof window !== 'undefined') {
  const savedVersion = localStorage.getItem(KEYS.APP_VERSION);
  if (savedVersion !== CURRENT_VERSION) {
    localStorage.removeItem(KEYS.USER);
    localStorage.removeItem(KEYS.CANDIDATES);
    localStorage.removeItem(KEYS.INTERACTIONS);
    localStorage.removeItem(KEYS.MATCHES);
    localStorage.removeItem(KEYS.NOTIFICATIONS);
    // Hapus juga pesan chat lama
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(KEYS.MESSAGES)) {
        localStorage.removeItem(key);
      }
    }
    localStorage.setItem(KEYS.APP_VERSION, CURRENT_VERSION);
  }
}

// Tidak ada data dummy (Murni Akun Asli Baru)
export const INITIAL_CANDIDATES: UserProfile[] = [];

export function getCurrentUser(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(KEYS.USER);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.name || !parsed.hasSignedPledge) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveCurrentUser(profile: UserProfile): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEYS.USER, JSON.stringify(profile));

  // Tambahkan juga ke daftar kandidat agar jika ada multi-user lokal tersimpan
  saveCandidate(profile);
}

export function getAllCandidates(): UserProfile[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(KEYS.CANDIDATES);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveCandidate(candidate: UserProfile): void {
  if (typeof window === 'undefined') return;
  const list = getAllCandidates();
  const index = list.findIndex(c => c.id === candidate.id);
  if (index >= 0) {
    list[index] = candidate;
  } else {
    list.push(candidate);
  }
  localStorage.setItem(KEYS.CANDIDATES, JSON.stringify(list));
}

export function getInteractions(): LoveInteraction[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(KEYS.INTERACTIONS);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function recordInteraction(interaction: LoveInteraction): void {
  if (typeof window === 'undefined') return;
  const list = getInteractions();
  list.push(interaction);
  localStorage.setItem(KEYS.INTERACTIONS, JSON.stringify(list));

  // Buat notifikasi jika ditujukan ke user saat ini
  const currentUser = getCurrentUser();
  if (currentUser && interaction.toUserId === currentUser.id) {
    const candidates = getAllCandidates();
    const sender = candidates.find(c => c.id === interaction.fromUserId);
    if (sender) {
      addNotification({
        id: `notif_${Date.now()}`,
        userId: currentUser.id,
        fromUser: {
          id: sender.id,
          name: sender.name,
          photoUrl: sender.photoUrl,
          city: sender.currentCity
        },
        type: interaction.type,
        note: interaction.note,
        timestamp: interaction.timestamp,
        isRead: false
      });
    }
  }
}

export function getMatches(): Match[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(KEYS.MATCHES);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function createMatch(userAId: string, userBId: string): Match {
  const matches = getMatches();
  const existing = matches.find(
    m => (m.userAId === userAId && m.userBId === userBId) || (m.userAId === userBId && m.userBId === userAId)
  );
  if (existing) return existing;

  const newMatch: Match = {
    id: `match_${Date.now()}`,
    userAId,
    userBId,
    matchedAt: new Date().toISOString()
  };

  matches.unshift(newMatch);
  if (typeof window !== 'undefined') {
    localStorage.setItem(KEYS.MATCHES, JSON.stringify(matches));
  }
  return newMatch;
}

export function getMessages(matchId: string): ChatMessage[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(`${KEYS.MESSAGES}_${matchId}`);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveMessage(message: ChatMessage): void {
  if (typeof window === 'undefined') return;
  const list = getMessages(message.matchId);
  list.push(message);
  localStorage.setItem(`${KEYS.MESSAGES}_${message.matchId}`, JSON.stringify(list));

  // Update pesan terakhir di match
  const matches = getMatches();
  const match = matches.find(m => m.id === message.matchId);
  if (match) {
    match.lastMessage = message.text;
    match.lastMessageTime = message.timestamp;
    localStorage.setItem(KEYS.MATCHES, JSON.stringify(matches));
  }
}

export function getNotifications(): AppNotification[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(KEYS.NOTIFICATIONS);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function addNotification(notif: AppNotification): void {
  if (typeof window === 'undefined') return;
  const list = getNotifications();
  list.unshift(notif);
  localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(list));
}

export function markNotificationsAsRead(): void {
  if (typeof window === 'undefined') return;
  const list = getNotifications().map(n => ({ ...n, isRead: true }));
  localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(list));
}

export function clearUserData(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEYS.USER);
  localStorage.removeItem(KEYS.INTERACTIONS);
  localStorage.removeItem(KEYS.MATCHES);
  localStorage.removeItem(KEYS.NOTIFICATIONS);
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key && key.startsWith(KEYS.MESSAGES)) {
      localStorage.removeItem(key);
    }
  }
}

/**
 * 7. RUANG CERITA / KOMUNITAS (POSTS, REPLIES, LIKES)
 */

export const INITIAL_COMMUNITY_POSTS: CommunityPost[] = [
  {
    id: 'post_1',
    authorId: 'user_siti',
    author: {
      id: 'user_siti',
      name: 'Siti Nurhaliza',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      gender: 'wanita',
      currentCity: 'Bandung',
      age: 26,
      mbti: 'INFJ',
      isPhotoVerified: true
    },
    content: 'Menghabiskan Sabtu sore di kedai kopi Braga sambil baca buku. Menurut kalian, kencan pertama yang ideal itu ngobrol santai sambil ngopi atau jalan-jalan santai di galeri seni? Pengen tahu pandangan teman-teman di sini 😊☕',
    photoUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80',
    category: 'keseharian',
    likesCount: 14,
    commentsCount: 2,
    hasLiked: false,
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
  },
  {
    id: 'post_2',
    authorId: 'user_budi',
    author: {
      id: 'user_budi',
      name: 'Budi Santoso',
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      gender: 'pria',
      currentCity: 'Jakarta',
      age: 28,
      mbti: 'INTJ',
      isPhotoVerified: true
    },
    content: 'Prinsip saya dalam mencari pasangan sederhana: saling menghargai komitmen, terbuka dari awal tentang target masa depan, dan mau bertumbuh bareng. Senang ada wadah yang mengedepankan niat serius seperti ini. Semangat untuk kita semua yang sedang berikhtiar! 💪🌱',
    category: 'cerita',
    likesCount: 28,
    commentsCount: 1,
    hasLiked: true,
    createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString()
  }
];

export const INITIAL_COMMUNITY_COMMENTS: { [postId: string]: PostComment[] } = {
  post_1: [
    {
      id: 'comm_1_1',
      postId: 'post_1',
      authorId: 'user_budi',
      author: {
        id: 'user_budi',
        name: 'Budi Santoso',
        photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
        gender: 'pria',
        currentCity: 'Jakarta',
        age: 28,
        isPhotoVerified: true
      },
      content: 'Ngobrol santai di kedai kopi menurut saya yang paling pas, karena suasananya tenang dan kita bisa benar-benar mendengarkan cerita satu sama lain tanpa terburu-buru.',
      createdAt: new Date(Date.now() - 100 * 60 * 1000).toISOString()
    },
    {
      id: 'comm_1_2',
      postId: 'post_1',
      parentCommentId: 'comm_1_1',
      replyToAuthorName: 'Budi Santoso',
      authorId: 'user_siti',
      author: {
        id: 'user_siti',
        name: 'Siti Nurhaliza',
        photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        gender: 'wanita',
        currentCity: 'Bandung',
        age: 26,
        isPhotoVerified: true
      },
      content: 'Setuju banget Mas Budi! Yang paling penting komunikasinya dua arah dan terasa nyaman.',
      createdAt: new Date(Date.now() - 80 * 60 * 1000).toISOString()
    }
  ],
  post_2: [
    {
      id: 'comm_2_1',
      postId: 'post_2',
      authorId: 'user_siti',
      author: {
        id: 'user_siti',
        name: 'Siti Nurhaliza',
        photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        gender: 'wanita',
        currentCity: 'Bandung',
        age: 26,
        isPhotoVerified: true
      },
      content: 'Keren sekali prinsipnya. Kejujuran di awal memang kunci agar tidak membuang waktu satu sama lain.',
      createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString()
    }
  ]
};

export function getLocalCommunityPosts(): CommunityPost[] {
  if (typeof window === 'undefined') return INITIAL_COMMUNITY_POSTS;
  const raw = localStorage.getItem(KEYS.COMMUNITY_POSTS);
  if (!raw) {
    localStorage.setItem(KEYS.COMMUNITY_POSTS, JSON.stringify(INITIAL_COMMUNITY_POSTS));
    return INITIAL_COMMUNITY_POSTS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return INITIAL_COMMUNITY_POSTS;
  }
}

export function saveLocalCommunityPost(post: CommunityPost): void {
  if (typeof window === 'undefined') return;
  const list = getLocalCommunityPosts();
  list.unshift(post);
  localStorage.setItem(KEYS.COMMUNITY_POSTS, JSON.stringify(list));
}

export function deleteLocalCommunityPost(postId: string): void {
  if (typeof window === 'undefined') return;
  const list = getLocalCommunityPosts().filter(p => p.id !== postId);
  localStorage.setItem(KEYS.COMMUNITY_POSTS, JSON.stringify(list));
}

export function getLocalPostComments(postId: string): PostComment[] {
  if (typeof window === 'undefined') return INITIAL_COMMUNITY_COMMENTS[postId] || [];
  const raw = localStorage.getItem(`${KEYS.COMMUNITY_COMMENTS}_${postId}`);
  if (!raw) {
    const initial = INITIAL_COMMUNITY_COMMENTS[postId] || [];
    if (initial.length > 0) {
      localStorage.setItem(`${KEYS.COMMUNITY_COMMENTS}_${postId}`, JSON.stringify(initial));
    }
    return initial;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return INITIAL_COMMUNITY_COMMENTS[postId] || [];
  }
}

export function saveLocalPostComment(comment: PostComment): void {
  if (typeof window === 'undefined') return;
  const list = getLocalPostComments(comment.postId);
  list.push(comment);
  localStorage.setItem(`${KEYS.COMMUNITY_COMMENTS}_${comment.postId}`, JSON.stringify(list));

  // Update comments count di post
  const posts = getLocalCommunityPosts();
  const post = posts.find(p => p.id === comment.postId);
  if (post) {
    post.commentsCount = (post.commentsCount || 0) + 1;
    localStorage.setItem(KEYS.COMMUNITY_POSTS, JSON.stringify(posts));
  }
}

export function toggleLocalPostLike(postId: string, userId: string): { isLiked: boolean; count: number } {
  if (typeof window === 'undefined') return { isLiked: false, count: 0 };
  const likesKey = `${KEYS.COMMUNITY_LIKES}_${userId}`;
  let userLikes: string[] = [];
  try {
    const raw = localStorage.getItem(likesKey);
    if (raw) userLikes = JSON.parse(raw);
  } catch {}

  const isLiked = userLikes.includes(postId);
  if (isLiked) {
    userLikes = userLikes.filter(id => id !== postId);
  } else {
    userLikes.push(postId);
  }
  localStorage.setItem(likesKey, JSON.stringify(userLikes));

  // Update count di post
  const posts = getLocalCommunityPosts();
  const post = posts.find(p => p.id === postId);
  let count = 0;
  if (post) {
    post.likesCount = Math.max(0, (post.likesCount || 0) + (isLiked ? -1 : 1));
    post.hasLiked = !isLiked;
    count = post.likesCount;
    localStorage.setItem(KEYS.COMMUNITY_POSTS, JSON.stringify(posts));
  }
  return { isLiked: !isLiked, count };
}

export function resetDemoData(): void {
  if (typeof window === 'undefined') return;
  localStorage.clear();
  window.location.reload();
}
