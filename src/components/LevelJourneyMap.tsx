import React, { useState, useEffect, useMemo } from 'react';
import { sound } from '../services/sound';
import { MascotBuddy } from './MascotBuddy';
import { PathLevel, ComplexityTier, LevelProgressItem, SaveData } from '../types';
import { getLevelData } from '../data/levelProgression';
import {
  Play,
  Star,
  Lock,
  CheckCircle2,
  Gift,
  LayoutGrid,
  Route,
  Crown,
  ChevronRight,
  Sparkles,
  X,
  Award,
} from 'lucide-react';

interface LevelJourneyMapProps {
  data?: SaveData;
  unlockedLevel?: number;
  progress?: Record<number, LevelProgressItem>;
  currentTier?: ComplexityTier;
  onSelectLevel: (levelNumber: number) => void;
  onOpenParentCorner?: () => void;
}

type FilterTier = 'all' | 'easy' | 'medium' | 'hard' | 'expert' | 'endless';

interface UnitDefinition {
  unitNumber: number;
  title: string;
  subtitle: string;
  difficultyLabel: string;
  difficultyTag: FilterTier;
  levelRangeLabel: string;
  direction: 'right' | 'left';
  theme: {
    bg: string;
    borderBevel: string;
    borderLight: string;
    headerGradient: string;
    accentText: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    trailColor: string;
  };
  rewardName: string;
  rewardCoins: number;
  levels: PathLevel[];
}

