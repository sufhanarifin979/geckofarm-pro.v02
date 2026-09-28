import React, { useState, useMemo } from 'react';
import { 
  X, 
  ArrowLeftRight, 
  Dna, 
  Eye, 
  Sparkles, 
  ShieldAlert, 
  Trophy, 
  Zap, 
  Layers, 
  Check, 
  Search, 
  ChevronDown
} from 'lucide-react';
import { MorphEntry } from '../../types';
import { 
  normalizeCategories, 
  normalizeInheritance, 
  normalizeRarity, 
  normalizeGeneticFormula, 
  normalizeGeneticSignatures, 
  normalizeComboPotential, 
  normalizeGeneticWarnings 
} from '../../lib/morphNormalizer';

interface MorphComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  allMorphs: MorphEntry[];
  initialMorphA?: MorphEntry | null;
  initialMorphB?: MorphEntry | null;
  onSelectForLab?: (morphA: MorphEntry, morphB: MorphEntry) => void;
  onSearchInRegistry?: (morphName: string) => void;
}

const COMPARISON_PRESETS = [
  { label: 'Tremper vs Bell Albino', a: 'tremper-albino', b: 'bell-albino' },
  { label: 'Mack Snow vs Super Snow', a: 'mack-snow', b: 'super-snow' },
  { label: 'Eclipse vs Marble Eye', a: 'eclipse', b: 'marble-eye' },
  { label: 'Tangerine vs Blood', a: 'tangerine', b: 'blood' },
  { label: 'Whiteout vs Oreo (AFT)', a: 'aft-whiteout', b: 'aft-oreo' },
];

