import React, { useState, useEffect } from 'react';
import { MascotBuddy, MascotMood, MascotHat } from './MascotBuddy';
import {
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  Laugh,
  RefreshCw,
  Music,
  Heart,
  Moon,
  Sun,
  Flame,
  Star,
  BookOpen,
  ArrowLeft,
  Cookie,
  Apple,
  Crown,
  PartyPopper,
  Shield,
  Smile,
} from 'lucide-react';
import { voiceMimic, VoiceMimicState } from '../services/voiceMimic';
import { voice } from '../services/voice';
import { sound } from '../services/sound';
import { ComplexityTier } from '../types';

interface BuddyPlayroomProps {
  tier?: ComplexityTier;
  voiceEnabled?: boolean;
  onBackToMenu?: () => void;
  onStartQuiz?: () => void;
}

export const BuddyPlayroom: React.FC<BuddyPlayroomProps> = ({
  tier,
  voiceEnabled = true,
  onBackToMenu,
  onStartQuiz,
}) => {
  const [mimicState, setMimicState] = useState<VoiceMimicState>(voiceMimic.state);
  const [mood, setMood] = useState<MascotMood>('happy');
  const [hat, setHat] = useState<MascotHat>('scholar');
  const [bubbleText, setBubbleText] = useState<string>(
    "Hi buddy! Touch any part of my body or talk into the mic!"
  );
  const [activeSnack, setActiveSnack] = useState<string | null>(null);

  // Subscribe to voice mimic state
  useEffect(() => {
    return voiceMimic.subscribe(s => {
      setMimicState(s);
      if (s.isRecording) {
        setMood('listening');
        setBubbleText("Listening closely... Say hello, ask a question, or say anything!");
      } else if (s.isPlaying) {
        setMood('dance');
        if (s.transcribedText) {
          const lower = s.transcribedText.toLowerCase();
          if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
            setBubbleText(`"Hello superstar!" You said: "${s.transcribedText}"! Listen to your cartoon voice!`);
          } else if (lower.includes('name')) {
            setBubbleText(`"I am Hootie your owl buddy!" You said: "${s.transcribedText}"!`);
          } else if (lower.includes('joke')) {
            setBubbleText(`"Hoo-hoo! Why did the owl invite friends? For a hootenanny!"`);
          } else if (lower.includes('dance')) {
            setBubbleText(`"Party time! Wiggle wiggle jump!"`);
          } else {
            setBubbleText(`You said: "${s.transcribedText}"! Listen to your funny cartoon voice!`);
          }
        } else {
          setBubbleText("Listen to your funny cartoon voice!");
        }
      }
    });
  }, []);

  // Set mood helper with voice line
  const handleTriggerMood = (targetMood: MascotMood, voiceLine: string, soundFn?: () => void) => {
    sound.pick();
    setMood(targetMood);
    setBubbleText(voiceLine);
    if (soundFn) soundFn();
    voice.say(voiceLine);
  };

  // 1. Dance Party Action
  const handleDance = () => {
    sound.owlDanceBeat();
    setMood('dance');
    const danceLines = [
      "Let's party and dance! Shake your feathers to the beat!",
      "Look at my owl groove! Wiggle wiggle jump!",
      "Dance party time! Move your wings!",
    ];
    const pick = danceLines[Math.floor(Math.random() * danceLines.length)];
    setBubbleText(pick);
    voice.say(pick);
  };

  // 2. Cutie Pie Action
  const handleCutiePie = () => {
    sound.owlCutiePie();
    setMood('cutie');
    const cutieLines = [
      "Aww, you are my favorite best friend ever!",
      "Hoo-hoo! I feel so cute and happy with you!",
      "Sparkle sparkle! You brighten up my whole day!",
    ];
    const pick = cutieLines[Math.floor(Math.random() * cutieLines.length)];
    setBubbleText(pick);
    voice.say(pick);
  };

  // 3. Funny Grumpy Action
  const handleGrumpy = () => {
    sound.owlAnger();
    setMood('anger');
    const grumpyLines = [
      "Squawk! I'm a little grumpy, but you can still make me smile!",
      "Hmph! Who ate my blueberry snacks?!",
      "Pouty face! Tickle my belly to cheer me up!",
    ];
    const pick = grumpyLines[Math.floor(Math.random() * grumpyLines.length)];
    setBubbleText(pick);
    voice.say(pick);
  };

  // 4. Sad / Need Hug Action
  const handleSad = () => {
    sound.owlSad();
    setMood('sad');
    const sadLines = [
      "Aww, can I have a gentle warm hug?",
      "I'm feeling a little blue... Tap my tummy to make me happy!",
      "A soft hug makes every friend feel better!",
    ];
    const pick = sadLines[Math.floor(Math.random() * sadLines.length)];
    setBubbleText(pick);
    voice.say(pick);
  };

  // 5. Sleep / Bedtime Action
  const handleSleep = () => {
    sound.owlSnore();
    setMood('sleep');
    setBubbleText("Zzz... Cozy bedtime... Tap me anytime to wake me up!");
  };

  // 6. Wake Up Action
  const handleWakeUp = () => {
    sound.owlWakeUp();
    setMood('happy');
    const wakeLines = [
      "Yaaawn! Good morning, superstar! I'm wide awake!",
      "Hoo-hoo! That was the best nap ever! Let's play!",
    ];
    const pick = wakeLines[Math.floor(Math.random() * wakeLines.length)];
    setBubbleText(pick);
    voice.say(pick);
  };

  // 7. Feed Snacks Action
  const handleFeedSnack = (snack: string, emoji: string) => {
    sound.owlMunch();
    setMood('eating');
    setActiveSnack(emoji);
    const lines = [
      `Nom nom nom! Yummy ${snack}! My tummy is so happy!`,
      `Mmm, delicious ${snack}! Thank you for feeding me!`,
      `Chomp chomp! That was super tasty!`,
    ];
    const pick = lines[Math.floor(Math.random() * lines.length)];
    setBubbleText(pick);
    voice.say(pick);

    setTimeout(() => {
      setActiveSnack(null);
      setMood('happy');
    }, 2800);
  };

  // 8. Microphone Talk (Talking Tom Echo)
  const handleStartMic = async () => {
    sound.pick();
    setMood('listening');
    setBubbleText("Listening closely... Say anything into your microphone!");
    const ok = await voiceMimic.startListening();
    if (!ok && voiceMimic.state.error) {
      setBubbleText(voiceMimic.state.error);
      setMood('happy');
    }
  };

  const handleStopMic = () => {
    sound.tap();
    setBubbleText("Copying your voice now! Listen closely!");
    voiceMimic.stopListening();
  };

  const handleReplay = () => {
    sound.owlChirp();
    setMood('dance');
    setBubbleText("Here is your funny cartoon voice again!");
    voiceMimic.playCartoonVoice(1.24);
  };

  // Soundboard triggers
  const handleTellJoke = () => {
    sound.owlChirp();
    setMood('celebrate');
    const joke = voiceMimic.tellMascotJoke();
    setBubbleText(joke);
    voice.say(joke);
  };

  const handleHoot = () => {
    sound.owlHoot();
    setMood('happy');
    const line = "Hooo-hooo! Welcome to our magical owl kingdom!";
    setBubbleText(line);
    voice.say(line);
  };

  const handleGiggle = () => {
    sound.owlGiggle();
    setMood('happy');
    const line = "Hehehe! Giggles make learning super fun!";
    setBubbleText(line);
    voice.say(line);
  };

  const handlePetHootie = () => {
    sound.owlPurr();
    setMood('cutie');
    const line = "Purrr... Soft pets feel so cozy and sweet!";
    setBubbleText(line);
    voice.say(line);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 py-4 flex flex-col items-center gap-4">
      {/* TOP BAR: BACK & QUICK STATUS */}
      <div className="w-full flex items-center justify-between">
        {onBackToMenu ? (
          <button
            type="button"
            onClick={onBackToMenu}
            className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-extrabold text-xs sm:text-sm rounded-2xl shadow-xs transition-colors cursor-pointer active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Home</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-100 text-emerald-900 rounded-2xl font-black text-xs">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Hootie's Playground</span>
          </div>
        )}

        {/* Dress Up Hats Quick-Picker */}
        <div className="flex items-center gap-1 sm:gap-1.5 bg-white border border-slate-200 p-0.5 sm:p-1 rounded-2xl shadow-xs">
          <button
            type="button"
            onClick={() => {
              sound.tap();
              setHat('scholar');
            }}
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-sm sm:text-base transition-all cursor-pointer ${
              hat === 'scholar' ? 'bg-emerald-600 text-white shadow-xs' : 'hover:bg-slate-100'
            }`}
            title="Scholar Cap"
          >
            🎓
          </button>
          <button
            type="button"
            onClick={() => {
              sound.tap();
              setHat('crown');
            }}
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-sm sm:text-base transition-all cursor-pointer ${
              hat === 'crown' ? 'bg-amber-500 text-white shadow-xs' : 'hover:bg-slate-100'
            }`}
            title="Royal Crown"
          >
            👑
          </button>
          <button
            type="button"
            onClick={() => {
              sound.tap();
              setHat('party');
            }}
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-sm sm:text-base transition-all cursor-pointer ${
              hat === 'party' ? 'bg-pink-500 text-white shadow-xs' : 'hover:bg-slate-100'
            }`}
            title="Party Hat"
          >
            🥳
          </button>
          <button
            type="button"
            onClick={() => {
              sound.tap();
              setHat('detective');
            }}
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-sm sm:text-base transition-all cursor-pointer ${
              hat === 'detective' ? 'bg-amber-700 text-white shadow-xs' : 'hover:bg-slate-100'
            }`}
            title="Detective Cap"
          >
            🕵️
          </button>
          <button
            type="button"
            onClick={() => {
              sound.tap();
              setHat('superhero');
            }}
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-sm sm:text-base transition-all cursor-pointer ${
              hat === 'superhero' ? 'bg-blue-600 text-white shadow-xs' : 'hover:bg-slate-100'
            }`}
            title="Superhero Mask"
          >
            🦸
          </button>
        </div>
      </div>

      {/* MAIN PLAYGROUND STAGE */}
      <div
        className={`w-full border-2 rounded-3xl p-4 sm:p-8 flex flex-col items-center text-center relative shadow-sm transition-colors duration-500 ${
          mood === 'sleep'
            ? 'bg-gradient-to-b from-indigo-950 via-slate-900 to-indigo-950 border-indigo-700 text-white'
            : mood === 'dance'
            ? 'bg-gradient-to-b from-pink-50 via-purple-50 to-amber-50 border-purple-300'
            : mood === 'anger'
            ? 'bg-gradient-to-b from-rose-50 via-white to-orange-50 border-rose-300'
            : mood === 'cutie'
            ? 'bg-gradient-to-b from-pink-50 via-white to-pink-100/50 border-pink-300'
            : 'bg-gradient-to-b from-emerald-50/70 via-white to-sky-50/60 border-emerald-200'
        }`}
      >
        {/* Floating Snack Emoji when munching */}
        {activeSnack && (
          <div className="absolute top-20 text-4xl animate-bounce z-40">
            {activeSnack}
          </div>
        )}

        {/* 3D Owl Mascot */}
        <div className="my-2">
          <MascotBuddy
            size="hero"
            mood={mood}
            hat={hat}
            speechBubbleText={bubbleText}
            showControls={false}
            interactive={true}
            onMoodChange={m => setMood(m)}
          />
        </div>

        {/* GIANT KID-FRIENDLY TALKING MIC BUTTON */}
        <div className="w-full max-w-md flex items-center gap-2 mt-4">
          {!mimicState.isRecording ? (
            <button
              type="button"
              onClick={handleStartMic}
              className="flex-1 h-16 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:to-teal-700 active:scale-95 text-white font-heading font-black text-base sm:text-lg rounded-2xl shadow-lg transition-all flex items-center justify-center gap-3 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Mic className="w-6 h-6 text-white animate-pulse" />
              </div>
              <span>Press to Talk to Me!</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStopMic}
              className="flex-1 h-16 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-heading font-black text-base sm:text-lg rounded-2xl shadow-lg transition-all flex items-center justify-center gap-3 animate-pulse cursor-pointer"
            >
              <MicOff className="w-6 h-6 text-white" />
              <span>Done! Copy My Voice!</span>
            </button>
          )}

          {mimicState.hasAudio && !mimicState.isRecording && (
            <button
              type="button"
              onClick={handleReplay}
              className="h-16 px-5 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-2xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              title="Play Funny Voice Again"
            >
              <RefreshCw className="w-5 h-5" />
              <span className="hidden sm:inline font-bold text-sm">Play</span>
            </button>
          )}
        </div>

        {/* KID REACTION & EMOTION ACTION BAR (VISUAL & COLORFUL) */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 sm:gap-2 w-full max-w-lg mt-3 sm:mt-4">
          {/* 1. Dance */}
          <button
            type="button"
            onClick={handleDance}
            className={`h-13 sm:h-14 rounded-2xl border-2 font-heading font-black text-xs flex flex-col items-center justify-center gap-0.5 sm:gap-1 transition-all active:scale-95 cursor-pointer shadow-xs ${
              mood === 'dance'
                ? 'bg-purple-600 text-white border-purple-700 scale-105 shadow-md'
                : 'bg-white hover:bg-purple-50 text-purple-900 border-purple-200'
            }`}
          >
            <span className="text-lg sm:text-xl">💃</span>
            <span>Dance!</span>
          </button>

          {/* 2. Cutie Pie */}
          <button
            type="button"
            onClick={handleCutiePie}
            className={`h-13 sm:h-14 rounded-2xl border-2 font-heading font-black text-xs flex flex-col items-center justify-center gap-0.5 sm:gap-1 transition-all active:scale-95 cursor-pointer shadow-xs ${
              mood === 'cutie'
                ? 'bg-pink-600 text-white border-pink-700 scale-105 shadow-md'
                : 'bg-white hover:bg-pink-50 text-pink-900 border-pink-200'
            }`}
          >
            <span className="text-lg sm:text-xl">💖</span>
            <span>Cutie Pie</span>
          </button>

          {/* 3. Funny Grumpy */}
          <button
            type="button"
            onClick={handleGrumpy}
            className={`h-13 sm:h-14 rounded-2xl border-2 font-heading font-black text-xs flex flex-col items-center justify-center gap-0.5 sm:gap-1 transition-all active:scale-95 cursor-pointer shadow-xs ${
              mood === 'anger'
                ? 'bg-rose-600 text-white border-rose-700 scale-105 shadow-md'
                : 'bg-white hover:bg-rose-50 text-rose-900 border-rose-200'
            }`}
          >
            <span className="text-lg sm:text-xl">😡</span>
            <span>Grumpy</span>
          </button>

          {/* 4. Sad / Hug */}
          <button
            type="button"
            onClick={handleSad}
            className={`h-13 sm:h-14 rounded-2xl border-2 font-heading font-black text-xs flex flex-col items-center justify-center gap-0.5 sm:gap-1 transition-all active:scale-95 cursor-pointer shadow-xs ${
              mood === 'sad'
                ? 'bg-blue-600 text-white border-blue-700 scale-105 shadow-md'
                : 'bg-white hover:bg-blue-50 text-blue-900 border-blue-200'
            }`}
          >
            <span className="text-lg sm:text-xl">😢</span>
            <span>Need Hug</span>
          </button>

          {/* 5. Sleep / Rest */}
          {mood !== 'sleep' ? (
            <button
              type="button"
              onClick={handleSleep}
              className="h-13 sm:h-14 rounded-2xl border-2 font-heading font-black text-xs flex flex-col items-center justify-center gap-0.5 sm:gap-1 transition-all active:scale-95 cursor-pointer shadow-xs bg-white hover:bg-indigo-50 text-indigo-900 border-indigo-200"
            >
              <span className="text-lg sm:text-xl">😴</span>
              <span>Sleep</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleWakeUp}
              className="h-13 sm:h-14 rounded-2xl border-2 font-heading font-black text-xs flex flex-col items-center justify-center gap-0.5 sm:gap-1 transition-all active:scale-95 cursor-pointer shadow-md bg-amber-400 text-slate-950 border-amber-500 scale-105 animate-bounce"
            >
              <span className="text-lg sm:text-xl">☀️</span>
              <span>Wake Up!</span>
            </button>
          )}

          {/* 6. Joke / Riddle */}
          <button
            type="button"
            onClick={handleTellJoke}
            className="h-13 sm:h-14 rounded-2xl border-2 font-heading font-black text-xs flex flex-col items-center justify-center gap-0.5 sm:gap-1 transition-all active:scale-95 cursor-pointer shadow-xs bg-white hover:bg-amber-50 text-amber-900 border-amber-200"
          >
            <span className="text-lg sm:text-xl">😄</span>
            <span>Tell Joke</span>
          </button>
        </div>

        {/* FEED HOOTIE YUMMY SNACKS */}
        <div className="w-full max-w-lg mt-3 sm:mt-4 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl p-2.5 sm:p-3 flex flex-col xs:flex-row items-center justify-between gap-2 shadow-2xs">
          <span className="text-xs font-heading font-black text-slate-700 flex items-center gap-1">
            <span>Feed Snack:</span>
          </span>

          <div className="grid grid-cols-3 gap-1.5 sm:flex sm:items-center sm:gap-2 w-full xs:w-auto">
            <button
              type="button"
              onClick={() => handleFeedSnack('strawberries', '🍓')}
              className="px-2.5 sm:px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold text-rose-900 flex items-center justify-center gap-1 cursor-pointer active:scale-95"
            >
              <span>🍓</span>
              <span>Berry</span>
            </button>

            <button
              type="button"
              onClick={() => handleFeedSnack('green apple', '🍏')}
              className="px-2.5 sm:px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-900 flex items-center justify-center gap-1 cursor-pointer active:scale-95"
            >
              <span>🍏</span>
              <span>Apple</span>
            </button>

            <button
              type="button"
              onClick={() => handleFeedSnack('chocolate cookie', '🍪')}
              className="px-2.5 sm:px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl text-xs font-bold text-amber-900 flex items-center justify-center gap-1 cursor-pointer active:scale-95"
            >
              <span>🍪</span>
              <span>Cookie</span>
            </button>
          </div>
        </div>

        {/* SOUNDBOARD FOR DIRECT HOOTS & CHIRPS */}
        <div className="flex items-center gap-2 mt-3 flex-wrap justify-center">
          <button
            type="button"
            onClick={handleHoot}
            className="px-3.5 py-1.5 bg-white hover:bg-emerald-50 border border-emerald-200 text-emerald-800 font-extrabold text-xs rounded-xl shadow-2xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Owl Hoot</span>
          </button>

          <button
            type="button"
            onClick={handleGiggle}
            className="px-3.5 py-1.5 bg-white hover:bg-amber-50 border border-amber-200 text-amber-800 font-extrabold text-xs rounded-xl shadow-2xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <Laugh className="w-3.5 h-3.5 text-amber-600" />
            <span>Giggle</span>
          </button>

          <button
            type="button"
            onClick={handlePetHootie}
            className="px-3.5 py-1.5 bg-white hover:bg-pink-50 border border-pink-200 text-pink-800 font-extrabold text-xs rounded-xl shadow-2xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-500" />
            <span>Pet & Purr</span>
          </button>
        </div>
      </div>

      {/* QUICK PLAY QUIZ LINK (PLAYFUL CARD, NO BORING TEXT) */}
      {onStartQuiz && (
        <div className="w-full max-w-md bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-3.5 flex items-center justify-between text-white shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Star className="w-5 h-5 text-amber-300 fill-amber-300" />
            </div>
            <div className="text-left">
              <h4 className="font-heading font-black text-sm text-white">Ready for a Quiz?</h4>
              <p className="text-[11px] text-blue-100 font-medium">Earn stars with Hootie!</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onStartQuiz}
            className="px-4 py-2 bg-amber-400 hover:bg-amber-500 active:scale-95 text-slate-950 font-heading font-black text-xs rounded-xl shadow-sm transition-all cursor-pointer"
          >
            Start Quiz!
          </button>
        </div>
      )}
    </div>
  );
};
