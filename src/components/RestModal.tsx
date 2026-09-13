import React, { useState } from 'react';
import { sound } from '../services/sound';
import { ShieldCheck, Moon, Sparkles, Infinity as InfinityIcon, Plus, Settings } from 'lucide-react';

interface RestModalProps {
  onAddTenMinutes: () => void;
  onAddMinutes?: (minutes: number) => void;
  onSetUnlimited?: () => void;
  onOpenParentCorner: () => void;
  onClose: () => void;
}

export const RestModal: React.FC<RestModalProps> = ({
  onAddTenMinutes,
  onAddMinutes,
  onSetUnlimited,
  onOpenParentCorner,
  onClose,
}) => {
  const [showParentOverride, setShowParentOverride] = useState(false);
  const [numA] = useState(Math.floor(Math.random() * 5) + 3);
  const [numB] = useState(Math.floor(Math.random() * 5) + 2);
  const [answerInput, setAnswerInput] = useState('');
  const [error, setError] = useState(false);
  const [verified, setVerified] = useState(false);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (parseInt(answerInput, 10) === numA + numB) {
      sound.good();
      setVerified(true);
      setError(false);
    } else {
      sound.notYet();
      setError(true);
      setAnswerInput('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-pop">
      <div className="bg-white border border-slate-200 rounded-3xl sm:rounded-[36px] max-w-md w-full p-6 sm:p-8 shadow-xl text-center flex flex-col items-center gap-5 text-slate-900">
        <div className="w-20 h-20 rounded-3xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shadow-xs">
          <Moon className="w-10 h-10 text-emerald-600" />
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900">
            Time for a Brain Break!
          </h2>
          <p className="font-medium text-slate-500 text-sm sm:text-base leading-relaxed">
            Healthy screen-time goal reached! Rest your eyes, take a stretch, drink a cup of water, or read a chapter in your favorite book!
          </p>
        </div>

        {!showParentOverride ? (
          <div className="flex flex-col gap-3 w-full">
            <button
              onClick={() => {
                sound.tap();
                onClose();
              }}
              className="btn-3d-primary w-full h-12 text-base"
            >
              Take a Break
            </button>

            <button
              onClick={() => {
                sound.tap();
                setShowParentOverride(true);
              }}
              className="font-bold text-slate-400 hover:text-slate-700 text-xs flex items-center justify-center gap-1.5 py-1.5 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Parent Screen-Time Options & Override</span>
            </button>
          </div>
        ) : !verified ? (
          <form onSubmit={handleVerify} className="flex flex-col gap-3 w-full animate-pop">
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-left space-y-1">
              <span className="text-xs font-bold text-slate-800 block">Parent Verification Gate</span>
              <p className="font-medium text-slate-500 text-xs">
                To adjust screen time, solve: <strong className="text-slate-900 text-sm">{numA} + {numB} = ?</strong>
              </p>
            </div>
            <input
              type="number"
              value={answerInput}
              onChange={e => {
                setAnswerInput(e.target.value);
                setError(false);
              }}
              placeholder="Enter sum"
              autoFocus
              className="w-full h-12 text-center font-bold text-xl rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-600 outline-none text-slate-900"
            />
            {error && (
              <span className="text-xs text-rose-600 font-bold">
                Incorrect, please try again
              </span>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowParentOverride(false)}
                className="btn-3d-secondary flex-1 h-11 text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-3d-primary flex-1 h-11 text-sm"
              >
                Verify
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col gap-3 w-full animate-pop text-left">
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl text-xs font-bold text-emerald-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Parent Verified! Choose an option below:</span>
            </div>

            <div className="space-y-2">
              {/* Option: Unlimited Screen Time */}
              <button
                type="button"
                onClick={() => {
                  sound.good();
                  if (onSetUnlimited) {
                    onSetUnlimited();
                  } else {
                    onAddTenMinutes();
                  }
                }}
                className="w-full p-3 bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer shadow-2xs"
              >
                <span className="flex items-center gap-2">
                  <InfinityIcon className="w-4 h-4 text-emerald-600" />
                  <span>Switch to Unlimited Screen Time</span>
                </span>
                <span className="text-[10px] bg-emerald-100 px-2 py-0.5 rounded-md text-emerald-800">No Limit</span>
              </button>

              {/* Option: Add +15 Mins */}
              <button
                type="button"
                onClick={() => {
                  sound.good();
                  if (onAddMinutes) {
                    onAddMinutes(15);
                  } else {
                    onAddTenMinutes();
                  }
                }}
                className="w-full p-3 bg-white hover:bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer shadow-2xs"
              >
                <span className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-emerald-600" />
                  <span>Grant +15 Extra Minutes</span>
                </span>
                <span className="text-[10px] bg-emerald-100 px-2 py-0.5 rounded-md text-emerald-800">+15m</span>
              </button>

              {/* Option: Add +30 Mins */}
              <button
                type="button"
                onClick={() => {
                  sound.good();
                  if (onAddMinutes) {
                    onAddMinutes(30);
                  } else {
                    onAddTenMinutes();
                  }
                }}
                className="w-full p-3 bg-white hover:bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer shadow-2xs"
              >
                <span className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-emerald-600" />
                  <span>Grant +30 Extra Minutes</span>
                </span>
                <span className="text-[10px] bg-emerald-100 px-2 py-0.5 rounded-md text-emerald-800">+30m</span>
              </button>

              {/* Option: Open Parent Corner */}
              <button
                type="button"
                onClick={() => {
                  sound.tap();
                  onOpenParentCorner();
                }}
                className="w-full p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Open Full Screen Time Settings</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
