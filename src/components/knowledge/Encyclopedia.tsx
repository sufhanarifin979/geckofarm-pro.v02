import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Dna, 
  ArrowRight, 
  ShieldAlert, 
  Zap, 
  Layers, 
  Sparkles, 
  ChevronDown, 
  Activity, 
  Trophy,
  Loader2,
  ArrowLeftRight,
  Search as SearchIcon,
  FlaskConical,
  Eye,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db, getCachedMorphs, setCachedMorphs } from '../../lib/firebase';
import MorphDetail from './MorphDetail';
import MorphComparisonModal from './MorphComparisonModal';
import { COMPLETE_MORPH_DATABASE } from './data';
import { MorphEntry } from '../../types';
import { 
  normalizeCategories, 
  normalizeInheritance, 
  normalizeRarity, 
  normalizeGeneticFormula, 
  normalizeGeneticWarnings, 
  normalizeGeneticSignatures, 
  normalizeComboPotential 
} from '../../lib/morphNormalizer';

interface MorphListItemProps {
  morph: MorphEntry;
  onSelect: (morph: MorphEntry) => void;
  onOpenCompare: (morph: MorphEntry) => void;
  index: number;
}

function MorphListItem({ morph, onSelect, onOpenCompare, index }: MorphListItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.02, 0.3) }}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all group"
    >
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-5 sm:p-6 flex items-center justify-between cursor-pointer active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-4 sm:gap-6 min-w-0">
          <div className="relative w-14 h-14 shrink-0">
            <div className={`w-full h-full rounded-2xl flex items-center justify-center overflow-hidden border-2 ${
              normalizeRarity(morph.rarity) === 'Legendary' ? 'border-amber-500/20 bg-amber-50' :
              normalizeRarity(morph.rarity) === 'Epic' ? 'border-purple-500/20 bg-purple-50' :
              normalizeRarity(morph.rarity) === 'Rare' ? 'border-indigo-500/20 bg-indigo-50' :
              normalizeRarity(morph.rarity) === 'Uncommon' ? 'border-blue-500/20 bg-blue-50' :
              'border-slate-200 bg-slate-50'
            }`}>
              {morph.image_url ? (
                <img 
                  src={morph.image_url} 
                  alt={morph.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                  referrerPolicy="no-referrer"
                />
              ) : (
                <Dna size={24} className={isExpanded ? 'animate-pulse text-slate-400' : 'text-slate-400'} />
              )}
            </div>
            {normalizeRarity(morph.rarity) !== 'Common' && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-sm">
                 <Sparkles size={8} className="text-white" />
              </div>
            )}
          </div>
          
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight truncate group-hover:text-emerald-500 transition-colors">
                {morph.name}
              </h3>
              {morph.image_url_baby && (
                <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300">
                  Baby Photo
                </span>
              )}
            </div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">
                {normalizeInheritance(morph.inheritance_type).join(', ')}
              </span>
              <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
              <span className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.15em]">
                {normalizeCategories(morph.category).join(', ')}
              </span>
              {(normalizeGeneticFormula(morph).length > 0 || morph.genetics) && (
                <>
                  <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
                  <span className="text-[9px] font-mono font-bold text-slate-400 truncate max-w-[120px]">
                    {normalizeGeneticFormula(morph).join(' + ') || morph.genetics}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenCompare(morph);
            }}
            title="Bandingkan Morph Ini"
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-500 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-indigo-400 transition-all text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <ArrowLeftRight size={14} />
            <span className="hidden sm:inline">Bandingkan</span>
          </button>

          {(normalizeGeneticWarnings(morph).length > 0 || morph.warnings) && (
            <span title={normalizeGeneticWarnings(morph).map(w => `${w.title}: ${w.description}`).join(' | ') || morph.warnings}>
              <ShieldAlert size={18} className="text-rose-500 shrink-0" />
            </span>
          )}

          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 group-hover:text-emerald-500 transition-all"
          >
            <ChevronDown size={20} />
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-slate-100 dark:border-slate-800"
          >
            <div className="p-6 sm:p-8 bg-slate-50/50 dark:bg-slate-800/20">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                       <Layers size={14} className="text-emerald-500" />
                       Deskripsi Visual & Riset
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed line-clamp-4">
                      {morph.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex-1 min-w-[130px]">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Rarity</span>
                      <span className="text-xs font-black text-slate-900 dark:text-white uppercase">{normalizeRarity(morph.rarity)}</span>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex-1 min-w-[130px]">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Genetics</span>
                      <span className="text-xs font-black text-slate-900 dark:text-white uppercase">{normalizeGeneticFormula(morph).join(' + ') || morph.genetics || 'N/A'}</span>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex-1 min-w-[130px]">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Pewarisan</span>
                      <span className="text-xs font-black text-slate-900 dark:text-white uppercase">{normalizeInheritance(morph.inheritance_type).join(', ')}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                       <Activity size={14} className="text-emerald-500" />
                       Breeder Insight
                    </h4>
                    <p className="text-xs text-slate-500 italic leading-relaxed mb-4">
                       {morph.breeder_notes || "Belum ada catatan khusus dari peternak."}
                    </p>
                  </div>

                  {morph.selection_priority && morph.selection_priority.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                         <Trophy size={14} />
                         Visual Grading Guide
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {morph.selection_priority.map((point, i) => (
                          <span key={i} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-bold text-slate-600 dark:text-slate-400">
                            {point}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/registry?search=${encodeURIComponent(morph.name)}`);
                      }}
                      className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <SearchIcon size={14} /> Cari di Koleksi
                    </button>

                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(morph);
                      }}
                      className="flex-1 py-3 px-4 bg-emerald-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-wider shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      Buka Detail Lengkap
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface EncyclopediaProps {
  onNavigateToLab?: (morph?: MorphEntry) => void;
}

export default function Encyclopedia({ onNavigateToLab }: EncyclopediaProps) {
  const [morphs, setMorphs] = useState<MorphEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterRarity, setFilterRarity] = useState<string>('all');
  const [selectedMorph, setSelectedMorph] = useState<MorphEntry | null>(null);
  const [activeSpecies, setActiveSpecies] = useState<'Leopard Gecko' | 'African Fat-Tailed Gecko'>('Leopard Gecko');

  // Side-by-Side Compare state
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [compareMorphA, setCompareMorphA] = useState<MorphEntry | null>(null);
  const [compareMorphB, setCompareMorphB] = useState<MorphEntry | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    // 1. Try memory cache first
    const memCache = getCachedMorphs();
    if (memCache && memCache.length > 0) {
      setMorphs(memCache as MorphEntry[]);
      setLoading(false);
      return;
    }

    // 2. Try localStorage cache next
    let localCacheLoaded = false;
    try {
      const local = localStorage.getItem('cache_encyclopedia_morphs');
      if (local) {
        const parsed = JSON.parse(local);
        if (parsed && parsed.length > 0) {
          setMorphs(parsed);
          setCachedMorphs(parsed);
          setLoading(false);
          localCacheLoaded = true;
        }
      }
    } catch (e) {
      console.warn("Failed to load morphs from localStorage:", e);
    }

    const q = query(collection(db, 'morphs'), orderBy('name', 'asc'));
    getDocs(q).then((snapshot) => {
      const data = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as MorphEntry));
      const finalData = (data && data.length > 0) ? data : (COMPLETE_MORPH_DATABASE as unknown as MorphEntry[]);
      setMorphs(finalData);
      setCachedMorphs(finalData);
      setLoading(false);
      try {
        localStorage.setItem('cache_encyclopedia_morphs', JSON.stringify(finalData));
      } catch (e) {}
    }).catch((error) => {
      console.warn("Firestore morphs query error (e.g. quota limit). Falling back to local complete database:", error);
      if (!localCacheLoaded) {
        setMorphs(COMPLETE_MORPH_DATABASE as unknown as MorphEntry[]);
      }
      setLoading(false);
    });
  }, []);

  const handleOpenCompareWith = (morph: MorphEntry) => {
    setCompareMorphA(morph);
    // Find an appropriate comparison partner
    const otherMorph = morphs.find(m => (m.id !== morph.id && m.slug !== morph.slug) && (m.category === morph.category || m.inheritance_type === morph.inheritance_type));
    setCompareMorphB(otherMorph || null);
    setIsCompareOpen(true);
  };

  const filteredMorphs = useMemo(() => {
    return morphs.filter(m => {
      const queryStr = searchQuery.toLowerCase().trim();
      const cats = normalizeCategories(m.category);
      const inhs = normalizeInheritance(m.inheritance_type);
      const formulas = normalizeGeneticFormula(m);
      const sigs = normalizeGeneticSignatures(m);
      const combos = normalizeComboPotential(m);
      const warns = normalizeGeneticWarnings(m);
      const rarity = normalizeRarity(m.rarity);
      
      const matchesSearch = !queryStr || (
        m.name.toLowerCase().includes(queryStr) || 
        m.description.toLowerCase().includes(queryStr) ||
        m.tags?.some(k => k.toLowerCase().includes(queryStr)) ||
        cats.some(c => c.toLowerCase().includes(queryStr)) ||
        inhs.some(i => i.toLowerCase().includes(queryStr)) ||
        formulas.some(f => f.toLowerCase().includes(queryStr)) ||
        sigs.some(s => s.toLowerCase().includes(queryStr)) ||
        combos.some(c => c.toLowerCase().includes(queryStr)) ||
        warns.some(w => w.title.toLowerCase().includes(queryStr) || w.description.toLowerCase().includes(queryStr))
      );

      const matchesCategory = filterCategory === 'all' || cats.includes(filterCategory);
      const matchesRarity = filterRarity === 'all' || rarity === filterRarity;
      
      const mSpecies = (m as any).species || 'Leopard Gecko';
      const matchesSpecies = mSpecies === activeSpecies;
      
      return matchesSearch && matchesCategory && matchesRarity && matchesSpecies;
    });
  }, [morphs, searchQuery, filterCategory, filterRarity, activeSpecies]);

  const categories = useMemo(() => {
    const activeMorphs = morphs.filter(m => ((m as any).species || 'Leopard Gecko') === activeSpecies);
    const set = new Set<string>();
    activeMorphs.forEach(m => {
      normalizeCategories(m.category).forEach(c => set.add(c));
    });
    return Array.from(set).sort();
  }, [morphs, activeSpecies]);

  if (selectedMorph) {
    return (
      <MorphDetail 
        morph={selectedMorph} 
        onBack={() => setSelectedMorph(null)}
        onOpenCompare={(m) => handleOpenCompareWith(m)}
        onNavigateToLab={(m) => onNavigateToLab?.(m)}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
        <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Menyinkronkan Ensiklopedia Riset...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Top Banner with Compare Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-500/10 via-indigo-500/10 to-transparent p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2.5">
            <Dna className="text-emerald-500" size={26} />
            Arsip Ensiklopedia Morph & Genetika
          </h2>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
            Panduan terlengkap identifikasi genetik, foto anakan vs dewasa, grading kualitas, dan etika breeding.
          </p>
        </div>

        <button
          onClick={() => {
            setCompareMorphA(null);
            setCompareMorphB(null);
            setIsCompareOpen(true);
          }}
          className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-indigo-600/25 active:scale-95 transition-all flex items-center justify-center gap-2.5 cursor-pointer shrink-0"
        >
          <ArrowLeftRight size={16} />
          Bandingkan 2 Morph (Side-by-Side)
        </button>
      </div>

      {/* Species Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 pb-1 gap-6">
        <button
          onClick={() => {
            setActiveSpecies('Leopard Gecko');
            setFilterCategory('all');
          }}
          className={`pb-3 text-xs sm:text-sm font-black uppercase tracking-widest relative transition-colors cursor-pointer ${
            activeSpecies === 'Leopard Gecko'
              ? 'text-emerald-500 border-b-2 border-emerald-500'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          Leopard Gecko
        </button>
        <button
          onClick={() => {
            setActiveSpecies('African Fat-Tailed Gecko');
            setFilterCategory('all');
          }}
          className={`pb-3 text-xs sm:text-sm font-black uppercase tracking-widest relative transition-colors cursor-pointer ${
            activeSpecies === 'African Fat-Tailed Gecko'
              ? 'text-emerald-500 border-b-2 border-emerald-500'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          African Fat-Tailed Gecko (AFT)
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="relative w-full lg:max-w-xl group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Cari research morph (contoh: 'Tremper', 'Mack Snow', 'Tangerine')..."
            className="w-full pl-14 pr-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/30 transition-all font-semibold text-slate-700 dark:text-slate-200 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-4 w-full">
          <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 no-scrollbar">
            <button 
              onClick={() => setFilterCategory('all')}
              className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                filterCategory === 'all' ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20' : 'bg-white dark:bg-slate-900 text-slate-400 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <Layers size={14} />
              Semua
            </button>
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                  filterCategory === cat ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/20' : 'bg-white dark:bg-slate-900 text-slate-400 border border-slate-200 dark:border-slate-800'
                }`}
              >
                {cat === 'Base' && <Dna size={14} />}
                {cat === 'Albino' && <Sparkles size={14} />}
                {cat === 'Snow' && <Activity size={14} />}
                {cat === 'Combo' && <Zap size={14} />}
                {cat === 'Pattern' && <Layers size={14} />}
                {cat === 'Line-bred' && <Activity size={14} />}
                {cat}
              </button>
            ))}
          </div>

          <div className="flex gap-3 w-full lg:w-auto">
            <select 
              className="flex-1 lg:flex-none px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none text-xs font-bold text-slate-600 dark:text-slate-300 focus:border-emerald-500/30 shadow-sm cursor-pointer"
              value={filterRarity}
              onChange={(e) => setFilterRarity(e.target.value)}
            >
              <option value="all">Semua Kelangkaan</option>
              <option value="Common">Common</option>
              <option value="Uncommon">Uncommon</option>
              <option value="Rare">Rare</option>
              <option value="Epic">Epic</option>
              <option value="Legendary">Legendary</option>
            </select>
          </div>
        </div>
      </div>

      {/* Morph List */}
      <div className="space-y-3">
        {filteredMorphs.map((morph, index) => (
          <MorphListItem 
            key={morph.id || morph.slug} 
            morph={morph} 
            onSelect={setSelectedMorph}
            onOpenCompare={handleOpenCompareWith}
            index={index}
          />
        ))}
      </div>

      {filteredMorphs.length === 0 && (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800">
           <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl w-20 h-20 mx-auto mb-6 flex items-center justify-center text-slate-300">
             <Search size={32} />
           </div>
           <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase mb-2">Morph Tidak Ditemukan</h4>
           <p className="text-slate-500 dark:text-slate-400 font-medium max-w-xs mx-auto text-xs">Coba cari dengan kata kunci lain atau gunakan tab spesies lain.</p>
        </div>
      )}

      {/* Comparison Modal */}
      <MorphComparisonModal 
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        allMorphs={morphs}
        initialMorphA={compareMorphA}
        initialMorphB={compareMorphB}
        onSelectForLab={(mA, mB) => {
          onNavigateToLab?.(mA);
        }}
        onSearchInRegistry={(name) => {
          navigate(`/registry?search=${encodeURIComponent(name)}`);
        }}
      />
    </div>
  );
}
