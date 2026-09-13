export type ComplexityTier = 'sprout' | 'explorer' | 'champion';

export type GKCategory = 
  | 'us_history'
  | 'geography'
  | 'science' 
  | 'space' 
  | 'animals' 
  | 'inventions' 
  | 'math_logic';

export interface GKQuestion {
  id: string;
  category: GKCategory;
  tier: ComplexityTier;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  curriculumGrade?: string;
  hint?: string;
  icon?: string;
}

export interface QuizQuestionReview {
  question: string;
  options: string[];
  chosenIndex: number;
  correctIndex: number;
  isCorrect: boolean;
  explanation: string;
}

export interface QuizResultLog {
  id: string;
  timestamp: number;
  title: string;
  category: GKCategory | 'daily' | 'trail' | 'general';
  tier: ComplexityTier;
  score: number;
  total: number;
  percentage: number;
  timeSpentSeconds: number;
  reviews: QuizQuestionReview[];
}

export interface ChildProfile {
  id: string;
  name: string;
  age: number;
  grade: string;
  avatar: string;
}

export interface BadgeInfo {
  id: string;
  title: string;
  description: string;
  desc?: string;
  icon: string;
  category: string;
  unlockedAt?: number;
}

export interface FactCard {
  id: string;
  title: string;
  category: GKCategory;
  fact: string;
  detail: string;
  emoji: string;
  icon?: string;
  difficulty: ComplexityTier;
}

export type LevelDifficulty = 'easy' | 'medium' | 'hard' | 'expert' | 'master';

export interface LevelProgressItem {
  levelNumber: number;
  stars: number; // 1, 2, or 3
  score: number;
  total: number;
  completedAt: number;
}

export interface PathLevel {
  levelNumber: number;
  unit: number;
  unitTitle: string;
  title: string;
  subtitle: string;
  difficulty: LevelDifficulty;
  category: GKCategory | 'mixed';
  curriculumGrade: string;
  targetPassScore: number;
  coinReward: number;
  isMilestone: boolean;
  milestoneRewardName?: string;
  questions: GKQuestion[];
  questionTypeDescription?: string;
  topicTags?: string[];
  difficultyTierLabel?: string;
}

export interface SaveData {
  done: number[];
  completedCount?: number;
  coins: number;
  name: string;
  certs: number[];
  energyMs: number;
  stamp: number;
  tier: ComplexityTier;
  sessionLimitMinutes: number; // 0 = unlimited, 10, 15, 20, 30
  voiceEnabled: boolean;
  soundEnabled: boolean;
  speechRate: number; // 0.82 = gentle/slow, 0.95 = normal
  // Enhanced for Kids Ages 5-12 & Parent Portfolio
  childAge: number;
  childGrade: string;
  avatarEmoji: string;
  quizLogs: QuizResultLog[];
  dailyStreak: number;
  lastDailyDate: string;
  unlockedBadges: string[];
  badges: string[];
  factsDiscovered: string[];
  // Duolingo & Candy Crush style Progressive Level System
  unlockedLevel?: number;
  levelProgress?: Record<number, LevelProgressItem>;
}

export interface TierConfig {
  id: ComplexityTier;
  label: string;
  ageLabel: string;
  badge: string;
  description: string;
  color: string;
  recommendedGrade: string;
}

export const COMPLEXITY_TIERS: Record<ComplexityTier, TierConfig> = {
  sprout: {
    id: 'sprout',
    label: 'Junior Explorer',
    ageLabel: 'Ages 5–7',
    recommendedGrade: 'Kindergarten – 2nd Grade',
    badge: 'Level 1',
    description: 'American symbols, 50 stars on the flag, Bald Eagle, continents & oceans, plant needs, and beginner math.',
    color: '#059669',
  },
  explorer: {
    id: 'explorer',
    label: 'Curious Scholar',
    ageLabel: 'Ages 8–10',
    recommendedGrade: '3rd – 5th Grade',
    badge: 'Level 2',
    description: '3 Branches of US Government, 1776, 50 State Capitals, Mississippi River, Photosynthesis, Water Cycle, and Fractions.',
    color: '#2563EB',
  },
  champion: {
    id: 'champion',
    label: 'Master Scholar',
    ageLabel: 'Ages 11–12+',
    recommendedGrade: '6th – 7th Grade (Middle School)',
    badge: 'Level 3',
    description: 'US Constitution & Bill of Rights, Civil War & WWII, Plate Tectonics, Cell Biology, Periodic Table, and Pre-Algebra.',
    color: '#7C3AED',
  },
};
