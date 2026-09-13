import React, { useState } from 'react';
import {
  BookOpen,
  Volume2,
  Sparkles,
  Check,
  ChevronDown,
  ChevronUp,
  Bookmark,
} from 'lucide-react';
import { FACT_CARDS } from '../data/gkQuestions';
import { voice } from '../services/voice';
import { sound } from '../services/sound';

interface FactVaultProps {
  discoveredIds: string[];
  onDiscoverFact: (id: string) => void;
  voiceEnabled: boolean;
}

export const FactVault: React.FC<FactVaultProps> = ({
  discoveredIds,
  onDiscoverFact,
  voiceEnabled,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: 'All Wonders' },
    { id: 'us_history', label: 'US History & Civics' },
    { id: 'space', label: 'Space & Astronomy' },
    { id: 'animals', label: 'Wildlife & Nature' },
    { id: 'science', label: 'Science & Physics' },
    { id: 'geography', label: 'World Geography' },
    { id: 'inventions', label: 'Great Inventions' },
  ];

  const filtered =
    activeCategory === 'all'
      ? FACT_CARDS
      : FACT_CARDS.filter(f => f.category === activeCategory);

  const handleReadFact = (fact: typeof FACT_CARDS[0]) => {
    sound.tap();
    voice.say(`${fact.title}. ${fact.fact}. ${fact.detail}`);
    if (!discoveredIds.includes(fact.id)) {
      onDiscoverFact(fact.id);
    }
  };

  const toggleExpand = (id: string) => {
    sound.tap();
    setExpandedId(prev => (prev === id ? null : id));
    if (!discoveredIds.includes(id)) {
      onDiscoverFact(id);
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto p-4 sm:p-6 bg-slate-50">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto shadow-2xs">
            <BookOpen className="w-7 h-7 text-emerald-600" />
          </div>
          <h1 className="font-heading text-2xl sm:text-4xl font-extrabold text-slate-900">
            Curriculum Wonder Vault
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
            Fascinating true discoveries from American history, biology, Earth science, and deep cosmos. Tap any card to listen and expand the secrets!
          </p>
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700">
            <Bookmark className="w-3.5 h-3.5 text-emerald-600" />
            <span>Discovered {discoveredIds.length} of {FACT_CARDS.length} Wonders</span>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeCategory === c.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(card => {
            const isDiscovered = discoveredIds.includes(card.id);
            const isExpanded = expandedId === card.id;

            return (
              <div
                key={card.id}
                className={`bg-white rounded-3xl p-5 border transition-all ${
                  isDiscovered ? 'border-slate-200 shadow-xs' : 'border-slate-200/80 shadow-2xs'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl p-2 bg-slate-50 rounded-2xl">{card.icon || card.emoji}</span>
                    <div>
                      <h3 className="font-heading font-bold text-base text-slate-900">
                        {card.title}
                      </h3>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800">
                        {card.category}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleReadFact(card)}
                      className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-emerald-600 transition-colors cursor-pointer"
                      title="Read fact aloud"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleExpand(card.id)}
                      className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 font-medium mt-3 leading-relaxed">
                  {card.fact}
                </p>

                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-2 bg-slate-50/80 p-3 rounded-2xl">
                    <p className="leading-relaxed">{card.detail}</p>
                    <div className="flex items-center justify-between text-[11px] font-bold text-emerald-800">
                      <span>Curriculum Verified Fact</span>
                      {isDiscovered && (
                        <span className="flex items-center gap-1 text-emerald-600">
                          <Check className="w-3.5 h-3.5" /> Discovered
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
