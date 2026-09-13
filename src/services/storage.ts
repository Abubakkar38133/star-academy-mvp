import { SaveData, ComplexityTier, QuizResultLog } from '../types';

const STORAGE_KEY = 'starscholar_academy_save_v1';
const LEGACY_STORAGE_KEY = 'pips_learning_world_v3';

const DEFAULT_DATA: SaveData = {
  done: [0, 1], // Start with 2 completed stops so parents see immediate data
  completedCount: 2,
  coins: 15,
  name: 'Leo',
  certs: [1],
  energyMs: 0,
  stamp: Date.now(),
  tier: 'explorer', // Explorer is balanced for ages 8-10
  sessionLimitMinutes: 25,
  voiceEnabled: true,
  soundEnabled: true,
  speechRate: 0.88,
  childAge: 8,
  childGrade: '3rd Grade',
  avatarEmoji: 'scholar',
  dailyStreak: 2,
  lastDailyDate: new Date().toISOString().split('T')[0],
  unlockedBadges: ['first_quiz'],
  badges: ['first_quiz'],
  factsDiscovered: ['fact_1', 'fact_2'],
  unlockedLevel: 3,
  levelProgress: {
    1: {
      levelNumber: 1,
      stars: 3,
      score: 5,
      total: 5,
      completedAt: Date.now() - 3600 * 1000 * 3,
    },
    2: {
      levelNumber: 2,
      stars: 2,
      score: 4,
      total: 5,
      completedAt: Date.now() - 3600 * 1000 * 1,
    },
  },
  quizLogs: [
    {
      id: 'log_seed_1',
      timestamp: Date.now() - 3600 * 1000 * 4,
      title: 'Space Exploration Sprint',
      category: 'space',
      tier: 'explorer',
      score: 4,
      total: 5,
      percentage: 80,
      timeSpentSeconds: 95,
      reviews: [
        {
          question: 'Which is the largest planet in our solar system?',
          options: ['Saturn', 'Jupiter', 'Earth', 'Neptune'],
          chosenIndex: 1,
          correctIndex: 1,
          isCorrect: true,
          explanation: 'Jupiter is the massive king of planets!',
        },
        {
          question: 'What is the name of our home galaxy?',
          options: ['Andromeda', 'The Milky Way', 'Whirlpool Galaxy', 'Solar Galaxy'],
          chosenIndex: 1,
          correctIndex: 1,
          isCorrect: true,
          explanation: 'The Milky Way Galaxy.',
        },
        {
          question: 'Which star gives warmth and light to Earth?',
          options: ['The Moon', 'The Sun', 'Mars', 'The North Star'],
          chosenIndex: 1,
          correctIndex: 1,
          isCorrect: true,
          explanation: 'The Sun.',
        },
        {
          question: 'Which planet is known as the Red Planet?',
          options: ['Jupiter', 'Earth', 'Mars', 'Venus'],
          chosenIndex: 2,
          correctIndex: 2,
          isCorrect: true,
          explanation: 'Mars has iron oxide rocks on its surface.',
        },
        {
          question: 'Which planet rotates sideways?',
          options: ['Mars', 'Saturn', 'Uranus', 'Mercury'],
          chosenIndex: 1,
          correctIndex: 2,
          isCorrect: false,
          explanation: 'Uranus rotates tilted on its side at 98 degrees.',
        },
      ],
    },
    {
      id: 'log_seed_2',
      timestamp: Date.now() - 3600 * 1000 * 24,
      title: 'Wildlife & Nature Explorer',
      category: 'animals',
      tier: 'explorer',
      score: 3,
      total: 3,
      percentage: 100,
      timeSpentSeconds: 62,
      reviews: [
        {
          question: 'What is the largest living mammal on Earth?',
          options: ['African Elephant', 'Blue Whale', 'Colossal Squid', 'Giraffe'],
          chosenIndex: 1,
          correctIndex: 1,
          isCorrect: true,
          explanation: 'Blue Whale is larger than any dinosaur!',
        },
        {
          question: 'How many hearts does an octopus have?',
          options: ['1 heart', '2 hearts', '3 hearts', '4 hearts'],
          chosenIndex: 2,
          correctIndex: 2,
          isCorrect: true,
          explanation: '3 hearts circulate blood in octopuses.',
        },
        {
          question: 'What is the tallest living land animal?',
          options: ['Elephant', 'Giraffe', 'Kangaroo', 'Horse'],
          chosenIndex: 1,
          correctIndex: 1,
          isCorrect: true,
          explanation: 'Giraffe can reach up to 19 feet.',
        },
      ],
    },
  ],
};

