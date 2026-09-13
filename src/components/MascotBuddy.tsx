import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, Sparkles, Heart, Mic, MicOff, RefreshCw } from 'lucide-react';
import { voiceMimic, VoiceMimicState } from '../services/voiceMimic';
import { voice } from '../services/voice';
import { sound } from '../services/sound';

export type MascotMood =
  | 'normal'
  | 'happy'
  | 'dance'
  | 'cutie'
  | 'anger'
  | 'sad'
  | 'sweet'
  | 'sleep'
  | 'listening'
  | 'talking'
  | 'celebrate'
  | 'eating'
  | 'thinking';

export type MascotHat = 'scholar' | 'crown' | 'party' | 'detective' | 'superhero';

export interface MascotBuddyProps {
  size?: 'sm' | 'md' | 'lg' | 'hero';
  showControls?: boolean;
  speechBubbleText?: string | null;
  onBubbleClick?: () => void;
  mood?: MascotMood;
  hat?: MascotHat;
  interactive?: boolean;
  className?: string;
  onMoodChange?: (newMood: MascotMood) => void;
}

export const MascotBuddy: React.FC<MascotBuddyProps> = ({
  size = 'md',
  showControls = false,
  speechBubbleText = null,
  onBubbleClick,
  mood: propMood,
  hat = 'scholar',
  interactive = true,
  className = '',
  onMoodChange,
}) => {
  // Active mood state
  const [currentMood, setCurrentMood] = useState<MascotMood>(propMood || 'happy');
  const [mimicState, setMimicState] = useState<VoiceMimicState>(voiceMimic.state);
  const [activeSpeech, setActiveSpeech] = useState<string | null>(speechBubbleText);

  // Voice playback sync
  const [isVoiceSpeaking, setIsVoiceSpeaking] = useState(false);
  const [voiceMouthLevel, setVoiceMouthLevel] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);

  // --- 60 FPS PROCEDURAL SKELETAL ANIMATION REFS ---
  const animFrameRef = useRef<number | null>(null);
  const clockRef = useRef(0);
  const lastTimeRef = useRef(performance.now());

  // Mouse / Pointer tracking
  const targetGazeRef = useRef({ x: 0, y: 0 }); // Normalized -1 to 1
  const smoothedGazeRef = useRef({ x: 0, y: 0 });

  // Spring physics for whole-body squash & stretch
  const springScaleRef = useRef({ x: 1, y: 1 });
  const springVelRef = useRef({ x: 0, y: 0 });

  // Ear tuft twitches (like cat ear flicks in the video)
  const leftEarTwitchRef = useRef({ time: 0, active: false });
  const rightEarTwitchRef = useRef({ time: 0, active: false });
  const nextTwitchTimeRef = useRef(2.5);

  // Blinking system
  const blinkTimerRef = useRef(3.0);
  const blinkProgressRef = useRef(0); // 0 = open, 1 = fully closed

  // Tail swish phase
  const tailAngleRef = useRef(0);

  // Petting interaction state
  const isPointerDownRef = useRef(false);
  const pointerStartPosRef = useRef({ x: 0, y: 0 });
  const pointerLastPosRef = useRef({ x: 0, y: 0 });
  const petDistanceRef = useRef(0);
  const isPettingRef = useRef(false);
  const lastPetSoundTimeRef = useRef(0);

  // Smoothed joints output state for rendering
  const [frameData, setFrameData] = useState({
    headAngle: 0,
    headBobY: 0,
    headTiltX: 0,
    bodyScaleX: 1,
    bodyScaleY: 1,
    bodyBobY: 0,
    wingLAngle: 0,
    wingRAngle: 0,
    tailAngle: 0,
    earLTwitch: 0,
    earRTwitch: 0,
    pupilX: 0,
    pupilY: 0,
    blinkAmount: 0,
    mouthOpen: 0,
    tasselAngle: 0,
  });

  // Sync prop mood
  useEffect(() => {
    if (propMood) {
      setCurrentMood(propMood);
    }
  }, [propMood]);

  // Sync voice mimic
  useEffect(() => {
    return voiceMimic.subscribe(s => {
      setMimicState(s);
      if (s.isRecording) {
        setCurrentMood('listening');
      } else if (s.isPlaying) {
        setCurrentMood('talking');
      }
    });
  }, []);

  // Sync speech voice
  useEffect(() => {
    return voice.subscribe((speaking, mouthLevel) => {
      setIsVoiceSpeaking(speaking);
      setVoiceMouthLevel(mouthLevel);
    });
  }, []);

  // Sync speech bubble
  useEffect(() => {
    if (speechBubbleText !== undefined) {
      setActiveSpeech(speechBubbleText);
    }
  }, [speechBubbleText]);

  const updateMood = useCallback((newMood: MascotMood) => {
    setCurrentMood(newMood);
    onMoodChange?.(newMood);
  }, [onMoodChange]);

  // Apply squash/stretch spring impulse
  const triggerSpringImpulse = useCallback((squash = -0.16) => {
    springVelRef.current.y += squash * 14;
    springVelRef.current.x -= squash * 10;
  }, []);

  // --- 60 FPS CONTINUOUS PROCEDURAL SKELETAL LOOP ---
  useEffect(() => {
    let active = true;

    const tick = (now: number) => {
      if (!active) return;
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = now;
      clockRef.current += dt;
      const t = clockRef.current;

      // 1. Spring-Damper Physics (Squash and Stretch)
      const k = 170; // Spring stiffness
      const d = 14;  // Damping
      const fX = -k * (springScaleRef.current.x - 1) - d * springVelRef.current.x;
      const fY = -k * (springScaleRef.current.y - 1) - d * springVelRef.current.y;
      springVelRef.current.x += fX * dt;
      springVelRef.current.y += fY * dt;
      springScaleRef.current.x += springVelRef.current.x * dt;
      springScaleRef.current.y += springVelRef.current.y * dt;

      // 2. Smooth Gaze Tracking (lerp towards mouse cursor)
      const gazeLerp = 8 * dt;
      smoothedGazeRef.current.x += (targetGazeRef.current.x - smoothedGazeRef.current.x) * gazeLerp;
      smoothedGazeRef.current.y += (targetGazeRef.current.y - smoothedGazeRef.current.y) * gazeLerp;

      // 3. Cat-Style Ear Tufts Twitches
      nextTwitchTimeRef.current -= dt;
      if (nextTwitchTimeRef.current <= 0) {
        if (Math.random() > 0.5) {
          leftEarTwitchRef.current = { time: 0, active: true };
        } else {
          rightEarTwitchRef.current = { time: 0, active: true };
        }
        nextTwitchTimeRef.current = 2.4 + Math.random() * 3.8;
      }

      let earLTwitch = 0;
      if (leftEarTwitchRef.current.active) {
        leftEarTwitchRef.current.time += dt;
        const et = leftEarTwitchRef.current.time;
        if (et > 0.35) {
          leftEarTwitchRef.current.active = false;
        } else {
          // Double flicker vibration
          earLTwitch = Math.sin(et * 45) * 14 * Math.exp(-et * 9);
        }
      }

      let earRTwitch = 0;
      if (rightEarTwitchRef.current.active) {
        rightEarTwitchRef.current.time += dt;
        const et = rightEarTwitchRef.current.time;
        if (et > 0.35) {
          rightEarTwitchRef.current.active = false;
        } else {
          earRTwitch = Math.sin(et * 45) * 14 * Math.exp(-et * 9);
        }
      }

      // 4. Natural Organic Blinking Cycle (Smooth cosine curve)
      blinkTimerRef.current -= dt;
      let blinkAmount = 0;
      if (currentMood === 'sleep') {
        blinkAmount = 1; // Sleeping eyes permanently closed
      } else {
        if (blinkTimerRef.current <= 0) {
          const blinkDuration = 0.18;
          const blinkElapsed = -blinkTimerRef.current;
          if (blinkElapsed < blinkDuration) {
            // Eyelid closes smoothly and opens with smooth easing
            blinkAmount = Math.sin((blinkElapsed / blinkDuration) * Math.PI);
          } else {
            blinkTimerRef.current = 2.8 + Math.random() * 3.2; // Next blink in 2.8-6s
          }
        }
      }

      // 5. Tail Swishing Physics (Like the cat's tail in the video!)
      let targetTail = Math.sin(t * 2.2 - 0.5) * 12;
      if (currentMood === 'dance' || currentMood === 'celebrate') {
        targetTail = Math.sin(t * 7) * 26; // Rapid joyful tail wag!
      } else if (currentMood === 'sleep') {
        targetTail = Math.sin(t * 1.0) * 4;
      }
      tailAngleRef.current += (targetTail - tailAngleRef.current) * (6 * dt);

      // 6. Articulated Skeletal Movement Based on Mood
      let headAngle = 0;
      let headBobY = 0;
      let headTiltX = 0;
      let bodyBobY = 0;
      let breathScaleY = 1;
      let breathScaleX = 1;
      let wingLAngle = 0;
      let wingRAngle = 0;
      let mouthOpen = 0;

      // Base breathing rhythm
      const breathCycle = Math.sin(t * 2.5);
      breathScaleY = 1 + breathCycle * 0.032;
      breathScaleX = 1 - breathCycle * 0.015;
      bodyBobY = -breathCycle * 2;

      // Smooth mouse-follow head tilt
      headAngle = smoothedGazeRef.current.x * 12 + Math.sin(t * 1.6) * 3.5;
      headTiltX = smoothedGazeRef.current.y * 8;
      headBobY = Math.sin(t * 3.2) * 1.8;

      // Wing breathing idle sway
      wingLAngle = -breathCycle * 3.5;
      wingRAngle = breathCycle * 3.5;

      // Mood-specific skeletal overrides
      switch (currentMood) {
        case 'dance': {
          // Rhythmic bounce and groove
          const danceBeat = Math.sin(t * 7.5);
          bodyBobY = Math.abs(danceBeat) * -12;
          headBobY = danceBeat * 6;
          headAngle = Math.sin(t * 3.75) * 16;
          wingLAngle = Math.sin(t * 7.5) * 38 - 12;
          wingRAngle = -Math.sin(t * 7.5) * 38 + 12;
          break;
        }
        case 'cutie':
        case 'sweet': {
          // Sweet head tilt, gentle rocking, big shiny eyes
          headAngle = -9 + Math.sin(t * 2.0) * 3;
          wingLAngle = 14 + Math.sin(t * 3) * 4; // Folded like paws
          wingRAngle = -14 - Math.sin(t * 3) * 4;
          headBobY = Math.sin(t * 2.5) * 2;
          break;
        }
        case 'anger': {
          // Comical angry shake / puff
          bodyBobY = (Math.random() - 0.5) * 2.5;
          headAngle = Math.sin(t * 24) * 4.5;
          wingLAngle = -22 + Math.sin(t * 12) * 4;
          wingRAngle = 22 - Math.sin(t * 12) * 4;
          breathScaleX = 1.06;
          break;
        }
        case 'sleep': {
          // Slow deep breathing, drooping head
          const sleepBreath = Math.sin(t * 1.2);
          breathScaleY = 1 + sleepBreath * 0.045;
          bodyBobY = 5 + sleepBreath * 3;
          headBobY = 6;
          headAngle = 3;
          wingLAngle = 12;
          wingRAngle = -12;
          break;
        }
        case 'celebrate': {
          // Full flight flap
          const flap = Math.sin(t * 12);
          bodyBobY = -8 + flap * 6;
          wingLAngle = flap * 40 - 15;
          wingRAngle = -flap * 40 + 15;
          headBobY = -flap * 3;
          break;
        }
        case 'happy': {
          // Cheerful bouncy wobble and laughing wings
          const happyBeat = Math.sin(t * 6.5);
          bodyBobY = -Math.abs(happyBeat) * 5.5;
          headBobY = happyBeat * 2.5;
          headAngle = Math.sin(t * 3.2) * 6;
          wingLAngle = Math.sin(t * 6.5) * 18 - 8;
          wingRAngle = -Math.sin(t * 6.5) * 18 + 8;
          break;
        }
        case 'sad': {
          headBobY = 8;
          headAngle = Math.sin(t * 1.2) * 2;
          wingLAngle = 8;
          wingRAngle = -8;
          bodyBobY = 4;
          break;
        }
      }

      // Mouth opening animation when talking, laughing, or singing
      const isSpeaking = mimicState.isPlaying || currentMood === 'talking' || isVoiceSpeaking;
      if (isSpeaking) {
        const audioAmp = mimicState.audioLevel || voiceMouthLevel || 0.55;
        mouthOpen = Math.max(3.5, Math.min(17, (0.45 + Math.sin(t * 19) * 0.55) * audioAmp * 20));
        headBobY += Math.sin(t * 16) * 1.2;
      } else if (currentMood === 'happy' || currentMood === 'celebrate' || currentMood === 'dance') {
        // Laughing open mouth showing teeth and playful tongue bounce
        mouthOpen = 8.5 + Math.sin(t * 9) * 2.5;
      } else if (currentMood === 'eating') {
        mouthOpen = 6 + Math.abs(Math.sin(t * 14)) * 8;
      } else if (currentMood === 'anger') {
        mouthOpen = 0;
      }

      // Cap Tassel Physics (Swings with head inertia)
      const tasselAngle = -headAngle * 0.8 + Math.sin(t * 2.5) * 6;

      setFrameData({
        headAngle,
        headBobY,
        headTiltX,
        bodyScaleX: breathScaleX * springScaleRef.current.x,
        bodyScaleY: breathScaleY * springScaleRef.current.y,
        bodyBobY,
        wingLAngle,
        wingRAngle,
        tailAngle: tailAngleRef.current,
        earLTwitch,
        earRTwitch,
        pupilX: smoothedGazeRef.current.x * 6,
        pupilY: smoothedGazeRef.current.y * 5,
        blinkAmount,
        mouthOpen,
        tasselAngle,
      });

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      active = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [currentMood, mimicState.isPlaying, mimicState.audioLevel, isVoiceSpeaking, voiceMouthLevel]);

  // Mouse / Touch Move Listener for 3D Gaze Tracking & Petting
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive || !containerRef.current || currentMood === 'sleep') return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const normX = Math.max(-1, Math.min(1, (e.clientX - centerX) / (rect.width / 2)));
    const normY = Math.max(-1, Math.min(1, (e.clientY - centerY) / (rect.height / 2)));
    targetGazeRef.current = { x: normX, y: normY };

    // Detect Petting / Stroking Drag
    if (isPointerDownRef.current) {
      const dx = e.clientX - pointerLastPosRef.current.x;
      const dy = e.clientY - pointerLastPosRef.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      petDistanceRef.current += dist;
      pointerLastPosRef.current = { x: e.clientX, y: e.clientY };

      // If user is stroking across the owl (petting gesture)
      if (petDistanceRef.current > 24) {
        isPettingRef.current = true;
        const now = performance.now();
        if (now - lastPetSoundTimeRef.current > 420) {
          lastPetSoundTimeRef.current = now;
          sound.owlPurr();
          triggerSpringImpulse(-0.06);
          if (currentMood !== 'cutie') {
            updateMood('cutie');
            setActiveSpeech("Purr... That feels so nice!");
          }
        }
      }
    }
  };

  const handlePointerLeave = () => {
    targetGazeRef.current = { x: 0, y: 0 };
    isPointerDownRef.current = false;
    isPettingRef.current = false;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive) return;
    isPointerDownRef.current = true;
    isPettingRef.current = false;
    petDistanceRef.current = 0;
    pointerStartPosRef.current = { x: e.clientX, y: e.clientY };
    pointerLastPosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = () => {
    isPointerDownRef.current = false;
    setTimeout(() => {
      isPettingRef.current = false;
    }, 100);
  };

  // --- INDIVIDUAL BODY PART CLICK REACTIONS ---

  // 1. TOUCH BEAK -> Comical Pout & Squawk!
  const handleTouchBeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!interactive || isPettingRef.current) return;

    sound.owlAnger();
    triggerSpringImpulse(-0.25);
    updateMood('anger');

    const angryLines = [
      "Hey! Hands off my beak, silly tickler!",
      "Hoo! No poking my beak, that's my berry-catcher!",
      "Squawk! My beak is sensitive, mister tickle monster!",
      "Grumpy owl alert! Give my beak some space!",
    ];
    const pick = angryLines[Math.floor(Math.random() * angryLines.length)];
    setActiveSpeech(pick);
    voice.say(pick);

    setTimeout(() => {
      setCurrentMood(prev => (prev === 'anger' ? 'happy' : prev));
    }, 4200);
  };

  // 2. TOUCH HEAD / CAP -> Sweet Kawaii Cutie Pat!
  const handleTouchHead = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!interactive || isPettingRef.current) return;

    sound.owlCutiePie();
    triggerSpringImpulse(-0.15);
    updateMood('cutie');

    const cuteLines = [
      "Aww, gentle head pats! You are my best buddy!",
      "Hoo-hoo! I feel so cute and loved!",
      "Purr... That feels like a warm hug!",
      "You have such a kind heart, superstar!",
    ];
    const pick = cuteLines[Math.floor(Math.random() * cuteLines.length)];
    setActiveSpeech(pick);
    voice.say(pick);

    setTimeout(() => {
      setCurrentMood(prev => (prev === 'cutie' ? 'happy' : prev));
    }, 4500);
  };

  // 3. TOUCH BELLY -> Giggles & Ticklish Wobble!
  const handleTouchBelly = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!interactive || isPettingRef.current) return;

    sound.owlGiggle();
    triggerSpringImpulse(-0.22);
    updateMood('happy');

    const bellyLines = [
      "Hahaha! Stop, my tummy is way too ticklish!",
      "Hehehe, hoo-hoo! Tickle attack on my fluffy belly!",
      "Giggles overload! You make me so happy!",
      "Hoo-hoo-hoo! My belly feathers tickle so much!",
    ];
    const pick = bellyLines[Math.floor(Math.random() * bellyLines.length)];
    setActiveSpeech(pick);
    voice.say(pick);
  };

  // 4. TOUCH LEFT WING -> High Five!
  const handleTouchLeftWing = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!interactive || isPettingRef.current) return;

    sound.owlChirp();
    triggerSpringImpulse(-0.12);
    updateMood('sweet');

    const wingLines = [
      "High five, superstar! You are brilliant!",
      "Wing five! Let's conquer another quiz together!",
      "Hello friend! Hootie is proud of you!",
    ];
    const pick = wingLines[Math.floor(Math.random() * wingLines.length)];
    setActiveSpeech(pick);
    voice.say(pick);

    setTimeout(() => {
      setCurrentMood(prev => (prev === 'sweet' ? 'happy' : prev));
    }, 3800);
  };

  // 5. TOUCH RIGHT WING -> Flight Flap & Soar!
  const handleTouchRightWing = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!interactive || isPettingRef.current) return;

    sound.owlFlutter();
    triggerSpringImpulse(-0.18);
    updateMood('celebrate');

    const flyLines = [
      "Flap flap flap! Watch me fly high into the sky!",
      "Ready for takeoff! Zoom through knowledge!",
      "Wings up! You can soar as high as your dreams!",
    ];
    const pick = flyLines[Math.floor(Math.random() * flyLines.length)];
    setActiveSpeech(pick);
    voice.say(pick);

    setTimeout(() => {
      setCurrentMood(prev => (prev === 'celebrate' ? 'happy' : prev));
    }, 4000);
  };

  // 6. TOUCH FEET -> Spring Hop Boing!
  const handleTouchFeet = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!interactive || isPettingRef.current) return;

    sound.owlBoing();
    triggerSpringImpulse(-0.35); // Big jump bounce!

    const feetLines = [
      "Whoaaa! My owl toes are super ticklish! Hop hop hop!",
      "Bouncy bounce! My feet are ready to dance!",
      "Boing! Look at how high I can hop!",
    ];
    const pick = feetLines[Math.floor(Math.random() * feetLines.length)];
    setActiveSpeech(pick);
    voice.say(pick);
  };

  // 7. WAKE UP FROM SLEEP
  const handleWakeUp = (e: React.MouseEvent) => {
    e.stopPropagation();
    sound.owlWakeUp();
    triggerSpringImpulse(-0.25);
    updateMood('happy');

    const wakeLines = [
      "Yaaawn... Good morning, sunshine! I had the sweetest dream!",
      "I am awake and bursting with energy! Let's play!",
      "Hoo-hoo! Ready for another great learning adventure!",
    ];
    const pick = wakeLines[Math.floor(Math.random() * wakeLines.length)];
    setActiveSpeech(pick);
    voice.say(pick);
  };

  // Fallback body click
  const handleBodyClick = (e: React.MouseEvent) => {
    if (currentMood === 'sleep') {
      handleWakeUp(e);
      return;
    }
    handleTouchBelly(e);
  };

  // Mic controls for voice echo
  const handleStartMic = async () => {
    sound.pick();
    setActiveSpeech("Listening closely... Say anything and I'll copy your voice!");
    updateMood('listening');
    const ok = await voiceMimic.startListening();
    if (!ok && voiceMimic.state.error) {
      setActiveSpeech(voiceMimic.state.error);
      updateMood('happy');
    }
  };

  const handleStopMic = () => {
    sound.tap();
    setActiveSpeech("Done! Watch me copy your voice right now!");
    voiceMimic.stopListening();
  };

  const handleReplayMimic = () => {
    sound.owlChirp();
    setActiveSpeech("Here is your cartoon voice again!");
    voiceMimic.playCartoonVoice(1.24);
  };

  // Responsive dimension classes for container
  const sizeClasses = {
    sm: 'w-[72px] h-[84px] sm:w-[84px] sm:h-[98px]',
    md: 'w-[110px] h-[128px] sm:w-[136px] sm:h-[160px]',
    lg: 'w-[145px] h-[170px] sm:w-[184px] sm:h-[216px]',
    hero: 'w-[180px] h-[210px] sm:w-[215px] sm:h-[250px] md:w-[240px] md:h-[280px]',
  }[size];

  const isTalking = mimicState.isPlaying || currentMood === 'talking' || isVoiceSpeaking;
  const isSpeaking = isTalking;
  const isListening = mimicState.isRecording || currentMood === 'listening';
  const isDancing = currentMood === 'dance';
  const isSleeping = currentMood === 'sleep';
  const isAngry = currentMood === 'anger';
  const isCutie = currentMood === 'cutie' || currentMood === 'sweet';

  return (
    <div className={`flex flex-col items-center select-none w-full max-w-full ${className}`}>
      {/* CUTE SPEECH BUBBLE WITH AUDIO BUTTON */}
      {(activeSpeech || speechBubbleText) && (
        <div
          onClick={() => {
            sound.tap();
            if (activeSpeech) voice.say(activeSpeech);
            if (onBubbleClick) onBubbleClick();
          }}
          className={`mb-3 max-w-[280px] sm:max-w-xs md:max-w-md w-auto mx-auto border-2 rounded-2xl px-3.5 sm:px-4 py-2 sm:py-2.5 shadow-md text-center text-xs sm:text-sm font-black relative cursor-pointer transition-all break-words ${
            isAngry
              ? 'bg-rose-50 border-rose-400 text-rose-950'
              : isCutie
              ? 'bg-pink-50 border-pink-400 text-pink-950'
              : isDancing
              ? 'bg-amber-50 border-amber-400 text-amber-950'
              : 'bg-white border-emerald-400 text-slate-900'
          }`}
          title="Tap to hear Hootie speak aloud"
        >
          <div className="flex items-center justify-center gap-1.5">
            <Volume2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="leading-tight">{activeSpeech || speechBubbleText}</span>
          </div>
          <div
            className={`w-3 h-3 border-b-2 border-r-2 rotate-45 absolute -bottom-1.5 left-1/2 -translate-x-1/2 ${
              isAngry
                ? 'bg-rose-50 border-rose-400'
                : isCutie
                ? 'bg-pink-50 border-pink-400'
                : isDancing
                ? 'bg-amber-50 border-amber-400'
                : 'bg-white border-emerald-400'
            }`}
          />
        </div>
      )}

      {/* 3D PERSPECTIVE STAGE */}
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onClick={handleBodyClick}
        className={`relative cursor-pointer flex items-center justify-center group touch-none shrink-0 ${sizeClasses}`}
      >
        {/* SLEEPING ZZZ FLOATING OVER HEAD */}
        {isSleeping && (
          <div className="absolute -top-6 right-2 pointer-events-none z-40 font-heading font-black text-indigo-500 text-xl animate-bounce">
            Zzz...
          </div>
        )}

        {/* DANCE DISCO COLOR LIGHT FLOOR */}
        {isDancing && (
          <div className="absolute -bottom-2 w-40 h-10 rounded-full bg-gradient-to-r from-pink-500 via-amber-400 to-indigo-500 opacity-60 blur-md pointer-events-none" />
        )}

        {/* FULL ARTICULATED SKELETAL SVG CHARACTER */}
        <svg
          viewBox="0 0 160 185"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-xl filter overflow-visible"
        >
          <defs>
            {/* Duolingo Signature Bright & Professional Body Gradients */}
            <radialGradient id="gradOwlBody" cx="45%" cy="36%" r="65%" fx="38%" fy="28%">
              <stop offset="0%" stopColor={isAngry ? '#fb7185' : '#79db15'} />
              <stop offset="35%" stopColor={isAngry ? '#f43f5e' : '#58cc02'} />
              <stop offset="80%" stopColor={isAngry ? '#e11d48' : '#46a302'} />
              <stop offset="100%" stopColor={isAngry ? '#9f1239' : '#398401'} />
            </radialGradient>

            <linearGradient id="gradOwlBelly" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={isAngry ? '#ffe4e6' : '#d7ff66'} />
              <stop offset="50%" stopColor={isAngry ? '#fecdd3' : '#89e219'} />
              <stop offset="100%" stopColor={isAngry ? '#fda4af' : '#76c413'} />
            </linearGradient>

            <linearGradient id="gradOwlWingL" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={isAngry ? '#fb7185' : '#79db15'} />
              <stop offset="65%" stopColor={isAngry ? '#e11d48' : '#58cc02'} />
              <stop offset="100%" stopColor={isAngry ? '#9f1239' : '#398401'} />
            </linearGradient>

            <linearGradient id="gradOwlWingR" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={isAngry ? '#fb7185' : '#79db15'} />
              <stop offset="65%" stopColor={isAngry ? '#e11d48' : '#58cc02'} />
              <stop offset="100%" stopColor={isAngry ? '#9f1239' : '#398401'} />
            </linearGradient>

            <linearGradient id="gradOwlBeak" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffc800" />
              <stop offset="40%" stopColor="#ff9600" />
              <stop offset="100%" stopColor="#e07b00" />
            </linearGradient>

            <radialGradient id="gradEyeWhite" cx="40%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="85%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#e2e8f0" />
            </radialGradient>

            <linearGradient id="gradMouthCavity" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fb7185" />
              <stop offset="100%" stopColor="#e11d48" />
            </linearGradient>

            {/* Soft Organic Feathery Blush for Cheeks (No hard borders or solid circles) */}
            <radialGradient id="gradCheekBlush" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.65" />
              <stop offset="45%" stopColor="#fb7185" stopOpacity="0.32" />
              <stop offset="75%" stopColor="#fda4af" stopOpacity="0.10" />
              <stop offset="100%" stopColor="#fda4af" stopOpacity="0" />
            </radialGradient>

            <filter id="soft3DShadow" x="-15%" y="-15%" width="130%" height="130%">
              <feDropShadow dx="0" dy="3.5" stdDeviation="2.8" floodOpacity="0.18" />
            </filter>
          </defs>

          {/* CONTACT GROUND SHADOW (SCALES DYNAMICALLY WITH HOPS) */}
          <ellipse
            cx="80"
            cy="174"
            rx={46 * (1 - frameData.bodyBobY * 0.03)}
            ry={7.5 * (1 - frameData.bodyBobY * 0.03)}
            fill="#0f172a"
            fillOpacity={Math.max(0.08, 0.18 + frameData.bodyBobY * 0.015)}
          />

          {/* ROOT ARTICULATION WRAPPER (SPRING PHYSICS SQUASH & BOB) */}
          <g
            transform={`translate(80, 108) translate(0, ${frameData.bodyBobY}) scale(${frameData.bodyScaleX}, ${frameData.bodyScaleY}) translate(-80, -108)`}
          >
            {/* 1. TAIL FEATHERS (BEHIND BODY - CONTINUOUS SWISH LIKE CAT'S TAIL IN VIDEO!) */}
            <g
              style={{
                transformOrigin: '80px 148px',
                transform: `rotate(${frameData.tailAngle}deg)`,
              }}
            >
              {/* Central tail feather */}
              <path
                d="M76 142 C76 166 77 176 80 177 C83 176 84 166 84 142 Z"
                fill="#047857"
              />
              {/* Left tail feather */}
              <path
                d="M72 142 C68 162 70 172 74 174 C76 172 78 160 76 142 Z"
                fill="#065f46"
              />
              {/* Right tail feather */}
              <path
                d="M88 142 C92 162 90 172 86 174 C84 172 82 160 84 142 Z"
                fill="#065f46"
              />
            </g>

            {/* 2. ARTICULATED FEET / TALONS */}
            <g
              onClick={handleTouchFeet}
              className="cursor-pointer hover:opacity-85 transition-opacity"
              title="Touch feet to hop!"
            >
              {/* Left Foot */}
              <path
                d="M52 163 C50 172 42 174 39 168 C38 165 43 162 48 162"
                fill="#f59e0b"
                stroke="#d97706"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <path d="M59 163 C59 173 54 175 51 169" stroke="#f59e0b" strokeWidth="4.2" strokeLinecap="round" />
              {/* Right Foot */}
              <path
                d="M108 163 C110 172 118 174 121 168 C122 165 117 162 112 162"
                fill="#f59e0b"
                stroke="#d97706"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <path d="M101 163 C101 173 106 175 109 169" stroke="#f59e0b" strokeWidth="4.2" strokeLinecap="round" />
            </g>

            {/* 3. ARTICULATED LEFT WING (FLAPPING, WAVING, BREATHING) */}
            <g
              onClick={handleTouchLeftWing}
              className="cursor-pointer hover:scale-105 transition-transform"
              title="Touch wing for high-five!"
              style={{
                transformOrigin: '38px 88px',
                transform: `rotate(${frameData.wingLAngle}deg)`,
              }}
            >
              <path
                d="M36 84 C14 88 6 118 22 136 C30 142 42 126 42 108 Z"
                fill="url(#gradOwlWingL)"
                filter="url(#soft3DShadow)"
              />
              {/* Wing Feather Ranks */}
              <path d="M22 108 C16 122 26 133 33 130" stroke="#047857" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
              <path d="M28 98 C24 112 32 122 38 118" stroke="#047857" strokeWidth="1.8" strokeLinecap="round" opacity="0.6" />
            </g>

            {/* 4. ARTICULATED RIGHT WING (FLAPPING, SOARING) */}
            <g
              onClick={handleTouchRightWing}
              className="cursor-pointer hover:scale-105 transition-transform"
              title="Touch wing to flap and fly!"
              style={{
                transformOrigin: '122px 88px',
                transform: `rotate(${frameData.wingRAngle}deg)`,
              }}
            >
              <path
                d="M124 84 C146 88 154 118 138 136 C130 142 118 126 118 108 Z"
                fill="url(#gradOwlWingR)"
                filter="url(#soft3DShadow)"
              />
              {/* Wing Feather Ranks */}
              <path d="M138 108 C144 122 134 133 127 130" stroke="#047857" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
              <path d="M132 98 C136 112 128 122 122 118" stroke="#047857" strokeWidth="1.8" strokeLinecap="round" opacity="0.6" />
            </g>

            {/* 5. TORSO MAIN BODY */}
            <ellipse
              cx="80"
              cy="108"
              rx="53"
              ry="58"
              fill="url(#gradOwlBody)"
              filter="url(#soft3DShadow)"
            />

            {/* 6. BELLY FLUFF (TOUCHABLE: TICKLE & GIGGLE) */}
            <g
              onClick={handleTouchBelly}
              className="cursor-pointer hover:brightness-105"
              title="Tickle Hootie's tummy!"
            >
              <ellipse cx="80" cy="119" rx="37" ry="41" fill="url(#gradOwlBelly)" />
              {/* Cute Scallop Feather Scales */}
              <path d="M71 103 Q80 109 89 103" stroke="#059669" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.75" />
              <path d="M63 117 Q72 123 81 117" stroke="#059669" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.75" />
              <path d="M79 117 Q88 123 97 117" stroke="#059669" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.75" />
              <path d="M71 131 Q80 137 89 131" stroke="#059669" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.75" />
            </g>

            {/* 7. ARTICULATED HEAD & NECK (TILTS, BOBS, TRACKS MOUSE LIKE REAL KITTEN/OWL!) */}
            <g
              style={{
                transformOrigin: '80px 86px',
                transform: `translate(0, ${frameData.headBobY}px) rotate(${frameData.headAngle}deg)`,
              }}
            >
              {/* EAR TUFTS / HORNS (WITH NATURAL CAT-STYLE FLICK TWITCHES!) */}
              {/* Left Ear Tuft */}
              <g
                style={{
                  transformOrigin: '42px 46px',
                  transform: `rotate(${frameData.earLTwitch}deg)`,
                }}
              >
                <polygon
                  points="46,54 30,26 58,45"
                  fill="#047857"
                />
                <polygon
                  points="44,50 34,31 52,45"
                  fill="#059669"
                  opacity="0.8"
                />
              </g>

              {/* Right Ear Tuft */}
              <g
                style={{
                  transformOrigin: '118px 46px',
                  transform: `rotate(${frameData.earRTwitch}deg)`,
                }}
              >
                <polygon
                  points="114,54 130,26 102,45"
                  fill="#047857"
                />
                <polygon
                  points="116,50 126,31 108,45"
                  fill="#059669"
                  opacity="0.8"
                />
              </g>

              {/* 3D FACIAL DISC BACKGROUND */}
              <circle cx="57" cy="74" r="23.5" fill="url(#gradEyeWhite)" stroke="#cbd5e1" strokeWidth="2" filter="url(#soft3DShadow)" />
              <circle cx="103" cy="74" r="23.5" fill="url(#gradEyeWhite)" stroke="#cbd5e1" strokeWidth="2" filter="url(#soft3DShadow)" />

              {/* EYE SOCKETS, PUPILS & BLINKING EYELIDS */}
              {isSleeping ? (
                /* Sleeping Eyes (Peaceful, gentle curved resting lines) */
                <g>
                  <path
                    d="M45 74 Q57 81 69 74"
                    stroke="#0f172a"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path
                    d="M91 74 Q103 81 115 74"
                    stroke="#0f172a"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    fill="none"
                  />
                </g>
              ) : (
                /* Interactive Expressive Eyeballs with Gaze Tracking - Always Big, Round, and Friendly! */
                <>
                  {/* Left Eye */}
                  <g>
                    <clipPath id="leftEyeClip">
                      <circle cx="57" cy="74" r="21.5" />
                    </clipPath>
                    <g clipPath="url(#leftEyeClip)">
                      {/* Iris / Pupil - Always Warm Dark Slate, Never Red! */}
                      <circle
                        cx={57 + frameData.pupilX}
                        cy={74 + frameData.pupilY}
                        r={isCutie || currentMood === 'happy' ? 13 : 11.5}
                        fill="#0f172a"
                      />
                      {/* Big Glistening Top Catchlight Sparkle */}
                      <circle
                        cx={54 + frameData.pupilX * 0.55}
                        cy={70 + frameData.pupilY * 0.55}
                        r={isCutie || currentMood === 'happy' ? 5 : 4.2}
                        fill="#ffffff"
                      />
                      {/* Secondary Warm Catchlight Sparkle */}
                      <circle
                        cx={61 + frameData.pupilX * 0.55}
                        cy={77 + frameData.pupilY * 0.55}
                        r={isCutie || currentMood === 'happy' ? 2.6 : 2}
                        fill="#ffffff"
                      />
                      {/* Tiny Star Catchlight */}
                      <circle
                        cx={54 + frameData.pupilX * 0.55}
                        cy={77 + frameData.pupilY * 0.55}
                        r="1.4"
                        fill="#ffffff"
                      />

                      {/* Sweet Cutie Heart Reflection */}
                      {isCutie && (
                        <path
                          d={`M${57 + frameData.pupilX} ${73 + frameData.pupilY} L${58 + frameData.pupilX} ${74 + frameData.pupilY} L${59 + frameData.pupilX} ${73 + frameData.pupilY} L${59.5 + frameData.pupilX} ${74 + frameData.pupilY} L${58 + frameData.pupilX} ${76 + frameData.pupilY} Z`}
                          fill="#f43f5e"
                        />
                      )}

                      {/* Organic Sliding Eyelid (Smooth Cosine Blink in Soft Character Green) */}
                      {frameData.blinkAmount > 0.05 && (
                        <rect
                          x="30"
                          y="50"
                          width="54"
                          height={46 * frameData.blinkAmount}
                          fill="#46a302"
                        />
                      )}
                      {frameData.blinkAmount > 0.05 && (
                        <line
                          x1="35"
                          y1={50 + 46 * frameData.blinkAmount}
                          x2="79"
                          y2={50 + 46 * frameData.blinkAmount}
                          stroke="#0f172a"
                          strokeWidth="2.2"
                        />
                      )}
                    </g>
                  </g>

                  {/* Right Eye */}
                  <g>
                    <clipPath id="rightEyeClip">
                      <circle cx="103" cy="74" r="21.5" />
                    </clipPath>
                    <g clipPath="url(#rightEyeClip)">
                      {/* Iris / Pupil */}
                      <circle
                        cx={103 + frameData.pupilX}
                        cy={74 + frameData.pupilY}
                        r={isCutie || currentMood === 'happy' ? 13 : 11.5}
                        fill="#0f172a"
                      />
                      {/* Big Glistening Top Catchlight Sparkle */}
                      <circle
                        cx={100 + frameData.pupilX * 0.55}
                        cy={70 + frameData.pupilY * 0.55}
                        r={isCutie || currentMood === 'happy' ? 5 : 4.2}
                        fill="#ffffff"
                      />
                      {/* Secondary Warm Catchlight Sparkle */}
                      <circle
                        cx={107 + frameData.pupilX * 0.55}
                        cy={77 + frameData.pupilY * 0.55}
                        r={isCutie || currentMood === 'happy' ? 2.6 : 2}
                        fill="#ffffff"
                      />
                      {/* Tiny Star Catchlight */}
                      <circle
                        cx={100 + frameData.pupilX * 0.55}
                        cy={77 + frameData.pupilY * 0.55}
                        r="1.4"
                        fill="#ffffff"
                      />

                      {/* Sweet Cutie Heart Reflection */}
                      {isCutie && (
                        <path
                          d={`M${103 + frameData.pupilX} ${73 + frameData.pupilY} L${104 + frameData.pupilX} ${74 + frameData.pupilY} L${105 + frameData.pupilX} ${73 + frameData.pupilY} L${105.5 + frameData.pupilX} ${74 + frameData.pupilY} L${104 + frameData.pupilX} ${76 + frameData.pupilY} Z`}
                          fill="#f43f5e"
                        />
                      )}

                      {/* Organic Sliding Eyelid */}
                      {frameData.blinkAmount > 0.05 && (
                        <rect
                          x="76"
                          y="50"
                          width="54"
                          height={46 * frameData.blinkAmount}
                          fill="#46a302"
                        />
                      )}
                      {frameData.blinkAmount > 0.05 && (
                        <line
                          x1="81"
                          y1={50 + 46 * frameData.blinkAmount}
                          x2="125"
                          y2={50 + 46 * frameData.blinkAmount}
                          stroke="#0f172a"
                          strokeWidth="2.2"
                        />
                      )}
                    </g>
                  </g>
                </>
              )}

              {/* Comical Cute Baby Chick Eyebrows (Gentle and humorous, never scary!) */}
              {isAngry && (
                <g>
                  <path d="M42 62 Q55 67 66 69" stroke="#047857" strokeWidth="2.8" strokeLinecap="round" fill="none" />
                  <path d="M118 62 Q105 67 94 69" stroke="#047857" strokeWidth="2.8" strokeLinecap="round" fill="none" />
                </g>
              )}

              {/* NATURAL ORGANIC ROSY BLUSH CHEEKS (SOFT RADIAL FADE) */}
              {(isCutie || currentMood === 'happy' || currentMood === 'celebrate' || isDancing) && (
                <g className="transition-opacity duration-500">
                  {/* Left Cheek */}
                  <ellipse
                    cx="49"
                    cy="87"
                    rx={isCutie ? 11 : 9.5}
                    ry={isCutie ? 7.5 : 6}
                    fill="url(#gradCheekBlush)"
                    opacity={isCutie ? 0.95 : 0.8}
                  />
                  {/* Right Cheek */}
                  <ellipse
                    cx="111"
                    cy="87"
                    rx={isCutie ? 11 : 9.5}
                    ry={isCutie ? 7.5 : 6}
                    fill="url(#gradCheekBlush)"
                    opacity={isCutie ? 0.95 : 0.8}
                  />
                </g>
              )}

              {/* CUTE EXPRESSIVE BIRD BEAK & SWEET CHIRP SMILE (NO HUMAN TEETH!) */}
              <g
                onClick={handleTouchBeak}
                className="cursor-pointer hover:scale-105 transition-transform"
                title="Touch beak to interact!"
              >
                {isAngry ? (
                  /* 1. CUTE COMICAL POUT BEAK (PLAYFUL, NOT SCARY) */
                  <g>
                    {/* Rounded downturned beak */}
                    <path
                      d="M72 81 C72 77 88 77 88 81 C88 87 83 92 80 93 C77 92 72 87 72 81 Z"
                      fill="url(#gradOwlBeak)"
                      stroke="#d97706"
                      strokeWidth="1.3"
                      filter="url(#soft3DShadow)"
                    />
                    <path d="M76 80 C76 78.5 84 78.5 84 80 C84 82 81 84 80 84.5 C79 84 76 82 76 80 Z" fill="#fef08a" opacity="0.8" />
                    {/* Gentle little pout curve */}
                    <path
                      d="M73 92 Q80 89 87 92"
                      stroke="#d97706"
                      strokeWidth="2"
                      strokeLinecap="round"
                      fill="none"
                    />
                  </g>
                ) : isSpeaking || frameData.mouthOpen > 0 ? (
                  /* 2. CHIRPING TALKING BEAK WITH BOUNCING PINK TONGUE (PURE BIRD, NO TEETH!) */
                  <g>
                    {/* Soft strawberry mouth cavity */}
                    <path
                      d={`M72 84 Q80 81 88 84 Q89 ${87 + frameData.mouthOpen * 0.7} 80 ${89 + frameData.mouthOpen * 0.7} Q71 ${87 + frameData.mouthOpen * 0.7} 72 84 Z`}
                      fill="#e11d48"
                    />
                    {/* Bouncing Happy Baby-Pink Tongue inside */}
                    <ellipse
                      cx="80"
                      cy={85 + frameData.mouthOpen * 0.4}
                      rx="5"
                      ry={Math.max(2, frameData.mouthOpen * 0.25)}
                      fill="#fda4af"
                    />
                    {/* Upper Beak Cap */}
                    <path
                      d="M71 80 C71 76 89 76 89 80 C89 86 83 91 80 92 C77 91 71 86 71 80 Z"
                      fill="url(#gradOwlBeak)"
                      stroke="#d97706"
                      strokeWidth="1.2"
                    />
                    <path d="M76 79 C76 77.5 84 77.5 84 79 C84 81 81 83 80 83.5 C79 83 76 81 76 79 Z" fill="#fef08a" opacity="0.85" />
                    {/* Lower Beak moving with voice */}
                    <path
                      d={`M73 ${86 + frameData.mouthOpen * 0.7} Q80 ${90 + frameData.mouthOpen * 0.7} 87 ${86 + frameData.mouthOpen * 0.7}`}
                      stroke="#f59e0b"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      fill="none"
                    />
                    {/* Cheerful corner dimples */}
                    <path d="M69 82 Q67 84 69 86" stroke="#d97706" strokeWidth="2" strokeLinecap="round" fill="none" />
                    <path d="M91 82 Q93 84 91 86" stroke="#d97706" strokeWidth="2" strokeLinecap="round" fill="none" />
                  </g>
                ) : currentMood === 'happy' || currentMood === 'celebrate' || isDancing ? (
                  /* 3. HAPPY CHEERFUL CHIRP SMILE (ADORABLE, SWEET, NO TEETH!) */
                  <g>
                    {/* Cheerful small open mouth smile underneath */}
                    <path
                      d="M72 84 Q80 81 88 84 Q89 94 80 96 Q71 94 72 84 Z"
                      fill="#e11d48"
                    />
                    {/* Cute baby-pink tongue nestled happily inside */}
                    <path
                      d="M74 90 Q80 85 86 90 Q80 95 74 90 Z"
                      fill="#fda4af"
                    />
                    {/* Upper Beak Cap with warm golden gradient */}
                    <path
                      d="M71 80 C71 76 89 76 89 80 C89 86 83 91 80 92 C77 91 71 86 71 80 Z"
                      fill="url(#gradOwlBeak)"
                      stroke="#d97706"
                      strokeWidth="1.2"
                      filter="url(#soft3DShadow)"
                    />
                    {/* Soft golden sunlit highlight */}
                    <path d="M76 79 C76 77.5 84 77.5 84 79 C84 81 81 83 80 83.5 C79 83 76 81 76 79 Z" fill="#fef08a" opacity="0.85" />
                    {/* Lower Beak Smile Rim in sunny orange */}
                    <path
                      d="M72 85 Q80 96 88 85"
                      stroke="#f59e0b"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      fill="none"
                    />
                    {/* Cheerful mouth corner smile dimples */}
                    <path d="M69 82 Q67 84 69 86" stroke="#d97706" strokeWidth="2" strokeLinecap="round" fill="none" />
                    <path d="M91 82 Q93 84 91 86" stroke="#d97706" strokeWidth="2" strokeLinecap="round" fill="none" />
                  </g>
                ) : isSleeping ? (
                  /* 4. SLEEPING SWEET BEAK & CLOSED GENTLE SMILE */
                  <g>
                    <path
                      d="M73 82 C73 78 87 78 87 82 C87 87 82 91 80 91.5 C78 91 73 87 73 82 Z"
                      fill="url(#gradOwlBeak)"
                      stroke="#d97706"
                      strokeWidth="1.2"
                    />
                    <path
                      d="M74 91 Q80 93.5 86 91"
                      stroke="#d97706"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      fill="none"
                    />
                  </g>
                ) : (
                  /* 5. CUTE NEUTRAL / SWEET SMILE BEAK */
                  <g>
                    {/* Rounded golden beak */}
                    <path
                      d="M71 80 C71 76 89 76 89 80 C89 86.5 83 92.5 80 93.5 C77 92.5 71 86.5 71 80 Z"
                      fill="url(#gradOwlBeak)"
                      stroke="#d97706"
                      strokeWidth="1.3"
                      filter="url(#soft3DShadow)"
                    />
                    {/* Glossy top highlight */}
                    <path d="M76 79 C76 77.5 84 77.5 84 79 C84 81 81 83 80 83.5 C79 83 76 81 76 79 Z" fill="#fef08a" opacity="0.85" />
                    {/* Sweet smile curve under beak */}
                    <path
                      d="M73 91 Q80 95 87 91"
                      stroke="#d97706"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      fill="none"
                    />
                    {/* Dimples */}
                    <circle cx="72" cy="90" r="1.2" fill="#d97706" />
                    <circle cx="88" cy="90" r="1.2" fill="#d97706" />
                  </g>
                )}
              </g>

              {/* ACCESSORY HATS (TOUCHABLE: PAT HEAD/HAT) */}
              <g
                onClick={handleTouchHead}
                className="cursor-pointer hover:scale-105 transition-transform"
                title="Touch hat for cutie reaction!"
              >
                {hat === 'scholar' && (
                  <g transform="translate(0, -6)">
                    <ellipse cx="80" cy="46" rx="22" ry="8" fill="#1e293b" />
                    <polygon points="80,28 118,39 80,48 42,39" fill="#0f172a" filter="url(#soft3DShadow)" />
                    <polygon points="80,30 114,39 80,46 46,39" fill="#1e293b" />
                    <circle cx="80" cy="38" r="3" fill="#f59e0b" />
                    {/* Dynamic Physics Tassel */}
                    <g
                      style={{
                        transformOrigin: '80px 38px',
                        transform: `rotate(${frameData.tasselAngle}deg)`,
                      }}
                    >
                      <path
                        d="M80 38 Q96 44 98 56"
                        stroke="#f59e0b"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        fill="none"
                      />
                      <circle cx="98" cy="57" r="3.2" fill="#f59e0b" />
                    </g>
                  </g>
                )}

                {hat === 'crown' && (
                  <g transform="translate(0, -10)">
                    <polygon points="56,44 64,22 72,36 80,18 88,36 96,22 104,44" fill="#fbbf24" stroke="#d97706" strokeWidth="2" filter="url(#soft3DShadow)" />
                    <ellipse cx="80" cy="44" rx="24" ry="6" fill="#f59e0b" />
                    <circle cx="64" cy="24" r="2.5" fill="#ef4444" />
                    <circle cx="80" cy="20" r="3" fill="#3b82f6" />
                    <circle cx="96" cy="24" r="2.5" fill="#ef4444" />
                  </g>
                )}

                {hat === 'party' && (
                  <g transform="translate(0, -12)">
                    <polygon points="80,10 60,46 100,46" fill="#ec4899" stroke="#be185d" strokeWidth="2" filter="url(#soft3DShadow)" />
                    <circle cx="75" cy="28" r="2.5" fill="#fbbf24" />
                    <circle cx="85" cy="36" r="2.5" fill="#38bdf8" />
                    <circle cx="72" cy="40" r="2" fill="#a855f7" />
                    <circle cx="80" cy="9" r="4.5" fill="#fbbf24" />
                  </g>
                )}

                {hat === 'detective' && (
                  <g transform="translate(0, -6)">
                    <path d="M52 46 C52 30 108 30 108 46 Z" fill="#78350f" filter="url(#soft3DShadow)" />
                    <path d="M44 46 Q80 40 116 46" stroke="#92400e" strokeWidth="5" strokeLinecap="round" />
                    <circle cx="80" cy="30" r="3" fill="#451a03" />
                  </g>
                )}

                {hat === 'superhero' && (
                  <g transform="translate(0, -2)">
                    <path d="M40 70 Q57 60 74 70 Q80 72 86 70 Q103 60 120 70 Q103 82 86 72 Q80 74 74 72 Q57 82 40 70 Z" fill="#2563eb" filter="url(#soft3DShadow)" opacity="0.92" />
                  </g>
                )}
              </g>
            </g>
          </g>
        </svg>

        {/* LISTENING BADGE */}
        {isListening && (
          <div className="absolute -top-3 -right-3 bg-rose-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full animate-pulse flex items-center gap-1 shadow-md">
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            <span>LISTENING</span>
          </div>
        )}

        {/* TALKING BADGE */}
        {isTalking && (
          <div className="absolute -top-3 -right-3 bg-emerald-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full animate-bounce flex items-center gap-1 shadow-md">
            <Volume2 className="w-3 h-3 text-amber-300" />
            <span>TALKING</span>
          </div>
        )}
      </div>

      {/* TALKING TOM MIC BUTTON */}
      {showControls && (
        <div className="mt-3 flex flex-col items-center gap-2 w-full max-w-sm">
          <div className="flex items-center gap-2 w-full">
            {!mimicState.isRecording ? (
              <button
                type="button"
                onClick={handleStartMic}
                className="flex-1 h-14 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-95 text-white font-black text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Mic className="w-5 h-5 text-amber-300 animate-pulse" />
                <span>Talk to Hootie! (Echo Me)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStopMic}
                className="flex-1 h-14 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 active:scale-95 text-white font-black text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 animate-pulse cursor-pointer"
              >
                <MicOff className="w-5 h-5 text-white" />
                <span>Done! Copy My Voice!</span>
              </button>
            )}

            {mimicState.hasAudio && !mimicState.isRecording && (
              <button
                type="button"
                onClick={handleReplayMimic}
                className="h-14 px-4 bg-amber-500 hover:bg-amber-600 text-white font-extrabold rounded-2xl shadow-md active:scale-95 transition-all flex items-center justify-center cursor-pointer"
                title="Replay Voice Echo"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
