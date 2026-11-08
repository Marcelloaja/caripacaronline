import { UserProfile, LoveInteraction, Match, ChatMessage, AppNotification } from '@/types';
import { supabase, isSupabaseConfigured } from './supabase';
import * as localStore from './storage';

/**
 * 1. PROFIL PENGGUNA (PROFILES)
 */

export async function fetchProfileById(userId: string): Promise<UserProfile | null> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (data && !error) {
        const mapped = mapFromDbProfile(data);
        localStore.saveCurrentUser(mapped);
        return mapped;
      }
    } catch {
      // ignore
    }
  }

  const local = localStore.getCurrentUser();
  if (local && local.id === userId) return local;
  return null;
}

export async function fetchCurrentUser(): Promise<UserProfile | null> {
  // Cek sesi Supabase aktif terlebih dahulu
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user?.id) {
        const profile = await fetchProfileById(data.session.user.id);
        if (profile) return profile;
      }
    } catch {
      // Fallback
    }
  }

  // Fallback ke penyimpanan browser lokal
  const localUser = localStore.getCurrentUser();
  if (!localUser) return null;

  if (isSupabaseConfigured() && supabase) {
    try {
      const profile = await fetchProfileById(localUser.id);
      if (profile) return profile;
    } catch {
      // Fallback ke local storage
    }
  }

  return localUser;
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  // Simpan lokal selalu
  localStore.saveCurrentUser(profile);

  if (isSupabaseConfigured() && supabase) {
    try {
      const dbPayload = mapToDbProfile(profile);
      await supabase.from('profiles').upsert(dbPayload);
    } catch (err) {
      console.error('Gagal menyimpan profil ke Supabase:', err);
    }
  }
}

export async function fetchCandidates(currentUser: UserProfile): Promise<UserProfile[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', currentUser.id)
        .eq('gender', currentUser.interestedIn);

      if (data && !error && data.length > 0) {
        return data.map(mapFromDbProfile);
      }
    } catch (err) {
      console.error('Gagal mengambil kandidat dari Supabase:', err);
    }
  }

  // Fallback lokal
  return localStore.getAllCandidates().filter(c => c.id !== currentUser.id && c.gender === currentUser.interestedIn);
}

/**
 * 2. INTERAKSI SUKA (INTERACTIONS: LOVE & LOVE NOTE)
 */

export async function sendInteraction(interaction: LoveInteraction): Promise<void> {
  localStore.recordInteraction(interaction);

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('interactions').insert({
        id: interaction.id,
        from_user_id: interaction.fromUserId,
        to_user_id: interaction.toUserId,
        type: interaction.type,
        note: interaction.note || null,
        created_at: interaction.timestamp
      });
    } catch (err) {
      console.error('Gagal mengirim interaksi ke Supabase:', err);
    }
  }
}

