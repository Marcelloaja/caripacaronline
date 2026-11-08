export type Gender = 'pria' | 'wanita';

export type MBTIType = 
  | 'INTJ' | 'INTP' | 'ENTJ' | 'ENTP'
  | 'INFJ' | 'INFP' | 'ENFJ' | 'ENFP'
  | 'ISTJ' | 'ISFJ' | 'ESTJ' | 'ESFJ'
  | 'ISTP' | 'ISFP' | 'ESTP' | 'ESFP';

export interface UserProfile {
  id: string;
  name: string; // nama asli panggilan
  gender: Gender;
  interestedIn: Gender; // 'wanita' jika pria, 'pria' jika wanita (Straight only)
  originCity: string; // Asli mana
  currentCity: string; // Domisili saat ini
  country: string; // Negara (default: Indonesia)
  birthYear: number;
  birthDate?: string;
  age: number; // calculated automatically
  heightCm: number; // Tinggi badan
  mbti: MBTIType;
  bio: string; // Keterangan diri
  aiSummary?: string; // Summary buatan AI Gemini
  skills: string[]; // Skill
  hobbies: string[]; // Hobi
  ethnicity: string; // Keturunan / Etnis (contoh: Tionghoa (Chindo), Jawa, Sunda, Minang, dll.)
  photoUrl: string; // URL / Base64 foto
  isPhotoVerified: boolean; // Hasil face verification
  hasSignedPledge: boolean; // Ikrar Integritas Lajang
  targetMarriage: '6_bulan' | '1_tahun' | '2_tahun' | 'santai_tapi_serius';
  occupation?: string;
  education?: string;
  religion?: string;
  createdAt: string;
}

export interface LoveInteraction {
  id: string;
  fromUserId: string;
  toUserId: string;
  type: 'love' | 'love_note';
  note?: string;
  timestamp: string;
}

export interface Match {
  id: string;
  userAId: string;
  userBId: string;
  matchedAt: string;
  lastMessage?: string;
  lastMessageTime?: string;
}

export interface ChatMessage {
  id: string;
  matchId: string;
  senderId: string;
  text: string;
  timestamp: string;
  status: 'sending' | 'sent' | 'delivered' | 'read';
}

export interface AppNotification {
  id: string;
  userId: string;
  fromUser: {
    id: string;
    name: string;
    photoUrl: string;
    city: string;
  };
  type: 'love' | 'love_note' | 'match' | 'message';
  note?: string;
  timestamp: string;
  isRead: boolean;
}

export const INDONESIAN_CITIES = [
  'Jakarta',
  'Surabaya',
  'Bandung',
  'Medan',
  'Semarang',
  'Yogyakarta',
  'Makassar',
  'Palembang',
  'Tangerang',
  'Bekasi',
  'Depok',
  'Bogor',
  'Denpasar (Bali)',
  'Malang',
  'Solo (Surakarta)',
  'Balikpapan',
  'Banjarmasin',
  'Pontianak',
  'Manado',
  'Padang',
  'Bandar Lampung',
  'Batam',
  'Lombok'
] as const;

export const MBTI_OPTIONS: { code: MBTIType; label: string; desc: string }[] = [
  { code: 'INTJ', label: 'Arsitek (INTJ)', desc: 'Pemikir strategis dengan rencana untuk segalanya.' },
  { code: 'INTP', label: 'Logisi (INTP)', desc: 'Pemikir inovatif dengan rasa haus akan pengetahuan.' },
  { code: 'ENTJ', label: 'Komandan (ENTJ)', desc: 'Pemimpin yang berani, imajinatif, dan berkemauan kuat.' },
  { code: 'ENTP', label: 'Pendebat (ENTP)', desc: 'Pemikir cerdas dan penasaran yang suka tantangan intelektual.' },
  { code: 'INFJ', label: 'Advokat (INFJ)', desc: 'Idealis yang tenang, mistis, namun sangat menginspirasi.' },
  { code: 'INFP', label: 'Mediator (INFP)', desc: 'Pribadi puitis, baik hati, dan selalu mencari kebaikan.' },
  { code: 'ENFJ', label: 'Protagonis (ENFJ)', desc: 'Pemimpin karismatik dan inspiratif yang memikat pendengar.' },
  { code: 'ENFP', label: 'Juru Kampanye (ENFP)', desc: 'Sosok antusias, kreatif, bebas, dan selalu punya senyuman.' },
  { code: 'ISTJ', label: 'Logistisi (ISTJ)', desc: 'Pribadi praktis, mengutamakan fakta, dan sangat dapat diandalkan.' },
  { code: 'ISFJ', label: 'Pembela (ISFJ)', desc: 'Pelindung yang berdedikasi, hangat, dan selalu siap membela.' },
  { code: 'ESTJ', label: 'Eksekutif (ESTJ)', desc: 'Administrator ulung yang teratur dan tegas dalam tindakan.' },
  { code: 'ESFJ', label: 'Konsul (ESFJ)', desc: 'Pribadi penuh perhatian, sosial, dan populer di lingkungannya.' },
  { code: 'ISTP', label: 'Virtuoso (ISTP)', desc: 'Eksperimenter pemberani dan praktis, mahir dalam berbagai alat.' },
  { code: 'ISFP', label: 'Petualang (ISFP)', desc: 'Seniman fleksibel dan menawan yang selalu siap menjelajah hal baru.' },
  { code: 'ESTP', label: 'Pengusaha (ESTP)', desc: 'Cerdas, energik, perseptif, dan suka hidup di batas aksi.' },
  { code: 'ESFP', label: 'Penghibur (ESFP)', desc: 'Spontan, bersemangat, dan tidak pernah membiarkan suasana membosankan.' }
];

export const POPULAR_HOBBIES = [
  'Membaca Buku', 'Kopi & Nongkrong', 'Traveling', 'Olahraga / Gym',
  'Memasak', 'Fotografi', 'Menonton Film', 'Bermain Musik',
  'Kulineran', 'Hiking & Alam', 'Menulis', 'Seni & Desain',
  'Gaming Santai', 'Investasi & Bisnis', 'Relawan / Sosial'
];

export const ETHNICITY_OPTIONS = [
  'Tionghoa (Chindo)',
  'Jawa',
  'Sunda',
  'Batak',
  'Minang',
  'Melayu',
  'Bugis / Makassar',
  'Bali',
  'Arab-Indonesia',
  'Campuran / Blasteran',
  'Lainnya'
] as const;

export const COMMON_SKILLS = [
  'Komunikasi Empatis', 'Memasak Makanan Rumah', 'Mengelola Finansial',
  'Mendengarkan Cerita', 'Perencanaan Masa Depan', 'Time Management',
  'Problem Solving', 'Public Speaking', 'Kreativitas', 'Desain Grafis'
];

