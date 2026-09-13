import React from 'react';
import {
  Compass,
  Brain,
  MapPin,
  Mic,
  Shield,
  Volume2,
  VolumeX,
  Coins,
  GraduationCap,
  Flame,
  Clock,
  Infinity as InfinityIcon,
} from 'lucide-react';
import { SaveData, COMPLEXITY_TIERS, ComplexityTier } from '../types';

export type ActiveTab = 'path' | 'gk' | 'states' | 'buddy';

interface NavigationProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  data: SaveData;
  onChangeTier?: (tier: ComplexityTier) => void;
  onOpenParentPortfolio: () => void;
  onToggleVoice: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  data,
  onChangeTier,
  onOpenParentPortfolio,
  onToggleVoice,
}) => {
  const tierConfig = COMPLEXITY_TIERS[data.tier];
  const isUnlimited = (data.sessionLimitMinutes ?? 0) <= 0;
  const currentLimitMins = data.sessionLimitMinutes ?? 0;
  const totalAllowedMs = currentLimitMins * 60 * 1000;
  const currentUsedMs = Math.min(totalAllowedMs, data.energyMs || 0);
  const remainingMins = isUnlimited
    ? null
    : Math.max(0, Math.ceil((totalAllowedMs - currentUsedMs) / (60 * 1000)));

  return (
    <>
      {/* TOP HEADER BAR (Compact on mobile, full-featured on desktop) */}
      <header className="w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-2.5 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-1.5 sm:gap-4 z-40 sticky top-0 shrink-0 select-none">
        {/* Brand & Tier Quick-Select */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-emerald-600 to-green-600 flex items-center justify-center text-white shadow-xs shrink-0">
            <GraduationCap className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
          <div className="flex items-center gap-1 sm:gap-2 min-w-0">
            <span className="font-heading font-black text-xs sm:text-base text-slate-900 truncate">
              StarScholar
            </span>
            {/* Quick Level Selector Button */}
            <select
              value={data.tier}
              onChange={e => onChangeTier?.(e.target.value as ComplexityTier)}
              className="text-[10px] sm:text-xs font-extrabold px-1.5 sm:px-2.5 py-1 rounded-xl bg-emerald-50/90 hover:bg-emerald-100/90 text-emerald-950 border border-emerald-200/90 cursor-pointer outline-none transition-colors max-w-[105px] sm:max-w-none"
              title="Change Learning Age Level"
            >
              <option value="sprout">Junior (5-7)</option>
              <option value="explorer">Scholar (8-10)</option>
              <option value="champion">Master (11-12+)</option>
            </select>
          </div>
        </div>

        {/* DESKTOP & TABLET NAVIGATION BUTTONS (Unified StarScholar Academic Brand) */}
        <nav className="hidden sm:flex items-center gap-1 md:gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button
            type="button"
            onClick={() => onSelectTab('path')}
            className={`flex items-center gap-1.5 px-3 md:px-3.5 py-1.5 md:py-2 rounded-xl font-heading font-black text-xs md:text-sm transition-all cursor-pointer select-none ${
              activeTab === 'path'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Compass className={`w-4 h-4 ${activeTab === 'path' ? 'text-white' : 'text-emerald-700'}`} />
            <span>Trail Map</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('gk')}
            className={`flex items-center gap-1.5 px-3 md:px-3.5 py-1.5 md:py-2 rounded-xl font-heading font-black text-xs md:text-sm transition-all cursor-pointer select-none ${
              activeTab === 'gk'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Brain className={`w-4 h-4 ${activeTab === 'gk' ? 'text-white' : 'text-emerald-700'}`} />
            <span>Practice Lab</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('states')}
            className={`flex items-center gap-1.5 px-3 md:px-3.5 py-1.5 md:py-2 rounded-xl font-heading font-black text-xs md:text-sm transition-all cursor-pointer select-none ${
              activeTab === 'states'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <MapPin className={`w-4 h-4 ${activeTab === 'states' ? 'text-white' : 'text-emerald-700'}`} />
            <span>50 States</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('buddy')}
            className={`flex items-center gap-1.5 px-3 md:px-3.5 py-1.5 md:py-2 rounded-xl font-heading font-black text-xs md:text-sm transition-all cursor-pointer select-none ${
              activeTab === 'buddy'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Mic className={`w-4 h-4 ${activeTab === 'buddy' ? 'text-white' : 'text-amber-500'}`} />
            <span>Talking Owl</span>
          </button>
        </nav>

        {/* Right Utility Controls: Coins, Narration, Parent Gate */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Star / Coin Counter */}
          <div className="flex items-center gap-1 bg-amber-50/90 border border-amber-200/80 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-black text-amber-900 shadow-2xs">
            <Coins className="w-3.5 h-3.5 text-amber-600 fill-amber-400" />
            <span>{data.coins}</span>
          </div>

          {/* Voice Speech Toggle */}
          <button
            type="button"
            onClick={onToggleVoice}
            title={data.voiceEnabled ? 'Mute Voice Audio' : 'Turn On Voice Audio'}
            className={`w-7 h-7 sm:w-9 sm:h-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95 ${
              data.voiceEnabled
                ? 'bg-white border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                : 'bg-slate-100 border-slate-200 text-slate-400'
            }`}
          >
            {data.voiceEnabled ? <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          </button>

          {/* Screen Time Status Indicator (Tablet & Desktop) */}
          <button
            type="button"
            onClick={onOpenParentPortfolio}
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
              isUnlimited
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                : (remainingMins ?? 0) <= 5
                ? 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900 hover:bg-emerald-100'
            }`}
            title={
              isUnlimited
                ? 'Screen Time: Unlimited (Click to adjust in Parent Corner)'
                : `Screen Time: ${remainingMins}m left of ${currentLimitMins}m limit (Click to adjust)`
            }
          >
            {isUnlimited ? (
              <>
                <InfinityIcon className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden lg:inline">Unlimited</span>
              </>
            ) : (
              <>
                <Clock className="w-3.5 h-3.5 text-emerald-700" />
                <span>{remainingMins}m left</span>
              </>
            )}
          </button>

          {/* Parent Portal Gate */}
          <button
            type="button"
            onClick={onOpenParentPortfolio}
            className="flex items-center justify-center gap-1 sm:gap-1.5 w-7 h-7 sm:w-auto px-0 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-xs active:scale-95"
            title="Parent Dashboard"
          >
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden lg:inline">Parent Corner</span>
            <span className="hidden sm:inline lg:hidden text-xs">Parents</span>
          </button>
        </div>
      </header>

      {/* MOBILE BOTTOM NAVIGATION BAR (Unified StarScholar Academic Brand) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-1 py-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(0,0,0,0.06)] flex items-center justify-around select-none">
        <button
          type="button"
          onClick={() => onSelectTab('path')}
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer ${
            activeTab === 'path'
              ? 'text-emerald-700 font-black'
              : 'text-slate-500 hover:text-slate-800 font-bold'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-colors ${activeTab === 'path' ? 'bg-emerald-50 ring-1 ring-emerald-200' : ''}`}>
            <Compass className="w-4 h-4" />
          </div>
          <span className="text-[10px] mt-0.5 leading-tight">Trail</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('gk')}
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer ${
            activeTab === 'gk'
              ? 'text-emerald-700 font-black'
              : 'text-slate-500 hover:text-slate-800 font-bold'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-colors ${activeTab === 'gk' ? 'bg-emerald-50 ring-1 ring-emerald-200' : ''}`}>
            <Brain className="w-4 h-4" />
          </div>
          <span className="text-[10px] mt-0.5 leading-tight">Practice</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('states')}
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer ${
            activeTab === 'states'
              ? 'text-emerald-700 font-black'
              : 'text-slate-500 hover:text-slate-800 font-bold'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-colors ${activeTab === 'states' ? 'bg-emerald-50 ring-1 ring-emerald-200' : ''}`}>
            <MapPin className="w-4 h-4" />
          </div>
          <span className="text-[10px] mt-0.5 leading-tight">50 States</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('buddy')}
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer ${
            activeTab === 'buddy'
              ? 'text-emerald-700 font-black'
              : 'text-slate-500 hover:text-slate-800 font-bold'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-colors ${activeTab === 'buddy' ? 'bg-emerald-50 ring-1 ring-emerald-200' : ''}`}>
            <Mic className="w-4 h-4" />
          </div>
          <span className="text-[10px] mt-0.5 leading-tight">Owl Room</span>
        </button>
      </nav>
    </>
  );
};
