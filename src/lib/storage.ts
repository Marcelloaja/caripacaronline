import { UserProfile, LoveInteraction, Match, ChatMessage, AppNotification } from '@/types';

// STORAGE KEYS
const KEYS = {
  USER: 'cpo_current_user',
  CANDIDATES: 'cpo_candidates',
  INTERACTIONS: 'cpo_interactions',
  MATCHES: 'cpo_matches',
  MESSAGES: 'cpo_messages',
  NOTIFICATIONS: 'cpo_notifications',
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

export function resetDemoData(): void {
  if (typeof window === 'undefined') return;
  localStorage.clear();
  window.location.reload();
}
