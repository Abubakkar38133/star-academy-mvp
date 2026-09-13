import React from 'react';
import { ComplexityTier, COMPLEXITY_TIERS } from '../types';
import { sound } from '../services/sound';
import { DifficultySelector } from './DifficultySelector';
import { MascotBuddy } from './MascotBuddy';
import {
  Shield,
  Volume2,
  VolumeX,
  Play,
  Mic,
  GraduationCap,
} from 'lucide-react';

interface WelcomeScreenProps {
  currentTier: ComplexityTier;
  voiceEnabled: boolean;
  onStart: () => void;
  onChangeTier: (tier: ComplexityTier) => void;
  onToggleVoice: () => void;
  onOpenParentCorner: () => void;
  onOpenPlayroom?: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  currentTier,
  voiceEnabled,
  onStart,
  onChangeTier,
  onToggleVoice,
  onOpenParentCorner,
  onOpenPlayroom,
}) => {
  return (
    <div className="flex flex-col items-center justify-between min-h-full w-full p-4 sm:p-6 bg-slate-50 text-center select-none relative overflow-y-auto scroll-touch">
      {/* Top Utility Controls */}
      <div className="w-full max-w-lg flex items-center justify-between z-10 pt-1">
        <button
          type="button"
          onClick={() => {
            sound.tap();
            onOpenParentCorner();
          }}
          className="px-3 sm:px-4 py-2 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 text-xs font-black text-slate-700 shadow-2xs active:scale-95 flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Shield className="w-4 h-4 text-emerald-700" />
          <span>Parent Corner</span>
        </button>

        <button
          type="button"
          onClick={() => {
            sound.tap();
            onToggleVoice();
          }}
          className={`px-3 sm:px-4 py-2 rounded-2xl border flex items-center gap-1.5 text-xs font-black shadow-2xs active:scale-95 transition-all cursor-pointer ${
            voiceEnabled
              ? 'bg-white border-emerald-300 text-emerald-800'
              : 'bg-slate-100 border-slate-200 text-slate-500'
          }`}
          title={voiceEnabled ? 'Voice narration is ON' : 'Voice narration is muted'}
        >
          {voiceEnabled ? <Volume2 className="w-4 h-4 text-emerald-700" /> : <VolumeX className="w-4 h-4" />}
          <span>{voiceEnabled ? 'Sound On' : 'Muted'}</span>
        </button>
      </div>

      {/* Main Kid-Centric Welcome Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-8 flex flex-col items-center gap-4 sm:gap-5 my-auto max-w-lg w-full">
        {/* Academic App Badge */}
        <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
          <GraduationCap className="w-6 h-6" />
        </div>

        {/* Big Game Title */}
        <div className="space-y-1">
          <h1 className="font-heading text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            StarScholar Academy
          </h1>
          <p className="text-xs sm:text-sm font-bold text-slate-500">
            Learn & Play Fun Quizzes!
          </p>
        </div>

        {/* Playful Mascot Owl */}
        <div className="my-1">
          <MascotBuddy
            size="md"
            mood="happy"
            speechBubbleText="Hi! Tap Start to play!"
            showControls={false}
            interactive={true}
          />
        </div>

        {/* Age Level Selector - Tactile & Clear */}
        <div className="w-full bg-slate-50 p-3 rounded-2xl border border-slate-200">
          <div className="text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2 text-left px-1">
            Choose Your Age
          </div>
          <DifficultySelector
            currentTier={currentTier}
            onChange={onChangeTier}
            compact={false}
          />
        </div>

        {/* Tactile 3D Action Buttons (Reverse-Engineered Duolingo Physics) */}
        <div className="w-full space-y-3 pt-1">
          {/* 1. Hero Start Button */}
          <button
            type="button"
            onClick={() => {
              sound.good();
              onStart();
            }}
            className="btn-3d-primary w-full h-14 sm:h-16 text-base sm:text-lg gap-2.5 shadow-md"
          >
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Play className="w-4 h-4 text-white fill-white ml-0.5" />
            </div>
            <span>START GAME</span>
          </button>

          {/* 2. Secondary Owl Playroom */}
          {onOpenPlayroom && (
            <button
              type="button"
              onClick={() => {
                sound.owlChirp();
                onOpenPlayroom();
              }}
              className="btn-3d-secondary w-full h-12 text-sm gap-2"
            >
              <Mic className="w-4 h-4 text-amber-600" />
              <span>Talk with Owl</span>
            </button>
          )}
        </div>
      </div>

      {/* Subtle reassurance footer */}
      <div className="text-[11px] text-slate-400 font-semibold py-2">
        100% Safe for Kids • No Ads
      </div>
    </div>
  );
};
