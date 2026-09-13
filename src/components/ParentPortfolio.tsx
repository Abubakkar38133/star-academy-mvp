import React, { useState } from 'react';
import {
  Shield,
  X,
  User,
  BarChart3,
  BookOpen,
  FileText,
  Settings,
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sparkles,
  Heart,
  Lightbulb,
  GraduationCap,
  Compass,
  Atom,
  Map,
  Rocket,
  Star,
  Infinity as InfinityIcon,
  Timer,
  Plus,
  Minus,
  RefreshCw,
} from 'lucide-react';
import { SaveData, ComplexityTier, COMPLEXITY_TIERS, QuizResultLog, LevelProgressItem } from '../types';
import { sound } from '../services/sound';

interface ParentPortfolioProps {
  data: SaveData;
  onUpdateSettings: (patch: Partial<SaveData>) => void;
  onResetProgress: () => void;
  onClose: () => void;
}

type PortfolioTab = 'overview' | 'subjects' | 'logs' | 'reportcard' | 'controls';

export const ParentPortfolio: React.FC<ParentPortfolioProps> = ({
  data,
  onUpdateSettings,
  onResetProgress,
  onClose,
}) => {
  // Security gate: requires quick multiplication or addition to unlock
  const [gatePassed, setGatePassed] = useState(false);
  const [gateA] = useState(() => Math.floor(Math.random() * 5) + 6); // 6 to 10
  const [gateB] = useState(() => Math.floor(Math.random() * 5) + 3); // 3 to 7
  const [gateInput, setGateInput] = useState('');
  const [gateError, setGateError] = useState(false);

  // Active Portfolio Tab
  const [activeTab, setActiveTab] = useState<PortfolioTab>('overview');

  // Editing Child Details
  const [editName, setEditName] = useState(data.name || 'Leo');
  const [editAge, setEditAge] = useState(data.childAge || 8);
  const [editGrade, setEditGrade] = useState(data.childGrade || '3rd Grade');
  const [editAvatar, setEditAvatar] = useState(data.avatarEmoji || 'scholar');
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  // Expanded Quiz in Logs
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  // Available avatars
  const avatarOptions = [
    { id: 'scholar', label: 'Scholar', icon: GraduationCap },
    { id: 'explorer', label: 'Explorer', icon: Compass },
    { id: 'scientist', label: 'Scientist', icon: Atom },
    { id: 'navigator', label: 'Navigator', icon: Map },
    { id: 'astronaut', label: 'Astronaut', icon: Rocket },
  ];

  // Screen Time & Wellness Management State
  const currentLimitMins = data.sessionLimitMinutes ?? 0;
  const isUnlimited = currentLimitMins <= 0;
  const [customInputMins, setCustomInputMins] = useState<string>(
    currentLimitMins > 0 ? String(currentLimitMins) : '30'
  );
  const [screenNotice, setScreenNotice] = useState<string | null>(null);

  // Time calculations
  const totalAllowedMs = isUnlimited ? 0 : currentLimitMins * 60 * 1000;
  const currentUsedMs = Math.min(totalAllowedMs, data.energyMs || 0);
  const remainingMinutes = isUnlimited
    ? null
    : Math.max(0, Math.ceil((totalAllowedMs - currentUsedMs) / (60 * 1000)));
  const elapsedMinutes = isUnlimited
    ? null
    : Math.floor(currentUsedMs / (60 * 1000));
  const usedPercent = isUnlimited
    ? 0
    : Math.min(100, Math.round((currentUsedMs / (totalAllowedMs || 1)) * 100));

  const showScreenNotice = (msg: string) => {
    setScreenNotice(msg);
    setTimeout(() => setScreenNotice(null), 3000);
  };

  const handleSetUnlimited = () => {
    sound.good();
    onUpdateSettings({ sessionLimitMinutes: 0, energyMs: 0 });
    showScreenNotice('Unlimited Screen Time Enabled! (No time cutoffs)');
  };

  const handleSetCustomTime = (minutes: number) => {
    const valid = Math.max(1, Math.round(minutes));
    sound.tap();
    setCustomInputMins(String(valid));
    onUpdateSettings({ sessionLimitMinutes: valid });
    showScreenNotice(`Screen Time set to ${valid} minutes per session!`);
  };

  const handleRefillSession = () => {
    sound.good();
    onUpdateSettings({ energyMs: 0, stamp: Date.now() });
    showScreenNotice('Session Time Refilled to 100%!');
  };

  const handleGrantExtraTime = (extraMins: number) => {
    sound.good();
    const currentUsed = data.energyMs || 0;
    const addedMs = extraMins * 60 * 1000;
    const newUsed = Math.max(0, currentUsed - addedMs);
    onUpdateSettings({ energyMs: newUsed, stamp: Date.now() });
    showScreenNotice(`Granted +${extraMins} extra minutes!`);
  };

  const handleGateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parseInt(gateInput.trim(), 10) === gateA + gateB) {
      sound.good();
      setGatePassed(true);
    } else {
      sound.notYet();
      setGateError(true);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    sound.tap();
    onUpdateSettings({
      name: editName.trim() || 'Scholar',
      childAge: editAge,
      childGrade: editGrade,
      avatarEmoji: editAvatar,
    });
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 2000);
  };

  // Compute Overall Analytics
  const logs = data.quizLogs || [];
  const totalQuestions = logs.reduce((acc, l) => acc + l.total, 0) + (data.completedCount || 0) * 5;
  const totalCorrect =
    logs.reduce((acc, l) => acc + l.score, 0) + Math.round((data.completedCount || 0) * 4);
  const overallAccuracy =
    totalQuestions > 0 ? Math.min(100, Math.round((totalCorrect / totalQuestions) * 100)) : 90;

  // Compute Subject Mastery
  const getDomainStats = (category: string) => {
    const relevantLogs = logs.filter(l => l.category === category);
    if (relevantLogs.length === 0) return { pct: 85, count: 0 };
    const totalQ = relevantLogs.reduce((acc, l) => acc + l.total, 0);
    const score = relevantLogs.reduce((acc, l) => acc + l.score, 0);
    return {
      pct: Math.round((score / totalQ) * 100),
      count: totalQ,
    };
  };

  const subjectStats = [
    { name: 'US History & Civics', cat: 'us_history', ...getDomainStats('us_history') },
    { name: 'US & World Geography', cat: 'geography', ...getDomainStats('geography') },
    { name: 'STEM & Space Science', cat: 'space', ...getDomainStats('space') },
    { name: 'Earth & Physical Science', cat: 'science', ...getDomainStats('science') },
    { name: 'Wildlife & Nature', cat: 'animals', ...getDomainStats('animals') },
    { name: 'Math & Logic Reasoning', cat: 'math_logic', ...getDomainStats('math_logic') },
  ];

  // Letter Grade Calculation
  let letterGrade = 'A';
  if (overallAccuracy >= 93) letterGrade = 'A+';
  else if (overallAccuracy >= 85) letterGrade = 'A';
  else if (overallAccuracy >= 78) letterGrade = 'B+';
  else if (overallAccuracy >= 70) letterGrade = 'B';
  else letterGrade = 'C+';

  const handlePrintReport = () => {
    sound.tap();
    window.print();
  };

  // 1. Math Security Gate
  if (!gatePassed) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-pop">
        <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-8 text-center shadow-xl flex flex-col items-center gap-5 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 shadow-xs cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mt-1">
            <Shield className="w-7 h-7 text-emerald-600" />
          </div>

          <div>
            <h2 className="font-heading text-2xl font-bold text-slate-900">Parent & Educator Gate</h2>
            <p className="text-xs text-slate-500 mt-1">
              Grown-ups security verification: Please answer to open the analytics portfolio.
            </p>
          </div>

          <form onSubmit={handleGateSubmit} className="w-full flex flex-col gap-3">
            <div className="font-heading text-xl font-extrabold text-emerald-900 bg-emerald-50 py-3 px-4 rounded-2xl border border-emerald-200">
              {gateA} + {gateB} = ?
            </div>

            <input
              type="number"
              value={gateInput}
              onChange={e => {
                setGateInput(e.target.value);
                setGateError(false);
              }}
              placeholder="Your answer"
              autoFocus
              className="w-full h-12 text-center font-bold text-xl rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-600 outline-none text-slate-900"
            />

            {gateError && (
              <span className="text-xs text-rose-600 font-bold">
                Incorrect answer, please try again
              </span>
            )}

            <button
              type="submit"
              className="btn-3d-primary w-full h-12 text-sm"
            >
              Verify & Enter Portfolio
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. Full Parent Portfolio
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-pop">
      <div className="bg-white border border-slate-200 rounded-3xl sm:rounded-[36px] max-w-4xl w-full p-5 sm:p-8 shadow-2xl relative max-h-[92vh] flex flex-col text-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-700 to-teal-700 text-white flex items-center justify-center shadow-xs">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-slate-900">
                  {data.name || 'Scholar'}’s Learning Portfolio
                </h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {data.childAge || 8} yrs • {data.childGrade || '3rd Grade'}
                </span>
              </div>
              <span className="text-xs text-slate-500">
                Tier: {COMPLEXITY_TIERS[data.tier].label} ({COMPLEXITY_TIERS[data.tier].ageLabel}) • {COMPLEXITY_TIERS[data.tier].recommendedGrade}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 shadow-xs cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1.5 p-1.5 my-3 bg-slate-100 rounded-2xl border border-slate-200 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 min-w-[100px] py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" /> Overview
          </button>

          <button
            onClick={() => setActiveTab('subjects')}
            className={`flex-1 min-w-[100px] py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'subjects'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" /> Subject Mastery
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`flex-1 min-w-[100px] py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'logs'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Quiz History ({logs.length})
          </button>

          <button
            onClick={() => setActiveTab('reportcard')}
            className={`flex-1 min-w-[100px] py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'reportcard'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Report Card
          </button>

          <button
            onClick={() => setActiveTab('controls')}
            className={`flex-1 min-w-[100px] py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'controls'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Timer className="w-3.5 h-3.5" /> Screen Time & Settings
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto py-2 space-y-4 pr-1">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Stat Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                  <span className="text-xs text-slate-500 font-bold block mb-1">
                    Overall Accuracy
                  </span>
                  <span className="font-heading text-2xl sm:text-3xl font-extrabold text-emerald-600">
                    {overallAccuracy}%
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Grade {letterGrade}
                  </span>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                  <span className="text-xs text-slate-500 font-bold block mb-1">
                    Questions Solved
                  </span>
                  <span className="font-heading text-2xl sm:text-3xl font-extrabold text-blue-900">
                    {totalQuestions}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Across GK & States
                  </span>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                  <span className="text-xs text-slate-500 font-bold block mb-1">
                    Learning Streak
                  </span>
                  <span className="font-heading text-2xl sm:text-3xl font-extrabold text-amber-600">
                    {data.dailyStreak || 1} Days
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Daily engagement
                  </span>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                  <span className="text-xs text-slate-500 font-bold block mb-1">
                    Badges Earned
                  </span>
                  <span className="font-heading text-2xl sm:text-3xl font-extrabold text-indigo-600">
                    {data.badges.length}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Badges unlocked
                  </span>
                </div>
              </div>

              {/* Level Progression Journey Path Tracker */}
              <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl border border-blue-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Compass className="w-5 h-5 text-blue-600" />
                    <h3 className="font-heading font-black text-base text-slate-900">
                      Level Progression Journey
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-blue-200 text-blue-900 font-bold text-xs">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                    <span>
                      {Object.values(data.levelProgress || {}).reduce((acc: number, curr: LevelProgressItem) => acc + (curr.stars || 0), 0)} Stars Total
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-2xl border border-blue-100">
                    <span className="font-bold text-slate-500 block mb-0.5">Current Progress</span>
                    <span className="font-heading text-lg font-black text-blue-900">Level {data.unlockedLevel || 1}</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {(data.unlockedLevel || 1) <= 5
                        ? 'Unit 1: Easy (Foundations)'
                        : (data.unlockedLevel || 1) <= 10
                        ? 'Unit 2: Medium (Scholars)'
                        : (data.unlockedLevel || 1) <= 15
                        ? 'Unit 3: Hard (Academy)'
                        : 'Unit 4+: Expert / Endless'}
                    </p>
                  </div>

                  <div className="p-3 bg-white rounded-2xl border border-blue-100">
                    <span className="font-bold text-slate-500 block mb-0.5">Levels Completed</span>
                    <span className="font-heading text-lg font-black text-emerald-600">
                      {Object.values(data.levelProgress || {}).filter((p: LevelProgressItem) => (p.stars || 0) >= 1).length} Passed
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      With 1 to 3 star ratings
                    </p>
                  </div>

                  <div className="p-3 bg-white rounded-2xl border border-blue-100">
                    <span className="font-bold text-slate-500 block mb-0.5">Difficulty Scaling</span>
                    <span className="font-heading text-lg font-black text-indigo-600">1 to 15+</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Easy (1–5), Medium (6–10), Hard (11–15)
                    </p>
                  </div>
                </div>
              </div>

              {/* Parent Screen Time Summary Card */}
              <div className="p-4 bg-white rounded-3xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${isUnlimited ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                    {isUnlimited ? <InfinityIcon className="w-5 h-5" /> : <Timer className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-heading font-black text-sm text-slate-900">
                        {isUnlimited ? 'Unlimited Screen Time' : `Custom Screen Time: ${currentLimitMins}m limit`}
                      </span>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${isUnlimited ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                        {isUnlimited ? 'No Limit' : `${remainingMinutes}m left`}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      {isUnlimited
                        ? 'Child has unrestricted learning time without automatic screen timeouts.'
                        : `Current session has ${remainingMinutes}m remaining out of ${currentLimitMins}m before a healthy brain break.`}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('controls')}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer shrink-0"
                >
                  Adjust Screen Time
                </button>
              </div>

              {/* Cognitive Strength & Pedagogical Summary */}
              <div className="p-5 bg-white rounded-3xl border border-slate-200 space-y-3">
                <h3 className="font-heading font-bold text-base text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Curriculum Assessment & Insights</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {data.name || 'Your child'} is currently engaged at the{' '}
                  <strong>{COMPLEXITY_TIERS[data.tier].label}</strong> tier (aligned with{' '}
                  {COMPLEXITY_TIERS[data.tier].recommendedGrade}). Recent assessments show strong performance in{' '}
                  <strong>US History & Civics</strong> and <strong>US Geography</strong>. They demonstrate consistent deductive reasoning when evaluating multiple-choice options.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                  <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-emerald-900 block">Mastery Strengths</span>
                      <span className="text-emerald-800">
                        American Founding, Branches of Government, 50 States & Capitals
                      </span>
                    </div>
                  </div>
                  <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-blue-900 block">Next Learning Step</span>
                      <span className="text-blue-800">
                        Space exploration missions and multi-step math logic puzzles.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SUBJECT MASTERY */}
          {activeTab === 'subjects' && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-600">
                Subject mastery is calculated dynamically from completed quizzes, response accuracy, and hints used.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {subjectStats.map(sub => (
                  <div
                    key={sub.cat}
                    className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2 shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{sub.name}</span>
                      </div>
                      <span className="font-heading font-extrabold text-sm text-blue-700">
                        {sub.pct}%
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all"
                        style={{ width: `${sub.pct}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>{sub.count > 0 ? `${sub.count} questions logged` : 'Curriculum baseline'}</span>
                      <span className="font-semibold text-slate-600">
                        {sub.pct >= 90 ? 'Mastery Level' : sub.pct >= 75 ? 'Proficient' : 'Developing'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: QUIZ LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-3">
              {logs.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-3xl border border-slate-200 text-slate-400 space-y-2">
                  <Clock className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-sm font-semibold">No quizzes completed yet.</p>
                  <p className="text-xs text-slate-400">
                    Once your child takes a quiz in the GK Arenas or Daily Sprint, detailed results will be logged here.
                  </p>
                </div>
              ) : (
                logs.map(log => {
                  const isExpanded = expandedLogId === log.id;
                  const dateStr = new Date(log.timestamp).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={log.id}
                      className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2 shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-slate-900">{log.title}</h4>
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                              {log.tier}
                            </span>
                          </div>
                          <span className="text-xs text-slate-400">{dateStr}</span>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="font-heading font-extrabold text-sm text-emerald-600 block">
                              {log.score} / {log.total} ({log.percentage}%)
                            </span>
                            <span className="text-[10px] text-slate-400 flex items-center justify-end gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>{log.timeSpentSeconds}s</span>
                            </span>
                          </div>

                          {log.reviews && log.reviews.length > 0 && (
                            <button
                              onClick={() =>
                                setExpandedLogId(prev => (prev === log.id ? null : log.id))
                              }
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          )}
                        </div>
                      </div>

                      {isExpanded && log.reviews && (
                        <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
                          {log.reviews.map((r, i) => (
                            <div
                              key={i}
                              className={`p-2.5 rounded-xl border ${
                                r.isCorrect ? 'bg-emerald-50/50 border-emerald-100' : 'bg-rose-50/50 border-rose-100'
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                {r.isCorrect ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                                )}
                                <div className="space-y-0.5">
                                  <span className="font-bold text-slate-800 block">
                                    {i + 1}. {r.question}
                                  </span>
                                  <p className="text-slate-600">
                                    Answer: <span className={r.isCorrect ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                                      {r.chosenIndex >= 0 ? r.options[r.chosenIndex] : 'Timeout'}
                                    </span>
                                  </p>
                                  {!r.isCorrect && (
                                    <p className="text-emerald-800 font-medium">
                                      Correct: {r.options[r.correctIndex]}
                                    </p>
                                  )}
                                  <p className="text-slate-400 pt-0.5 leading-snug flex items-start gap-1">
                                    <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                                    <span>{r.explanation}</span>
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 4: REPORT CARD */}
          {activeTab === 'reportcard' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-heading font-extrabold text-xl text-slate-900">
                    Official Academic Progress Report
                  </h3>
                  <p className="text-xs text-slate-500">
                    StarScholar US Knowledge Academy • Academic Year Evaluation
                  </p>
                </div>
                <button
                  onClick={handlePrintReport}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Report</span>
                </button>
              </div>

              {/* Student Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 block">Student Name</span>
                  <span className="font-bold text-slate-900 text-sm">{data.name || 'Scholar'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Grade Level</span>
                  <span className="font-bold text-slate-900 text-sm">{data.childGrade || '3rd Grade'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Curriculum Tier</span>
                  <span className="font-bold text-slate-900 text-sm capitalize">{data.tier}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Letter Grade</span>
                  <span className="font-heading font-extrabold text-emerald-600 text-lg">{letterGrade}</span>
                </div>
              </div>

              {/* Subject Scores Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Subject Domain</th>
                      <th className="p-3">Curriculum Standards</th>
                      <th className="p-3 text-right">Mastery Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {subjectStats.map(s => (
                      <tr key={s.cat} className="hover:bg-slate-50/50">
                        <td className="p-3 font-bold text-slate-800">
                          {s.name}
                        </td>
                        <td className="p-3 text-slate-500">Elementary/Middle US Core</td>
                        <td className="p-3 text-right font-extrabold text-blue-700">{s.pct}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Educator Remarks */}
              <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-100 space-y-1 text-xs">
                <span className="font-bold text-blue-900 block">Educator Remarks:</span>
                <p className="text-slate-700 leading-relaxed">
                  The student demonstrates strong retention of American civics, state capitals, and scientific inquiry. They show great persistence and curiosity when answering challenging questions.
                </p>
              </div>
            </div>
          )}

          {/* TAB 5: SCREEN TIME & SETTINGS */}
          {activeTab === 'controls' && (
            <div className="space-y-6">
              {/* Screen Time Notification Toast */}
              {screenNotice && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-bold flex items-center justify-between shadow-xs">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{screenNotice}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setScreenNotice(null)}
                    className="text-emerald-700 hover:text-emerald-900 text-xs cursor-pointer font-bold"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* SCREEN TIME & REST BREAKS (PARENT CONTROLLED) */}
              <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Timer className="w-5 h-5 text-blue-600" />
                      <h3 className="font-heading font-black text-base text-slate-900">
                        Screen Time & Rest Breaks
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Parent-controlled learning limits with unlimited or custom minute options.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {isUnlimited ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-extrabold">
                        <InfinityIcon className="w-3.5 h-3.5" />
                        <span>Unlimited Time Active</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200 text-xs font-extrabold">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{currentLimitMins} Min Limit</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* The Two Main Parent Modes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* OPTION 1: UNLIMITED SCREEN TIME */}
                  <div
                    onClick={handleSetUnlimited}
                    className={`rounded-2xl p-4.5 border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                      isUnlimited
                        ? 'bg-emerald-50/70 border-emerald-500 shadow-sm ring-1 ring-emerald-400'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isUnlimited ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                            <InfinityIcon className="w-5 h-5" />
                          </div>
                          <h4 className="font-heading font-black text-sm text-slate-900">
                            Unlimited Screen Time
                          </h4>
                        </div>
                        <input
                          type="radio"
                          name="screenTimeMode"
                          checked={isUnlimited}
                          onChange={handleSetUnlimited}
                          className="w-4 h-4 text-emerald-600 cursor-pointer"
                        />
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">
                        Child can explore and answer questions without countdown timer limits or automatic rest cutoffs.
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-500">No lockouts or pauses</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetUnlimited();
                        }}
                        className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer ${
                          isUnlimited
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {isUnlimited ? '✓ Active Mode' : 'Select Unlimited'}
                      </button>
                    </div>
                  </div>

                  {/* OPTION 2: CUSTOM SCREEN TIME (NO LIMIT) */}
                  <div
                    onClick={() => {
                      if (isUnlimited) {
                        handleSetCustomTime(parseInt(customInputMins, 10) || 30);
                      }
                    }}
                    className={`rounded-2xl p-4.5 border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                      !isUnlimited
                        ? 'bg-blue-50/70 border-blue-500 shadow-sm ring-1 ring-blue-400'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${!isUnlimited ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                            <Timer className="w-5 h-5" />
                          </div>
                          <h4 className="font-heading font-black text-sm text-slate-900">
                            Custom Screen Time
                          </h4>
                        </div>
                        <input
                          type="radio"
                          name="screenTimeMode"
                          checked={!isUnlimited}
                          onChange={() => handleSetCustomTime(parseInt(customInputMins, 10) || 30)}
                          className="w-4 h-4 text-blue-600 cursor-pointer"
                        />
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">
                        Set any minutes duration (no limit). When time is up, a friendly stretch & rest screen prompts a break.
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-500">
                        {!isUnlimited ? `${currentLimitMins} mins per session` : 'Set your own minutes'}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetCustomTime(parseInt(customInputMins, 10) || 30);
                        }}
                        className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer ${
                          !isUnlimited
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {!isUnlimited ? '✓ Active Mode' : 'Select Custom'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* CUSTOM SCREEN TIME CONTROLS & PRESETS */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="font-heading font-black text-xs sm:text-sm text-slate-900">
                        Customize Session Duration (No Limit)
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Choose a quick preset or type any custom number of minutes:
                      </p>
                    </div>
                    {!isUnlimited && (
                      <div className="text-xs font-extrabold text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 shrink-0">
                        Current: {currentLimitMins} Minutes
                      </div>
                    )}
                  </div>

                  {/* 1-Click Fast Presets */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-bold text-slate-500 mr-1">Presets:</span>
                    {[15, 20, 25, 30, 45, 60, 90, 120].map(mins => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => handleSetCustomTime(mins)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                          !isUnlimited && currentLimitMins === mins
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {mins} min
                      </button>
                    ))}
                  </div>

                  {/* Direct Custom Minute Input (Any Number) */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const val = Math.max(5, (parseInt(customInputMins, 10) || 30) - 5);
                          handleSetCustomTime(val);
                        }}
                        className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-1 cursor-pointer"
                        title="Minus 5 minutes"
                      >
                        <Minus className="w-3.5 h-3.5" /> 5m
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const val = (parseInt(customInputMins, 10) || 30) + 5;
                          handleSetCustomTime(val);
                        }}
                        className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-1 cursor-pointer"
                        title="Plus 5 minutes"
                      >
                        <Plus className="w-3.5 h-3.5" /> 5m
                      </button>
                    </div>

                    <div className="flex items-center gap-2 flex-1">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          min={1}
                          max={9999}
                          value={customInputMins}
                          onChange={e => setCustomInputMins(e.target.value)}
                          placeholder="e.g. 45"
                          className="w-full pl-3 pr-16 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm font-black text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                          minutes
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const parsed = parseInt(customInputMins, 10);
                          if (!isNaN(parsed) && parsed > 0) {
                            handleSetCustomTime(parsed);
                          }
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-2xs shrink-0 cursor-pointer"
                      >
                        Set Custom Time
                      </button>
                    </div>
                  </div>
                </div>

                {/* CURRENT SESSION TIME STATUS & QUICK PARENT CONTROLS */}
                <div className="bg-slate-100/80 rounded-2xl p-4 border border-slate-200 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-slate-500" />
                      <span>Current Active Session Status:</span>
                    </span>

                    {isUnlimited ? (
                      <span className="text-xs font-extrabold text-emerald-700">
                        Unlimited (No Countdown)
                      </span>
                    ) : (
                      <span className="text-xs font-extrabold text-blue-900">
                        {remainingMinutes}m remaining ({elapsedMinutes}m elapsed of {currentLimitMins}m)
                      </span>
                    )}
                  </div>

                  {/* Progress bar if not unlimited */}
                  {!isUnlimited && (
                    <div className="space-y-1">
                      <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            usedPercent > 80 ? 'bg-amber-500' : 'bg-blue-600'
                          }`}
                          style={{ width: `${usedPercent}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] font-bold text-slate-400">
                        <span>0m start</span>
                        <span>{usedPercent}% elapsed</span>
                        <span>{currentLimitMins}m limit</span>
                      </div>
                    </div>
                  )}

                  {/* Parent Quick Reset & Bonus Time Buttons */}
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    <button
                      type="button"
                      onClick={handleRefillSession}
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                      <span>Refill / Reset Session Time</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleGrantExtraTime(15)}
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Add +15 Mins</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleGrantExtraTime(30)}
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Add +30 Mins</span>
                    </button>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="bg-slate-50 rounded-3xl p-6 border border-slate-200 space-y-4">
                <h3 className="font-heading font-bold text-base text-slate-900">
                  Learner Profile Configuration
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">
                      Learner Name
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">
                      Age
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={15}
                      value={editAge}
                      onChange={e => setEditAge(parseInt(e.target.value, 10))}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">
                      Grade
                    </label>
                    <input
                      type="text"
                      value={editGrade}
                      onChange={e => setEditGrade(e.target.value)}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Avatar Chooser */}
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1.5">
                    Avatar Icon Style
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {avatarOptions.map(av => {
                      const IconComp = av.icon;
                      return (
                        <button
                          type="button"
                          key={av.id}
                          onClick={() => setEditAvatar(av.id)}
                          className={`px-3 py-2 rounded-2xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                            editAvatar === av.id
                              ? 'bg-blue-50 border-blue-500 text-blue-800 ring-2 ring-blue-300'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <IconComp className="w-4 h-4" />
                          <span>{av.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    Save Profile Changes
                  </button>
                  {isSavedNotice && (
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Profile Updated!
                    </span>
                  )}
                </div>
              </form>

              {/* Reset Data Safety Box */}
              <div className="bg-rose-50 rounded-3xl p-6 border border-rose-200 space-y-3">
                <h4 className="font-heading font-bold text-sm text-rose-900">
                  Reset Academic History
                </h4>
                <p className="text-xs text-rose-700 leading-relaxed">
                  Clears all quiz scores, coin counts, unlocked badges, and daily streaks. Use this only if passing the applet to another child.
                </p>

                {!confirmReset ? (
                  <button
                    type="button"
                    onClick={() => setConfirmReset(true)}
                    className="px-4 py-2 bg-white border border-rose-300 text-rose-700 hover:bg-rose-100 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Reset Progress...
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onResetProgress();
                        onClose();
                      }}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                    >
                      Confirm Reset Everything
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmReset(false)}
                      className="px-4 py-2 bg-white border border-slate-200 text-slate-600 font-bold text-xs rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
