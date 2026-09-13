import { SaveData, ComplexityTier, QuizResultLog } from '../types';

// Storage keys
const STORAGE_KEY = 'starscholar_academy_save_v2';
const COOKIE_KEY = 'starscholar_save_v2';
const LEGACY_STORAGE_KEYS = ['starscholar_academy_save_v1', 'pips_learning_world_v3'];

/**
 * Clean baseline state for any new user visiting the app.
 * A new user starts 100% from scratch at Level 1 with no pre-completed levels,
 * 0 coins, and an empty academic record.
 */
export const DEFAULT_DATA: SaveData = {
  done: [],
  completedCount: 0,
  coins: 0,
  name: '',
  certs: [],
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
  dailyStreak: 1,
  lastDailyDate: new Date().toISOString().split('T')[0],
  unlockedBadges: [],
  badges: [],
  factsDiscovered: [],
  unlockedLevel: 1, // Fresh players start at Level 1!
  levelProgress: {}, // No pre-completed levels!
  quizLogs: [],
};

/**
 * Safely read a cookie by name from document.cookie
 */
function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  try {
    const cookies = document.cookie ? document.cookie.split('; ') : [];
    for (const c of cookies) {
      const idx = c.indexOf('=');
      if (idx > -1) {
        const key = decodeURIComponent(c.substring(0, idx).trim());
        if (key === name) {
          return decodeURIComponent(c.substring(idx + 1));
        }
      }
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Safely write a cookie with 1-year expiry and SameSite=Lax
 */
function writeCookie(name: string, value: string, days = 365) {
  if (typeof document === 'undefined') return;
  try {
    const d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = 'expires=' + d.toUTCString();
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; ${expires}; path=/; SameSite=Lax`;
  } catch {
    // ignore
  }
}

/**
 * Compact save payload for cookies to adhere strictly to browser 4KB cookie quotas
 */
function saveToCookie(data: SaveData) {
  try {
    const compact = {
      unlockedLevel: data.unlockedLevel || 1,
      levelProgress: data.levelProgress || {},
      coins: data.coins || 0,
      tier: data.tier || 'explorer',
      name: data.name || '',
      dailyStreak: data.dailyStreak || 1,
      lastDailyDate: data.lastDailyDate || '',
      badges: data.badges || [],
      certs: data.certs || [],
      stamp: data.stamp || Date.now(),
      sessionLimitMinutes: data.sessionLimitMinutes ?? 25,
      voiceEnabled: data.voiceEnabled ?? true,
      soundEnabled: data.soundEnabled ?? true,
      speechRate: data.speechRate ?? 0.88,
      childAge: data.childAge ?? 8,
      childGrade: data.childGrade ?? '3rd Grade',
      avatarEmoji: data.avatarEmoji ?? 'scholar',
    };
    writeCookie(COOKIE_KEY, JSON.stringify(compact));
  } catch {
    // ignore
  }
}

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

    // 1. Persist to browser localStorage (Cache)
    if (this.canUseStorage) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.mem));
      } catch {
        // ignore
      }
    }

    // 2. Persist to browser Cookies (Redundant Cross-Session Recovery)
    saveToCookie(this.mem);

    return this.mem;
  }

  public load(): SaveData {
    let loadedData: Partial<SaveData> | null = null;

    // 1. Try reading primary save from localStorage
    if (this.canUseStorage) {
      try {
        const rawLs = localStorage.getItem(STORAGE_KEY);
        if (rawLs) {
          loadedData = JSON.parse(rawLs);
        }
      } catch {
        // ignore
      }
    }

    // 2. Fallback: check browser cookies if localStorage is empty or blocked
    if (!loadedData) {
      try {
        const rawCookie = readCookie(COOKIE_KEY);
        if (rawCookie) {
          loadedData = JSON.parse(rawCookie);
          // Resync into localStorage so both caches are aligned
          if (this.canUseStorage && loadedData) {
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(loadedData));
            } catch {
              // ignore
            }
          }
        }
      } catch {
        // ignore
      }
    }

    // 3. Check legacy storage keys if this is a returning player from v1
    if (!loadedData && this.canUseStorage) {
      for (const legacyKey of LEGACY_STORAGE_KEYS) {
        try {
          const rawLegacy = localStorage.getItem(legacyKey);
          if (rawLegacy) {
            const parsed = JSON.parse(rawLegacy);
            // Check if this was the developer mock seed (unlockedLevel: 3, Leo, log_seed_1)
            const isOldMockSeed =
              parsed.unlockedLevel === 3 &&
              (parsed.name === 'Leo' || rawLegacy.includes('log_seed_1')) &&
              (!parsed.levelProgress || Object.keys(parsed.levelProgress).length <= 2);

            if (!isOldMockSeed) {
              // Genuine player progress from an earlier release — migrate it!
              loadedData = parsed;
            }
            // Clean up old legacy key
            try {
              localStorage.removeItem(legacyKey);
            } catch {
              // ignore
            }
            break;
          }
        } catch {
          // ignore
        }
      }
    }

    // 4. If this is a brand new player with no prior save:
    // They start 100% from scratch at Level 1!
    if (!loadedData) {
      this.mem = { ...DEFAULT_DATA };
      // Save this fresh state so this user's browser now has their personal save initialized
      if (this.canUseStorage) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(this.mem));
        } catch {
          // ignore
        }
      }
      saveToCookie(this.mem);
      return this.mem;
    }

    // Reconstruct valid SaveData state from loaded snapshot
    const validatedUnlockedLevel =
      typeof loadedData.unlockedLevel === 'number' &&
      !isNaN(loadedData.unlockedLevel) &&
      loadedData.unlockedLevel >= 1
        ? loadedData.unlockedLevel
        : 1;

    this.mem = {
      ...DEFAULT_DATA,
      ...loadedData,
      unlockedLevel: validatedUnlockedLevel,
      levelProgress: loadedData.levelProgress || {},
      quizLogs: loadedData.quizLogs || [],
      badges: loadedData.badges || loadedData.unlockedBadges || [],
      unlockedBadges: loadedData.unlockedBadges || loadedData.badges || [],
      done: loadedData.done || [],
      certs: loadedData.certs || [],
    };

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
      speechRate: this.mem.speechRate,
      sessionLimitMinutes: this.mem.sessionLimitMinutes,
      unlockedLevel: 1, // Reset to Level 1 from scratch
      levelProgress: {}, // Wipe all completed levels
      quizLogs: [],
      done: [],
      completedCount: 0,
      coins: 0,
      certs: [],
      unlockedBadges: [],
      badges: [],
      factsDiscovered: [],
      dailyStreak: 1,
      lastDailyDate: new Date().toISOString().split('T')[0],
    };
    if (this.canUseStorage) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.mem));
      } catch {
        // ignore
      }
    }
    saveToCookie(this.mem);
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
