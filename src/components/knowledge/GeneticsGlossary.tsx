import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  BookOpen,
  Filter,
  Sparkles,
  ExternalLink,
  X,
  AlertTriangle,
  Lightbulb,
  GraduationCap,
  ChevronRight,
  Bookmark,
  Share2,
  Check,
  RefreshCw,
  SlidersHorizontal,
  Info
} from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db, getCachedGlossary, setCachedGlossary, clearCachedGlossary, isFirestoreQuotaExceeded } from '../../lib/firebase';
import { GeneticsGlossaryItem, GlossaryCategory, GuideSpecies, UserProfile } from '../../types';
import { STARTER_GLOSSARY_ITEMS, DEFAULT_GLOSSARY_CATEGORIES, seedStarterGlossaryToFirestore } from './starterGlossaryData';

interface GeneticsGlossaryProps {
  profile: UserProfile | null;
  onOpenGuideLesson?: (guideId: string) => void;
  onOpenAdminGlossary?: () => void;
  initialSearchQuery?: string;
  initialSelectedTermId?: string;
}

export default function GeneticsGlossary({
  profile,
  onOpenGuideLesson,
  onOpenAdminGlossary,
  initialSearchQuery = '',
  initialSelectedTermId
}: GeneticsGlossaryProps) {
  const isAdmin = profile?.email === 'sufhan.arifin979@gmail.com';

  const [terms, setTerms] = useState<GeneticsGlossaryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isUsingFallback, setIsUsingFallback] = useState<boolean>(false);
  const [seeding, setSeeding] = useState<boolean>(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>(initialSearchQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSpecies, setSelectedSpecies] = useState<string>('all');
  const [selectedLetter, setSelectedLetter] = useState<string>('all');

  // Detail Modal
  const [activeModalTerm, setActiveModalTerm] = useState<GeneticsGlossaryItem | null>(null);
  const [copiedTermId, setCopiedTermId] = useState<string | null>(null);

  // Load Glossary Terms from Firestore / Cache / Local Starter
  const loadGlossaryTerms = async (forceNetwork = false) => {
    setLoading(true);

    if (!forceNetwork) {
      const mem = getCachedGlossary(false);
      if (mem && Array.isArray(mem) && mem.length > 0) {
        setTerms(mem);
        setIsUsingFallback(false);
        setLoading(false);
        return;
      }

      try {
        const localRaw = localStorage.getItem('cache_genetics_glossary_pub_v1');
        if (localRaw) {
          const parsed = JSON.parse(localRaw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setTerms(parsed);
            setCachedGlossary(parsed, false);
            setIsUsingFallback(false);
            setLoading(false);
            if (isFirestoreQuotaExceeded) return;
          }
        }
      } catch {}
    }

    try {
      const q = query(collection(db, 'genetics_glossary'), where('status', '==', 'published'));
      const snap = await getDocs(q);

      if (snap.docs.length > 0) {
        const fetched = snap.docs
          .map(d => ({ id: d.id, ...d.data() } as GeneticsGlossaryItem))
          .sort((a, b) => (a.order ?? 999) - (b.order ?? 999) || (a.term || '').localeCompare(b.term || ''));
        setTerms(fetched);
        setCachedGlossary(fetched, false);
        setIsUsingFallback(false);
      } else {
        // Fallback to rich starter dataset
        setTerms(STARTER_GLOSSARY_ITEMS);
        setIsUsingFallback(true);
      }
    } catch (err) {
      console.warn('Menggunakan glosarium starter lokal:', err);
      setTerms(STARTER_GLOSSARY_ITEMS);
      setIsUsingFallback(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGlossaryTerms();
  }, []);

  // Sync initial term modal if provided
  useEffect(() => {
    if (initialSelectedTermId && terms.length > 0) {
      const found = terms.find(t => t.id === initialSelectedTermId || t.slug === initialSelectedTermId);
      if (found) {
        setActiveModalTerm(found);
      }
    }
  }, [initialSelectedTermId, terms]);

  const handleSeedGlossary = async () => {
    setSeeding(true);
    try {
      await seedStarterGlossaryToFirestore();
      await loadGlossaryTerms(true);
    } catch (err) {
      console.error('Gagal seed glosarium:', err);
    } finally {
      setSeeding(false);
    }
  };

  // Extract available first letters dynamically from active terms
  const availableLetters = useMemo(() => {
    const letters = new Set<string>();
    terms.forEach(item => {
      if (item.term && item.term.trim().length > 0) {
        const first = item.term.trim().charAt(0).toUpperCase();
        if (/^[A-Z]$/.test(first)) {
          letters.add(first);
        }
      }
    });
    return Array.from(letters).sort();
  }, [terms]);

  // Counts per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    DEFAULT_GLOSSARY_CATEGORIES.forEach(cat => {
      counts[cat] = terms.filter(t => t.category === cat).length;
    });
    return counts;
  }, [terms]);

  // Filtered Terms based on Category, Species, Alphabet, and Search Query
  const filteredTerms = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return terms.filter(item => {
      // Category Filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }

      // Species Filter
      if (selectedSpecies !== 'all') {
        if (selectedSpecies === 'Leopard Gecko' && item.species !== 'Umum' && item.species !== 'Leopard Gecko') {
          return false;
        }
        if (selectedSpecies === 'African Fat-Tailed Gecko' && item.species !== 'Umum' && item.species !== 'African Fat-Tailed Gecko') {
          return false;
        }
      }

      // Alphabet Filter
      if (selectedLetter !== 'all') {
        const first = (item.term || '').trim().charAt(0).toUpperCase();
        if (first !== selectedLetter) return false;
      }

      // Search Query
      if (q) {
        const inTerm = (item.term || '').toLowerCase().includes(q);
        const inShortDef = (item.shortDefinition || '').toLowerCase().includes(q);
        const inDef = (item.definition || '').toLowerCase().includes(q);
        const inCategory = (item.category || '').toLowerCase().includes(q);
        const inExample = (item.breedingExample || '').toLowerCase().includes(q);
        const inNotes = (item.importantNotes || '').toLowerCase().includes(q);
        if (!inTerm && !inShortDef && !inDef && !inCategory && !inExample && !inNotes) {
          return false;
        }
      }

      return true;
    });
  }, [terms, searchQuery, selectedCategory, selectedSpecies, selectedLetter]);

  const handleCopyTerm = (term: GeneticsGlossaryItem) => {
    const textToCopy = `${term.term} (${term.category}): ${term.shortDefinition}\n\nPenjelasan: ${term.definition}`;
    navigator.clipboard?.writeText(textToCopy);
    setCopiedTermId(term.id);
    setTimeout(() => setCopiedTermId(null), 2500);
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'Dasar Genetika':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Pola Pewarisan':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Status Genetik':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Persilangan':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Analisis Breeding':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'Morph & Seleksi':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Risiko Genetik':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero Banner Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-6 sm:p-10 border border-slate-800 text-white shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-widest">
            <BookOpen size={14} />
            <span>Referensi Terbuka & Komprehensif</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
            GLOSARIUM GENETIKA & BREEDING
          </h2>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-normal">
            Kamus referensi istilah genetika, morph, dan breeding reptil untuk membantu memahami istilah yang digunakan dalam dunia leopard gecko dan African Fat-Tailed Gecko.
          </p>

          {/* Quick Metrics Bar */}
          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-semibold text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              {terms.length} Istilah Terdaftar
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              7 Kategori Utama
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              Akses Terbuka & Bebas
            </span>
          </div>
        </div>

        {/* Admin Quick Action Tool */}
        {isAdmin && (
          <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-emerald-400 font-bold flex items-center gap-1.5">
              <SlidersHorizontal size={14} />
              Mode Administrator Glosarium
            </span>
            <div className="flex items-center gap-2">
              {isUsingFallback && (
                <button
                  type="button"
                  onClick={handleSeedGlossary}
                  disabled={seeding}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw size={12} className={seeding ? 'animate-spin' : ''} />
                  <span>{seeding ? 'Menyimpan ke Firestore...' : 'Simpan Istilah ke Firestore'}</span>
                </button>
              )}
              {onOpenAdminGlossary && (
                <button
                  type="button"
                  onClick={onOpenAdminGlossary}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold transition-all cursor-pointer"
                >
                  Kelola di Admin Console
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Control Panel: Search & Filters */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-5">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari istilah, singkatan, atau penjelasan (contoh: Het, Allele, Outcross, Super Form, Lethal)..."
            className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-sm text-slate-800 transition-all outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Category Filters */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span className="flex items-center gap-1.5">
              <Filter size={13} />
              Filter Kategori:
            </span>
            {selectedCategory !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className="text-emerald-600 hover:text-emerald-700 font-extrabold cursor-pointer"
              >
                Reset Kategori
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua Kategori ({terms.length})
            </button>

            {DEFAULT_GLOSSARY_CATEGORIES.map(cat => {
              const count = categoryCounts[cat] || 0;
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>{cat}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Alphabet Navigation A–Z */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Indeks Alfabet:</span>
            {selectedLetter !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedLetter('all')}
                className="text-emerald-600 hover:text-emerald-700 font-extrabold cursor-pointer"
              >
                Tampilkan Semua Huruf
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedLetter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                selectedLetter === 'all'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua
            </button>

            {availableLetters.map(letter => {
              const isSelected = selectedLetter === letter;
              return (
                <button
                  key={letter}
                  type="button"
                  onClick={() => setSelectedLetter(letter)}
                  className={`w-7 h-7 rounded-lg text-xs font-black transition-all flex items-center justify-center cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700'
                  }`}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Terms Grid / List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-black uppercase tracking-wider text-slate-500">
            Menampilkan {filteredTerms.length} Istilah
            {selectedCategory !== 'all' && ` • Kategori: ${selectedCategory}`}
            {selectedLetter !== 'all' && ` • Huruf: ${selectedLetter}`}
          </p>

          {(searchQuery || selectedCategory !== 'all' || selectedLetter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedLetter('all');
              }}
              className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer"
            >
              Hapus Semua Filter
            </button>
          )}
        </div>

        {filteredTerms.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
              <Search size={28} />
            </div>
            <h3 className="text-lg font-black text-slate-800">Istilah Tidak Ditemukan</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Tidak ada istilah yang cocok dengan kata kunci "{searchQuery}" pada filter yang dipilih. Coba ganti kata pencarian atau reset filter kategori.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedLetter('all');
              }}
              className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all cursor-pointer"
            >
              Tampilkan Semua Istilah
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTerms.map(item => {
              return (
                <div
                  key={item.id}
                  onClick={() => setActiveModalTerm(item)}
                  className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group space-y-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${getCategoryBadgeColor(item.category)}`}>
                        {item.category}
                      </span>
                      {item.species !== 'Umum' && (
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          {item.species === 'African Fat-Tailed Gecko' ? 'AFT' : 'LG'}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-black text-slate-900 group-hover:text-emerald-600 transition-colors">
                      {item.term}
                    </h3>

                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                      {item.shortDefinition}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-600 group-hover:text-emerald-700">
                    <span className="inline-flex items-center gap-1">
                      <span>Buka Penjelasan</span>
                      <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                    </span>
                    {item.relatedGuideTitle && (
                      <span className="text-[10px] text-slate-500 font-medium truncate max-w-[140px]" title={item.relatedGuideTitle}>
                        {item.relatedGuideTitle}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DETAIL MODAL ISTILAH */}
      {activeModalTerm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-6"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${getCategoryBadgeColor(activeModalTerm.category)}`}>
                    {activeModalTerm.category}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    {activeModalTerm.species}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  {activeModalTerm.term}
                </h2>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleCopyTerm(activeModalTerm)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
                  title="Salin Istilah"
                >
                  {copiedTermId === activeModalTerm.id ? <Check size={18} className="text-emerald-600" /> : <Share2 size={18} />}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModalTerm(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Content Sections */}
            <div className="space-y-5 text-sm text-slate-700 leading-relaxed">
              {/* Definisi Singkat */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-1">
                  Definisi Ringkas
                </p>
                <p className="font-semibold text-slate-900">
                  {activeModalTerm.shortDefinition}
                </p>
              </div>

              {/* Penjelasan Lengkap */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Penjelasan Mendalam
                </h4>
                <p className="whitespace-pre-line leading-relaxed text-slate-700">
                  {activeModalTerm.definition}
                </p>
              </div>

              {/* Contoh Penerapan dalam Breeding */}
              {activeModalTerm.breedingExample && (
                <div className="rounded-2xl p-4 bg-emerald-50/70 border border-emerald-200/80 space-y-1.5">
                  <div className="flex items-center gap-2 text-emerald-800 text-xs font-black uppercase tracking-wider">
                    <Lightbulb size={15} className="text-emerald-600" />
                    <span>Contoh Penerapan dalam Breeding</span>
                  </div>
                  <p className="text-xs sm:text-sm text-emerald-950 leading-relaxed font-medium">
                    {activeModalTerm.breedingExample}
                  </p>
                </div>
              )}

              {/* Catatan Penting / Kesalahan yang Perlu Dihindari */}
              {activeModalTerm.importantNotes && (
                <div className="rounded-2xl p-4 bg-rose-50/70 border border-rose-200/80 space-y-1.5">
                  <div className="flex items-center gap-2 text-rose-800 text-xs font-black uppercase tracking-wider">
                    <AlertTriangle size={15} className="text-rose-600" />
                    <span>Catatan Penting & Kekeliruan Umum</span>
                  </div>
                  <p className="text-xs sm:text-sm text-rose-950 leading-relaxed font-medium">
                    {activeModalTerm.importantNotes}
                  </p>
                </div>
              )}

              {/* Referensi Materi Terkait */}
              {activeModalTerm.relatedGuideId && (
                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <GraduationCap size={13} className="text-emerald-600" />
                      Materi Pembelajaran Terkait
                    </span>
                    <p className="text-xs font-bold text-slate-800">
                      {activeModalTerm.relatedGuideTitle || 'Pelajari materi ini di Panduan Genetika'}
                    </p>
                  </div>

                  {onOpenGuideLesson && (
                    <button
                      type="button"
                      onClick={() => {
                        const targetId = activeModalTerm.relatedGuideId!;
                        setActiveModalTerm(null);
                        onOpenGuideLesson(targetId);
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white text-xs font-black transition-all inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer shadow-sm"
                    >
                      <span>Buka Materi</span>
                      <ExternalLink size={13} />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">
                GeckoFarm Pro • Glosarium Genetika & Breeding
              </span>
              <button
                type="button"
                onClick={() => setActiveModalTerm(null)}
                className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
