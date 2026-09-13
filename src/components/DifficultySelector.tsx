import React from 'react';
import { ComplexityTier, COMPLEXITY_TIERS } from '../types';
import { sound } from '../services/sound';

interface DifficultySelectorProps {
  currentTier: ComplexityTier;
  onChange?: (tier: ComplexityTier) => void;
  compact?: boolean;
}

export const DifficultySelector: React.FC<DifficultySelectorProps> = ({
  currentTier,
  onChange,
  compact = false,
}) => {
  const tiers: { id: ComplexityTier; levelNum: number; shortLabel: string }[] = [
    { id: 'sprout', levelNum: 1, shortLabel: 'Junior' },
    { id: 'explorer', levelNum: 2, shortLabel: 'Explorer' },
    { id: 'champion', levelNum: 3, shortLabel: 'Master' },
  ];

  return (
    <div
      className={`flex items-center gap-1.5 w-full ${
        compact
          ? 'bg-slate-100 p-1 rounded-2xl border border-slate-200'
          : 'p-1.5 bg-slate-100 rounded-2xl border border-slate-200 shadow-2xs'
      }`}
    >
      {tiers.map(t => {
        const config = COMPLEXITY_TIERS[t.id];
        const isSelected = currentTier === t.id;

        return (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              sound.tap();
              onChange?.(t.id);
            }}
            className={`flex-1 flex items-center justify-center gap-1 sm:gap-1.5 font-bold transition-all cursor-pointer ${
              compact
                ? `px-1.5 sm:px-2 py-1.5 rounded-xl text-[11px] sm:text-xs ${
                    isSelected
                      ? 'bg-white text-emerald-950 shadow-2xs font-extrabold ring-2 ring-emerald-500'
                      : 'text-slate-500 hover:text-slate-800'
                  }`
                : `px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm ${
                    isSelected
                      ? 'bg-white shadow-xs text-emerald-950 font-extrabold ring-2 ring-emerald-500'
                      : 'text-slate-500 hover:text-slate-800'
                  }`
            }`}
            title={config.description}
          >
            <span className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[9px] sm:text-[10px] font-black shrink-0 ${
              isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {t.levelNum}
            </span>
            <span className="whitespace-nowrap text-[11px] sm:text-xs md:text-sm">{t.shortLabel}</span>
            <span className={`hidden min-[380px]:inline text-[9px] sm:text-[10px] font-extrabold px-1 sm:px-1.5 py-0.5 rounded-md ${
              isSelected ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-200 text-slate-600'
            }`}>
              {config.ageLabel}
            </span>
          </button>
        );
      })}
    </div>
  );
};