export default function MorphComparisonModal({
  isOpen,
  onClose,
  allMorphs,
  initialMorphA,
  initialMorphB,
  onSelectForLab,
  onSearchInRegistry
}: MorphComparisonModalProps) {
  const [morphAId, setMorphAId] = useState<string>('');
  const [morphBId, setMorphBId] = useState<string>('');

  const [searchA, setSearchA] = useState('');
  const [searchB, setSearchB] = useState('');

  const [isDropdownAOpen, setIsDropdownAOpen] = useState(false);
  const [isDropdownBOpen, setIsDropdownBOpen] = useState(false);

  // Photo view stages for A & B ('adult' | 'baby' | 'eye')
  const [stageA, setStageA] = useState<'adult' | 'baby' | 'eye'>('adult');
  const [stageB, setStageB] = useState<'adult' | 'baby' | 'eye'>('adult');

  // Initialize selected morphs when opened or initial props change
  React.useEffect(() => {
    if (isOpen) {
      if (initialMorphA?.id || initialMorphA?.slug) {
        setMorphAId(initialMorphA.id || initialMorphA.slug);
      } else if (allMorphs.length > 0 && !morphAId) {
        setMorphAId(allMorphs[0].id || allMorphs[0].slug);
      }

      if (initialMorphB?.id || initialMorphB?.slug) {
        setMorphBId(initialMorphB.id || initialMorphB.slug);
      } else if (allMorphs.length > 1 && !morphBId) {
        setMorphBId(allMorphs[1].id || allMorphs[1].slug);
      }
    }
  }, [isOpen, initialMorphA, initialMorphB, allMorphs]);

  const morphA = useMemo(() => {
    return allMorphs.find(m => m.id === morphAId || m.slug === morphAId) || allMorphs[0] || null;
  }, [allMorphs, morphAId]);

  const morphB = useMemo(() => {
    return allMorphs.find(m => m.id === morphBId || m.slug === morphBId) || allMorphs[1] || null;
  }, [allMorphs, morphBId]);

  const filteredMorphsA = useMemo(() => {
    if (!searchA.trim()) return allMorphs;
    const q = searchA.toLowerCase().trim();
    return allMorphs.filter(m => {
      const cats = normalizeCategories(m.category);
      return m.name.toLowerCase().includes(q) || cats.some(c => c.toLowerCase().includes(q));
    });
  }, [allMorphs, searchA]);

  const filteredMorphsB = useMemo(() => {
    if (!searchB.trim()) return allMorphs;
    const q = searchB.toLowerCase().trim();
    return allMorphs.filter(m => {
      const cats = normalizeCategories(m.category);
      return m.name.toLowerCase().includes(q) || cats.some(c => c.toLowerCase().includes(q));
    });
  }, [allMorphs, searchB]);

  const handleSwap = () => {
    const tempA = morphAId;
    setMorphAId(morphBId);
    setMorphBId(tempA);
  };

  const handleApplyPreset = (slugA: string, slugB: string) => {
    const foundA = allMorphs.find(m => m.slug.toLowerCase().includes(slugA) || m.name.toLowerCase().includes(slugA));
    const foundB = allMorphs.find(m => m.slug.toLowerCase().includes(slugB) || m.name.toLowerCase().includes(slugB));
    if (foundA) setMorphAId(foundA.id || foundA.slug);
    if (foundB) setMorphBId(foundB.id || foundB.slug);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-6xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <ArrowLeftRight size={22} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                Side-by-Side Morph Comparison
              </h2>
              <p className="text-xs font-semibold text-slate-400">Bandingkan genetika, ciri visual, mata, serta grading guide secara objektif</p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-all cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Quick Presets Bar */}
        <div className="px-6 sm:px-8 py-3 bg-slate-100/60 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0 flex items-center gap-1.5">
            <Sparkles size={12} className="text-amber-500" />
            Preset Populer:
          </span>
          {COMPARISON_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handleApplyPreset(preset.a, preset.b)}
              className="text-[10px] font-bold px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-500 transition-all whitespace-nowrap cursor-pointer shadow-2xs"
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8">

          {/* Morph Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
            
            {/* Center Swap Button */}
            <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
              <button 
                onClick={handleSwap}
                title="Tukar Posisi"
                className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 hover:border-emerald-500 hover:text-emerald-500 transition-all cursor-pointer"
              >
                <ArrowLeftRight size={16} />
              </button>
            </div>

            {/* Selector A */}
            <div className="relative">
              <label className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-2 flex items-center justify-between">
                <span>Morph A</span>
                <span className="text-[9px] font-bold text-slate-400">Pilih dari katalog</span>
              </label>
              <div 
                onClick={() => setIsDropdownAOpen(prev => !prev)}
                className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-between cursor-pointer hover:border-emerald-500 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                    {morphA?.image_url ? (
                      <img src={morphA.image_url} alt={morphA.name} className="w-full h-full object-cover" />
                    ) : (
                      <Dna size={18} className="text-slate-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-sm text-slate-900 dark:text-white uppercase truncate">{morphA?.name || 'Pilih Morph A'}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {normalizeCategories(morphA?.category).join(', ')} • {normalizeInheritance(morphA?.inheritance_type).join(', ')}
                    </p>
                  </div>
                </div>
                <ChevronDown size={18} className={`text-slate-400 transition-transform ${isDropdownAOpen ? 'rotate-180' : ''}`} />
              </div>

              {/* Dropdown A */}
              {isDropdownAOpen && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-30 p-2 space-y-2 max-h-60 overflow-y-auto">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text"
                      placeholder="Cari morph..."
                      value={searchA}
                      onChange={(e) => setSearchA(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:border-emerald-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="space-y-0.5">
                    {filteredMorphsA.map((m) => (
                      <div 
                        key={m.id || m.slug}
                        onClick={() => {
                          setMorphAId(m.id || m.slug);
                          setIsDropdownAOpen(false);
                          setSearchA('');
                        }}
                        className={`p-2 rounded-xl flex items-center justify-between cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors ${
                          (morphA?.id === m.id || morphA?.slug === m.slug) ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-black uppercase truncate text-slate-800 dark:text-slate-200">{m.name}</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase">({normalizeCategories(m.category).join(', ')})</span>
                        </div>
                        {(morphA?.id === m.id || morphA?.slug === m.slug) && <Check size={14} className="text-emerald-500" />}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Selector B */}
            <div className="relative">
              <label className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-2 flex items-center justify-between">
                <span>Morph B</span>
                <span className="text-[9px] font-bold text-slate-400">Pilih dari katalog</span>
              </label>
              <div 
                onClick={() => setIsDropdownBOpen(prev => !prev)}
                className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-between cursor-pointer hover:border-indigo-500 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                    {morphB?.image_url ? (
                      <img src={morphB.image_url} alt={morphB.name} className="w-full h-full object-cover" />
                    ) : (
                      <Dna size={18} className="text-slate-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-sm text-slate-900 dark:text-white uppercase truncate">{morphB?.name || 'Pilih Morph B'}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {normalizeCategories(morphB?.category).join(', ')} • {normalizeInheritance(morphB?.inheritance_type).join(', ')}
                    </p>
                  </div>
                </div>
                <ChevronDown size={18} className={`text-slate-400 transition-transform ${isDropdownBOpen ? 'rotate-180' : ''}`} />
              </div>

              {/* Dropdown B */}
              {isDropdownBOpen && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-30 p-2 space-y-2 max-h-60 overflow-y-auto">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text"
                      placeholder="Cari morph..."
                      value={searchB}
                      onChange={(e) => setSearchB(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="space-y-0.5">
                    {filteredMorphsB.map((m) => (
                      <div 
                        key={m.id || m.slug}
                        onClick={() => {
                          setMorphBId(m.id || m.slug);
                          setIsDropdownBOpen(false);
                          setSearchB('');
                        }}
                        className={`p-2 rounded-xl flex items-center justify-between cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors ${
                          (morphB?.id === m.id || morphB?.slug === m.slug) ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-black uppercase truncate text-slate-800 dark:text-slate-200">{m.name}</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase">({normalizeCategories(m.category).join(', ')})</span>
                        </div>
                        {(morphB?.id === m.id || morphB?.slug === m.slug) && <Check size={14} className="text-indigo-500" />}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Side-by-Side Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800">
            
            {/* COLUMN A */}
            <div className="space-y-6 pt-4 md:pt-0">
              {morphA ? (
                <>
                  {/* Photo & Stage Toggle */}
                  <div className="space-y-3">
                    <div className="aspect-[16/10] bg-slate-100 dark:bg-slate-800 rounded-3xl overflow-hidden relative border border-slate-200 dark:border-slate-700 shadow-md flex items-center justify-center group">
                      {(() => {
                        const currentImg = stageA === 'baby' 
                          ? (morphA.image_url_baby || morphA.image_url) 
                          : stageA === 'eye' 
                          ? (morphA.image_url_eye || morphA.image_url)
                          : morphA.image_url;
                        
                        return currentImg ? (
                          <img 
                            src={currentImg} 
                            alt={morphA.name} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="text-center p-6">
                            <Dna size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                            <p className="text-[10px] font-black uppercase text-slate-400">Belum ada foto</p>
                          </div>
                        );
                      })()}
                      <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full text-white text-[9px] font-black uppercase tracking-wider">
                        {stageA === 'baby' ? '🐣 Fase Baby / Anakan' : stageA === 'eye' ? '👁️ Detail Mata' : '🦎 Fase Dewasa (Adult)'}
                      </div>
                    </div>

                    {/* Stage Toggle Buttons */}
                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl">
                      <button
                        onClick={() => setStageA('adult')}
                        className={`flex-1 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${
                          stageA === 'adult' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs' : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        Dewasa
                      </button>
                      <button
                        onClick={() => setStageA('baby')}
                        className={`flex-1 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${
                          stageA === 'baby' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs' : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        Baby
                      </button>
                      <button
                        onClick={() => setStageA('eye')}
                        className={`flex-1 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${
                          stageA === 'eye' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs' : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        Mata
                      </button>
                    </div>
                  </div>

                  {/* Title & Badges */}
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {normalizeInheritance(morphA.inheritance_type).map((inh, i) => (
                        <span key={i} className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30">
                          {inh}
                        </span>
                      ))}
                      {normalizeCategories(morphA.category).map((cat, i) => (
                        <span key={i} className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                          {cat}
                        </span>
                      ))}
                      <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30">
                        {normalizeRarity(morphA.rarity)}
                      </span>
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{morphA.name}</h3>
                    
                    {/* Genetic Formula */}
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-mono font-bold text-slate-400">Formula:</span>
                      {normalizeGeneticFormula(morphA).length > 0 ? (
                        normalizeGeneticFormula(morphA).map((f, i) => (
                          <span key={i} className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                            {f}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs font-mono text-slate-400">{morphA.genetics || 'N/A'}</span>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-1.5 flex items-center gap-1.5">
                      <Layers size={12} className="text-emerald-500" />
                      Ciri & Deskripsi Visual
                    </span>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                      {morphA.description}
                    </p>
                  </div>

                  {/* Genetic Signatures */}
                  {normalizeGeneticSignatures(morphA).length > 0 && (
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-2 flex items-center gap-1.5">
                        <Zap size={12} className="text-emerald-500" />
                        Genetic Signatures
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {normalizeGeneticSignatures(morphA).map((trait, idx) => (
                          <span key={idx} className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20 rounded-lg text-[10px] font-bold">
                            {trait}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Combo Potential */}
                  {normalizeComboPotential(morphA).length > 0 && (
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-2 flex items-center gap-1.5">
                        <Sparkles size={12} className="text-indigo-500" />
                        Combo Potential
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {normalizeComboPotential(morphA).map((combo, idx) => (
                          <span key={idx} className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20 rounded-lg text-[10px] font-bold">
                            {combo}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Selection & Grading Priority */}
                  {morphA.selection_priority && morphA.selection_priority.length > 0 && (
                    <div className="p-4 bg-amber-50/50 dark:bg-amber-500/5 rounded-2xl border border-amber-200/60 dark:border-amber-500/20 space-y-2">
                      <span className="text-[9px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                        <Trophy size={13} />
                        Kriteria Grading Kualitas
                      </span>
                      <ul className="space-y-1">
                        {morphA.selection_priority.map((p, idx) => (
                          <li key={idx} className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Health Warnings */}
                  {normalizeGeneticWarnings(morphA).length > 0 ? (
                    <div className="space-y-2">
                      {normalizeGeneticWarnings(morphA).map((w, idx) => (
                        <div key={idx} className="p-4 bg-rose-50 dark:bg-rose-500/10 rounded-2xl border border-rose-200 dark:border-rose-500/30 flex items-start gap-3">
                          <ShieldAlert size={18} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">{w.title}</span>
                              <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300">{w.templateId}</span>
                            </div>
                            <p className="text-xs font-bold text-rose-700 dark:text-rose-300 leading-snug">{w.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 bg-emerald-50/60 dark:bg-emerald-500/5 rounded-xl border border-emerald-200/50 dark:border-emerald-500/20 flex items-center gap-2 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                      <Check size={14} />
                      Genetika Bersih (Tidak ada catatan sindrom kelainan bawaan)
                    </div>
                  )}

                  {/* Action Link to Registry */}
                  {onSearchInRegistry && (
                    <button
                      onClick={() => onSearchInRegistry(morphA.name)}
                      className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-[11px] font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Search size={14} /> Cari {morphA.name} di Koleksi Saya
                    </button>
                  )}
                </>
              ) : (
                <div className="p-8 text-center text-slate-400">Pilih Morph A untuk memulai komparasi</div>
              )}
            </div>

            {/* COLUMN B */}
            <div className="space-y-6 pt-6 md:pt-0 md:pl-8">
              {morphB ? (
                <>
                  {/* Photo & Stage Toggle */}
                  <div className="space-y-3">
                    <div className="aspect-[16/10] bg-slate-100 dark:bg-slate-800 rounded-3xl overflow-hidden relative border border-slate-200 dark:border-slate-700 shadow-md flex items-center justify-center group">
                      {(() => {
                        const currentImg = stageB === 'baby' 
                          ? (morphB.image_url_baby || morphB.image_url) 
                          : stageB === 'eye' 
                          ? (morphB.image_url_eye || morphB.image_url)
                          : morphB.image_url;
                        
                        return currentImg ? (
                          <img 
                            src={currentImg} 
                            alt={morphB.name} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="text-center p-6">
                            <Dna size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                            <p className="text-[10px] font-black uppercase text-slate-400">Belum ada foto</p>
                          </div>
                        );
                      })()}
                      <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full text-white text-[9px] font-black uppercase tracking-wider">
                        {stageB === 'baby' ? '🐣 Fase Baby / Anakan' : stageB === 'eye' ? '👁️ Detail Mata' : '🦎 Fase Dewasa (Adult)'}
                      </div>
                    </div>

                    {/* Stage Toggle Buttons */}
                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl">
                      <button
                        onClick={() => setStageB('adult')}
                        className={`flex-1 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${
                          stageB === 'adult' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs' : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        Dewasa
                      </button>
                      <button
                        onClick={() => setStageB('baby')}
                        className={`flex-1 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${
                          stageB === 'baby' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs' : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        Baby
                      </button>
                      <button
                        onClick={() => setStageB('eye')}
                        className={`flex-1 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${
                          stageB === 'eye' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs' : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        Mata
                      </button>
                    </div>
                  </div>

                  {/* Title & Badges */}
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {normalizeInheritance(morphB.inheritance_type).map((inh, i) => (
                        <span key={i} className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30">
                          {inh}
                        </span>
                      ))}
                      {normalizeCategories(morphB.category).map((cat, i) => (
                        <span key={i} className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                          {cat}
                        </span>
                      ))}
                      <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30">
                        {normalizeRarity(morphB.rarity)}
                      </span>
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{morphB.name}</h3>
                    
                    {/* Genetic Formula */}
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-mono font-bold text-slate-400">Formula:</span>
                      {normalizeGeneticFormula(morphB).length > 0 ? (
                        normalizeGeneticFormula(morphB).map((f, i) => (
                          <span key={i} className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                            {f}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs font-mono text-slate-400">{morphB.genetics || 'N/A'}</span>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-1.5 flex items-center gap-1.5">
                      <Layers size={12} className="text-indigo-500" />
                      Ciri & Deskripsi Visual
                    </span>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                      {morphB.description}
                    </p>
                  </div>

                  {/* Genetic Signatures */}
                  {normalizeGeneticSignatures(morphB).length > 0 && (
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-2 flex items-center gap-1.5">
                        <Zap size={12} className="text-indigo-500" />
                        Genetic Signatures
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {normalizeGeneticSignatures(morphB).map((trait, idx) => (
                          <span key={idx} className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20 rounded-lg text-[10px] font-bold">
                            {trait}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Combo Potential */}
                  {normalizeComboPotential(morphB).length > 0 && (
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-2 flex items-center gap-1.5">
                        <Sparkles size={12} className="text-indigo-500" />
                        Combo Potential
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {normalizeComboPotential(morphB).map((combo, idx) => (
                          <span key={idx} className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20 rounded-lg text-[10px] font-bold">
                            {combo}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Selection & Grading Priority */}
                  {morphB.selection_priority && morphB.selection_priority.length > 0 && (
                    <div className="p-4 bg-amber-50/50 dark:bg-amber-500/5 rounded-2xl border border-amber-200/60 dark:border-amber-500/20 space-y-2">
                      <span className="text-[9px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                        <Trophy size={13} />
                        Kriteria Grading Kualitas
                      </span>
                      <ul className="space-y-1">
                        {morphB.selection_priority.map((p, idx) => (
                          <li key={idx} className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Health Warnings */}
                  {normalizeGeneticWarnings(morphB).length > 0 ? (
                    <div className="space-y-2">
                      {normalizeGeneticWarnings(morphB).map((w, idx) => (
                        <div key={idx} className="p-4 bg-rose-50 dark:bg-rose-500/10 rounded-2xl border border-rose-200 dark:border-rose-500/30 flex items-start gap-3">
                          <ShieldAlert size={18} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">{w.title}</span>
                              <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300">{w.templateId}</span>
                            </div>
                            <p className="text-xs font-bold text-rose-700 dark:text-rose-300 leading-snug">{w.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 bg-emerald-50/60 dark:bg-emerald-500/5 rounded-xl border border-emerald-200/50 dark:border-emerald-500/20 flex items-center gap-2 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                      <Check size={14} />
                      Genetika Bersih (Tidak ada catatan sindrom kelainan bawaan)
                    </div>
                  )}

                  {/* Action Link to Registry */}
                  {onSearchInRegistry && (
                    <button
                      onClick={() => onSearchInRegistry(morphB.name)}
                      className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-[11px] font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Search size={14} /> Cari {morphB.name} di Koleksi Saya
                    </button>
                  )}
                </>
              ) : (
                <div className="p-8 text-center text-slate-400">Pilih Morph B untuk memulai komparasi</div>
              )}
            </div>

          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
          <div className="text-xs text-slate-500">
            {morphA && morphB ? (
              <span>Membandingkan <strong className="text-slate-800 dark:text-white">{morphA.name}</strong> vs <strong className="text-slate-800 dark:text-white">{morphB.name}</strong></span>
            ) : (
              <span>Pilih dua morph untuk melihat perbedaan genetik dan fenotip.</span>
            )}
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {morphA && morphB && onSelectForLab && (
              <button
                onClick={() => {
                  onSelectForLab(morphA, morphB);
                  onClose();
                }}
                className="flex-1 sm:flex-none px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Zap size={16} /> Simulasikan Persilangan Keduanya
              </button>
            )}
            <button
              onClick={onClose}
              className="px-6 py-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-bold transition-all cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