class StorageService {
  private mem: SaveData = { ...DEFAULT_DATA };
  private canUseStorage: boolean = true;

  constructor() {
    try {
      const testKey = '__test_ls__';
      localStorage.setItem(testKey, '1');
      localStorage.removeItem(testKey);
    } catch {
      this.canUseStorage = false;
    }
    this.load();
  }

  public get(): SaveData {
    return this.mem;
  }

  public save(patch: Partial<SaveData>): SaveData {
    this.mem = { ...this.mem, ...patch };
    if (patch.unlockedBadges && !patch.badges) {
      this.mem.badges = patch.unlockedBadges;
    } else if (patch.badges && !patch.unlockedBadges) {
      this.mem.unlockedBadges = patch.badges;
    }
    if (this.canUseStorage) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.mem));
      } catch {
        // ignore
      }
    }
    return this.mem;
  }

  public load(): SaveData {
    if (!this.canUseStorage) return this.mem;
    try {
      let raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        raw = localStorage.getItem(LEGACY_STORAGE_KEY);
        if (raw) {
          try {
            // Migrate to new storage key
            localStorage.setItem(STORAGE_KEY, raw);
            localStorage.removeItem(LEGACY_STORAGE_KEY);
          } catch {
            // ignore
          }
        }
      }

      if (raw) {
        const parsed = JSON.parse(raw);
        this.mem = { ...DEFAULT_DATA, ...parsed };
        if (!this.mem.badges && this.mem.unlockedBadges) {
          this.mem.badges = this.mem.unlockedBadges;
        }
        if (!this.mem.unlockedBadges && this.mem.badges) {
          this.mem.unlockedBadges = this.mem.badges;
        }
        if (this.mem.completedCount === undefined) {
          this.mem.completedCount = this.mem.done ? this.mem.done.length : 2;
        }
        if (!this.mem.levelProgress) {
          this.mem.levelProgress = { ...DEFAULT_DATA.levelProgress };
        }
        if (typeof this.mem.unlockedLevel !== 'number' || isNaN(this.mem.unlockedLevel) || this.mem.unlockedLevel < 1) {
          this.mem.unlockedLevel = 1;
        }
      }
    } catch {
      this.mem = { ...DEFAULT_DATA };
    }
    return this.mem;
  }

  public addQuizLog(log: QuizResultLog): SaveData {
    const nextLogs = [log, ...(this.mem.quizLogs || [])].slice(0, 30);
    const newCoins = (this.mem.coins || 0) + log.score * 2;
    const badges = [...(this.mem.unlockedBadges || [])];

    // Check badges
    if (!badges.includes('first_quiz')) badges.push('first_quiz');
    if (log.percentage === 100 && !badges.includes('perfect_score')) badges.push('perfect_score');
    if (log.category === 'space' && !badges.includes('space_cadet')) badges.push('space_cadet');
    if (log.category === 'animals' && !badges.includes('nature_ranger')) badges.push('nature_ranger');
    if (log.category === 'geography' && !badges.includes('globe_trotter')) badges.push('globe_trotter');
    if (log.category === 'math_logic' && !badges.includes('math_whiz')) badges.push('math_whiz');

    const totalAnswered = nextLogs.reduce((acc, curr) => acc + curr.total, 0);
    if (totalAnswered >= 25 && !badges.includes('scholar_rank')) badges.push('scholar_rank');

    return this.save({
      quizLogs: nextLogs,
      coins: newCoins,
      unlockedBadges: badges,
    });
  }

  public recordLevelCompleted(
    levelNumber: number,
    stars: number,
    score: number,
    total: number,
    coinReward: number
  ): SaveData {
    const prevProgress = this.mem.levelProgress || {};
    const existing = prevProgress[levelNumber];
    const bestStars = existing ? Math.max(existing.stars, stars) : stars;
    const bestScore = existing ? Math.max(existing.score, score) : score;

    const nextProgress = {
      ...prevProgress,
      [levelNumber]: {
        levelNumber,
        stars: bestStars,
        score: bestScore,
        total,
        completedAt: Date.now(),
      },
    };

    const currentUnlocked = this.mem.unlockedLevel || 1;
    const nextUnlocked = Math.max(currentUnlocked, levelNumber + 1);
    const newCoins = (this.mem.coins || 0) + coinReward;

    const badges = [...(this.mem.unlockedBadges || [])];
    if (!badges.includes('first_quiz')) badges.push('first_quiz');
    if (levelNumber >= 5 && !badges.includes('unit1_complete')) badges.push('unit1_complete');
    if (levelNumber >= 10 && !badges.includes('unit2_complete')) badges.push('unit2_complete');
    if (levelNumber >= 15 && !badges.includes('unit3_complete')) badges.push('unit3_complete');
    if (stars === 3 && !badges.includes('perfect_score')) badges.push('perfect_score');

    return this.save({
      levelProgress: nextProgress,
      unlockedLevel: nextUnlocked,
      coins: newCoins,
      unlockedBadges: badges,
    });
  }

  public recordDailyCompleted(): { streak: number; isFirstToday: boolean } {
    const today = new Date().toISOString().split('T')[0];
    const last = this.mem.lastDailyDate;
    let streak = this.mem.dailyStreak || 1;
    let isFirstToday = false;

    if (last !== today) {
      isFirstToday = true;
      streak += 1;
      const badges = [...(this.mem.unlockedBadges || [])];
      if (streak >= 3 && !badges.includes('daily_streak_3')) {
        badges.push('daily_streak_3');
      }
      this.save({
        lastDailyDate: today,
        dailyStreak: streak,
        coins: (this.mem.coins || 0) + 10,
        unlockedBadges: badges,
      });
    }

    return { streak, isFirstToday };
  }

  public resetProgress(): SaveData {
    this.mem = {
      ...DEFAULT_DATA,
      name: this.mem.name,
      childAge: this.mem.childAge,
      childGrade: this.mem.childGrade,
      avatarEmoji: this.mem.avatarEmoji,
      tier: this.mem.tier,
      voiceEnabled: this.mem.voiceEnabled,
      soundEnabled: this.mem.soundEnabled,
      quizLogs: [],
      done: [],
      coins: 5,
      certs: [],
      unlockedBadges: [],
    };
    if (this.canUseStorage) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.mem));
      } catch {
        // ignore
      }
    }
    return this.mem;
  }

  public getEnergyRemainingFraction(): number {
    const limitMinutes = this.mem.sessionLimitMinutes;
    if (limitMinutes <= 0) return 1;

    const totalAllowedMs = limitMinutes * 60 * 1000;
    const refillMs = 8 * 60 * 60 * 1000;

    const awayMs = Math.max(0, Date.now() - (this.mem.stamp || Date.now()));
    const recoveredMs = (awayMs / refillMs) * totalAllowedMs;
    const currentUsedMs = Math.max(0, Math.min(totalAllowedMs, (this.mem.energyMs || 0) - recoveredMs));

    return Math.max(0, 1 - currentUsedMs / totalAllowedMs);
  }

  public addPlayTime(deltaMs: number) {
    const limitMinutes = this.mem.sessionLimitMinutes;
    if (limitMinutes <= 0) return;

    const totalAllowedMs = limitMinutes * 60 * 1000;
    const currentUsed = (this.mem.energyMs || 0) + deltaMs;
    this.save({
      energyMs: Math.min(totalAllowedMs, currentUsed),
      stamp: Date.now(),
    });
  }

  public refillEnergy() {
    this.save({ energyMs: 0, stamp: Date.now() });
  }

  public setTier(tier: ComplexityTier) {
    this.save({ tier });
  }
}

export const storage = new StorageService();