export async function fetchInteractions(userId: string): Promise<LoveInteraction[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('interactions')
        .select('*')
        .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`);

      if (data && !error) {
        return data.map(item => ({
          id: item.id,
          fromUserId: item.from_user_id,
          toUserId: item.to_user_id,
          type: item.type,
          note: item.note,
          timestamp: item.created_at
        }));
      }
    } catch (err) {
      console.error('Gagal mengambil interaksi dari Supabase:', err);
    }
  }

  return localStore.getInteractions();
}

/**
 * 3. PASANGAN COCOK (MATCHES)
 */

export async function createNewMatch(userAId: string, userBId: string): Promise<Match> {
  const match = localStore.createMatch(userAId, userBId);

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('matches').upsert({
        id: match.id,
        user_a_id: match.userAId,
        user_b_id: match.userBId,
        last_message: match.lastMessage || null,
        last_message_time: match.lastMessageTime || null,
        created_at: match.matchedAt
      });
    } catch (err) {
      console.error('Gagal menyimpan match ke Supabase:', err);
    }
  }

  return match;
}

export async function fetchMatches(userId: string): Promise<Match[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (data && !error) {
        return data.map(m => ({
          id: m.id,
          userAId: m.user_a_id,
          userBId: m.user_b_id,
          lastMessage: m.last_message,
          lastMessageTime: m.last_message_time,
          matchedAt: m.created_at
        }));
      }
    } catch (err) {
      console.error('Gagal mengambil matches dari Supabase:', err);
    }
  }

  return localStore.getMatches();
}

/**
 * 4. PESAN CHAT (MESSAGES) & REALTIME
 */

export async function fetchMessages(matchId: string): Promise<ChatMessage[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true });

      if (data && !error) {
        return data.map(m => ({
          id: m.id,
          matchId: m.match_id,
          senderId: m.sender_id,
          text: m.text,
          status: m.status,
          timestamp: m.created_at
        }));
      }
    } catch (err) {
      console.error('Gagal mengambil pesan dari Supabase:', err);
    }
  }

  return localStore.getMessages(matchId);
}

export async function sendMessage(msg: ChatMessage): Promise<void> {
  localStore.saveMessage(msg);

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('messages').insert({
        id: msg.id,
        match_id: msg.matchId,
        sender_id: msg.senderId,
        text: msg.text,
        status: msg.status,
        created_at: msg.timestamp
      });

      // Update match
      await supabase.from('matches').update({
        last_message: msg.text,
        last_message_time: msg.timestamp
      }).eq('id', msg.matchId);
    } catch (err) {
      console.error('Gagal mengirim pesan ke Supabase:', err);
    }
  }
}

/**
 * Supabase Realtime Subscription untuk Pesan Baru
 */
export function subscribeToMatchMessages(
  matchId: string,
  onNewMessage: (msg: ChatMessage) => void
): () => void {
  if (!isSupabaseConfigured() || !supabase) return () => {};
  const client = supabase;

  const channel = client
    .channel(`messages:${matchId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `match_id=eq.${matchId}`
      },
      (payload) => {
        const m = payload.new;
        onNewMessage({
          id: m.id,
          matchId: m.match_id,
          senderId: m.sender_id,
          text: m.text,
          status: m.status,
          timestamp: m.created_at
        });
      }
    )
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
}

/**
 * 5. LAPORAN PELANGGARAN (REPORTS)
 */

export async function submitReport(
  reporterId: string,
  reportedUserId: string,
  reason: string,
  details: string
): Promise<void> {
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('reports').insert({
        id: `rep_${Date.now()}`,
        reporter_id: reporterId,
        reported_user_id: reportedUserId,
        reason,
        details
      });
    } catch (err) {
      console.error('Gagal menyimpan laporan ke Supabase:', err);
    }
  }
}

/**
 * 6. HAPUS AKUN PERMANEN (DELETE ACCOUNT)
 */
export async function deleteAccount(userId: string): Promise<void> {
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('profiles').delete().eq('id', userId);
    } catch (err) {
      console.error('Gagal menghapus profil dari Supabase:', err);
    }
  }

  localStore.clearUserData();
}

// Helper Mappings
function mapFromDbProfile(d: any): UserProfile {
  return {
    id: d.id,
    name: d.name,
    gender: d.gender,
    interestedIn: d.interested_in,
    originCity: d.origin_city,
    currentCity: d.current_city,
    country: d.country || 'Indonesia',
    birthYear: d.birth_year,
    age: d.age,
    heightCm: d.height_cm || 165,
    mbti: d.mbti,
    ethnicity: d.ethnicity || 'Tionghoa (Chindo)',
    bio: d.bio || '',
    aiSummary: d.ai_summary || '',
    skills: d.skills || [],
    hobbies: d.hobbies || [],
    photoUrl: d.photo_url || '',
    isPhotoVerified: d.is_photo_verified ?? true,
    hasSignedPledge: d.has_signed_pledge ?? true,
    targetMarriage: d.target_marriage || '1_tahun',
    createdAt: d.created_at
  };
}

function mapToDbProfile(p: UserProfile): any {
  return {
    id: p.id,
    name: p.name,
    gender: p.gender,
    interested_in: p.interestedIn,
    origin_city: p.originCity,
    current_city: p.currentCity,
    country: p.country,
    birth_year: p.birthYear,
    age: p.age,
    height_cm: p.heightCm,
    mbti: p.mbti,
    ethnicity: p.ethnicity,
    bio: p.bio,
    ai_summary: p.aiSummary,
    skills: p.skills,
    hobbies: p.hobbies,
    photo_url: p.photoUrl,
    is_photo_verified: p.isPhotoVerified,
    has_signed_pledge: p.hasSignedPledge,
    target_marriage: p.targetMarriage,
    created_at: p.createdAt
  };
}

