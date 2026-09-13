import React, { useState, useEffect } from 'react';
import {
  Brain,
  HelpCircle,
  Sparkles,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Volume2,
  Lightbulb,
  Award,
  ChevronLeft,
  Clock,
  Zap,
  BookOpen,
  Landmark,
  MapPin,
  Rocket,
  Star,
  Coins,
  Calculator,
} from 'lucide-react';
import { GKCategory, GKQuestion, ComplexityTier, QuizResultLog, QuizQuestionReview } from '../types';
import { GK_CATEGORIES, GK_QUESTIONS } from '../data/gkQuestions';
import { sound } from '../services/sound';
import { voice } from '../services/voice';
import { MascotBuddy } from './MascotBuddy';
import { shuffleQuestionOptions } from '../utils/shuffle';

interface GKArenaProps {
  tier: ComplexityTier;
  voiceEnabled: boolean;
  onSaveQuizResult: (log: QuizResultLog) => void;
  onOpenParentPortfolio: () => void;
}

const renderCategoryIcon = (id: string) => {
  switch (id) {
    case 'us_history':
      return <Landmark className="w-6 h-6 text-blue-600" />;
    case 'geography':
      return <MapPin className="w-6 h-6 text-emerald-600" />;
    case 'science':
      return <Rocket className="w-6 h-6 text-purple-600" />;
    case 'animals':
      return <Sparkles className="w-6 h-6 text-amber-600" />;
    case 'inventions':
      return <Lightbulb className="w-6 h-6 text-cyan-600" />;
    case 'math_logic':
      return <Calculator className="w-6 h-6 text-rose-600" />;
    default:
      return <Brain className="w-6 h-6 text-blue-600" />;
  }
};

