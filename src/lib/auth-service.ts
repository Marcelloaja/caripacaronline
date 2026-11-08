import { supabase, isSupabaseConfigured } from './supabase';
import { UserProfile } from '@/types';
import * as localStore from './storage';

export interface AuthResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
  };
  error?: string;
  isNewUser?: boolean;
}

/**
 * Mendaftar akun baru dengan Email & Password
 */
export async function signUpWithEmail(email: string, password: string): Promise<AuthResult> {
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, error: 'Format alamat email tidak valid.' };
  }

  if (password.length < 6) {
    return { success: false, error: 'Kata sandi minimal 6 karakter demi keamanan akun Anda.' };
  }

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password
      });

      if (error) {
        if (error.message.includes('already registered') || error.message.includes('User already registered')) {
          return { success: false, error: 'Email ini sudah terdaftar. Silakan masuk menggunakan kata sandi Anda.' };
        }
        return { success: false, error: error.message };
      }

      if (data.user) {
        return {
          success: true,
          user: {
            id: data.user.id,
            email: data.user.email || cleanEmail
          },
          isNewUser: true
        };
      }
    } catch (err: any) {
      console.error('Error saat signUp di Supabase:', err);
      return { success: false, error: err.message || 'Terjadi gangguan saat mendaftar.' };
    }
  }

  // Fallback lokal jika offline / Supabase tidak aktif
  const localId = `user_${Date.now()}`;
  return {
    success: true,
    user: {
      id: localId,
      email: cleanEmail
    },
    isNewUser: true
  };
}

/**
 * Masuk dengan Email & Password
 */
export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail || !password) {
    return { success: false, error: 'Harap isi email dan kata sandi Anda.' };
  }

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          return { success: false, error: 'Email atau kata sandi tidak cocok. Harap periksa kembali.' };
        }
        return { success: false, error: error.message };
      }

      if (data.user) {
        return {
          success: true,
          user: {
            id: data.user.id,
            email: data.user.email || cleanEmail
          },
          isNewUser: false
        };
      }
    } catch (err: any) {
      console.error('Error saat signIn di Supabase:', err);
      return { success: false, error: err.message || 'Gagal masuk. Periksa koneksi Anda.' };
    }
  }

  // Fallback mode lokal
  const localUser = localStore.getCurrentUser();
  if (localUser) {
    return {
      success: true,
      user: {
        id: localUser.id,
        email: cleanEmail
      },
      isNewUser: false
    };
  }

  return {
    success: true,
    user: {
      id: `user_${Date.now()}`,
      email: cleanEmail
    },
    isNewUser: true
  };
}

/**
 * Keluar (Logout)
 */
export async function signOutUser(): Promise<void> {
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error sign out Supabase:', err);
    }
  }

  if (typeof window !== 'undefined') {
    localStorage.removeItem('cpo_current_user');
  }
}

/**
 * Cek sesi aktif yang tersimpan
 */
export async function getActiveSessionUser(): Promise<{ id: string; email: string } | null> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        return {
          id: data.session.user.id,
          email: data.session.user.email || ''
        };
      }
    } catch {
      // ignore
    }
  }

  const localUser = localStore.getCurrentUser();
  if (localUser) {
    return {
      id: localUser.id,
      email: (localUser as any).email || ''
    };
  }

  return null;
}