export const LevelJourneyMap: React.FC<LevelJourneyMapProps> = ({
  data,
  unlockedLevel: propUnlockedLevel,
  progress: propProgress,
  onSelectLevel,
  onOpenParentCorner,
}) => {
  const unlockedLevel = propUnlockedLevel ?? data?.unlockedLevel ?? 1;
  const progress: Record<number, LevelProgressItem> = propProgress ?? data?.levelProgress ?? {};

  const [selectedFilter, setSelectedFilter] = useState<FilterTier>('all');
  const [previewLevelNumber, setPreviewLevelNumber] = useState<number | null>(null);
  const [selectedMilestoneUnit, setSelectedMilestoneUnit] = useState<UnitDefinition | null>(null);

  // Auto-scroll to active level on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      const activeEl = document.getElementById(`duo-level-btn-${unlockedLevel}`);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [unlockedLevel]);

  // Show at least 20 levels or up to next milestone of 5
  const maxDisplayLevel = Math.max(20, Math.ceil((unlockedLevel + 2) / 5) * 5);

  // Structured Units of 5 with StarScholar Academic Theme
  const units: UnitDefinition[] = useMemo(() => {
    const list: UnitDefinition[] = [];
    const totalUnits = Math.ceil(maxDisplayLevel / 5);

    for (let u = 1; u <= totalUnits; u++) {
      const startLvl = (u - 1) * 5 + 1;
      const endLvl = Math.min(u * 5, maxDisplayLevel);
      const lvlList: PathLevel[] = [];

      for (let l = startLvl; l <= endLvl; l++) {
        lvlList.push(getLevelData(l));
      }

      // Alternating snake curve: Unit 1 curves right, Unit 2 curves left, Unit 3 curves right...
      const direction: 'right' | 'left' = u % 2 === 1 ? 'right' : 'left';

      if (u === 1) {
        list.push({
          unitNumber: 1,
          title: 'Unit 1',
          subtitle: 'Symbols & Animals',
          difficultyLabel: 'Junior',
          difficultyTag: 'easy',
          levelRangeLabel: 'Levels 1 – 5',
          direction,
          theme: {
            bg: 'bg-emerald-600',
            borderBevel: '#15803d',
            borderLight: 'border-emerald-400',
            headerGradient: 'from-emerald-600 via-green-600 to-emerald-700',
            accentText: 'text-emerald-700',
            badgeBg: 'bg-emerald-100',
            badgeText: 'text-emerald-900',
            badgeBorder: 'border-emerald-300',
            trailColor: '#16a34a',
          },
          rewardName: 'Junior Star Medal',
          rewardCoins: 50,
          levels: lvlList,
        });
      } else if (u === 2) {
        list.push({
          unitNumber: 2,
          title: 'Unit 2',
          subtitle: 'States & Maps',
          difficultyLabel: 'Scholar',
          difficultyTag: 'medium',
          levelRangeLabel: 'Levels 6 – 10',
          direction,
          theme: {
            bg: 'bg-emerald-600',
            borderBevel: '#15803d',
            borderLight: 'border-emerald-400',
            headerGradient: 'from-emerald-600 via-teal-600 to-green-700',
            accentText: 'text-emerald-700',
            badgeBg: 'bg-emerald-100',
            badgeText: 'text-emerald-900',
            badgeBorder: 'border-emerald-300',
            trailColor: '#16a34a',
          },
          rewardName: 'Explorer Crown',
          rewardCoins: 100,
          levels: lvlList,
        });
      } else if (u === 3) {
        list.push({
          unitNumber: 3,
          title: 'Unit 3',
          subtitle: 'Science & Space',
          difficultyLabel: 'Master',
          difficultyTag: 'hard',
          levelRangeLabel: 'Levels 11 – 15',
          direction,
          theme: {
            bg: 'bg-emerald-600',
            borderBevel: '#15803d',
            borderLight: 'border-emerald-400',
            headerGradient: 'from-green-600 via-emerald-600 to-teal-700',
            accentText: 'text-emerald-700',
            badgeBg: 'bg-emerald-100',
            badgeText: 'text-emerald-900',
            badgeBorder: 'border-emerald-300',
            trailColor: '#16a34a',
          },
          rewardName: 'Gold Star Crest',
          rewardCoins: 150,
          levels: lvlList,
        });
      } else if (u === 4) {
        list.push({
          unitNumber: 4,
          title: 'Unit 4',
          subtitle: 'Champion Challenges',
          difficultyLabel: 'Champion',
          difficultyTag: 'expert',
          levelRangeLabel: 'Levels 16 – 20',
          direction,
          theme: {
            bg: 'bg-emerald-600',
            borderBevel: '#15803d',
            borderLight: 'border-emerald-400',
            headerGradient: 'from-emerald-700 via-green-700 to-teal-800',
            accentText: 'text-emerald-700',
            badgeBg: 'bg-emerald-100',
            badgeText: 'text-emerald-900',
            badgeBorder: 'border-emerald-300',
            trailColor: '#16a34a',
          },
          rewardName: 'Champion Trophy',
          rewardCoins: 200,
          levels: lvlList,
        });
      } else {
        list.push({
          unitNumber: u,
          title: `Unit ${u}`,
          subtitle: 'Endless Adventure',
          difficultyLabel: 'Endless',
          difficultyTag: 'endless',
          levelRangeLabel: `Levels ${startLvl} – ${endLvl}`,
          direction,
          theme: {
            bg: 'bg-emerald-600',
            borderBevel: '#15803d',
            borderLight: 'border-emerald-400',
            headerGradient: 'from-emerald-700 via-green-800 to-teal-900',
            accentText: 'text-emerald-700',
            badgeBg: 'bg-emerald-100',
            badgeText: 'text-emerald-900',
            badgeBorder: 'border-emerald-300',
            trailColor: '#16a34a',
          },
          rewardName: 'Honor Medal',
          rewardCoins: 250,
          levels: lvlList,
        });
      }
    }

    return list;
  }, [maxDisplayLevel]);

  // Overall Statistics
  const totalStars = useMemo(() => {
    return Object.values(progress || {}).reduce((acc: number, curr: LevelProgressItem) => acc + (curr?.stars || 0), 0);
  }, [progress]);

  const completedCount = useMemo(() => {
    return Object.values(progress || {}).filter((p: LevelProgressItem) => (p?.stars || 0) >= 1).length;
  }, [progress]);

  const filteredUnits = useMemo(() => {
    if (selectedFilter === 'all') return units;
    return units.filter(u => u.difficultyTag === selectedFilter);
  }, [units, selectedFilter]);

  const previewLevelData = useMemo(() => {
    if (!previewLevelNumber) return null;
    return getLevelData(previewLevelNumber);
  }, [previewLevelNumber]);

  /**
   * DUOLINGO SNAKE PATH COORDINATE GENERATOR
   * 360 x 670 viewBox per 5-level unit.
   * Alternates S-curve direction:
   * Unit 1 & 3: swings to right
   * Unit 2 & 4: swings to left
   */
  const getUnitPoints = (direction: 'right' | 'left') => {
    if (direction === 'right') {
      return [
        { x: 180, y: 65 },   // Level 1: Center (with space for mascot above)
        { x: 250, y: 165 },  // Level 2: Swing Right
        { x: 260, y: 275 },  // Level 3: Apex Right (safe mobile edge margin)
        { x: 215, y: 385 },  // Level 4: Curve back
        { x: 180, y: 495 },  // Level 5: Center Milestone Level
        { x: 180, y: 605 },  // Milestone Chest: Center
      ];
    }
    return [
      { x: 180, y: 65 },   // Level 1: Center (with space for mascot above)
      { x: 110, y: 165 },  // Level 2: Swing Left
      { x: 100, y: 275 },  // Level 3: Apex Left (safe mobile edge margin)
      { x: 145, y: 385 },  // Level 4: Curve back
      { x: 180, y: 495 },  // Level 5: Center Milestone Level
      { x: 180, y: 605 },  // Milestone Chest: Center
    ];
  };

  /**
   * Build smooth cubic bezier curve SVG string between points
   */
  const generateSmoothPathString = (points: { x: number; y: number }[]) => {
    if (points.length < 2) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const dy = p2.y - p1.y;
      const cp1x = p1.x;
      const cp1y = p1.y + dy * 0.55;
      const cp2x = p2.x;
      const cp2y = p2.y - dy * 0.55;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-slate-50 text-slate-900 select-none pb-32">
      {/* STREAMLINED ACADEMIC SUBHEADER */}
      <div className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-xl mx-auto px-4 py-2.5">
          <div className="flex items-center justify-between gap-3">
            {/* Title & Level Indicator */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0 font-black">
                <Crown className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-heading font-black text-sm sm:text-base text-slate-900 tracking-tight leading-tight">
                    Adventure Trail
                  </h1>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-black text-[10px]">
                    Level {unlockedLevel}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-bold">
                  {completedCount} of {maxDisplayLevel} completed
                </p>
              </div>
            </div>

            {/* Quick Stats: Stars & Coins */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-black text-xs shadow-2xs">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                <span>{totalStars}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <div className="mx-auto px-3 sm:px-4 pt-4 sm:pt-6 space-y-8 sm:space-y-10 max-w-md">
        {/* DUOLINGO SNAKE PATH (ICONIC WINDING SERPENTINE ROAD) */}
        <div className="space-y-12">
          {filteredUnits.map(unit => {
            const unitCompletedCount = unit.levels.filter(
              l => ((progress && progress[l.levelNumber]?.stars) || 0) >= 1
            ).length;
            const isUnitMastered = unitCompletedCount === unit.levels.length;
            const points = getUnitPoints(unit.direction);
            const pathString = generateSmoothPathString(points);

              return (
                <div key={unit.unitNumber} className="relative">
                  {/* DUOLINGO STYLE UNIT HEADER BANNER */}
                  <div
                    className={`rounded-3xl p-5 text-white shadow-sm bg-gradient-to-r ${unit.theme.headerGradient}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-md">
                            {unit.title}
                          </span>
                          <span className="text-xs font-bold text-white/90">
                            {unit.levelRangeLabel}
                          </span>
                        </div>
                        <h2 className="font-heading font-black text-xl tracking-tight mt-1">
                          {unit.subtitle}
                        </h2>
                      </div>

                      {/* Milestone Reward Chest Button */}
                      <button
                        type="button"
                        onClick={() => {
                          sound.click();
                          setSelectedMilestoneUnit(unit);
                        }}
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border-2 transition-all active:scale-95 cursor-pointer ${
                          isUnitMastered
                            ? 'bg-amber-400 border-amber-200 text-slate-950 shadow-md'
                            : 'bg-white/20 border-white/40 text-white hover:bg-white/30'
                        }`}
                        title="View Unit Milestone Reward"
                      >
                        <Gift className="w-6 h-6" />
                      </button>
                    </div>

                    {/* Progress Bar of Unit */}
                    <div className="mt-3.5 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-extrabold text-white/90">
                        <span>Unit Progress</span>
                        <span>
                          {unitCompletedCount} / {unit.levels.length} Complete
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-black/20 rounded-full overflow-hidden p-0.5">
                        <div
                          className="h-full bg-amber-400 rounded-full transition-all duration-300"
                          style={{
                            width: `${(unitCompletedCount / unit.levels.length) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* DUOLINGO SNAKE PATH STAGE */}
                  <div className="relative w-full h-[670px] my-4">
                    {/* SVG Connecting Snake Road Track */}
                    <svg
                      viewBox="0 0 360 670"
                      className="absolute inset-0 w-full h-full pointer-events-none"
                    >
                      {/* Wide Base Road Bed */}
                      <path
                        d={pathString}
                        fill="none"
                        stroke="#e2e8f0"
                        strokeWidth="16"
                        strokeLinecap="round"
                      />
                      {/* Center Dash Guide Line */}
                      <path
                        d={pathString}
                        fill="none"
                        stroke="#cbd5e1"
                        strokeWidth="3.5"
                        strokeDasharray="8 8"
                        strokeLinecap="round"
                      />
                      {/* Active / Completed Trail Overlay */}
                      {unitCompletedCount > 0 && (
                        <path
                          d={pathString}
                          fill="none"
                          stroke="#16a34a"
                          strokeWidth="8"
                          strokeLinecap="round"
                          opacity="0.4"
                        />
                      )}
                    </svg>

                    {/* INTERACTIVE LEVEL BUTTONS ON THE SNAKE CURVE */}
                    {unit.levels.map((lvl, index) => {
                      const pt = points[index];
                      const isUnlocked = lvl.levelNumber <= unlockedLevel;
                      const isCurrent = lvl.levelNumber === unlockedLevel;
                      const record = progress ? progress[lvl.levelNumber] : undefined;
                      const stars = record ? record.stars : 0;
                      const isCompleted = stars > 0;

                      return (
                        <div
                          key={lvl.levelNumber}
                          className="absolute z-10 flex flex-col items-center"
                          style={{
                            left: `${(pt.x / 360) * 100}%`,
                            top: `${pt.y}px`,
                            transform: 'translate(-50%, -50%)',
                          }}
                        >
                          {/* FLOATING BOUNCING "START" WITH 3D HOOTIE MASCOT (Duolingo Style!) */}
                          {isCurrent && (
                            <div className="absolute -top-20 sm:-top-24 z-30 pointer-events-none flex flex-col items-center animate-bounce-subtle">
                              <div className="scale-[0.65] sm:scale-75 -mb-2">
                                <MascotBuddy size="sm" mood="celebrate" interactive={false} />
                              </div>
                              <div className="bg-amber-400 text-slate-950 font-heading font-black text-[10px] sm:text-[11px] tracking-wider uppercase px-2.5 py-0.5 rounded-xl shadow-md border border-amber-300 flex items-center gap-1">
                                <Play className="w-2.5 h-2.5 fill-slate-950" />
                                <span>START</span>
                              </div>
                              {/* Downward pointing speech caret */}
                              <div className="w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-amber-400 mx-auto -mt-0.5" />
                            </div>
                          )}

                          {/* TACTILE CIRCULAR STEPPING STONE (Duolingo 3D Physics) */}
                          <button
                            id={`duo-level-btn-${lvl.levelNumber}`}
                            type="button"
                            onClick={() => {
                              if (isUnlocked) {
                                sound.tap();
                                setPreviewLevelNumber(lvl.levelNumber);
                              } else {
                                sound.notYet();
                              }
                            }}
                            disabled={!isUnlocked}
                            className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full flex flex-col items-center justify-center font-heading font-black transition-all cursor-pointer select-none active:translate-y-1 ${
                              isCurrent
                                ? 'bg-emerald-600 text-white border-b-4 border-emerald-800 ring-4 ring-emerald-300/80 shadow-lg'
                                : isCompleted
                                ? 'bg-emerald-600 text-white border-b-4 border-emerald-800 hover:bg-emerald-700 shadow-sm'
                                : isUnlocked
                                ? 'bg-emerald-500 text-white border-b-4 border-emerald-700 shadow-xs'
                                : 'bg-slate-200 text-slate-400 border-b-4 border-slate-300 cursor-not-allowed shadow-none'
                            }`}
                          >
                            {isUnlocked ? (
                              <span className="text-2xl sm:text-3xl leading-none drop-shadow-2xs">
                                {lvl.levelNumber}
                              </span>
                            ) : (
                              <Lock className="w-6 h-6 sm:w-7 sm:h-7 text-slate-400" />
                            )}
                          </button>

                          {/* STARS UNDERNEATH (1, 2, or 3 Stars) */}
                          {isCompleted ? (
                            <div className="flex items-center gap-0.5 mt-2 bg-white px-2 py-0.5 rounded-full shadow-2xs border border-slate-200">
                              {[1, 2, 3].map(s => (
                                <Star
                                  key={s}
                                  className={`w-3 h-3 ${
                                    s <= stars
                                      ? 'text-amber-400 fill-amber-400'
                                      : 'text-slate-300'
                                  }`}
                                />
                              ))}
                            </div>
                          ) : (
                            <span className="text-[10px] font-black uppercase text-slate-400 mt-2">
                              {isCurrent ? 'Play' : isUnlocked ? 'Ready' : ''}
                            </span>
                          )}
                        </div>
                      );
                    })}

                    {/* UNIT MILESTONE REWARD CHEST (At Point 5 - Center) */}
                    <div
                      className="absolute z-10 flex flex-col items-center"
                      style={{
                        left: `${(points[5].x / 360) * 100}%`,
                        top: `${points[5].y}px`,
                        transform: 'translate(-50%, -50%)',
                      }}
                    >
                      <button
                        id={`duo-milestone-chest-${unit.unitNumber}`}
                        type="button"
                        onClick={() => {
                          if (isUnitMastered) {
                            sound.fanfare();
                          } else {
                            sound.click();
                          }
                          setSelectedMilestoneUnit(unit);
                        }}
                        className={`w-16 h-16 sm:w-18 sm:h-18 rounded-3xl flex flex-col items-center justify-center transition-all cursor-pointer select-none active:translate-y-1 shadow-md ${
                          isUnitMastered
                            ? 'bg-amber-400 text-slate-950 border-b-4 border-amber-600 ring-4 ring-amber-200'
                            : 'bg-slate-200 text-slate-400 border-b-4 border-slate-300 shadow-none'
                        }`}
                      >
                        {isUnitMastered ? (
                          <Gift className="w-8 h-8 text-slate-950 animate-bounce" />
                        ) : (
                          <Gift className="w-7 h-7 text-slate-400" />
                        )}
                      </button>

                      <div className="mt-2 text-center">
                        <span
                          className={`text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            isUnitMastered
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'text-slate-400'
                          }`}
                        >
                          {isUnitMastered ? 'Reward Unlocked' : `${unit.rewardName}`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      {/* SPECIAL LEVEL PREVIEW MODAL */}
      {previewLevelNumber !== null && previewLevelData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-pop">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-xs w-full p-6 shadow-xl text-center flex flex-col items-center gap-4">
            <div className="w-full flex justify-end -mb-2">
              <button
                type="button"
                onClick={() => setPreviewLevelNumber(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Clean Rounded Level Badge */}
            <div className="w-20 h-20 rounded-full bg-emerald-600 text-white flex items-center justify-center font-heading font-black text-4xl border-4 border-emerald-200 shadow-md -mt-3">
              {previewLevelNumber}
            </div>

            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-black border border-emerald-200">
                {previewLevelNumber <= 5
                  ? 'Levels 1–5'
                  : previewLevelNumber <= 10
                  ? 'Levels 6–10'
                  : previewLevelNumber <= 15
                  ? 'Levels 11–15'
                  : 'Levels 16–20'}
              </span>
              <h3 className="font-heading font-black text-2xl text-slate-900 mt-1">
                Level {previewLevelNumber}
              </h3>
            </div>

            {/* Stars Record Box */}
            <div className="bg-slate-50 rounded-2xl p-3 w-full border border-slate-200 flex items-center justify-around">
              <div className="text-center">
                <span className="text-[10px] font-black text-slate-400 block uppercase">Stars</span>
                <div className="flex items-center gap-1 mt-0.5">
                  {[1, 2, 3].map(s => (
                    <Star
                      key={s}
                      className={`w-4 h-4 ${
                        s <= ((progress && progress[previewLevelNumber]?.stars) || 0)
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="h-8 w-px bg-slate-200" />
              <div className="text-center">
                <span className="text-[10px] font-black text-slate-400 block uppercase">Reward</span>
                <span className="font-heading font-black text-amber-600 text-sm">
                  +{previewLevelData.coinReward} Coins
                </span>
              </div>
            </div>

            {/* Tactile 3D Action Buttons */}
            <div className="w-full space-y-2.5">
              <button
                type="button"
                id="modal-play-level-btn"
                onClick={() => {
                  sound.click();
                  onSelectLevel(previewLevelNumber);
                  setPreviewLevelNumber(null);
                }}
                className="btn-3d-primary w-full py-3.5 text-base gap-2"
              >
                <Play className="w-5 h-5 fill-white" />
                <span>
                  {((progress && progress[previewLevelNumber]?.stars) || 0) > 0
                    ? `Replay Level ${previewLevelNumber}`
                    : `Start Level ${previewLevelNumber}`}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPreviewLevelNumber(null)}
                className="btn-3d-secondary w-full py-2 text-xs"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MILESTONE REWARD CHEST MODAL */}
      {selectedMilestoneUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-pop">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-xs w-full p-6 shadow-xl text-center flex flex-col items-center gap-4">
            <div className="w-full flex justify-end -mb-2">
              <button
                type="button"
                onClick={() => setSelectedMilestoneUnit(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="w-20 h-20 rounded-3xl bg-amber-100 border-2 border-amber-300 flex items-center justify-center shadow-md -mt-4">
              <Gift className="w-10 h-10 text-amber-600" />
            </div>

            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200">
                {selectedMilestoneUnit.title} Milestone
              </span>
              <h3 className="font-heading font-black text-xl text-slate-900 mt-1">
                {selectedMilestoneUnit.rewardName}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Complete all {selectedMilestoneUnit.levels.length} levels in {selectedMilestoneUnit.title} ({selectedMilestoneUnit.levelRangeLabel}) to unlock this bonus reward!
              </p>
            </div>

            <div className="bg-amber-50 rounded-2xl p-3 w-full border border-amber-200 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span className="font-black text-amber-900 text-sm">
                Bonus Reward: +{selectedMilestoneUnit.rewardCoins} Coins
              </span>
            </div>

            <button
              type="button"
              onClick={() => setSelectedMilestoneUnit(null)}
              className="btn-3d-primary w-full py-3 text-xs"
            >
              Awesome!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