export const GKArena: React.FC<GKArenaProps> = ({
  tier,
  voiceEnabled,
  onSaveQuizResult,
  onOpenParentPortfolio,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<GKCategory | 'all' | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<GKQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [reviews, setReviews] = useState<QuizQuestionReview[]>([]);
  const [score, setScore] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [isQuizComplete, setIsQuizComplete] = useState<boolean>(false);

  // Timer Sprint Mode
  const [timedMode, setTimedMode] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(20);
  const [quizDifficulty, setQuizDifficulty] = useState<ComplexityTier>(tier);
  const [isUnlimitedMode, setIsUnlimitedMode] = useState<boolean>(false);
  const [currentStreak, setCurrentStreak] = useState<number>(0);

  // Start a quiz session with level-by-level progression and unlimited option
  const startQuiz = (
    category: GKCategory | 'all',
    isTimed: boolean = timedMode,
    targetTier?: ComplexityTier,
    unlimited: boolean = false,
    questionCount: number = 10
  ) => {
    sound.pick();
    setSelectedCategory(category);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setIsAnswerSubmitted(false);
    setShowHint(false);
    setReviews([]);
    setScore(0);
    setCurrentStreak(0);
    setIsQuizComplete(false);
    setStartTime(Date.now());
    setTimedMode(isTimed);
    setTimeLeft(20);
    setIsUnlimitedMode(unlimited);

    const activeTier = targetTier || quizDifficulty || tier;
    setQuizDifficulty(activeTier);

    // Filter questions by category
    let pool = GK_QUESTIONS;
    if (category !== 'all') {
      pool = pool.filter(q => q.category === category);
    }

    // Build progressive question list: starting at activeTier, then escalating if unlimited
    let tiered = pool.filter(q => q.tier === activeTier);
    if (tiered.length < questionCount) {
      tiered = pool;
    }

    const shuffled = [...tiered]
      .sort(() => 0.5 - Math.random())
      .slice(0, questionCount)
      .map(q => shuffleQuestionOptions(q));
    setQuizQuestions(shuffled);

    if (voiceEnabled && shuffled.length > 0) {
      setTimeout(() => {
        voice.say(shuffled[0].question);
      }, 300);
    }
  };

  // Timer effect for timed mode
  useEffect(() => {
    if (!timedMode || isAnswerSubmitted || isQuizComplete || quizQuestions.length === 0) return;

    if (timeLeft <= 0) {
      // Auto-submit time out
      handleSelectOption(-1);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timedMode, timeLeft, isAnswerSubmitted, isQuizComplete, quizQuestions.length]);

  const currentQ = quizQuestions[currentIndex];

  const handleSelectOption = (index: number) => {
    if (isAnswerSubmitted) return;
    setSelectedAnswer(index);
    setIsAnswerSubmitted(true);

    const isCorrect = index === currentQ.correctIndex;
    if (isCorrect) {
      sound.good();
      setScore(prev => prev + 1);
      setCurrentStreak(prev => prev + 1);
      if (voiceEnabled) {
        voice.say("Awesome! That's right!");
      }
    } else {
      sound.notYet();
      setCurrentStreak(0);
      if (voiceEnabled) {
        const correctText = currentQ.options[currentQ.correctIndex];
        voice.say(`Good try! The answer is ${correctText}.`);
      }
    }

    const reviewItem: QuizQuestionReview = {
      question: currentQ.question,
      options: currentQ.options,
      chosenIndex: index,
      correctIndex: currentQ.correctIndex,
      isCorrect,
      explanation: currentQ.explanation,
    };
    setReviews(prev => [...prev, reviewItem]);
  };

  const finishQuizSession = () => {
    sound.cheer();
    setIsQuizComplete(true);

    const timeSpent = Math.max(15, Math.round((Date.now() - startTime) / 1000));
    const total = quizQuestions.length;
    const finalScore = score;
    const percentage = Math.round((finalScore / Math.max(1, total)) * 100);

    const categoryLabel =
      selectedCategory === 'all'
        ? isUnlimitedMode
          ? 'Unlimited Quest'
          : '10-Question Sprint'
        : GK_CATEGORIES.find(c => c.id === selectedCategory)?.label || 'General Knowledge';

    const log: QuizResultLog = {
      id: `quiz_${Date.now()}`,
      timestamp: Date.now(),
      title: `${categoryLabel} (${quizDifficulty})`,
      category: selectedCategory === 'all' ? 'general' : (selectedCategory as GKCategory),
      tier: quizDifficulty,
      score: finalScore,
      total,
      percentage,
      timeSpentSeconds: timeSpent,
      reviews: [...reviews],
    };

    onSaveQuizResult(log);

    if (voiceEnabled) {
      voice.say(`Terrific job! You scored ${finalScore} stars!`);
    }
  };

  const handleNext = () => {
    sound.tap();
    if (currentIndex < quizQuestions.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setSelectedAnswer(null);
      setIsAnswerSubmitted(false);
      setShowHint(false);
      setTimeLeft(20);
      if (voiceEnabled && quizQuestions[nextIdx]) {
        voice.say(quizQuestions[nextIdx].question);
      }
    } else if (isUnlimitedMode) {
      // Endless mode: dynamically add new questions that get harder with higher score!
      const usedIds = new Set(quizQuestions.map(q => q.id));
      let available = GK_QUESTIONS.filter(q => !usedIds.has(q.id));
      if (available.length === 0) available = GK_QUESTIONS;

      // Higher score -> higher tier
      const nextTier: ComplexityTier = score >= 12 ? 'champion' : score >= 6 ? 'explorer' : 'sprout';
      let candidates = available.filter(q => q.tier === nextTier);
      if (candidates.length === 0) candidates = available;
      const nextQ = candidates[Math.floor(Math.random() * candidates.length)];

      setQuizQuestions(prev => [...prev, shuffleQuestionOptions(nextQ)]);
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setSelectedAnswer(null);
      setIsAnswerSubmitted(false);
      setShowHint(false);
      setTimeLeft(20);
      if (voiceEnabled) {
        voice.say(nextQ.question);
      }
    } else {
      finishQuizSession();
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 space-y-6 select-none">
      {/* View 1: Category Selection Screen */}
      {!selectedCategory && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider">
                <Brain className="w-3.5 h-3.5 text-amber-300" />
                <span>Quiz Zone</span>
              </div>
              <h1 className="font-heading text-2xl sm:text-4xl font-extrabold tracking-tight">
                Fun Kid Quizzes
              </h1>
              <p className="text-emerald-100 text-sm sm:text-base leading-relaxed">
                Pick your difficulty level and answer fun questions to earn stars and coins!
              </p>

              {/* Level Selector Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <span className="text-xs font-bold text-emerald-200">Difficulty:</span>
                <button
                  onClick={() => {
                    sound.tap();
                    setQuizDifficulty('sprout');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    quizDifficulty === 'sprout'
                      ? 'bg-emerald-400 text-emerald-950 shadow-sm ring-2 ring-emerald-200'
                      : 'bg-white/15 text-white hover:bg-white/25'
                  }`}
                >
                  Level 1 (Ages 5-7)
                </button>
                <button
                  onClick={() => {
                    sound.tap();
                    setQuizDifficulty('explorer');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    quizDifficulty === 'explorer'
                      ? 'bg-teal-300 text-teal-950 shadow-sm ring-2 ring-teal-200'
                      : 'bg-white/15 text-white hover:bg-white/25'
                  }`}
                >
                  Level 2 (Ages 8-10)
                </button>
                <button
                  onClick={() => {
                    sound.tap();
                    setQuizDifficulty('champion');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    quizDifficulty === 'champion'
                      ? 'bg-amber-300 text-amber-950 shadow-sm ring-2 ring-amber-200'
                      : 'bg-white/15 text-white hover:bg-white/25'
                  }`}
                >
                  Level 3 (Ages 11-12+)
                </button>
              </div>
            </div>

            {/* Mode Toggle Pills: Normal vs Timed */}
            <div className="bg-white/15 p-2 rounded-2xl backdrop-blur-md z-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 self-stretch md:self-auto">
              <button
                onClick={() => {
                  sound.tap();
                  setTimedMode(false);
                }}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  !timedMode ? 'bg-white text-emerald-900 shadow-sm' : 'text-white hover:bg-white/10'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Relaxed</span>
              </button>
              <button
                onClick={() => {
                  sound.tap();
                  setTimedMode(true);
                }}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  timedMode ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-white hover:bg-white/10'
                }`}
              >
                <Zap className="w-4 h-4 text-amber-950" />
                <span>20s Timer</span>
              </button>
            </div>
          </div>

          {/* Quick Actions: 10-Question Sprint & Unlimited Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              onClick={() => startQuiz('all', timedMode, quizDifficulty, false, 10)}
              className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white shadow-sm hover:shadow-md hover:scale-[1.01] active:scale-95 transition-all cursor-pointer flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5">
                <span className="p-3 bg-white/20 rounded-2xl backdrop-blur-md flex items-center justify-center">
                  <Star className="w-7 h-7 text-white fill-amber-300" />
                </span>
                <div>
                  <h3 className="font-heading text-lg font-black">
                    10-Question Quiz
                  </h3>
                  <p className="text-white/90 text-xs">
                    10 fun questions mixing all topics!
                  </p>
                </div>
              </div>
              <ArrowRight className="w-6 h-6 text-white shrink-0" />
            </div>

            <div
              onClick={() => startQuiz('all', timedMode, quizDifficulty, true, 10)}
              className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white shadow-sm hover:shadow-md hover:scale-[1.01] active:scale-95 transition-all cursor-pointer flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5">
                <span className="p-3 bg-white/20 rounded-2xl backdrop-blur-md flex items-center justify-center">
                  <Zap className="w-7 h-7 text-white fill-yellow-300" />
                </span>
                <div>
                  <h3 className="font-heading text-lg font-black">
                    Unlimited Questions Mode
                  </h3>
                  <p className="text-white/90 text-xs">
                    Questions get harder as your streak goes up!
                  </p>
                </div>
              </div>
              <ArrowRight className="w-6 h-6 text-white shrink-0" />
            </div>
          </div>

          {/* Subject Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {GK_CATEGORIES.map(cat => {
              const countInTier = GK_QUESTIONS.filter(q => q.category === cat.id && q.tier === quizDifficulty).length;
              return (
                <div
                  key={cat.id}
                  onClick={() => startQuiz(cat.id, timedMode, quizDifficulty, false, 10)}
                  className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs hover:shadow-md hover:border-emerald-400 transition-all cursor-pointer flex flex-col justify-between gap-4 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="w-12 h-12 bg-slate-50 rounded-2xl group-hover:scale-110 transition-transform flex items-center justify-center">
                        {renderCategoryIcon(cat.id)}
                      </span>
                      <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {countInTier > 0 ? `${countInTier}+ Questions` : 'All Ages'}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-heading text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                        {cat.label}
                      </h3>
                      <p className="text-xs text-slate-500 leading-relaxed mt-1">
                        {cat.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs font-bold text-emerald-700">
                    <span>Play 10 Questions</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* View 2: Active Quiz Screen */}
      {selectedCategory && !isQuizComplete && currentQ && (
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Quiz Top Status Bar */}
          <div className="flex items-center justify-between bg-white rounded-2xl px-5 py-3 border border-slate-200 shadow-xs">
            <button
              onClick={() => {
                sound.tap();
                setSelectedCategory(null);
              }}
              className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Exit Quiz</span>
            </button>

            <div className="flex items-center gap-3">
              {/* Question Progress Pill */}
              <span className="text-xs font-extrabold px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full">
                {isUnlimitedMode
                  ? `Q #${currentIndex + 1} • Streak: ${currentStreak} 🔥`
                  : `Question ${currentIndex + 1} of ${quizQuestions.length}`}
              </span>

              {/* Timer in timed mode */}
              {timedMode && (
                <div
                  className={`flex items-center gap-1 text-xs font-extrabold px-3 py-1 rounded-full ${
                    timeLeft <= 5 ? 'bg-rose-100 text-rose-700 animate-pulse' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{timeLeft}s</span>
                </div>
              )}

              {isUnlimitedMode && (
                <button
                  type="button"
                  onClick={finishQuizSession}
                  className="px-2.5 py-1 text-xs font-black bg-amber-100 hover:bg-amber-200 text-amber-950 rounded-xl transition-colors cursor-pointer"
                >
                  Claim Stars ({score} ⭐)
                </button>
              )}
            </div>

            {/* Read Aloud Button */}
            <button
              onClick={() => voice.say(currentQ.question)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
              title="Read Question Aloud"
            >
              <Volume2 className="w-4 h-4 text-emerald-600" />
            </button>
          </div>

          {/* Mascot Companion Guidance in Quiz */}
          <div className="flex items-center justify-center -mb-2">
            <MascotBuddy
              size="sm"
              mood={isAnswerSubmitted ? (selectedAnswer === currentQ.correctIndex ? 'celebrate' : 'thinking') : 'happy'}
              speechBubbleText={
                isAnswerSubmitted
                  ? (selectedAnswer === currentQ.correctIndex ? "Hooray! That is correct!" : "Good effort! Check the explanation below.")
                  : "Pick your best answer, or tap me to read the question!"
              }
              showControls={false}
              onBubbleClick={() => voice.say(currentQ.question)}
            />
          </div>

          {/* Question Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            {/* Question Counter Tag & Icon */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                Question {currentIndex + 1} of {quizQuestions.length}
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
                {renderCategoryIcon(currentQ.category)}
              </div>
            </div>

            {/* Question Text */}
            <h2 className="font-heading text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug">
              {currentQ.question}
            </h2>

            {/* Hint Trigger */}
            {currentQ.hint && !isAnswerSubmitted && (
              <div>
                {!showHint ? (
                  <button
                    onClick={() => {
                      sound.tap();
                      setShowHint(true);
                      if (voiceEnabled) voice.say(`Hint: ${currentQ.hint}`);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-800 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 cursor-pointer"
                  >
                    <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                    <span>Need a Hint?</span>
                  </button>
                ) : (
                  <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200 text-xs text-amber-900 font-medium">
                    <span className="font-bold flex items-center gap-1 mb-0.5">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                      Helpful Hint:
                    </span>
                    {currentQ.hint}
                  </div>
                )}
              </div>
            )}

            {/* Options List */}
            <div className="grid grid-cols-1 gap-3 pt-2">
              {currentQ.options.map((option, idx) => {
                const isSelected = selectedAnswer === idx;
                const isCorrect = idx === currentQ.correctIndex;
                let btnStyle = 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50 hover:border-slate-300';

                if (isAnswerSubmitted) {
                  if (isCorrect) {
                    btnStyle = 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-300 font-bold';
                  } else if (isSelected) {
                    btnStyle = 'bg-rose-50 border-rose-500 text-rose-900 font-bold';
                  } else {
                    btnStyle = 'bg-slate-50 border-slate-200 text-slate-400 opacity-60';
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(idx)}
                    disabled={isAnswerSubmitted}
                    className={`p-4 rounded-2xl border text-left text-sm sm:text-base transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-600 shrink-0">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span>{option}</span>
                    </div>

                    {isAnswerSubmitted && isCorrect && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    )}
                    {isAnswerSubmitted && isSelected && !isCorrect && (
                      <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Simple Kid-Friendly Feedback & Next Step */}
            {isAnswerSubmitted && (
              <div className="pt-3 space-y-3 border-t border-slate-100">
                {selectedAnswer === currentQ.correctIndex ? (
                  <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-300 text-emerald-950 flex items-center gap-3">
                    <span className="text-2xl">🎉</span>
                    <div>
                      <span className="font-heading font-black text-sm sm:text-base block">Awesome! You got it right!</span>
                      <span className="text-xs sm:text-sm text-emerald-800 font-medium">
                        {currentQ.explanation.split('.')[0]}.
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-50 rounded-2xl p-4 border border-amber-300 text-amber-950 flex items-center gap-3">
                    <span className="text-2xl">⭐</span>
                    <div>
                      <span className="font-heading font-black text-sm sm:text-base block">
                        Good try! Right answer: {currentQ.options[currentQ.correctIndex]}
                      </span>
                      <span className="text-xs sm:text-sm text-amber-800 font-medium">
                        {currentQ.explanation.split('.')[0]}.
                      </span>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleNext}
                  className="btn-3d-primary w-full py-3.5 sm:py-4 text-base gap-2"
                >
                  <span>
                    {currentIndex < quizQuestions.length - 1
                      ? 'Next Question'
                      : isUnlimitedMode
                      ? 'Keep Playing (Next Question)'
                      : 'View Quiz Scoreboard'}
                  </span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* View 3: Post-Quiz Scoreboard & Question Review */}
      {isQuizComplete && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm text-center space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-400 to-orange-500 text-white flex items-center justify-center mx-auto shadow-md">
              <Award className="w-10 h-10 text-white" />
            </div>

            <div className="space-y-2">
              <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900">
                Quiz Quest Completed!
              </h2>
              <p className="text-slate-600 text-sm sm:text-base">
                You scored <span className="font-extrabold text-emerald-600 text-lg">{score}</span> out of {quizQuestions.length}!
              </p>
            </div>

            {/* Score Stats Row */}
            <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Correct</span>
                <span className="font-heading text-xl font-extrabold text-emerald-600">
                  {score}/{quizQuestions.length}
                </span>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Coins Won</span>
                <span className="font-heading text-xl font-extrabold text-amber-600 flex items-center justify-center gap-1">
                  +{score * 2} <Coins className="w-4 h-4 text-amber-600 fill-amber-400 inline" />
                </span>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Stars Earned</span>
                <span className="font-heading text-xl font-extrabold text-yellow-600 flex items-center justify-center gap-1">
                  +{score} <Star className="w-4 h-4 text-yellow-500 fill-yellow-400 inline" />
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => startQuiz(selectedCategory || 'all', timedMode, quizDifficulty, false, 10)}
                className="btn-3d-primary w-full sm:w-auto px-6 py-3.5 text-sm gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Play Again</span>
              </button>
              <button
                onClick={() => {
                  const nextTier: ComplexityTier =
                    quizDifficulty === 'sprout' ? 'explorer' : quizDifficulty === 'explorer' ? 'champion' : 'champion';
                  setQuizDifficulty(nextTier);
                  startQuiz(selectedCategory || 'all', timedMode, nextTier, false, 10);
                }}
                className="btn-3d-secondary w-full sm:w-auto px-6 py-3.5 text-sm gap-2"
              >
                <Zap className="w-4 h-4 text-amber-600" />
                <span>Level Up</span>
              </button>
              <button
                onClick={() => setSelectedCategory(null)}
                className="btn-3d-secondary w-full sm:w-auto px-6 py-3.5 text-sm"
              >
                Choose Topic
              </button>
            </div>
          </div>

          {/* Question-by-Question Review Accordion */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-heading font-extrabold text-lg text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
              <span>Question Review Breakdown</span>
              <span className="text-xs font-bold text-slate-500">
                {reviews.filter(r => r.isCorrect).length} Correct • {reviews.filter(r => !r.isCorrect).length} Needs Practice
              </span>
            </h3>

            <div className="space-y-3">
              {reviews.map((rev, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border text-left space-y-2 ${
                    rev.isCorrect ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50/50 border-rose-200'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {rev.isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <span className="font-bold text-sm text-slate-900 block">
                        {idx + 1}. {rev.question}
                      </span>
                      <div className="text-xs space-y-0.5">
                        <p className="text-slate-600">
                          Your answer: <span className={rev.isCorrect ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                            {rev.chosenIndex >= 0 ? rev.options[rev.chosenIndex] : 'Time Expired'}
                          </span>
                        </p>
                        {!rev.isCorrect && (
                          <p className="text-emerald-800 font-semibold">
                            Correct answer: {rev.options[rev.correctIndex]}
                          </p>
                        )}
                        <p className="text-slate-500 pt-1 leading-relaxed flex items-start gap-1">
                          <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                          <span>{rev.explanation}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
