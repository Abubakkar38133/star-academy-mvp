import React, { useState, useEffect } from 'react';
import { SaveData, ComplexityTier, QuizResultLog } from './types';
import { storage } from './services/storage';
import { sound } from './services/sound';
import { voice } from './services/voice';
import { Navigation, ActiveTab } from './components/Navigation';
import { WelcomeScreen } from './components/WelcomeScreen';
import { LevelJourneyMap } from './components/LevelJourneyMap';
import { LevelPlayArena } from './components/LevelPlayArena';
import { BuddyPlayroom } from './components/BuddyPlayroom';
import { GKArena } from './components/GKArena';
import { StatesExplorer } from './components/StatesExplorer';
import { DailyChallenge } from './components/DailyChallenge';
import { FactVault } from './components/FactVault';
import { ParentPortfolio } from './components/ParentPortfolio';
import { CertificateModal } from './components/CertificateModal';
import { RestModal } from './components/RestModal';

export default function App() {
  const [data, setData] = useState<SaveData>(() => storage.get());
  const [screen, setScreen] = useState<'welcome' | 'hub'>('welcome');
  const [activeTab, setActiveTab] = useState<ActiveTab>('path');
  const [playingLevelNumber, setPlayingLevelNumber] = useState<number | null>(null);

  // Modals state
  const [showParentPortfolio, setShowParentPortfolio] = useState(false);
  const [showCertModal, setShowCertModal] = useState<number | null>(null);
  const [showRestModal, setShowRestModal] = useState(false);

  // Energy fraction
  const [energyFraction, setEnergyFraction] = useState<number>(() =>
    storage.getEnergyRemainingFraction()
  );

  // Sync audio & speech rates
  useEffect(() => {
    sound.setEnabled(data.soundEnabled);
    voice.setEnabled(data.voiceEnabled);
    voice.setRate(data.speechRate);
  }, [data.soundEnabled, data.voiceEnabled, data.speechRate]);

  // Screen time tracking interval
  useEffect(() => {
    const interval = setInterval(() => {
      // Only drain energy if not on welcome screen
      if (screen !== 'welcome' && data.sessionLimitMinutes > 0) {
        storage.addPlayTime(5000);
        const remaining = storage.getEnergyRemainingFraction();
        setEnergyFraction(remaining);

        if (remaining <= 0.02 && !showRestModal) {
          setShowRestModal(true);
          voice.say('Time for a healthy screen-time rest! Let us continue later.');
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [screen, data.sessionLimitMinutes, showRestModal]);

  const updateSettings = (patch: Partial<SaveData>) => {
    const updated = storage.save(patch);
    setData({ ...updated });
  };

  const handleStartGame = () => {
    sound.tap();
    voice.say("Welcome to StarScholar Academy! Let's explore American civics, 50 states, STEM, and world knowledge!");
    setScreen('hub');
    setActiveTab('path');
    setPlayingLevelNumber(null);
  };

  const handleToggleVoice = () => {
    const nextVal = !data.voiceEnabled;
    updateSettings({ voiceEnabled: nextVal });
    if (nextVal) {
      voice.say('Voice narration is on!');
    }
  };

  const handleChangeTier = (tier: ComplexityTier) => {
    updateSettings({ tier });
  };

  const handleResetProgress = () => {
    const reset = storage.resetProgress();
    setData({ ...reset });
    setScreen('welcome');
    setShowParentPortfolio(false);
  };

  const handleAddTenMinutes = () => {
    handleAddMinutes(10);
  };

  const handleAddMinutes = (minutes: number) => {
    const currentUsed = data.energyMs || 0;
    const addedMs = minutes * 60 * 1000;
    const nextUsed = Math.max(0, currentUsed - addedMs);
    const updated = storage.save({ energyMs: nextUsed, stamp: Date.now() });
    setData({ ...updated });
    setEnergyFraction(storage.getEnergyRemainingFraction());
    setShowRestModal(false);
    sound.good();
  };

  const handleSetUnlimitedFromRest = () => {
    const updated = storage.save({ sessionLimitMinutes: 0, energyMs: 0 });
    setData({ ...updated });
    setEnergyFraction(1);
    setShowRestModal(false);
    sound.good();
  };

  // Progressive level completion handler (Duolingo / Candy Crush style)
  const handleCompleteLevel = (
    stars: number,
    score: number,
    total: number,
    coinsEarned: number
  ) => {
    if (playingLevelNumber === null) return;
    const updated = storage.recordLevelCompleted(
      playingLevelNumber,
      stars,
      score,
      total,
      coinsEarned
    );
    setData({ ...updated });

    // Check milestone diploma (at 5, 10, 15, 20)
    if (stars > 0 && playingLevelNumber % 5 === 0 && playingLevelNumber <= 20) {
      setTimeout(() => {
        setShowCertModal(playingLevelNumber);
      }, 1500);
    }
  };

  // Quiz completion handler
  const handleSaveQuizResult = (log: QuizResultLog) => {
    const updated = storage.addQuizLog(log);
    const newCompleted = (data.completedCount || 0) + 1;
    const withCount = storage.save({
      completedCount: newCompleted,
      coins: (data.coins || 0) + log.score * 2,
    });
    setData({ ...withCount, quizLogs: updated.quizLogs });

    // Check milestone diploma (at 5, 10, 15)
    if (newCompleted % 5 === 0 && newCompleted <= 15) {
      setTimeout(() => {
        setShowCertModal(newCompleted);
      }, 1500);
    }
  };

  // Daily sprint completion handler
  const handleDailyComplete = (log: QuizResultLog) => {
    storage.recordDailyCompleted();
    const updated = storage.addQuizLog(log);
    setData({ ...updated });
  };

  // Fact discovery handler
  const handleDiscoverFact = (factId: string) => {
    const current = data.factsDiscovered || [];
    if (!current.includes(factId)) {
      const updated = storage.save({
        factsDiscovered: [...current, factId],
        coins: (data.coins || 0) + 1,
      });
      setData({ ...updated });
    }
  };

  return (
    <div className="relative w-full h-screen h-[100dvh] min-h-[100dvh] overflow-hidden bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* 1. Welcome Screen */}
      {screen === 'welcome' && (
        <WelcomeScreen
          currentTier={data.tier}
          voiceEnabled={data.voiceEnabled}
          unlockedLevel={data.unlockedLevel || 1}
          playerName={data.name}
          onStart={handleStartGame}
          onChangeTier={handleChangeTier}
          onToggleVoice={handleToggleVoice}
          onOpenParentCorner={() => setShowParentPortfolio(true)}
          onOpenPlayroom={() => {
            setScreen('hub');
            setActiveTab('buddy');
          }}
          onResetToScratch={handleResetProgress}
        />
      )}

      {/* 2. Main Learning Hub */}
      {screen === 'hub' && (
        <div className="flex flex-col w-full h-full overflow-hidden">
          <Navigation
            activeTab={activeTab}
            onSelectTab={tab => {
              sound.tap();
              setActiveTab(tab);
              setPlayingLevelNumber(null);
            }}
            data={data}
            onChangeTier={handleChangeTier}
            onOpenParentPortfolio={() => setShowParentPortfolio(true)}
            onToggleVoice={handleToggleVoice}
          />

          <main className="flex-1 overflow-y-auto relative bg-slate-50 pb-20 sm:pb-0 scroll-touch">
            {activeTab === 'path' && (
              playingLevelNumber !== null ? (
                <LevelPlayArena
                  key={playingLevelNumber}
                  levelNumber={playingLevelNumber}
                  data={data}
                  onCompleteLevel={handleCompleteLevel}
                  onExit={() => setPlayingLevelNumber(null)}
                  onNextLevel={nextNum => setPlayingLevelNumber(nextNum)}
                />
              ) : (
                <LevelJourneyMap
                  data={data}
                  unlockedLevel={data.unlockedLevel || 1}
                  progress={data.levelProgress || {}}
                  currentTier={data.tier}
                  onSelectLevel={lvlNum => setPlayingLevelNumber(lvlNum)}
                  onOpenParentCorner={() => setShowParentPortfolio(true)}
                />
              )
            )}

            {activeTab === 'gk' && (
              <GKArena
                tier={data.tier}
                voiceEnabled={data.voiceEnabled}
                onSaveQuizResult={handleSaveQuizResult}
                onOpenParentPortfolio={() => setShowParentPortfolio(true)}
              />
            )}

            {activeTab === 'states' && (
              <StatesExplorer
                tier={data.tier}
                voiceEnabled={data.voiceEnabled}
                onAwardCoins={c => updateSettings({ coins: (data.coins || 0) + c })}
              />
            )}

            {activeTab === 'buddy' && (
              <BuddyPlayroom
                voiceEnabled={data.voiceEnabled}
                onStartQuiz={() => {
                  sound.tap();
                  setActiveTab('path');
                }}
                onBackToMenu={() => {
                  sound.tap();
                  setActiveTab('path');
                }}
              />
            )}

            {activeTab === 'daily' && (
              <DailyChallenge
                tier={data.tier}
                streak={data.dailyStreak || 1}
                lastDailyDate={data.lastDailyDate || ''}
                voiceEnabled={data.voiceEnabled}
                onCompleteDaily={handleDailyComplete}
                onOpenParentPortfolio={() => setShowParentPortfolio(true)}
              />
            )}

            {activeTab === 'facts' && (
              <FactVault
                discoveredIds={data.factsDiscovered || []}
                onDiscoverFact={handleDiscoverFact}
                voiceEnabled={data.voiceEnabled}
              />
            )}
          </main>
        </div>
      )}

      {/* Dedicated Comprehensive Parent & Educator Portfolio */}
      {showParentPortfolio && (
        <ParentPortfolio
          data={data}
          onUpdateSettings={updateSettings}
          onResetProgress={handleResetProgress}
          onClose={() => setShowParentPortfolio(false)}
        />
      )}

      {/* Official Diploma Modal */}
      {showCertModal !== null && (
        <CertificateModal
          milestoneStop={showCertModal}
          childName={data.name}
          onSaveName={name => updateSettings({ name })}
          onClose={() => setShowCertModal(null)}
        />
      )}

      {/* Rest Screen Time Modal */}
      {showRestModal && (
        <RestModal
          onAddTenMinutes={handleAddTenMinutes}
          onAddMinutes={handleAddMinutes}
          onSetUnlimited={handleSetUnlimitedFromRest}
          onOpenParentCorner={() => {
            setShowRestModal(false);
            setShowParentPortfolio(true);
          }}
          onClose={() => {
            setShowRestModal(false);
            setScreen('hub');
          }}
        />
      )}
    </div>
  );
}
