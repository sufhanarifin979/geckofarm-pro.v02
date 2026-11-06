import React, { useState, useEffect, useMemo } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  BookOpen,
  CheckCircle2,
  Clock,
  Lock,
  Sparkles,
  Search,
  ArrowLeft,
  ArrowRight,
  Bookmark,
  AlertTriangle,
  Lightbulb,
  ListChecks,
  HelpCircle,
  Calculator,
  Microscope,
  RotateCcw,
  ShieldAlert,
  Info,
  Loader2,
  ChevronRight,
  Smartphone,
  Circle,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import {
  db,
  getCachedGuides,
  setCachedGuides,
  getCachedGuideBody,
  setCachedGuideBody,
  getCachedEvaluations,
  setCachedEvaluations,
  isFirestoreQuotaExceeded
} from '../../lib/firebase';
import {
  UserProfile,
  GeneticsGuideMeta,
  GeneticsGuideBody,
  GeneticsGuideFull,
  GuideSpecies,
  ClassEvaluationData,
  GuideLevel
} from '../../types';
import { isSubscriptionActive, isSubscriptionExpired, isUserAdmin } from '../../lib/subscriptionUtils';
import {
  getLearningProgress,
  toggleGuideCompleted,
  toggleGuideBookmarked,
  saveGuideQuizResult,
  markLastReadGuide,
  UserLearningProgress
} from '../../lib/learningProgress';
import { STARTER_GENETICS_GUIDES, seedStarterGuidesToFirestore } from './starterGuidesData';
import { STARTER_CLASS_EVALUATIONS } from './starterEvaluationsData';
import ClassEvaluationView from './ClassEvaluationView';
import PremiumModal from '../PremiumModal';
import GeneticsGlossary from './GeneticsGlossary';

interface GeneticsGuideProps {
  profile: UserProfile | null;
  onNavigateToEncyclopedia?: (species?: 'Leopard Gecko' | 'African Fat-Tailed Gecko') => void;
  onNavigateToAdminGuides?: () => void;
  onNavigateToAdminGlossary?: () => void;
  onNavigateToAdminEvaluations?: () => void;
  initialSpecies?: 'Leopard Gecko' | 'African Fat-Tailed Gecko';
  initialView?: 'lessons' | 'glossary';
}

type SpeciesFilterMode = 'track_lg' | 'track_aft' | 'only_umum' | 'only_lg' | 'only_aft' | 'all';

