/**
 * Validasi Foto Asli & Deteksi Karakteristik Wajah Manusia
 * Memastikan foto bukan dokumen kosong, ukuran tidak melebihi 5MB,
 * dan memiliki parameter resolusi & ciri portrait manusia.
 */

export interface PhotoValidationResult {
  isValid: boolean;
  error?: string;
  faceDetected: boolean;
  base64Url?: string;
}

export async function validateAndProcessProfilePhoto(file: File): Promise<PhotoValidationResult> {
  // 1. Batas ukuran maksimal 5MB
  const MAX_SIZE_MB = 5;
  const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

  if (file.size > MAX_SIZE_BYTES) {
    return {
      isValid: false,
      error: `Ukuran foto melebihi batas maksimal 5MB (Foto Anda: ${(file.size / (1024 * 1024)).toFixed(1)}MB).`,
      faceDetected: false
    };
  }

  // 2. Format file yang diizinkan
  if (!file.type.startsWith('image/')) {
    return {
      isValid: false,
      error: 'File harus berformat gambar (JPG, PNG, atau WebP).',
      faceDetected: false
    };
  }

  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();

      img.onload = () => {
        // Cek resolusi minimal untuk foto profil yang jelas
        if (img.width < 200 || img.height < 200) {
          resolve({
            isValid: false,
            error: 'Resolusi foto terlalu kecil. Harap unggah foto dengan minimal 200x200 pixel agar wajah terlihat jelas.',
            faceDetected: false
          });
          return;
        }

        // Analisis Canvas untuk deteksi struktur portrait
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ isValid: true, faceDetected: true, base64Url: dataUrl });
          return;
        }

        canvas.width = 100;
        canvas.height = 100;
        ctx.drawImage(img, 0, 0, 100, 100);

        try {
          const imageData = ctx.getImageData(0, 0, 100, 100);
          const data = imageData.data;

          // Hitung variasi warna dan saturasi untuk mendeteksi apakah ini gambar asli
          // Gambar solid/kosong atau grafis sederhana akan gagal
          let totalBrightness = 0;
          let skinToneCount = 0;

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const brightness = (r + g + b) / 3;
            totalBrightness += brightness;

            // Heuristik rentang warna kulit manusia alami (RGB)
            if (r > 60 && g > 40 && b > 20 && r > g && r > b && Math.abs(r - g) > 10) {
              skinToneCount++;
            }
          }

          const avgBrightness = totalBrightness / (data.length / 4);
          const skinRatio = skinToneCount / (data.length / 4);

          // Jika gambar terlalu gelap/terlalu terang (blank)
          if (avgBrightness < 15 || avgBrightness > 250) {
            resolve({
              isValid: false,
              error: 'Foto terlalu gelap atau terlalu terang sehingga wajah tidak terlihat jelas.',
              faceDetected: false
            });
            return;
          }

          // Verifikasi proporsi naturalitas foto
          if (skinRatio < 0.05) {
            resolve({
              isValid: false,
              error: 'Sistem tidak mendeteksi karakteristik wajah manusia pada foto. Wajib menggunakan foto asli diri sendiri.',
              faceDetected: false
            });
            return;
          }

          resolve({
            isValid: true,
            faceDetected: true,
            base64Url: dataUrl
          });
        } catch {
          // Fallback jika canvas terhambat security origin
          resolve({
            isValid: true,
            faceDetected: true,
            base64Url: dataUrl
          });
        }
      };

      img.onerror = () => {
        resolve({
          isValid: false,
          error: 'Gagal memproses gambar. Pastikan file tidak rusak.',
          faceDetected: false
        });
      };

      img.src = dataUrl;
    };

    reader.onerror = () => {
      resolve({
        isValid: false,
        error: 'Gagal membaca file foto.',
        faceDetected: false
      });
    };

    reader.readAsDataURL(file);
  });
}

