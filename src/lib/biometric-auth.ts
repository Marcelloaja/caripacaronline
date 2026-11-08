/**
 * Modul Autentikasi Biometrik Web (WebAuthn / Passkeys)
 * Mendukung Sensor Sidik Jari (Fingerprint), Touch ID, Face ID, & Windows Hello
 */

const BIOMETRIC_CRED_KEY = 'cpo_biometric_credential_v1';

export interface BiometricRecord {
  credentialId: string;
  userId: string;
  email: string;
  registeredAt: string;
}

/**
 * Cek apakah perangkat keras mendukung sensor biometrik platform (Sidik Jari / Face ID)
 */
export async function isBiometricsAvailable(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!window.PublicKeyCredential) return false;

  try {
    const isAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return Boolean(isAvailable);
  } catch (err) {
    console.warn('Gagal mengecek sensor biometrik:', err);
    return false;
  }
}

/**
 * Cek apakah ada akun yang sudah didaftarkan biometriknya di perangkat ini
 */
export function getSavedBiometricAccount(): BiometricRecord | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(BIOMETRIC_CRED_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Hapus pendaftaran biometrik di perangkat ini
 */
export function removeBiometricAccount(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(BIOMETRIC_CRED_KEY);
  }
}

/**
 * Daftarkan sidik jari / biometrik pengguna saat ini
 */
export async function registerBiometrics(
  userId: string,
  email: string
): Promise<{ success: boolean; error?: string }> {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Tidak dapat dijalankan di sisi server' };
  }

  const available = await isBiometricsAvailable();
  if (!available) {
    return {
      success: false,
      error: 'Perangkat ini tidak memiliki sensor biometrik (sidik jari / Face ID) yang aktif.'
    };
  }

  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const userIdBytes = new TextEncoder().encode(userId);

    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: {
          name: 'CariPacar Online',
          id: window.location.hostname
        },
        user: {
          id: userIdBytes,
          name: email,
          displayName: email.split('@')[0] || 'Pengguna CariPacar'
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 }, // ES256
          { type: 'public-key', alg: -257 } // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred'
        },
        timeout: 60000,
        attestation: 'none'
      }
    })) as PublicKeyCredential;

    if (!credential) {
      return { success: false, error: 'Pendaftaran sidik jari dibatalkan.' };
    }

    // Simpan id kredensial yang berhasil dibuat
    const credIdBase64 = bufferToBase64(credential.rawId);
    const record: BiometricRecord = {
      credentialId: credIdBase64,
      userId,
      email,
      registeredAt: new Date().toISOString()
    };

    localStorage.setItem(BIOMETRIC_CRED_KEY, JSON.stringify(record));
    return { success: true };
  } catch (err: any) {
    console.error('Error saat pendaftaran biometrik:', err);
    if (err.name === 'NotAllowedError') {
      return { success: false, error: 'Pemindaian sidik jari dibatalkan oleh pengguna.' };
    }
    return {
      success: false,
      error: err.message || 'Gagal memproses pendaftaran sidik jari pada perangkat ini.'
    };
  }
}

/**
 * Verifikasi sidik jari / biometrik untuk login cepat
 */
export async function authenticateWithBiometrics(): Promise<{
  success: boolean;
  userId?: string;
  email?: string;
  error?: string;
}> {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Tidak dapat dijalankan di server' };
  }

  const savedRecord = getSavedBiometricAccount();
  if (!savedRecord) {
    return {
      success: false,
      error: 'Belum ada sidik jari yang terdaftar di perangkat ini. Silakan masuk dengan email & kata sandi terlebih dahulu.'
    };
  }

  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const credentialIdBuffer = base64ToBuffer(savedRecord.credentialId);

    const assertion = (await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: [
          {
            type: 'public-key',
            id: credentialIdBuffer,
            transports: ['internal']
          }
        ],
        userVerification: 'required',
        timeout: 60000
      }
    })) as PublicKeyCredential;

    if (!assertion) {
      return { success: false, error: 'Pemindaian sidik jari dibatalkan.' };
    }

    return {
      success: true,
      userId: savedRecord.userId,
      email: savedRecord.email
    };
  } catch (err: any) {
    console.error('Error autentikasi biometrik:', err);
    if (err.name === 'NotAllowedError') {
      return { success: false, error: 'Pemindaian sidik jari dibatalkan atau tidak cocok.' };
    }
    return {
      success: false,
      error: err.message || 'Gagal memverifikasi sidik jari pada perangkat ini.'
    };
  }
}

// Helper ArrayBuffer <-> Base64
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