export default function GeneticsGuide({
  profile,
  onNavigateToEncyclopedia,
  onNavigateToAdminGuides,
  onNavigateToAdminGlossary,
  initialSpecies,
  initialView = 'lessons'
}: GeneticsGuideProps) {
  const navigate = useNavigate();
  const isAdmin = isUserAdmin(profile);
  const hasActivePremium = isSubscriptionActive(profile);
  const hasExpiredPremium = isSubscriptionExpired(profile);

  // Main Section Toggle: Materi Pembelajaran vs Glosarium Genetika & Breeding
  const [mainView, setMainView] = useState<'lessons' | 'glossary'>(initialView);
  const [glossaryTargetTermId, setGlossaryTargetTermId] = useState<string | undefined>(undefined);

  // Species Track & Explicit Filter
  const defaultTrack: SpeciesFilterMode =
    (initialSpecies || profile?.defaultSpecies) === 'African Fat-Tailed Gecko'
      ? 'track_aft'
      : 'track_lg';

  const [speciesMode, setSpeciesMode] = useState<SpeciesFilterMode>(defaultTrack);
  const [selectedLevel, setSelectedLevel] = useState<'all' | 'Pemula' | 'Menengah' | 'Lanjutan'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showBookmarksOnly, setShowBookmarksOnly] = useState<boolean>(false);

  // Guides Catalog & Active Lesson
  const [guides, setGuides] = useState<GeneticsGuideMeta[]>([]);
  const [isUsingFallback, setIsUsingFallback] = useState<boolean>(false);
  const [loadingCatalog, setLoadingCatalog] = useState<boolean>(true);
  const [seedingInline, setSeedingInline] = useState<boolean>(false);

  const [selectedGuideMeta, setSelectedGuideMeta] = useState<GeneticsGuideMeta | null>(null);
  const [selectedGuideBody, setSelectedGuideBody] = useState<GeneticsGuideBody | null>(null);
  const [loadingBody, setLoadingBody] = useState<boolean>(false);
  const [lockedGuidePrompt, setLockedGuidePrompt] = useState<GeneticsGuideMeta | null>(null);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState<boolean>(false);

  // Class Evaluations State
  const [evaluations, setEvaluations] = useState<ClassEvaluationData[]>(STARTER_CLASS_EVALUATIONS);
  const [selectedEvaluation, setSelectedEvaluation] = useState<ClassEvaluationData | null>(null);

  // Quiz & Glossary Reader State
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [glossarySearch, setGlossarySearch] = useState<string>('');

  // Account-isolated localStorage Learning Progress
  const [progress, setProgress] = useState<UserLearningProgress>(() => getLearningProgress(profile?.uid));

  useEffect(() => {
    setProgress(getLearningProgress(profile?.uid));
  }, [profile?.uid]);

  const starterMetaList: GeneticsGuideMeta[] = useMemo(
    () =>
      STARTER_GENETICS_GUIDES
        .filter(g => g.category !== 'Glosarium' && g.id !== 'guide-07-glosarium')
        .map(g => ({
          id: g.id,
          title: g.title,
          slug: g.slug,
          subtitle: g.subtitle,
          category: g.category,
          species: g.species,
          level: g.level,
          order: g.order,
          readTimeMinutes: g.readTimeMinutes,
          coverImageUrl: g.coverImageUrl,
          imageCaption: g.imageCaption,
          status: g.status,
          accessLevel: g.accessLevel,
          ctaType: g.ctaType,
          ctaLabel: g.ctaLabel,
          hasQuiz: !!(g.quiz && g.quiz.length > 0),
          hasGlossary: false
        })),
    []
  );

  // Load Published Guides Catalog
  const loadGuidesCatalog = async (forceNetwork = false) => {
    setLoadingCatalog(true);

    if (!forceNetwork) {
      const mem = getCachedGuides(false);
      if (mem && Array.isArray(mem) && mem.length > 0) {
        setGuides(mem);
        setIsUsingFallback(false);
        setLoadingCatalog(false);
        return;
      }

      try {
        const localRaw = localStorage.getItem('cache_genetics_guides_pub_v6');
        if (localRaw) {
          const parsed = JSON.parse(localRaw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setGuides(parsed);
            setCachedGuides(parsed, false);
            setIsUsingFallback(false);
            setLoadingCatalog(false);
            if (isFirestoreQuotaExceeded) return;
          }
        }
      } catch {}
    }

    try {
      const q = query(collection(db, 'genetics_guides'), where('status', '==', 'published'));
      const snap = await getDocs(q);
      if (snap.docs.length > 0) {
        const fetched = snap.docs
          .map(d => ({ id: d.id, ...d.data() } as GeneticsGuideMeta))
          .filter(g => g.category !== 'Glosarium' && g.id !== 'guide-07-glosarium')
          .sort((a, b) => (a.order ?? 999) - (b.order ?? 999) || (a.title || '').localeCompare(b.title || ''));
        setGuides(fetched);
        setCachedGuides(fetched, false);
        setIsUsingFallback(false);
      } else {
        // Check if Admin intentionally unpublished everything vs brand-new empty DB
        if (isAdmin) {
          const allSnap = await getDocs(query(collection(db, 'genetics_guides')));
          if (allSnap.docs.length > 0) {
            // Admin intentionally put all lessons in Draft
            setGuides([]);
            setIsUsingFallback(false);
          } else {
            setGuides(starterMetaList);
            setIsUsingFallback(true);
          }
        } else {
          setGuides(starterMetaList);
          setIsUsingFallback(true);
        }
      }
    } catch (err) {
      console.warn('Menggunakan materi starter lokal karena kendala jaringan/kuota:', err);
      if (guides.length === 0) {
        setGuides(starterMetaList);
        setIsUsingFallback(true);
      }
    } finally {
      // Load Class Evaluations
      try {
        const cachedEvals = getCachedEvaluations(false);
        if (cachedEvals && cachedEvals.length > 0) {
          setEvaluations(cachedEvals);
        } else {
          const evalSnap = await getDocs(query(collection(db, 'class_evaluations'), where('status', '==', 'published')));
          if (!evalSnap.empty) {
            const evalList = evalSnap.docs.map(d => ({ id: d.id, ...d.data() } as ClassEvaluationData));
            evalList.sort((a, b) => (a.order || 0) - (b.order || 0));
            setEvaluations(evalList);
            setCachedEvaluations(evalList, false);
          } else {
            setEvaluations(STARTER_CLASS_EVALUATIONS);
          }
        }
      } catch (e) {
        setEvaluations(STARTER_CLASS_EVALUATIONS);
      }
      setLoadingCatalog(false);
    }
  };

  useEffect(() => {
    loadGuidesCatalog();
  }, []);

  const handleInlineSeed = async () => {
    setSeedingInline(true);
    try {
      await seedStarterGuidesToFirestore();
      await loadGuidesCatalog(true);
    } catch (err) {
      console.error('Gagal menginisialisasi materi awal:', err);
    } finally {
      setSeedingInline(false);
    }
  };

  // Species Filtering Logic
  const matchesSpeciesFilter = (guideSpecies: GuideSpecies, mode: SpeciesFilterMode): boolean => {
    switch (mode) {
      case 'track_lg':
        return guideSpecies === 'Umum' || guideSpecies === 'Leopard Gecko';
      case 'track_aft':
        return guideSpecies === 'Umum' || guideSpecies === 'African Fat-Tailed Gecko';
      case 'only_umum':
        return guideSpecies === 'Umum';
      case 'only_lg':
        return guideSpecies === 'Leopard Gecko';
      case 'only_aft':
        return guideSpecies === 'African Fat-Tailed Gecko';
      case 'all':
      default:
        return true;
    }
  };

  // Guides matching active species mode (used for accurate Progress Bar calculation)
  const speciesScopedGuides = useMemo(() => {
    return guides.filter(g => matchesSpeciesFilter(g.species, speciesMode));
  }, [guides, speciesMode]);

  // Dynamic Categories within active species scope
  const categories = useMemo(() => {
    const set = new Set<string>();
    speciesScopedGuides.forEach(g => {
      if (g.category?.trim()) set.add(g.category.trim());
    });
    return Array.from(set);
  }, [speciesScopedGuides]);

  // Level counts within active species scope (Pemula 7 materi awal, Menengah materi 8-9, Lanjutan)
  const levelCounts = useMemo(() => {
    let pemula = 0;
    let menengah = 0;
    let lanjutan = 0;
    speciesScopedGuides.forEach(g => {
      if (g.level === 'Pemula') pemula++;
      else if (g.level === 'Menengah') menengah++;
      else if (g.level === 'Lanjutan') lanjutan++;
    });
    return { pemula, menengah, lanjutan, total: speciesScopedGuides.length };
  }, [speciesScopedGuides]);

  useEffect(() => {
    if (selectedCategory !== 'all' && !categories.includes(selectedCategory)) {
      setSelectedCategory('all');
    }
  }, [categories, selectedCategory]);

  // Final filtered guides for grid (strictly respecting order sequence and level tier)
  const filteredGuides = useMemo(() => {
    return speciesScopedGuides
      .filter(g => {
        const q = searchQuery.toLowerCase().trim();
        const matchSearch =
          !q ||
          g.title.toLowerCase().includes(q) ||
          (g.subtitle || '').toLowerCase().includes(q) ||
          g.category.toLowerCase().includes(q);
        const matchCat = selectedCategory === 'all' || g.category === selectedCategory;
        const matchLevel = selectedLevel === 'all' || g.level === selectedLevel;
        const matchBookmark = !showBookmarksOnly || progress.bookmarkedGuideIds.includes(g.id || '');
        return matchSearch && matchCat && matchLevel && matchBookmark;
      })
      .sort((a, b) => (a.order ?? 999) - (b.order ?? 999) || (a.title || '').localeCompare(b.title || ''));
  }, [speciesScopedGuides, searchQuery, selectedCategory, selectedLevel, showBookmarksOnly, progress.bookmarkedGuideIds]);

  // Progress Stats (Strictly local per account, Glosarium is never counted)
  const progressStats = useMemo(() => {
    const validGuides = speciesScopedGuides.filter(g => g.id !== 'guide-07-glosarium' && g.category !== 'Glosarium');
    const total = validGuides.length;
    const completed = validGuides.filter(g => g.id && g.id !== 'guide-07-glosarium' && progress.completedGuideIds.includes(g.id)).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    const quizzesCompleted = validGuides.filter(g => g.id && g.id !== 'guide-07-glosarium' && progress.quizResults[g.id]).length;
    return { total, completed, percentage, quizzesCompleted };
  }, [speciesScopedGuides, progress]);

  // Open Lesson Reader directly by ID (used for cross-reference from Glossary)
  const handleSelectGuideById = async (guideId: string) => {
    setMainView('lessons');
    let target = guides.find(g => g.id === guideId);
    if (!target) {
      target = starterMetaList.find(g => g.id === guideId);
    }
    if (target) {
      await handleSelectGuide(target);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Open Lesson Reader
  const handleSelectGuide = async (meta: GeneticsGuideMeta) => {
    if (!meta.id) return;

    // Frontend + Backend Premium Check (considers subscription status & expiry date)
    if (meta.accessLevel === 'premium' && !hasActivePremium) {
      setLockedGuidePrompt(meta);
      return;
    }

    setSelectedGuideMeta(meta);
    setSelectedAnswers({});
    setQuizSubmitted(false);
    setGlossarySearch('');
    setLoadingBody(true);

    // Update last read in localStorage
    setProgress(markLastReadGuide(profile?.uid, meta.id));

    try {
      // 1. If using starter fallback (before Firestore seed), load from local starter array
      if (isUsingFallback) {
        const starter = STARTER_GENETICS_GUIDES.find(s => s.id === meta.id);
        if (starter) {
          setSelectedGuideBody({
            guideId: starter.id!,
            status: starter.status,
            accessLevel: starter.accessLevel,
            content: starter.content,
            exampleTitle: starter.exampleTitle,
            exampleContent: starter.exampleContent,
            warningTitle: starter.warningTitle,
            warningContent: starter.warningContent,
            diagramImageUrl: starter.diagramImageUrl,
            diagramCaption: starter.diagramCaption,
            summaryPoints: starter.summaryPoints,
            quiz: starter.quiz,
            glossaryTerms: starter.glossaryTerms
          });
          setLoadingBody(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
      }

      // 2. Check memory cache
      const cachedBody = getCachedGuideBody(meta.id) as GeneticsGuideBody | null;
      if (cachedBody && (meta.accessLevel === 'free' || hasActivePremium)) {
        setSelectedGuideBody(cachedBody);
        setLoadingBody(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      // 3. Fetch protected body from Firestore `genetics_guide_contents/{id}`
      const bodySnap = await getDoc(doc(db, 'genetics_guide_contents', meta.id));
      if (bodySnap.exists()) {
        const body = bodySnap.data() as GeneticsGuideBody;
        setCachedGuideBody(meta.id, body);
        setSelectedGuideBody(body);
      } else {
        // Graceful fallback if starter ID exists in starter data
        const starter = STARTER_GENETICS_GUIDES.find(s => s.id === meta.id);
        if (starter && meta.accessLevel === 'free') {
          setSelectedGuideBody({
            guideId: meta.id,
            status: meta.status,
            accessLevel: meta.accessLevel,
            content: starter.content,
            exampleTitle: starter.exampleTitle,
            exampleContent: starter.exampleContent,
            warningTitle: starter.warningTitle,
            warningContent: starter.warningContent,
            summaryPoints: starter.summaryPoints,
            quiz: starter.quiz,
            glossaryTerms: starter.glossaryTerms
          });
        } else {
          setSelectedGuideBody({
            guideId: meta.id,
            status: meta.status,
            accessLevel: meta.accessLevel,
            content: 'Isi materi sedang disiapkan oleh Admin.'
          });
        }
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      const code = err?.code || '';
      const msg = String(err?.message || '').toLowerCase();
      if (code === 'permission-denied' || msg.includes('permission') || msg.includes('insufficient')) {
        // Firestore Security Rules blocked access (e.g. Premium expired or Free user)
        setSelectedGuideMeta(null);
        setSelectedGuideBody(null);
        setLockedGuidePrompt(meta);
      } else {
        const starter = STARTER_GENETICS_GUIDES.find(s => s.id === meta.id);
        if (starter && meta.accessLevel === 'free') {
          setSelectedGuideBody({
            guideId: meta.id,
            status: meta.status,
            accessLevel: meta.accessLevel,
            content: starter.content,
            exampleTitle: starter.exampleTitle,
            exampleContent: starter.exampleContent,
            warningTitle: starter.warningTitle,
            warningContent: starter.warningContent,
            summaryPoints: starter.summaryPoints,
            quiz: starter.quiz,
            glossaryTerms: starter.glossaryTerms
          });
        }
      }
    } finally {
      setLoadingBody(false);
    }
  };

  // Toggle Completed
  const handleToggleCompleted = (guideId: string) => {
    const updated = toggleGuideCompleted(profile?.uid, guideId);
    setProgress(updated);
  };

  // Toggle Bookmark
  const handleToggleBookmark = (e: React.MouseEvent, guideId: string) => {
    e.stopPropagation();
    const updated = toggleGuideBookmarked(profile?.uid, guideId);
    setProgress(updated);
  };

  // Submit Quiz
  const handleQuizSubmit = () => {
    if (!selectedGuideMeta?.id || !selectedGuideBody?.quiz) return;
    const quizList = selectedGuideBody.quiz;
    let correct = 0;
    quizList.forEach(q => {
      if (selectedAnswers[q.id] === q.correctIndex) {
        correct++;
      }
    });
    setQuizSubmitted(true);
    const updated = saveGuideQuizResult(profile?.uid, selectedGuideMeta.id, correct, quizList.length);
    setProgress(updated);
  };

  // Contextual CTA Action Handler
  const resolveTargetSpeciesParam = (guideSpecies: GuideSpecies): 'Leopard Gecko' | 'African Fat-Tailed Gecko' => {
    if (guideSpecies === 'African Fat-Tailed Gecko') return 'African Fat-Tailed Gecko';
    if (guideSpecies === 'Leopard Gecko') return 'Leopard Gecko';
    return speciesMode === 'track_aft' || speciesMode === 'only_aft'
      ? 'African Fat-Tailed Gecko'
      : 'Leopard Gecko';
  };

  const handleContextualAction = (guide: GeneticsGuideMeta) => {
    const targetSpecies = resolveTargetSpeciesParam(guide.species);
    const spCode = targetSpecies === 'African Fat-Tailed Gecko' ? 'AFT' : 'LG';

    if (guide.ctaType === 'encyclopedia') {
      if (onNavigateToEncyclopedia) {
        onNavigateToEncyclopedia(targetSpecies);
      } else {
        navigate(`/knowledge?tab=encyclopedia&species=${spCode}`);
      }
      return;
    }

    if (guide.ctaType === 'morph_calculator') {
      navigate(`/morph-calculator?species=${spCode}`);
      return;
    }

    if (guide.ctaType === 'breeder_ai') {
      if (hasActivePremium) {
        navigate(`/morph-calculator?species=${spCode}&mode=ai`);
      } else {
        setIsPremiumModalOpen(true);
      }
    }
  };

  // Previous / Next Lesson Navigation inside current filtered list
  const currentLessonIndex = useMemo(() => {
    if (!selectedGuideMeta?.id) return -1;
    return speciesScopedGuides.findIndex(g => g.id === selectedGuideMeta.id);
  }, [selectedGuideMeta, speciesScopedGuides]);

  const prevLesson = currentLessonIndex > 0 ? speciesScopedGuides[currentLessonIndex - 1] : null;
  const nextLesson =
    currentLessonIndex >= 0 && currentLessonIndex < speciesScopedGuides.length - 1
      ? speciesScopedGuides[currentLessonIndex + 1]
      : null;

  // Filtered Glossary Terms inside Reader (respects active species track so LG & AFT never mix!)
  const visibleGlossaryTerms = useMemo(() => {
    const terms = selectedGuideBody?.glossaryTerms || [];
    if (terms.length === 0) return [];

    return terms.filter(t => {
      const speciesAllowed =
        speciesMode === 'track_lg' || speciesMode === 'only_lg'
          ? t.species === 'Umum' || t.species === 'Leopard Gecko'
          : speciesMode === 'track_aft' || speciesMode === 'only_aft'
            ? t.species === 'Umum' || t.species === 'African Fat-Tailed Gecko'
            : speciesMode === 'only_umum'
              ? t.species === 'Umum'
              : true;

      if (!speciesAllowed) return false;

      const q = glossarySearch.toLowerCase().trim();
      if (!q) return true;
      return (
        t.term.toLowerCase().includes(q) ||
        t.definition.toLowerCase().includes(q) ||
        (t.category || '').toLowerCase().includes(q)
      );
    });
  }, [selectedGuideBody?.glossaryTerms, speciesMode, glossarySearch]);

  // ============================================================================
  // CLASS EVALUATION VIEW
  // ============================================================================
  if (selectedEvaluation) {
    return (
      <div className="max-w-4xl mx-auto animate-in fade-in duration-300">
        <ClassEvaluationView
          data={selectedEvaluation}
          profile={profile}
          onBack={() => {
            setSelectedEvaluation(null);
            setProgress(getLearningProgress(profile?.uid));
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onNavigateToTier={tier => {
            setSelectedEvaluation(null);
            setSelectedLevel(tier);
            setProgress(getLearningProgress(profile?.uid));
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenPremiumModal={() => setIsPremiumModalOpen(true)}
        />
      </div>
    );
  }

  // ============================================================================
  // LESSON READER VIEW
  // ============================================================================
  if (selectedGuideMeta) {
    const isCompleted = !!(selectedGuideMeta.id && progress.completedGuideIds.includes(selectedGuideMeta.id));
    const isBookmarked = !!(selectedGuideMeta.id && progress.bookmarkedGuideIds.includes(selectedGuideMeta.id));
    const savedQuiz = selectedGuideMeta.id ? progress.quizResults[selectedGuideMeta.id] : undefined;
    const quizQuestions = selectedGuideBody?.quiz || [];
    const allAnswered = quizQuestions.length > 0 && quizQuestions.every(q => selectedAnswers[q.id] !== undefined);

    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectedGuideMeta(null);
                setSelectedGuideBody(null);
              }}
              className="px-4 py-2.5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 text-slate-700 text-xs font-black uppercase tracking-wider inline-flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <ArrowLeft size={15} />
              <span>Daftar Materi</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedGuideMeta(null);
                setSelectedGuideBody(null);
                setMainView('glossary');
              }}
              className="px-3.5 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-800 text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <BookOpen size={14} className="text-emerald-600" />
              <span className="hidden sm:inline">Kamus Glosarium</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {selectedGuideMeta.id && (
              <button
                type="button"
                onClick={e => handleToggleBookmark(e, selectedGuideMeta.id!)}
                className={`px-3.5 py-2.5 rounded-2xl border text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                  isBookmarked
                    ? 'bg-amber-50 border-amber-300 text-amber-700'
                    : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800'
                }`}
              >
                <Bookmark size={14} className={isBookmarked ? 'fill-amber-500 text-amber-500' : ''} />
                <span className="hidden sm:inline">{isBookmarked ? 'Tersimpan' : 'Simpan'}</span>
              </button>
            )}

            {selectedGuideMeta.id && (
              <button
                type="button"
                onClick={() => handleToggleCompleted(selectedGuideMeta.id!)}
                className={`px-4 py-2.5 rounded-2xl border text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                  isCompleted
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-400'
                }`}
              >
                <CheckCircle2 size={15} />
                <span>{isCompleted ? 'Selesai Dibaca' : 'Tandai Selesai'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Lesson Header Card */}
        <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
          <div className="p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 text-white space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-xl bg-white/10 text-emerald-300 text-[10px] font-black uppercase tracking-widest">
                {selectedGuideMeta.category}
              </span>
              <span
                className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                  selectedGuideMeta.species === 'Leopard Gecko'
                    ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/30'
                    : selectedGuideMeta.species === 'African Fat-Tailed Gecko'
                      ? 'bg-amber-500/25 text-amber-200 border border-amber-400/30'
                      : 'bg-indigo-500/25 text-indigo-200 border border-indigo-400/30'
                }`}
              >
                {selectedGuideMeta.species === 'Umum'
                  ? 'Umum (LG & AFT)'
                  : selectedGuideMeta.species === 'African Fat-Tailed Gecko'
                    ? 'Khusus AFT'
                    : 'Khusus Leopard Gecko'}
              </span>
              <span
                className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                  selectedGuideMeta.level === 'Menengah'
                    ? 'bg-blue-500/25 text-blue-200 border border-blue-400/30'
                    : selectedGuideMeta.level === 'Lanjutan'
                      ? 'bg-purple-500/25 text-purple-200 border border-purple-400/30'
                      : 'bg-white/10 text-slate-200'
                }`}
              >
                Level: {selectedGuideMeta.level}
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-white/10 text-slate-200 text-[10px] font-bold inline-flex items-center gap-1">
                <Clock size={11} />
                {selectedGuideMeta.readTimeMinutes || 4} menit baca
              </span>
              {selectedGuideMeta.accessLevel === 'premium' && (
                <span className="px-2.5 py-1 rounded-xl bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1">
                  <Sparkles size={11} />
                  Materi Premium
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-3xl font-black tracking-tight leading-snug">
              {selectedGuideMeta.title}
            </h1>

            {selectedGuideMeta.subtitle && (
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
                {selectedGuideMeta.subtitle}
              </p>
            )}
          </div>

          {/* Optional Cover Image */}
          {selectedGuideMeta.coverImageUrl && (
            <div className="border-b border-slate-100 bg-slate-50 p-4 sm:p-6">
              <img
                src={selectedGuideMeta.coverImageUrl}
                alt={selectedGuideMeta.title}
                className="w-full max-h-80 object-contain rounded-2xl mx-auto"
                referrerPolicy="no-referrer"
              />
              {selectedGuideMeta.imageCaption && (
                <p className="text-center text-xs text-slate-500 mt-2 font-medium">
                  {selectedGuideMeta.imageCaption}
                </p>
              )}
            </div>
          )}

          {/* Body Content */}
          {loadingBody ? (
            <div className="p-16 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Memuat halaman pembelajaran...
              </p>
            </div>
          ) : (
            <div className="p-6 sm:p-8 space-y-8">
              {/* Main Markdown Explanation */}
              <div
                className="text-slate-700 text-sm sm:text-[15px] leading-relaxed space-y-4
                  [&_h2]:text-lg sm:[&_h2]:text-xl [&_h2]:font-black [&_h2]:text-slate-900 [&_h2]:mt-2 [&_h2]:mb-3
                  [&_h3]:text-base [&_h3]:font-black [&_h3]:text-slate-800 [&_h3]:mt-5 [&_h3]:mb-2
                  [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5
                  [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1.5
                  [&_strong]:font-black [&_strong]:text-slate-900
                  [&_blockquote]:border-l-4 [&_blockquote]:border-emerald-500 [&_blockquote]:bg-emerald-50/60 [&_blockquote]:p-4 [&_blockquote]:rounded-r-2xl [&_blockquote]:text-xs sm:[&_blockquote]:text-sm [&_blockquote]:font-semibold [&_blockquote]:text-emerald-950
                  [&_hr]:border-slate-100 [&_hr]:my-6"
              >
                <ReactMarkdown>{selectedGuideBody?.content || ''}</ReactMarkdown>
              </div>

              {/* Optional Diagram Inside Lesson */}
              {selectedGuideBody?.diagramImageUrl && (
                <div className="p-4 sm:p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-2">
                  <img
                    src={selectedGuideBody.diagramImageUrl}
                    alt={selectedGuideBody.diagramCaption || 'Diagram Genetika'}
                    className="w-full max-h-80 object-contain rounded-2xl mx-auto"
                    referrerPolicy="no-referrer"
                  />
                  {selectedGuideBody.diagramCaption && (
                    <p className="text-center text-xs text-slate-500 font-medium">
                      {selectedGuideBody.diagramCaption}
                    </p>
                  )}
                </div>
              )}

              {/* Interactive Glossary Dictionary (When Lesson has glossaryTerms) */}
              {(selectedGuideBody?.glossaryTerms || []).length > 0 && (
                <div className="space-y-4 p-5 sm:p-6 rounded-3xl bg-slate-50 border border-slate-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                        <BookOpen size={18} className="text-emerald-600" />
                        <span>Pencarian Cepat Istilah Genetika</span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        Menampilkan {visibleGlossaryTerms.length} istilah yang relevan dengan fokus spesies Anda.
                      </p>
                    </div>
                    <div className="relative w-full sm:w-64">
                      <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={glossarySearch}
                        onChange={e => setGlossarySearch(e.target.value)}
                        placeholder="Cari istilah (mis: Het, Sire)..."
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[440px] overflow-y-auto pr-1">
                    {visibleGlossaryTerms.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-sm font-black text-slate-900">{item.term}</h4>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider shrink-0 ${
                              item.species === 'Leopard Gecko'
                                ? 'bg-emerald-100 text-emerald-700'
                                : item.species === 'African Fat-Tailed Gecko'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {item.species === 'African Fat-Tailed Gecko' ? 'AFT' : item.species}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{item.definition}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Example Application Box */}
              {selectedGuideBody?.exampleContent && (
                <div className="p-5 sm:p-6 rounded-3xl bg-emerald-50/70 border border-emerald-200/80 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800 font-black text-xs uppercase tracking-wider">
                    <Lightbulb size={16} className="text-emerald-600 shrink-0" />
                    <span>{selectedGuideBody.exampleTitle || 'Contoh Penerapan'}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-emerald-950/90 leading-relaxed whitespace-pre-line font-medium">
                    {selectedGuideBody.exampleContent}
                  </p>
                </div>
              )}

              {/* Warning / Important Risk Box */}
              {selectedGuideBody?.warningContent && (
                <div className="p-5 sm:p-6 rounded-3xl bg-rose-50/70 border border-rose-200 space-y-2">
                  <div className="flex items-center gap-2 text-rose-800 font-black text-xs uppercase tracking-wider">
                    <ShieldAlert size={16} className="text-rose-600 shrink-0" />
                    <span>{selectedGuideBody.warningTitle || 'Catatan & Peringatan Penting'}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-rose-950/90 leading-relaxed whitespace-pre-line font-medium">
                    {selectedGuideBody.warningContent}
                  </p>
                </div>
              )}

              {/* Key Takeaways / Summary Box */}
              {(selectedGuideBody?.summaryPoints || []).length > 0 && (
                <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 text-white space-y-3.5">
                  <div className="flex items-center gap-2 text-emerald-400 font-black text-xs uppercase tracking-widest">
                    <ListChecks size={17} />
                    <span>Rangkuman Inti Materi</span>
                  </div>
                  <ul className="space-y-2.5">
                    {selectedGuideBody!.summaryPoints!.map((pt, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-200 leading-relaxed">
                        <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Interactive Mini Quiz */}
              {quizQuestions.length > 0 && (
                <div className="p-5 sm:p-7 rounded-3xl bg-indigo-50/50 border border-indigo-200/80 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                        <HelpCircle size={19} className="text-indigo-600" />
                        <span>Kuis Uji Pemahaman Singkat</span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        Jawab {quizQuestions.length} pertanyaan singkat di bawah ini untuk menguji pemahaman Anda.
                      </p>
                    </div>
                    {savedQuiz && !quizSubmitted && (
                      <span className="px-3 py-1 rounded-xl bg-white border border-indigo-200 text-[11px] font-black text-indigo-700 self-start">
                        Skor Terakhir: {savedQuiz.score}/{savedQuiz.total} ({savedQuiz.percentage}%)
                      </span>
                    )}
                  </div>

                  <div className="space-y-4">
                    {quizQuestions.map((q, qIdx) => {
                      const picked = selectedAnswers[q.id];
                      const isCorrect = picked === q.correctIndex;

                      return (
                        <div key={q.id} className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-sm">
                          <p className="text-xs sm:text-sm font-black text-slate-900">
                            {qIdx + 1}. {q.question}
                          </p>

                          <div className="grid grid-cols-1 gap-2">
                            {q.options.map((opt, optIdx) => {
                              const isSelected = picked === optIdx;
                              let btnClass = 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700';

                              if (quizSubmitted) {
                                if (optIdx === q.correctIndex) {
                                  btnClass = 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold';
                                } else if (isSelected && optIdx !== q.correctIndex) {
                                  btnClass = 'bg-rose-50 border-rose-400 text-rose-900 font-bold';
                                } else {
                                  btnClass = 'bg-slate-50/60 border-slate-200 text-slate-400';
                                }
                              } else if (isSelected) {
                                btnClass = 'bg-indigo-600 border-indigo-600 text-white font-bold shadow-sm';
                              }

                              return (
                                <button
                                  key={optIdx}
                                  type="button"
                                  disabled={quizSubmitted}
                                  onClick={() => setSelectedAnswers(prev => ({ ...prev, [q.id]: optIdx }))}
                                  className={`w-full text-left px-4 py-3 rounded-xl border text-xs transition-all flex items-center gap-3 cursor-pointer disabled:cursor-default ${btnClass}`}
                                >
                                  <span className="w-6 h-6 rounded-lg bg-black/5 flex items-center justify-center text-[11px] font-black shrink-0">
                                    {String.fromCharCode(65 + optIdx)}
                                  </span>
                                  <span>{opt}</span>
                                </button>
                              );
                            })}
                          </div>

                          {quizSubmitted && (
                            <div
                              className={`p-3.5 rounded-xl text-xs leading-relaxed ${
                                isCorrect
                                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-900 border border-amber-200'
                              }`}
                            >
                              <strong className="block mb-0.5">
                                {isCorrect ? '✓ Jawaban Tepat!' : '💡 Pembahasan:'}
                              </strong>
                              {q.explanation}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {!quizSubmitted ? (
                    <button
                      type="button"
                      disabled={!allAnswered}
                      onClick={handleQuizSubmit}
                      className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-indigo-600/20 transition-all cursor-pointer disabled:cursor-not-allowed"
                    >
                      Periksa Jawaban & Simpan Skor
                    </button>
                  ) : (
                    <div className="p-4 rounded-2xl bg-white border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-sm">
                          {savedQuiz?.percentage ?? 0}%
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-black text-slate-900">
                            Skor Anda: {savedQuiz?.score ?? 0} dari {quizQuestions.length} Benar!
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Materi ini otomatis ditandai selesai pada progres belajar akun Anda.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAnswers({});
                          setQuizSubmitted(false);
                        }}
                        className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                      >
                        <RotateCcw size={13} />
                        <span>Ulangi Kuis</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Contextual Bridge (Jembatan Kontekstual) */}
              {selectedGuideMeta.ctaType && selectedGuideMeta.ctaType !== 'none' && (
                <div
                  className={`p-5 sm:p-6 rounded-3xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    selectedGuideMeta.ctaType === 'breeder_ai'
                      ? 'bg-gradient-to-br from-amber-50 via-white to-emerald-50 border-amber-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">
                        Langkah Praktik Selanjutnya
                      </span>
                      {selectedGuideMeta.ctaType === 'breeder_ai' ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1">
                          <Sparkles size={10} />
                          Fitur Premium
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                          Akses Gratis
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm sm:text-base font-black text-slate-900">
                      {selectedGuideMeta.ctaLabel ||
                        (selectedGuideMeta.ctaType === 'morph_calculator'
                          ? 'Praktikkan di Morph Calculator'
                          : selectedGuideMeta.ctaType === 'encyclopedia'
                            ? 'Pelajari Karakteristik Visual di Ensiklopedia Morph'
                            : 'Analisis Pasangan Indukan dengan Breeder AI Analysis')}
                    </h4>

                    {selectedGuideMeta.ctaType === 'breeder_ai' ? (
                      <p className="text-xs text-slate-600 leading-relaxed max-w-xl">
                        {hasActivePremium
                          ? 'Akun Premium Anda aktif! Anda dapat langsung menganalisis peluang proyek, prioritas holdback, dan keamanan genetik pairing di Breeder AI Analysis.'
                          : hasExpiredPremium
                            ? 'Catatan: Masa aktif langganan Premium Anda telah berakhir. Breeder AI Analysis memerlukan langganan Premium aktif, namun Anda tetap dapat menggunakan Morph Calculator dasar secara gratis.'
                            : 'Informasi: Tujuan ini mengarah ke Breeder AI Analysis yang merupakan fitur eksklusif pengguna Premium. Anda tetap bisa mencoba Morph Calculator dasar secara gratis kapan saja.'}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
                        {selectedGuideMeta.ctaType === 'morph_calculator'
                          ? 'Terapkan konsep pewarisan yang baru saja Anda pelajari untuk menghitung peluang persilangan genetik.'
                          : 'Lihat foto contoh, klasifikasi gen, dan catatan karakteristik setiap morph secara lengkap.'}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    {selectedGuideMeta.ctaType === 'breeder_ai' && !hasActivePremium && (
                      <button
                        type="button"
                        onClick={() => {
                          const sp = resolveTargetSpeciesParam(selectedGuideMeta.species) === 'African Fat-Tailed Gecko' ? 'AFT' : 'LG';
                          navigate(`/morph-calculator?species=${sp}`);
                        }}
                        className="px-4 py-3 rounded-2xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                      >
                        Buka Kalkulator Dasar
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleContextualAction(selectedGuideMeta)}
                      className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider inline-flex items-center gap-2 shadow-md transition-all cursor-pointer ${
                        selectedGuideMeta.ctaType === 'breeder_ai'
                          ? 'bg-slate-900 hover:bg-slate-800 text-white'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                      }`}
                    >
                      {selectedGuideMeta.ctaType === 'morph_calculator' && <Calculator size={15} />}
                      {selectedGuideMeta.ctaType === 'encyclopedia' && <BookOpen size={15} />}
                      {selectedGuideMeta.ctaType === 'breeder_ai' &&
                        (hasActivePremium ? <Microscope size={15} /> : <Lock size={14} className="text-amber-400" />)}
                      <span>
                        {selectedGuideMeta.ctaType === 'breeder_ai' && !hasActivePremium
                          ? 'Lihat Keunggulan Premium'
                          : 'Buka Sekarang'}
                      </span>
                      <ChevronRight size={15} />
                    </button>
                  </div>
                </div>
              )}

              {/* Bottom Prev / Next Lesson Navigation */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {prevLesson ? (
                  <button
                    type="button"
                    onClick={() => handleSelectGuide(prevLesson)}
                    className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-400 text-left flex items-center gap-3 transition-all cursor-pointer flex-1"
                  >
                    <ArrowLeft size={16} className="text-slate-400 shrink-0" />
                    <div className="min-w-0">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Materi Sebelumnya
                      </span>
                      <span className="block text-xs font-black text-slate-800 truncate">{prevLesson.title}</span>
                    </div>
                  </button>
                ) : (
                  <div className="hidden sm:block flex-1" />
                )}

                {nextLesson ? (
                  <button
                    type="button"
                    onClick={() => handleSelectGuide(nextLesson)}
                    className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-400 text-right flex items-center justify-end gap-3 transition-all cursor-pointer flex-1"
                  >
                    <div className="min-w-0">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                        Materi Berikutnya
                      </span>
                      <span className="block text-xs font-black text-slate-800 truncate">{nextLesson.title}</span>
                    </div>
                    <ArrowRight size={16} className="text-emerald-600 shrink-0" />
                  </button>
                ) : null}
              </div>
            </div>
          )}
        </div>

        <PremiumModal
          isOpen={isPremiumModalOpen}
          onClose={() => setIsPremiumModalOpen(false)}
          profile={profile}
        />
      </div>
    );
  }

  const renderClassEvaluationCard = (evalData: ClassEvaluationData) => {
    const isLocked = evalData.accessLevel === 'premium' && !hasActivePremium;
    const result = progress.evaluationResults?.[evalData.tier];
    const status = progress.evaluationStatus?.[evalData.tier];

    return (
      <div
        key={evalData.id}
        onClick={() => {
          if (isLocked) {
            setLockedGuidePrompt({
              title: evalData.title,
              category: 'Rangkuman & Evaluasi Akhir',
              accessLevel: 'premium',
              level: evalData.tier,
              order: 999,
              species: 'Umum',
              status: 'published',
              slug: 'evaluasi-' + evalData.tier.toLowerCase()
            });
          } else {
            setSelectedEvaluation(evalData);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
        className={`p-6 sm:p-7 rounded-3xl border transition-all cursor-pointer relative overflow-hidden group shadow-sm hover:shadow-md ${
          evalData.tier === 'Pemula'
            ? 'bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-900 text-white border-emerald-500/40 hover:border-emerald-400'
            : evalData.tier === 'Menengah'
              ? 'bg-gradient-to-br from-blue-950 via-slate-900 to-slate-900 text-white border-blue-500/40 hover:border-blue-400'
              : 'bg-gradient-to-br from-purple-950 via-slate-900 to-slate-900 text-white border-purple-500/40 hover:border-purple-400'
        }`}
      >
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none group-hover:scale-110 transition-transform" />

        <div className="relative z-10 space-y-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-white/10 text-white border border-white/15 flex items-center gap-1.5 shadow-sm">
                <Award size={13} className="text-amber-400" />
                <span>Rangkuman & Evaluasi Akhir</span>
              </span>
              <span
                className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                  evalData.tier === 'Pemula'
                    ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/30'
                    : evalData.tier === 'Menengah'
                      ? 'bg-blue-500/25 text-blue-300 border border-blue-400/30'
                      : 'bg-purple-500/25 text-purple-300 border border-purple-400/30'
                }`}
              >
                Kelas {evalData.tier}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {evalData.accessLevel === 'premium' ? (
                <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-purple-500/25 text-purple-200 border border-purple-400/30 inline-flex items-center gap-1">
                  {hasActivePremium ? <Sparkles size={11} /> : <Lock size={11} />}
                  <span>Eksklusif Premium</span>
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-emerald-500/25 text-emerald-300 border border-emerald-400/30">
                  Akses Gratis
                </span>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-black text-white group-hover:text-emerald-300 transition-colors leading-snug">
              {evalData.title}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed font-medium line-clamp-2">
              {evalData.subtitle}
            </p>
          </div>

          <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-xs text-slate-300 font-medium">
              <span className="inline-flex items-center gap-1">
                <BookOpen size={13} className="text-emerald-400" />
                <span>5 Modul Terangkum</span>
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <Award size={13} className="text-amber-400" />
                <span>10 Soal Evaluasi</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              {result ? (
                <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-emerald-400" />
                  <span>Selesai • {result.score}/100 ({result.category})</span>
                </span>
              ) : status === 'in_progress' ? (
                <span className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black uppercase tracking-wider">
                  Sedang Dipelajari
                </span>
              ) : (
                <span className="px-3 py-1.5 rounded-xl bg-white/10 text-slate-300 border border-white/15 text-xs font-bold uppercase tracking-wider">
                  Belum Dimulai
                </span>
              )}

              <span className="text-xs font-black text-emerald-400 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                <span>Buka</span>
                <ChevronRight size={15} />
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ============================================================================
  // CATALOG LEARNING CENTER VIEW
  // ============================================================================
  return (
    <div className="space-y-6">
      {/* Top Feature Sub-Tabs: Materi Pembelajaran vs Glosarium */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2 sm:p-2.5 rounded-3xl border border-slate-200 shadow-sm">
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-1 sm:gap-1.5 p-1 bg-slate-100 rounded-2xl w-full sm:w-auto">
          <button
            type="button"
            onClick={() => {
              setMainView('lessons');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`min-w-0 px-2 sm:px-5 py-2.5 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1 sm:gap-2 transition-all cursor-pointer ${
              mainView === 'lessons'
                ? 'bg-white text-emerald-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GraduationCap size={15} className="shrink-0" />
            <span className="truncate">
              <span className="hidden sm:inline">Materi Pembelajaran</span>
              <span className="sm:hidden">Materi</span>
            </span>
            <span className="hidden md:inline-flex text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold shrink-0">
              {speciesScopedGuides.length} Materi
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMainView('glossary');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`min-w-0 px-2 sm:px-5 py-2.5 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1 sm:gap-2 transition-all cursor-pointer ${
              mainView === 'glossary'
                ? 'bg-white text-emerald-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen size={15} className="shrink-0" />
            <span className="truncate">
              <span className="hidden sm:inline">Glosarium Genetika & Breeding</span>
              <span className="sm:hidden">Glosarium</span>
            </span>
            <span className="hidden md:inline-flex text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold shrink-0">
              Kamus Bebas
            </span>
          </button>
        </div>

        {mainView === 'lessons' ? (
          <button
            type="button"
            onClick={() => {
              setMainView('glossary');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-all cursor-pointer"
          >
            <BookOpen size={14} />
            <span>Buka Kamus Glosarium Terbuka →</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setMainView('lessons');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer"
          >
            <GraduationCap size={14} />
            <span>Kembali ke Materi Belajar →</span>
          </button>
        )}
      </div>

      {mainView === 'glossary' ? (
        <GeneticsGlossary
          profile={profile}
          onOpenGuideLesson={handleSelectGuideById}
          onOpenAdminGlossary={onNavigateToAdminGlossary}
          initialSelectedTermId={glossaryTargetTermId}
        />
      ) : (
        <>
          {/* Quick Glosarium Helper Banner inside Materi Pembelajaran */}
          <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <BookOpen size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <span className="font-black text-slate-900 block text-xs sm:text-sm">
                  Glosarium Genetika & Breeding Tersedia Bebas
                </span>
                <span className="text-slate-600 font-medium line-clamp-2 sm:line-clamp-none">
                  Pelajari arti istilah seperti Het, Alel, Super Form, Poss Het, Outcross, atau Lethal Gene kapan saja tanpa harus menyelesaikan materi.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setMainView('glossary');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white font-bold transition-all shrink-0 cursor-pointer text-center"
            >
              Buka Glosarium →
            </button>
          </div>

          {/* Admin Unseeded Info Notice */}
      {isAdmin && isUsingFallback && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <Sparkles size={18} className="text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-950">
              <strong className="font-black">Mode Pratinjau Starter Aktif (Admin):</strong> Koleksi{' '}
              <code>genetics_guides</code> di Firestore belum diinisialisasi. Klik tombol di samping untuk menyimpan 9 materi awal ini ke Firestore agar dapat diedit atau ditambah kapan saja.
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleInlineSeed}
              disabled={seedingInline}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
            >
              {seedingInline ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              <span>Simpan Materi Awal ke Firestore</span>
            </button>
            {onNavigateToAdminGuides && (
              <button
                type="button"
                onClick={onNavigateToAdminGuides}
                className="px-3.5 py-2.5 rounded-xl bg-white border border-emerald-200 text-emerald-800 text-xs font-bold cursor-pointer"
              >
                Kelola
              </button>
            )}
          </div>
        </div>
      )}

      {/* Hero + Species Track Selector + Progress Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Species Learning Track Card */}
        <div className="lg:col-span-7 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 text-white rounded-3xl p-6 sm:p-7 shadow-lg flex flex-col justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-black uppercase tracking-widest">
              <GraduationCap size={13} />
              <span>Pusat Edukasi Genetika GFP</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Panduan Genetika dari Nol
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Pilih spesies fokus Anda agar contoh morph, kombinasi gen, dan peringatan kesehatan genetik disesuaikan secara akurat tanpa tercampur.
            </p>
          </div>

          {/* Primary Track Switcher (LG vs AFT) */}
          <div className="space-y-2.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
              Pilih Jalur Belajar Spesies Utama:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setSpeciesMode('track_lg')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  speciesMode === 'track_lg'
                    ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20'
                    : 'bg-white/5 border-white/10 text-slate-200 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider">Jalur Leopard Gecko</span>
                  {speciesMode === 'track_lg' && <CheckCircle2 size={15} />}
                </div>
                <p className={`text-[11px] mt-0.5 ${speciesMode === 'track_lg' ? 'text-slate-900 font-semibold' : 'text-slate-400'}`}>
                  Materi Umum + Genetika Khusus LG
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSpeciesMode('track_aft')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  speciesMode === 'track_aft'
                    ? 'bg-amber-400 border-amber-300 text-slate-950 shadow-lg shadow-amber-400/20'
                    : 'bg-white/5 border-white/10 text-slate-200 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider leading-tight">
                    Jalur African Fat-Tailed Gecko (AFT)
                  </span>
                  {speciesMode === 'track_aft' && <CheckCircle2 size={15} className="shrink-0" />}
                </div>
                <p className={`text-[11px] mt-0.5 ${speciesMode === 'track_aft' ? 'text-slate-900 font-semibold' : 'text-slate-400'}`}>
                  Materi Umum + Genetika Khusus AFT
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Account-Scoped Local Progress Card */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Progres Belajar Anda
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-black">
                {progressStats.percentage}% Selesai
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">
                {progressStats.completed}
              </span>
              <span className="text-sm font-bold text-slate-400">
                / {progressStats.total} Materi Selesai
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressStats.percentage}%` }}
                transition={{ duration: 0.4 }}
                className="h-full bg-emerald-500 rounded-full"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold pt-1">
              <span>Kuis Dikerjakan: {progressStats.quizzesCompleted}</span>
              <button
                type="button"
                onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
                className={`inline-flex items-center gap-1 font-bold cursor-pointer ${
                  showBookmarksOnly ? 'text-amber-600' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Bookmark size={13} className={showBookmarksOnly ? 'fill-amber-500 text-amber-500' : ''} />
                <span>Favorit ({progress.bookmarkedGuideIds.length})</span>
              </button>
            </div>
          </div>

          {/* Explicit Local-Only Sync Notice (without exposing user email) */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5 text-[11px] text-slate-500 leading-relaxed">
            <Smartphone size={15} className="text-slate-400 shrink-0 mt-0.5" />
            <span>
              Progres baca dan skor kuis disimpan secara lokal pada perangkat ini untuk akun Anda. Data tidak otomatis tersinkronisasi ke perangkat lain.
            </span>
          </div>
        </div>
      </div>

      {/* Granular Filter Bar (Pilihan Tingkat Materi + Search + Quick Species Filter + Dynamic Categories) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-sm space-y-4">
        {/* Tier / Level Tabs (Pemula 7 materi awal, Menengah materi 8 & 9, Lanjutan) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <GraduationCap size={16} className="text-emerald-600 shrink-0" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-800">
              Pilihan Tingkat Materi:
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            <button
              type="button"
              onClick={() => {
                setSelectedLevel('all');
                setSelectedCategory('all');
              }}
              className={`px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedLevel === 'all'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>Semua Tingkat</span>
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                  selectedLevel === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {speciesScopedGuides.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedLevel('Pemula');
                setSelectedCategory('all');
              }}
              className={`px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedLevel === 'Pemula'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60'
              }`}
            >
              <span>Pemula</span>
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                  selectedLevel === 'Pemula' ? 'bg-white/20 text-white' : 'bg-emerald-200/60 text-emerald-900'
                }`}
              >
                {levelCounts.pemula} Materi
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedLevel('Menengah');
                setSelectedCategory('all');
              }}
              className={`px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedLevel === 'Menengah'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200/60'
              }`}
            >
              <span>Menengah</span>
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                  selectedLevel === 'Menengah' ? 'bg-white/20 text-white' : 'bg-blue-200/60 text-blue-900'
                }`}
              >
                {levelCounts.menengah} Materi
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedLevel('Lanjutan');
                setSelectedCategory('all');
              }}
              className={`px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedLevel === 'Lanjutan'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200/60'
              }`}
            >
              <span>Lanjutan</span>
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                  selectedLevel === 'Lanjutan' ? 'bg-white/20 text-white' : 'bg-purple-200/60 text-purple-900'
                }`}
              >
                {levelCounts.lanjutan > 0 ? `${levelCounts.lanjutan} Materi` : 'Segera'}
              </span>
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari materi (contoh: Het, Recessive, Whiteout, Enigma, Glosarium)..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Explicit Species Filter Dropdown/Pills for Granular Filtering */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
            {[
              { id: 'track_lg', label: 'Jalur LG' },
              { id: 'track_aft', label: 'Jalur AFT' },
              { id: 'only_umum', label: 'Hanya Umum' },
              { id: 'only_lg', label: 'Khusus LG' },
              { id: 'only_aft', label: 'Khusus AFT' },
              { id: 'all', label: 'Semua' }
            ].map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSpeciesMode(item.id as SpeciesFilterMode)}
                className={`px-3 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                  speciesMode === item.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category Pills */}
        {categories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua Kategori
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Cards Grid */}
      {loadingCatalog ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Menyiapkan materi pembelajaran...
          </p>
        </div>
      ) : filteredGuides.length === 0 ? (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-10 sm:p-12 text-center space-y-4">
            {selectedLevel === 'Lanjutan' && levelCounts.lanjutan === 0 ? (
              <>
                <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 mx-auto flex items-center justify-center">
                  <GraduationCap size={28} />
                </div>
                <div className="space-y-1.5 max-w-md mx-auto">
                  <span className="px-2.5 py-1 rounded-lg bg-purple-100 text-purple-800 text-[10px] font-black uppercase tracking-wider">
                    Tingkat Lanjutan
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    Materi Tingkat Lanjutan Sedang Disiapkan
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Materi harian tingkat lanjutan yang mencakup studi kasus breeding kompleks dan analisis poligenik sedang disiapkan. Anda tetap dapat meninjau dan mengerjakan Rangkuman & Evaluasi Akhir Kelas Lanjutan di bawah ini.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLevel('Pemula');
                      setSelectedCategory('all');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider cursor-pointer shadow-sm transition-all"
                  >
                    Buka Materi Pemula ({levelCounts.pemula})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLevel('Menengah');
                      setSelectedCategory('all');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider cursor-pointer shadow-sm transition-all"
                  >
                    Buka Materi Menengah ({levelCounts.menengah})
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                  <BookOpen size={22} />
                </div>
                <h3 className="text-base font-black text-slate-900">Materi Tidak Ditemukan</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Coba ubah kata kunci pencarian, kategori, tingkat materi, atau matikan filter Favorit.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setSelectedLevel('all');
                    setShowBookmarksOnly(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold cursor-pointer hover:bg-slate-800 transition-all"
                >
                  Reset Filter
                </button>
              </>
            )}
          </div>

          {/* Rangkuman & Evaluasi Akhir Kelas Lanjutan bila filter Lanjutan aktif */}
          {selectedLevel === 'Lanjutan' && evaluations.find(e => e.tier === 'Lanjutan') && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 px-1">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-purple-600" />
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
                    Bagian Penutup: Rangkuman & Evaluasi Akhir Kelas Lanjutan
                  </h3>
                </div>
                <span className="text-xs font-semibold text-purple-700">
                  Eksklusif Premium • 10 Soal Evaluasi Terpadu
                </span>
              </div>
              {renderClassEvaluationCard(evaluations.find(e => e.tier === 'Lanjutan')!)}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredGuides.map((guide, idx) => {
            const isDone = !!(guide.id && progress.completedGuideIds.includes(guide.id));
            const isSaved = !!(guide.id && progress.bookmarkedGuideIds.includes(guide.id));
            const quizScore = guide.id ? progress.quizResults[guide.id] : undefined;
            const isLockedPremium = guide.accessLevel === 'premium' && !hasActivePremium;

            return (
              <motion.div
                key={guide.id || idx}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.03, 0.25) }}
                onClick={() => handleSelectGuide(guide)}
                className={`group bg-white rounded-3xl border p-5 sm:p-6 flex flex-col justify-between gap-5 transition-all cursor-pointer shadow-sm hover:shadow-md ${
                  isDone
                    ? 'border-emerald-300/80 hover:border-emerald-500'
                    : isLockedPremium
                      ? 'border-purple-200 hover:border-purple-400'
                      : 'border-slate-200 hover:border-emerald-400'
                }`}
              >
                <div className="space-y-3">
                  {/* Top Badges Row */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-wider">
                        Materi {String(guide.order || idx + 1).padStart(2, '0')}
                      </span>
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                          guide.species === 'Leopard Gecko'
                            ? 'bg-emerald-100 text-emerald-800'
                            : guide.species === 'African Fat-Tailed Gecko'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-indigo-100 text-indigo-800'
                        }`}
                      >
                        {guide.species === 'African Fat-Tailed Gecko' ? 'AFT' : guide.species}
                      </span>
                    </div>

                    {/* Top Right Corner: Replaced "Gratis" with Material Level (Pemula, Menengah, Lanjutan) */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                          guide.level === 'Menengah'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : guide.level === 'Lanjutan'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                        }`}
                      >
                        {guide.level || 'Pemula'}
                      </span>

                      {guide.accessLevel === 'premium' && (
                        <span
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1 ${
                            hasActivePremium
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                          title={hasActivePremium ? 'Modul Premium Aktif' : 'Modul Khusus Premium'}
                        >
                          {hasActivePremium ? <Sparkles size={11} /> : <Lock size={11} />}
                          <span className="hidden sm:inline">Premium</span>
                        </span>
                      )}

                      {guide.id && (
                        <button
                          type="button"
                          onClick={e => handleToggleBookmark(e, guide.id!)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-amber-500 transition-colors cursor-pointer"
                          title="Simpan ke materi favorit"
                        >
                          <Bookmark size={15} className={isSaved ? 'fill-amber-500 text-amber-500' : ''} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Category & Title */}
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">
                      {guide.category}
                    </p>
                    <h3 className="text-base font-black text-slate-900 group-hover:text-emerald-600 transition-colors leading-snug">
                      {guide.title}
                    </h3>
                  </div>

                  {guide.subtitle && (
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                      {guide.subtitle}
                    </p>
                  )}
                </div>

                {/* Footer Metadata & Status */}
                <div className="pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-slate-400">
                    <span className="inline-flex items-center gap-1 text-slate-600 font-semibold">
                      <Clock size={12} />
                      {guide.readTimeMinutes || 4} mnt
                    </span>
                    {guide.hasQuiz && (
                      <>
                        <span>•</span>
                        <span className="text-indigo-600 font-semibold">Kuis</span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isDone ? (
                      <div className="flex items-center gap-1.5">
                        <span className="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1">
                          <CheckCircle2 size={12} />
                          <span>{quizScore ? `Selesai (${quizScore.percentage}%)` : 'Selesai'}</span>
                        </span>
                        <ChevronRight size={14} className="text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1">
                          <Circle size={9} className="text-slate-400" />
                          <span>Belum Selesai</span>
                        </span>
                        {isLockedPremium ? (
                          <span className="text-[11px] font-black text-purple-600 inline-flex items-center gap-1">
                            <Lock size={12} />
                            <span>Buka Akses</span>
                          </span>
                        ) : (
                          <span className="text-xs font-black text-emerald-600 group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-0.5">
                            <span>Pelajari</span>
                            <ChevronRight size={14} />
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Bagian Penutup Kelas: Rangkuman & Evaluasi Akhir Kelas */}
      {selectedLevel === 'Pemula' && evaluations.find(e => e.tier === 'Pemula') && (
        <div className="mt-8 pt-6 border-t border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 px-1">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
                Bagian Penutup: Rangkuman & Evaluasi Akhir Kelas Pemula
              </h3>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              Penutup Kelas • Intisari, Kompetensi, Studi Kasus & 10 Soal Evaluasi
            </span>
          </div>
          {renderClassEvaluationCard(evaluations.find(e => e.tier === 'Pemula')!)}
        </div>
      )}

      {selectedLevel === 'Menengah' && evaluations.find(e => e.tier === 'Menengah') && (
        <div className="mt-8 pt-6 border-t border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 px-1">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
                Bagian Penutup: Rangkuman & Evaluasi Akhir Kelas Menengah
              </h3>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              Penutup Kelas • Intisari, Kompetensi, Studi Kasus & 10 Soal Evaluasi
            </span>
          </div>
          {renderClassEvaluationCard(evaluations.find(e => e.tier === 'Menengah')!)}
        </div>
      )}

      {selectedLevel === 'Lanjutan' && filteredGuides.length > 0 && evaluations.find(e => e.tier === 'Lanjutan') && (
        <div className="mt-8 pt-6 border-t border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 px-1">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-600" />
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
                Bagian Penutup: Rangkuman & Evaluasi Akhir Kelas Lanjutan
              </h3>
            </div>
            <span className="text-xs font-semibold text-purple-700">
              Eksklusif Premium • 10 Soal Evaluasi Terpadu
            </span>
          </div>
          {renderClassEvaluationCard(evaluations.find(e => e.tier === 'Lanjutan')!)}
        </div>
      )}

      {selectedLevel === 'all' && evaluations.length > 0 && (
        <div className="mt-12 pt-8 border-t border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 px-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Award size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Rangkuman & Evaluasi Akhir Tiap Kelas
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Uji pemahaman komprehensif setelah menyelesaikan 5 materi pokok di setiap jenjang
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-400">
              Pemula • Menengah • Lanjutan
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {evaluations
              .filter(e => {
                if (!searchQuery.trim()) return true;
                const q = searchQuery.toLowerCase();
                return e.title.toLowerCase().includes(q) || e.subtitle.toLowerCase().includes(q) || e.tier.toLowerCase().includes(q);
              })
              .map(evalData => renderClassEvaluationCard(evalData))}
          </div>
        </div>
      )}
      </>
      )}

      {/* Locked Premium Lesson Prompt Modal */}
      <AnimatePresence>
        {lockedGuidePrompt && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 border border-slate-200"
            >
              <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center">
                <Lock size={26} />
              </div>

              <div className="space-y-2">
                <span className="px-2.5 py-1 rounded-lg bg-purple-100 text-purple-800 text-[10px] font-black uppercase tracking-wider">
                  Modul Eksklusif Premium
                </span>
                <h3 className="text-lg font-black text-slate-900 leading-snug">
                  {lockedGuidePrompt.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {hasExpiredPremium
                    ? 'Langganan Premium Anda telah melewati tanggal kedaluwarsa. Perpanjang akses Premium untuk membuka materi lanjutan ini serta fitur Breeder AI Analysis.'
                    : 'Materi lanjutan ini dilindungi khusus untuk pelanggan GFP Premium aktif. Seluruh materi dasar tetap dapat Anda pelajari secara gratis!'}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setLockedGuidePrompt(null)}
                  className="flex-1 py-3 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Kembali ke Katalog Materi
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLockedGuidePrompt(null);
                    setIsPremiumModalOpen(true);
                  }}
                  className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-600/20 cursor-pointer"
                >
                  Info Upgrade Premium
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <PremiumModal
        isOpen={isPremiumModalOpen}
        onClose={() => setIsPremiumModalOpen(false)}
        profile={profile}
      />
    </div>
  );
}
