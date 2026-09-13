import React, { useState } from 'react';
import { sound } from '../services/sound';
import { Printer, X, Award, Sparkles, CheckCircle } from 'lucide-react';

interface CertificateModalProps {
  milestoneStop: number;
  childName: string;
  onSaveName: (name: string) => void;
  onClose: () => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  milestoneStop,
  childName,
  onSaveName,
  onClose,
}) => {
  const [inputName, setInputName] = useState(childName);
  const [isEditingName, setIsEditingName] = useState(!childName);

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = inputName.trim() || 'A Brilliant Scholar';
    onSaveName(cleanName);
    setIsEditingName(false);
    sound.tap();
  };

  const handlePrint = () => {
    sound.tap();
    window.print();
  };

  const todayStr = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-pop">
      <div className="bg-white border border-slate-200 rounded-3xl sm:rounded-[36px] max-w-lg w-full p-6 sm:p-8 shadow-2xl text-center relative max-h-[92vh] overflow-y-auto text-slate-900">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 shadow-xs cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {isEditingName ? (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-400 to-amber-500 text-white flex items-center justify-center shadow-md">
              <Award className="w-10 h-10 text-white" />
            </div>
            <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900">
              What's your scholar name?
            </h2>
            <p className="font-medium text-slate-500 text-sm">
              We'll print your name proudly on this StarScholar Honor Diploma!
            </p>
            <form onSubmit={handleNameSubmit} className="w-full max-w-xs flex flex-col gap-3">
              <input
                type="text"
                value={inputName}
                onChange={e => setInputName(e.target.value)}
                maxLength={24}
                placeholder="Enter your name"
                autoFocus
                className="w-full h-12 text-center font-bold text-lg rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-600 outline-none text-slate-900"
              />
              <button
                type="submit"
                className="btn-3d-primary w-full h-12 text-base"
              >
                Issue My Diploma!
              </button>
            </form>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6">
            {/* Printable Diploma Box */}
            <div
              id="printable-certificate"
              className="w-full bg-gradient-to-b from-amber-50/50 to-white border-4 border-double border-amber-300 rounded-3xl p-6 sm:p-8 text-center relative shadow-xs space-y-3"
            >
              <div className="flex justify-center mb-1">
                <div className="w-16 h-16 rounded-full bg-amber-100 border-2 border-amber-300 flex items-center justify-center shadow-xs">
                  <Award className="w-9 h-9 text-amber-600" />
                </div>
              </div>

              <span className="text-[11px] uppercase tracking-widest text-amber-800 font-extrabold block">
                StarScholar Academic Honors Award
              </span>

              <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
                Diploma of Academic Excellence
              </h1>

              <div className="w-24 h-1 bg-amber-400 mx-auto rounded-full" />

              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Proudly Presented To
              </p>

              <div className="font-heading text-3xl sm:text-4xl font-extrabold text-emerald-900 my-2 underline decoration-amber-400 decoration-wavy">
                {childName || 'A Great Scholar'}
              </div>

              <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto leading-relaxed font-medium">
                for mastering <strong>{milestoneStop} curriculum milestones</strong> across American History, Civics, 50 States, and STEM, displaying outstanding critical thinking and academic curiosity!
              </p>

              <div className="mt-6 flex justify-between items-end border-t border-dashed border-amber-200 pt-4 text-xs font-semibold text-slate-500">
                <div>Date: {todayStr}</div>
                <div className="flex items-center gap-1 text-emerald-900 font-bold">
                  <span>StarScholar Academy Board</span>
                  <Award className="w-4 h-4 text-amber-600 inline" />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-center flex-wrap w-full">
              <button
                onClick={handlePrint}
                className="btn-3d-secondary flex-1 min-w-[140px] py-3 text-sm gap-2"
              >
                <Printer className="w-4 h-4 text-emerald-700" />
                <span>Print Diploma</span>
              </button>

              <button
                onClick={onClose}
                className="btn-3d-primary flex-1 min-w-[140px] py-3 text-sm"
              >
                Continue Learning!
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
