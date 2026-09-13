import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Volume2,
  Lightbulb,
  CheckCircle2,
  XCircle,
  Star,
  Gift,
  Coins,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Award,
} from 'lucide-react';
import { PathLevel, GKQuestion, SaveData } from '../types';
import { getLevelData, getDifficultyColor } from '../data/levelProgression';
import { sound } from '../services/sound';
import { voice } from '../services/voice';
import { MascotBuddy } from './MascotBuddy';
import { shuffleQuestionOptions } from '../utils/shuffle';

interface LevelPlayArenaProps {
  levelNumber: number;
  data: SaveData;
  onCompleteLevel: (stars: number, score: number, total: number, coinsEarned: number) => void;
  onExit: () => void;
  onNextLevel: (nextLevelNum: number) => void;
}

export const LevelPlayArena: React.FC<LevelPlayArenaProps> = ({
  levelNumber,
  data,
  onCompleteLevel,
  onExit,
  onNextLevel,
}) => {
  const level: PathLevel = useMemo(() => getLevelData(levelNumber), [levelNumber]);
  const [playSessionKey, setPlaySessionKey] = useState(0);

  // Shuffle question options so correct answer is NOT always B (1)
  const questions: GKQuestion[] = useMemo(() => {
    return level.questions.map(q => shuffleQuestionOptions(q));
  }, [level, playSessionKey]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [owlReaction, setOwlReaction] = useState<'neutral' | 'happy' | 'thinking'>('neutral');

  const currentQ = questions[currentIndex] || questions[0];
  const diffColor = getDifficultyColor(level.difficulty);

  // Read aloud question with kid-friendly voice
  const speakText = (text: string) => {
    if (!data.voiceEnabled) return;
    voice.setRate(data.speechRate || 0.88);
    voice.say(text);
  };

  useEffect(() => {
    if (currentQ) {
      speakText(currentQ.question);
    }
    setShowHint(false);
    setSelectedOption(null);
    setIsAnswered(false);
    setOwlReaction('neutral');
  }, [currentIndex, levelNumber, playSessionKey]);

  const handleSelectOption = (index: number) => {
    if (isAnswered || !currentQ) return;
    setSelectedOption(index);
    setIsAnswered(true);

    const isCorrect = index === currentQ.correctIndex;
    if (isCorrect) {
      sound.good();
      setScore((prev) => prev + 1);
      setOwlReaction('happy');
    } else {
      sound.notYet();
      setOwlReaction('thinking');
    }
  };

  const handleNext = () => {
    sound.click();
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Calculate Stars & complete
      const finalScore = score + (selectedOption === currentQ.correctIndex ? 0 : 0);
      const total = questions.length;
      let earnedStars = 0;
      if (finalScore >= total) earnedStars = 3;
      else if (finalScore >= 4) earnedStars = 2;
      else if (finalScore >= level.targetPassScore) earnedStars = 1;

      const baseCoins = earnedStars > 0 ? level.coinReward : 5;
      const milestoneBonus = (earnedStars > 0 && level.isMilestone) ? 25 : 0;
      const totalCoinsEarned = baseCoins + milestoneBonus;

      if (earnedStars > 0) {
        sound.fanfare();
      } else {
        sound.notYet();
      }

      onCompleteLevel(earnedStars, finalScore, total, totalCoinsEarned);
      setShowResults(true);
    }
  };

  // If results modal is active
  if (showResults) {
    const total = questions.length;
    let earnedStars = 0;
    if (score >= total) earnedStars = 3;
    else if (score >= 4) earnedStars = 2;
    else if (score >= level.targetPassScore) earnedStars = 1;
    const passed = earnedStars > 0;
    const coinsEarned = passed ? (level.coinReward + (level.isMilestone ? 25 : 0)) : 5;

    return (
      <div className="w-full h-full overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 z-50 select-none">
        <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-slate-200 shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
          {/* Top Badge */}
          <div className="w-20 h-20 rounded-3xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto shadow-md">
            {passed ? (
              <Award className="w-10 h-10 text-amber-500" />
            ) : (
              <RotateCcw className="w-10 h-10 text-slate-400" />
            )}
          </div>

          <div className="space-y-1.5">
            <span className={`inline-block text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full ${diffColor.badgeBg} ${diffColor.badgeText}`}>
              Level {level.levelNumber} Complete
            </span>
            <h2 className="font-heading text-2xl sm:text-3xl font-black text-slate-900">
              {passed ? 'Outstanding Work!' : 'Good Effort! Try Again!'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              {passed
                ? `You conquered ${level.title} with great mastery!`
                : `You scored ${score} out of ${total}. Score at least ${level.targetPassScore} to pass to the next level!`}
            </p>
          </div>

          {/* Star Celebration */}
          <div className="flex items-center justify-center gap-3 py-2">
            {[1, 2, 3].map((starIdx) => (
              <div
                key={starIdx}
                className={`p-3 rounded-2xl border transition-all ${
                  starIdx <= earnedStars
                    ? 'bg-amber-50 border-amber-300 scale-110 shadow-sm'
                    : 'bg-slate-50 border-slate-200 opacity-40'
                }`}
              >
                <Star
                  className={`w-8 h-8 ${
                    starIdx <= earnedStars
                      ? 'text-amber-500 fill-amber-400'
                      : 'text-slate-300'
                  }`}
                />
              </div>
            ))}
          </div>

          {/* Score & Coin Stats */}
          <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Score</p>
              <p className="text-xl font-black text-slate-900">{score} / {total}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Coins Awarded</p>
              <div className="flex items-center gap-1.5 text-amber-800 font-black text-xl">
                <Coins className="w-5 h-5 text-amber-500 fill-amber-400" />
                <span>+{coinsEarned}</span>
              </div>
            </div>
          </div>

          {/* Milestone Chest Alert if passed */}
          {passed && level.isMilestone && (
            <div className="p-4 bg-gradient-to-r from-amber-100 via-yellow-100 to-amber-100 rounded-2xl border border-amber-300 text-left flex items-center gap-3.5 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-heading font-black text-xs text-amber-950">
                  {level.milestoneRewardName || 'Milestone Award Unlocked!'}
                </h4>
                <p className="text-[11px] text-amber-800">
                  Bonus coins and permanent achievement record unlocked!
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            {passed && (
              <button
                id="next-level-btn"
                onClick={() => {
                  sound.click();
                  onNextLevel(level.levelNumber + 1);
                }}
                className="btn-3d-primary w-full py-4 text-sm sm:text-base gap-2"
              >
                <span>Continue to Level {level.levelNumber + 1}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              <button
                id="replay-level-btn"
                onClick={() => {
                  sound.click();
                  setCurrentIndex(0);
                  setSelectedOption(null);
                  setIsAnswered(false);
                  setScore(0);
                  setShowResults(false);
                  setPlaySessionKey(k => k + 1);
                }}
                className="btn-3d-secondary py-3 text-xs sm:text-sm gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Play Again</span>
              </button>

              <button
                id="exit-to-map-btn"
                onClick={() => {
                  sound.click();
                  onExit();
                }}
                className="btn-3d-secondary py-3 text-xs sm:text-sm"
              >
                <span>Level Map</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const progressPercent = Math.round(((currentIndex) / questions.length) * 100);
  const isSelectedCorrect = selectedOption !== null && selectedOption === currentQ.correctIndex;

  return (
    <div className="w-full h-full overflow-y-auto bg-slate-50 select-none flex flex-col justify-between">
      <div className="max-w-xl mx-auto w-full px-4 pt-4 sm:pt-6 pb-28 space-y-4 sm:space-y-5">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between gap-3">
          <button
            id="exit-quiz-btn"
            onClick={() => {
              sound.click();
              onExit();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs shadow-2xs cursor-pointer transition-all active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Map</span>
          </button>

          {/* Level Info & Difficulty */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5">
              <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${diffColor.badgeBg} ${diffColor.badgeText}`}>
                {level.difficulty}
              </span>
              <span className="font-heading font-black text-sm sm:text-base text-slate-900">
                Level {level.levelNumber}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium truncate max-w-[200px]">
              {level.title}
            </p>
          </div>

          {/* Question Counter */}
          <div className="px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-black text-xs">
            {currentIndex + 1} / {questions.length}
          </div>
        </div>

        {/* Smooth Progress Bar */}
        <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Question Text & Audio / Hint Utilities */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-heading text-lg sm:text-xl font-black text-slate-900 leading-snug">
              {currentQ.question}
            </h3>

            {/* Read Aloud & Hint Buttons */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                id="listen-question-btn"
                onClick={() => {
                  sound.click();
                  speakText(currentQ.question);
                }}
                title="Read Question Aloud"
                className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-emerald-50 text-emerald-600 shadow-2xs cursor-pointer active:scale-95 transition-all"
              >
                <Volume2 className="w-4 h-4" />
              </button>

              {currentQ.hint && (
                <button
                  id="show-hint-btn"
                  onClick={() => {
                    sound.click();
                    setShowHint(!showHint);
                  }}
                  title="Show Owl Hint"
                  className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-800 shadow-2xs cursor-pointer active:scale-95 transition-all flex items-center gap-1 text-xs font-bold"
                >
                  <Lightbulb className="w-4 h-4 text-amber-600" />
                  <span className="hidden sm:inline">Hint</span>
                </button>
              )}
            </div>
          </div>

          {/* Hint Card if toggled */}
          {showHint && currentQ.hint && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 animate-in fade-in duration-150 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Clue: </span>
                <span>{currentQ.hint}</span>
              </div>
            </div>
          )}

          {/* Tactile 3D Multiple Choice Option Tiles */}
          <div className="grid grid-cols-1 gap-2.5 pt-1">
            {currentQ.options.map((opt, optIdx) => {
              const letter = ['A', 'B', 'C', 'D'][optIdx];
              const isSelected = selectedOption === optIdx;
              const isCorrect = optIdx === currentQ.correctIndex;

              let tileClasses = 'bg-white border-2 border-slate-200 border-b-4 hover:border-slate-300 text-slate-800';
              if (isAnswered) {
                if (isCorrect) {
                  tileClasses = 'bg-emerald-50 border-2 border-emerald-500 border-b-4 text-emerald-950 font-black';
                } else if (isSelected) {
                  tileClasses = 'bg-rose-50 border-2 border-rose-500 border-b-4 text-rose-950 font-black';
                } else {
                  tileClasses = 'bg-slate-50 border-2 border-slate-200 border-b-4 text-slate-400 opacity-50';
                }
              }

              return (
                <button
                  key={optIdx}
                  id={`option-${optIdx}`}
                  onClick={() => handleSelectOption(optIdx)}
                  disabled={isAnswered}
                  className={`w-full text-left p-3.5 sm:p-4 rounded-2xl shadow-2xs flex items-center justify-between gap-3 transition-all select-none ${tileClasses} ${
                    !isAnswered ? 'cursor-pointer active:translate-y-1 active:border-b-2' : 'cursor-default'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-heading font-black text-xs shrink-0 ${
                      isAnswered && isCorrect
                        ? 'bg-emerald-600 text-white'
                        : isAnswered && isSelected
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {letter}
                    </span>
                    <span className="text-sm sm:text-base font-bold">
                      {opt}
                    </span>
                  </div>

                  {isAnswered && (
                    <div>
                      {isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                      {isSelected && !isCorrect && <XCircle className="w-5 h-5 text-rose-600" />}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* DUOLINGO DOCKED BOTTOM EVALUATION SHEET */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-40 border-t-2 transition-all duration-200 p-4 sm:p-5 ${
          !isAnswered
            ? 'bg-white border-slate-200 shadow-lg'
            : isSelectedCorrect
            ? 'bg-emerald-50 border-emerald-400 shadow-xl'
            : 'bg-rose-50 border-rose-400 shadow-xl'
        }`}
      >
        <div className="max-w-xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3.5 sm:gap-6">
          {/* Status Message or Prompt */}
          {!isAnswered ? (
            <div className="text-center sm:text-left text-xs sm:text-sm font-bold text-slate-400 py-1">
              Pick an answer
            </div>
          ) : (
            <div className="flex items-start gap-3 w-full sm:w-auto">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                isSelectedCorrect ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
              }`}>
                {isSelectedCorrect ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
              </div>
              <div>
                <h4 className={`font-heading font-black text-base leading-tight ${
                  isSelectedCorrect ? 'text-emerald-950' : 'text-rose-950'
                }`}>
                  {isSelectedCorrect ? 'Great Job!' : 'Keep Going!'}
                </h4>
                <p className={`text-xs sm:text-sm font-medium mt-0.5 leading-snug line-clamp-2 ${
                  isSelectedCorrect ? 'text-emerald-800' : 'text-rose-800'
                }`}>
                  {currentQ.explanation}
                </p>
              </div>
            </div>
          )}

          {/* Action Button */}
          {isAnswered && (
            <button
              id="next-question-btn"
              onClick={handleNext}
              className={`w-full sm:w-48 py-3.5 sm:py-4 text-sm sm:text-base gap-2 shrink-0 ${
                isSelectedCorrect ? 'btn-3d-success' : 'btn-3d-primary'
              }`}
            >
              <span>{currentIndex + 1 < questions.length ? 'Continue' : 'Finish'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
