import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Compass,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Volume2,
  Search,
  BookOpen,
  Award,
  Landmark,
} from 'lucide-react';
import { US_STATES_DATA, USStateQuizItem } from '../data/gkQuestions';
import { sound } from '../services/sound';
import { voice } from '../services/voice';
import { ComplexityTier } from '../types';
import { shuffleArray } from '../utils/shuffle';

interface StatesExplorerProps {
  tier: ComplexityTier;
  voiceEnabled: boolean;
  onAwardCoins: (coins: number) => void;
}

type Mode = 'learn' | 'quiz';

export const StatesExplorer: React.FC<StatesExplorerProps> = ({
  tier,
  voiceEnabled,
  onAwardCoins,
}) => {
  const [mode, setMode] = useState<Mode>('learn');
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedState, setSelectedState] = useState<USStateQuizItem | null>(US_STATES_DATA[0]);
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');

  const [quizLength, setQuizLength] = useState<number>(10);

  // Quiz State
  const [quizQuestions, setQuizQuestions] = useState<{
    state: USStateQuizItem;
    questionText: string;
    options: string[];
    correctAnswer: string;
    fact: string;
  }[]>([]);
  const [quizIndex, setQuizIndex] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [quizFinished, setQuizFinished] = useState<boolean>(false);

  const regions = ['All', 'Northeast', 'South', 'Midwest', 'West'];

  const filteredStates = US_STATES_DATA.filter(st => {
    const matchesRegion = selectedRegion === 'All' || st.region === selectedRegion;
    const matchesQuery =
      st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.capital.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.nickname.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRegion && matchesQuery;
  });

  const startQuiz = (customCount?: number | unknown) => {
    sound.pick();
    const count = typeof customCount === 'number' && customCount > 0 ? customCount : (quizLength || 10);
    setQuizLength(count);

    // Shuffle all 50 states randomly every time using Fisher-Yates
    const shuffled = shuffleArray([...US_STATES_DATA]).slice(0, Math.min(count, US_STATES_DATA.length));

    const questionTypes = ['capital', 'reverse_capital', 'nickname', 'fact', 'region'] as const;

    const prepared = shuffled.map((st, i) => {
      // Rotate through diverse question types for maximum variety
      const qType = questionTypes[i % questionTypes.length];

      if (qType === 'capital') {
        // "What is the capital city of Florida?"
        const others = shuffleArray(
          US_STATES_DATA.filter(s => s.id !== st.id).map(s => s.capital)
        ).slice(0, 3);
        const options = shuffleArray([...others, st.capital]);
        return {
          state: st,
          questionText: `What is the capital city of ${st.name}?`,
          options,
          correctAnswer: st.capital,
          fact: `${st.capital} is the capital of ${st.name}. ${st.famousFact}`,
        };
      } else if (qType === 'reverse_capital') {
        // "Sacramento is the capital city of which US state?"
        const others = shuffleArray(
          US_STATES_DATA.filter(s => s.id !== st.id).map(s => s.name)
        ).slice(0, 3);
        const options = shuffleArray([...others, st.name]);
        return {
          state: st,
          questionText: `${st.capital} is the capital city of which US state?`,
          options,
          correctAnswer: st.name,
          fact: `${st.name}'s capital is ${st.capital}!`,
        };
      } else if (qType === 'nickname') {
        // "Which state is known as The Sunshine State?"
        const others = shuffleArray(
          US_STATES_DATA.filter(s => s.id !== st.id).map(s => s.name)
        ).slice(0, 3);
        const options = shuffleArray([...others, st.name]);
        return {
          state: st,
          questionText: `Which state is known as "${st.nickname}"?`,
          options,
          correctAnswer: st.name,
          fact: `${st.name} is famous as ${st.nickname}!`,
        };
      } else if (qType === 'fact') {
        // Famous fact question
        const others = shuffleArray(
          US_STATES_DATA.filter(s => s.id !== st.id).map(s => s.name)
        ).slice(0, 3);
        const options = shuffleArray([...others, st.name]);
        return {
          state: st,
          questionText: `Which state is famous for: ${st.famousFact.split(',')[0]}?`,
          options,
          correctAnswer: st.name,
          fact: `${st.name}: ${st.famousFact}`,
        };
      } else {
        // Region question
        const sameRegion = st;
        const differentRegionStates = shuffleArray(
          US_STATES_DATA.filter(s => s.region !== st.region).map(s => s.name)
        ).slice(0, 3);
        const options = shuffleArray([...differentRegionStates, sameRegion.name]);
        return {
          state: st,
          questionText: `Which of these states is located in the ${st.region} region?`,
          options,
          correctAnswer: sameRegion.name,
          fact: `${sameRegion.name} is in the ${sameRegion.region} region!`,
        };
      }
    });

    setQuizQuestions(prepared);
    setQuizIndex(0);
    setSelectedAnswer(null);
    setIsAnswerSubmitted(false);
    setQuizScore(0);
    setQuizFinished(false);
    setMode('quiz');

    if (voiceEnabled && prepared.length > 0) {
      setTimeout(() => voice.say(prepared[0].questionText), 300);
    }
  };

  // Auto-generate quiz questions if entering quiz mode with an empty queue
  useEffect(() => {
    if (mode === 'quiz' && quizQuestions.length === 0 && !quizFinished) {
      startQuiz(quizLength || 10);
    }
  }, [mode]);

  const handleSelectQuizOption = (opt: string) => {
    if (isAnswerSubmitted) return;
    sound.tap();
    setSelectedAnswer(opt);
    setIsAnswerSubmitted(true);

    const currentQ = quizQuestions[quizIndex];
    const isCorrect = opt === currentQ.correctAnswer;
    if (isCorrect) {
      sound.good();
      setQuizScore(prev => prev + 1);
      if (voiceEnabled) {
        voice.say(`Correct! ${currentQ.correctAnswer}. ${currentQ.state.famousFact}`);
      }
    } else {
      sound.notYet();
      if (voiceEnabled) {
        voice.say(`The correct answer is ${currentQ.correctAnswer}. ${currentQ.state.famousFact}`);
      }
    }
  };

  const handleNextQuiz = () => {
    sound.tap();
    if (quizIndex < quizQuestions.length - 1) {
      const nextIdx = quizIndex + 1;
      setQuizIndex(nextIdx);
      setSelectedAnswer(null);
      setIsAnswerSubmitted(false);
      if (voiceEnabled) {
        voice.say(quizQuestions[nextIdx].questionText);
      }
    } else {
      setQuizFinished(true);
      const earnedCoins = (quizScore + (isAnswerSubmitted && selectedAnswer === quizQuestions[quizIndex]?.correctAnswer ? 0 : 0)) * 3;
      if (earnedCoins > 0) {
        onAwardCoins(earnedCoins);
      }
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-green-700 text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1.5 z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider">
            <Compass className="w-3.5 h-3.5 text-amber-300" />
            <span>States Explorer</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight">
            50 States & Capitals
          </h1>
          <p className="text-emerald-100 text-sm sm:text-base">
            Learn states, capitals, fun facts, and test your knowledge!
          </p>
        </div>

        {/* Mode switcher pills */}
        <div className="flex items-center gap-2 bg-white/15 p-1.5 rounded-2xl backdrop-blur-md self-stretch sm:self-auto justify-center z-10">
          <button
            onClick={() => {
              sound.tap();
              setMode('learn');
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              mode === 'learn'
                ? 'bg-white text-emerald-950 shadow-sm'
                : 'text-white hover:bg-white/10'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Explore States</span>
          </button>
          <button
            onClick={() => startQuiz(quizLength || 10)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              mode === 'quiz'
                ? 'bg-amber-400 text-slate-900 shadow-sm'
                : 'text-white hover:bg-white/10'
            }`}
          >
            <Award className="w-4 h-4 text-amber-900" />
            <span>50 States Quiz</span>
          </button>
        </div>
      </div>

      {/* Mode = Study States */}
      {mode === 'learn' && (
        <div className="space-y-4">
          {/* Mobile View Switcher Tabs (Only visible on screens < 1024px) */}
          <div className="flex lg:hidden items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl">
            <button
              type="button"
              onClick={() => setMobileView('list')}
              className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                mobileView === 'list'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              States List ({filteredStates.length})
            </button>
            <button
              type="button"
              onClick={() => setMobileView('detail')}
              className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                mobileView === 'detail'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {selectedState ? `${selectedState.name} Facts` : 'State Facts'}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: State List & Search */}
            <div className={`lg:col-span-5 space-y-3 ${mobileView === 'list' ? 'block' : 'hidden lg:block'}`}>
              {/* Search Bar & Region Filters */}
              <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-xs space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search state, capital, or nickname..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                {/* Region Pills */}
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-1">
                  {regions.map(reg => (
                    <button
                      key={reg}
                      onClick={() => {
                        sound.tap();
                        setSelectedRegion(reg);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                        selectedRegion === reg
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {reg}
                    </button>
                  ))}
                </div>
              </div>

              {/* States List Cards */}
              <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                {filteredStates.map(st => {
                  const isSelected = selectedState?.id === st.id;
                  return (
                    <div
                      key={st.id}
                      onClick={() => {
                        sound.tap();
                        setSelectedState(st);
                        setMobileView('detail');
                        if (voiceEnabled) {
                          voice.say(`${st.name}. Capital is ${st.capital}. ${st.famousFact}`);
                        }
                      }}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-emerald-50 border-emerald-400 shadow-sm ring-2 ring-emerald-300'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-900 font-extrabold flex items-center justify-center text-sm shrink-0">
                          {st.id.toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-slate-900">{st.name}</h4>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-600">
                              {st.region}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">
                            Capital: <span className="font-semibold text-emerald-800">{st.capital}</span>
                          </p>
                        </div>
                      </div>
                      <MapPin className={`w-4 h-4 ${isSelected ? 'text-emerald-600' : 'text-slate-300'}`} />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Detailed State Showcase */}
            <div className={`lg:col-span-7 ${mobileView === 'detail' ? 'block' : 'hidden lg:block'}`}>
              {selectedState ? (
                <div className="bg-white rounded-3xl p-5 sm:p-8 border border-slate-200 shadow-sm space-y-6 sticky top-20">
                  {/* Mobile Back Button */}
                  <div className="lg:hidden flex items-center justify-between -mt-1 pb-2 border-b border-slate-100">
                    <button
                      type="button"
                      onClick={() => setMobileView('list')}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
                    >
                      <span>← Back to States List</span>
                    </button>
                    <span className="text-[11px] font-bold text-slate-400">
                      {selectedState.region} Region
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl sm:text-4xl p-2 bg-emerald-50 rounded-2xl border border-emerald-100">
                        {selectedState.icon}
                      </span>
                      <div>
                        <h2 className="font-heading text-xl sm:text-3xl font-extrabold text-slate-900">
                          {selectedState.name}
                        </h2>
                        <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                          {selectedState.nickname}
                        </span>
                      </div>
                    </div>

                    {/* Read Aloud Button */}
                    <button
                      onClick={() => {
                        voice.say(
                          `${selectedState.name}. Capital is ${selectedState.capital}. ${selectedState.nickname}. ${selectedState.famousFact}`
                        );
                      }}
                      className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                      title="Read State Fact Aloud"
                    >
                      <Volume2 className="w-5 h-5 text-emerald-600" />
                    </button>
                  </div>

                  {/* Core Facts Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                        State Capital
                      </span>
                      <span className="font-heading text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-1.5 mt-1">
                        <Landmark className="w-5 h-5 text-emerald-700 shrink-0" />
                        <span>{selectedState.capital}</span>
                      </span>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                        US Region
                      </span>
                      <span className="font-heading text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-1.5 mt-1">
                        <MapPin className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span>{selectedState.region}</span>
                      </span>
                    </div>
                  </div>

                  {/* Did You Know Highlight */}
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-4 sm:p-5 border border-amber-200 space-y-2">
                    <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      <span>Curriculum Landmark & Heritage</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                      {selectedState.famousFact}
                    </p>
                  </div>

                  {/* Practice Quiz Trigger */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                    <span className="text-xs text-slate-400 font-medium text-center sm:text-left">
                      Ready to test your state knowledge?
                    </span>
                    <button
                      onClick={() => startQuiz(10)}
                      className="btn-3d-primary w-full sm:w-auto px-5 py-2.5 text-xs sm:text-sm gap-2"
                    >
                      <span>Start State Quiz</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-400">
                  Select a state from the list to view its details.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mode = State Capitals Quiz */}
      {mode === 'quiz' && (
        <div className="max-w-2xl mx-auto">
          {!quizFinished ? (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              {/* Quiz Progress & Mode Row */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full">
                    Question {quizIndex + 1} of {quizQuestions.length || quizLength}
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    Score: {quizScore}
                  </span>
                </div>

                {/* Quiz Length Selector Pills */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => startQuiz(10)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      quizLength === 10
                        ? 'bg-white text-emerald-950 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    10 Qs
                  </button>
                  <button
                    type="button"
                    onClick={() => startQuiz(25)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      quizLength === 25
                        ? 'bg-white text-emerald-950 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    25 Qs
                  </button>
                  <button
                    type="button"
                    onClick={() => startQuiz(50)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      quizLength === 50
                        ? 'bg-white text-emerald-950 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All 50
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const q = quizQuestions[quizIndex];
                    if (q) voice.say(q.questionText);
                  }}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                  title="Read question aloud"
                >
                  <Volume2 className="w-4 h-4 text-emerald-600" />
                </button>
              </div>

              {/* Question Body */}
              {quizQuestions[quizIndex] ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="text-3xl p-2 bg-emerald-50 rounded-2xl">
                      {quizQuestions[quizIndex].state.icon}
                    </span>
                    <h3 className="font-heading text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
                      {quizQuestions[quizIndex].questionText}
                    </h3>
                  </div>

                  {/* Options List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {quizQuestions[quizIndex].options.map((opt, i) => {
                      const isChosen = selectedAnswer === opt;
                      const isCorrect = opt === quizQuestions[quizIndex].correctAnswer;
                      let btnStyle = 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50';

                      if (isAnswerSubmitted) {
                        if (isCorrect) {
                          btnStyle = 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-300';
                        } else if (isChosen) {
                          btnStyle = 'bg-rose-50 border-rose-500 text-rose-900';
                        } else {
                          btnStyle = 'bg-slate-50 border-slate-200 text-slate-400 opacity-60';
                        }
                      }

                      return (
                        <button
                          key={i}
                          onClick={() => handleSelectQuizOption(opt)}
                          disabled={isAnswerSubmitted}
                          className={`p-4 rounded-2xl border text-left font-bold text-sm sm:text-base transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
                        >
                          <span>{opt}</span>
                          {isAnswerSubmitted && isCorrect && (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                          )}
                          {isAnswerSubmitted && isChosen && !isCorrect && (
                            <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Post Answer Feedback & Next */}
                  {isAnswerSubmitted && (
                    <div className="pt-3 space-y-3">
                      {selectedAnswer === quizQuestions[quizIndex].correctAnswer ? (
                        <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 text-sm font-semibold text-emerald-900 flex items-start gap-3">
                          <span className="text-xl">🎉</span>
                          <div>
                            <span className="font-black block">Awesome! That's Right!</span>
                            <span className="font-normal text-emerald-800">{quizQuestions[quizIndex].fact}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 text-sm font-semibold text-amber-900 flex items-start gap-3">
                          <span className="text-xl">⭐</span>
                          <div>
                            <span className="font-black block">Good Try! Correct: {quizQuestions[quizIndex].correctAnswer}</span>
                            <span className="font-normal text-amber-800">{quizQuestions[quizIndex].fact}</span>
                          </div>
                        </div>
                      )}

                      <button
                        onClick={handleNextQuiz}
                        className="btn-3d-primary w-full py-3.5 sm:py-4 text-base gap-2"
                      >
                        <span>{quizIndex < quizQuestions.length - 1 ? 'Next Question' : 'Finish Quiz & Claim Stars'}</span>
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 space-y-4">
                  <p className="text-sm font-bold text-slate-500">Preparing state questions...</p>
                  <button
                    type="button"
                    onClick={() => startQuiz(10)}
                    className="btn-3d-primary px-5 py-2.5 text-sm"
                  >
                    Start 10 Questions
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Quiz Results Card */
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto text-amber-600">
                <Award className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900">
                  50 States Quiz Completed!
                </h2>
                <p className="text-slate-600 text-base">
                  You scored <span className="font-extrabold text-emerald-600">{quizScore}</span> out of {quizQuestions.length}!
                </p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 font-bold rounded-full text-xs">
                  <span>+{quizScore * 3} Star Coins Earned!</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => startQuiz(10)}
                  className="btn-3d-primary px-6 py-3.5 text-sm gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>10 Questions</span>
                </button>
                <button
                  type="button"
                  onClick={() => startQuiz(25)}
                  className="btn-3d-secondary px-5 py-3.5 text-sm gap-2"
                >
                  <span>25 States</span>
                </button>
                <button
                  type="button"
                  onClick={() => startQuiz(50)}
                  className="btn-3d-secondary px-5 py-3.5 text-sm gap-2"
                >
                  <span>All 50 States</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('learn')}
                  className="btn-3d-secondary px-5 py-3.5 text-sm"
                >
                  Explore States
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
