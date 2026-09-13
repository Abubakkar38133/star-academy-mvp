import React, { useState } from 'react';
import {
  Zap,
  Flame,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Award,
  Volume2,
  HelpCircle,
  Coins,
} from 'lucide-react';
import { ComplexityTier, QuizResultLog, QuizQuestionReview, GKCategory } from '../types';
import { GK_QUESTIONS } from '../data/gkQuestions';
import { shuffleQuestionOptions } from '../data/levelProgression';
import { sound } from '../services/sound';
import { voice } from '../services/voice';

interface DailyChallengeProps {
  tier: ComplexityTier;
  streak: number;
  lastDailyDate: string;
  voiceEnabled: boolean;
  onCompleteDaily: (log: QuizResultLog) => void;
  onOpenParentPortfolio: () => void;
}

export const DailyChallenge: React.FC<DailyChallengeProps> = ({
  tier,
  streak,
  lastDailyDate,
  voiceEnabled,
  onCompleteDaily,
  onOpenParentPortfolio,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const isAlreadyCompletedToday = lastDailyDate === todayStr;

  const [hasStarted, setHasStarted] = useState(false);
  const [questions, setQuestions] = useState<typeof GK_QUESTIONS>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [reviews, setReviews] = useState<QuizQuestionReview[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());

  const startDaily = () => {
    sound.pick();
    // Pick questions across US History, Geography, Science, Animals, and Math
    const categories: GKCategory[] = [
      'us_history',
      'geography',
      'science',
      'animals',
      'math_logic',
    ];
    const picked: typeof GK_QUESTIONS = [];
    categories.forEach(cat => {
      const pool = GK_QUESTIONS.filter(q => q.category === cat && q.tier === tier);
      const fallback = GK_QUESTIONS.filter(q => q.category === cat);
      const candidates = pool.length > 0 ? pool : fallback;
      if (candidates.length > 0) {
        const randomItem = candidates[Math.floor(Math.random() * candidates.length)];
        picked.push(shuffleQuestionOptions(randomItem));
      }
    });

    setQuestions(picked);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setIsAnswerSubmitted(false);
    setScore(0);
    setReviews([]);
    setIsComplete(false);
    setStartTime(Date.now());
    setHasStarted(true);

    if (voiceEnabled && picked.length > 0) {
      voice.say(`Welcome to your Daily Scholar Sprint! Question 1: ${picked[0].question}`);
    }
  };

  const currentQ = questions[currentIndex];

  const handleSelectOption = (index: number) => {
    if (isAnswerSubmitted) return;
    sound.tap();
    setSelectedAnswer(index);
    setIsAnswerSubmitted(true);

    const isCorrect = index === currentQ.correctIndex;
    if (isCorrect) {
      sound.good();
      setScore(s => s + 1);
      if (voiceEnabled) voice.say(`Correct! ${currentQ.explanation}`);
    } else {
      sound.notYet();
      if (voiceEnabled) {
        voice.say(
          `Good try! The answer was ${currentQ.options[currentQ.correctIndex]}. ${currentQ.explanation}`
        );
      }
    }

    const item: QuizQuestionReview = {
      question: currentQ.question,
      options: currentQ.options,
      chosenIndex: index,
      correctIndex: currentQ.correctIndex,
      isCorrect,
      explanation: currentQ.explanation,
    };
    setReviews(prev => [...prev, item]);
  };

  const handleNext = () => {
    sound.tap();
    if (currentIndex < questions.length - 1) {
      const next = currentIndex + 1;
      setCurrentIndex(next);
      setSelectedAnswer(null);
      setIsAnswerSubmitted(false);
      if (voiceEnabled) voice.say(questions[next].question);
    } else {
      sound.cheer();
      setIsComplete(true);
      const timeSpent = Math.max(15, Math.round((Date.now() - startTime) / 1000));
      const log: QuizResultLog = {
        id: 'daily_' + Date.now(),
        timestamp: Date.now(),
        title: 'Daily Scholar Sprint',
        category: 'daily',
        tier,
        score,
        total: questions.length,
        percentage: Math.round((score / questions.length) * 100),
        timeSpentSeconds: timeSpent,
        reviews,
      };
      onCompleteDaily(log);
    }
  };

  if (!hasStarted) {
    return (
      <div className="w-full h-full overflow-y-auto p-4 sm:p-8 bg-slate-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto shadow-2xs">
            <Zap className="w-8 h-8 text-amber-500" />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-extrabold mb-2">
              <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
              <span>Current Learning Streak: {streak} Days</span>
            </div>
            <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900">
              Daily Scholar Sprint
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
              5 fast questions across US History, Geography, Science, and Logic to keep your mind sharp every single day!
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2 text-slate-600">
            <div className="flex justify-between font-bold text-slate-800">
              <span>Sprint Reward</span>
              <span className="text-amber-600 font-extrabold flex items-center gap-1">
                +10 Bonus Coins <Coins className="w-3.5 h-3.5 text-amber-500 fill-amber-400 inline" />
              </span>
            </div>
            <div className="flex justify-between font-bold text-slate-800">
              <span>Time Needed</span>
              <span>~2 Minutes</span>
            </div>
            <div className="flex justify-between font-bold text-slate-800">
              <span>Curriculum Level</span>
              <span className="capitalize">{tier} Tier</span>
            </div>
          </div>

          {isAlreadyCompletedToday && (
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 font-bold flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>You already completed today's streak! You can practice again anytime.</span>
            </div>
          )}

          <button
            onClick={startDaily}
            className="btn-3d-primary w-full py-4 text-base gap-2"
          >
            <Zap className="w-4 h-4 text-amber-300" />
            <span>{isAlreadyCompletedToday ? 'Practice Sprint Again' : 'Start Daily Sprint!'}</span>
          </button>
        </div>
      </div>
    );
  }

  if (isComplete) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="w-full h-full overflow-y-auto p-4 sm:p-8 bg-slate-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto shadow-2xs">
            <Award className="w-8 h-8 text-amber-600" />
          </div>

          <div>
            <span className="text-xs uppercase font-extrabold tracking-wider text-amber-600 flex items-center justify-center gap-1">
              <Flame className="w-4 h-4 fill-amber-500 text-amber-500" /> Daily Sprint Conquered!
            </span>
            <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              {score === 5 ? 'Flawless 5/5!' : `${score} / 5 Correct!`}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Streak updated to <strong>{streak + (lastDailyDate !== todayStr ? 1 : 0)} days</strong>!
            </p>
          </div>

          <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs font-bold text-amber-900 flex items-center justify-center gap-1.5">
            <Coins className="w-4 h-4 text-amber-600 fill-amber-400" />
            <span>+10 Coins awarded to your academy wallet!</span>
          </div>

          <div className="flex gap-2 justify-center">
            <button
              onClick={() => setHasStarted(false)}
              className="btn-3d-secondary flex-1 py-3 text-sm"
            >
              Back to Start
            </button>
            <button
              onClick={onOpenParentPortfolio}
              className="btn-3d-primary flex-1 py-3 text-sm"
            >
              View in Portfolio
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto p-4 sm:p-6 space-y-5">
      {/* Top Header */}
      <div className="flex items-center justify-between bg-white rounded-2xl px-4 py-3 border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full">
            Sprint {currentIndex + 1} of {questions.length}
          </span>
          <span className="text-xs font-bold text-slate-500">Score: {score}</span>
        </div>

        <button
          onClick={() => currentQ && voice.say(currentQ.question)}
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
        >
          <Volume2 className="w-4 h-4 text-emerald-600" />
        </button>
      </div>

      {/* Question Box */}
      {currentQ && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
              {currentQ.curriculumGrade || currentQ.category.toUpperCase()}
            </span>
            <HelpCircle className="w-6 h-6 text-emerald-600" />
          </div>

          <h3 className="font-heading text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
            {currentQ.question}
          </h3>

          {/* Options */}
          <div className="grid grid-cols-1 gap-2.5 pt-2">
            {currentQ.options.map((opt, idx) => {
              const isChosen = selectedAnswer === idx;
              const isCorrect = idx === currentQ.correctIndex;
              let btnStyle = 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50';

              if (isAnswerSubmitted) {
                if (isCorrect) {
                  btnStyle = 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-300 font-bold';
                } else if (isChosen) {
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
                  className={`p-4 rounded-2xl border text-left text-sm font-semibold transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-600">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span>{opt}</span>
                  </div>
                  {isAnswerSubmitted && isCorrect && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  )}
                  {isAnswerSubmitted && isChosen && !isCorrect && (
                    <XCircle className="w-5 h-5 text-rose-500" />
                  )}
                </button>
              );
            })}
          </div>

          {isAnswerSubmitted && (
            <div className="pt-4 space-y-4 border-t border-slate-100">
              <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                <span className="font-bold text-emerald-900 block mb-0.5">Explanation:</span>
                {currentQ.explanation}
              </div>

              <button
                onClick={handleNext}
                className="btn-3d-primary w-full py-4 text-base gap-2"
              >
                <span>{currentIndex < questions.length - 1 ? 'Next Question' : 'Complete Daily Sprint'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
