import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  collection,
  query,
  getDocs,
  getDoc,
  doc,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import {
  Search,
  Plus,
  Edit3,
  Trash2,
  Save,
  X,
  BookOpen,
  Sparkles,
  CheckCircle2,
  EyeOff,
  Eye,
  Lock,
  Unlock,
  ArrowUp,
  ArrowDown,
  Upload,
  Loader2,
  AlertTriangle,
  HelpCircle,
  ListChecks,
  GraduationCap,
  RefreshCw,
  Image as ImageIcon,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import {
  db,
  getCachedGuides,
  setCachedGuides,
  getCachedGuideBody,
  setCachedGuideBody,
  clearCachedGuides,
  handleFirestoreError,
  OperationType
} from '../lib/firebase';
import { compressImage } from '../lib/imageUtils';
import {
  GeneticsGuideMeta,
  GeneticsGuideBody,
  GeneticsGuideFull,
  GuideSpecies,
  GuideLevel,
  GuideAccessLevel,
  GuideStatus,
  GuideCtaType,
  GuideQuizQuestion,
  GuideGlossaryTerm
} from '../types';
import { DEFAULT_GUIDE_CATEGORIES, seedStarterGuidesToFirestore } from './knowledge/starterGuidesData';

function slugifyTitle(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 120) || `materi-${Date.now()}`;
}

function generateSafeDocId(slug: string): string {
  const base = slug.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 90) || 'guide';
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base}-${suffix}`;
}

const CTA_OPTIONS: { value: GuideCtaType; label: string; badge?: string }[] = [
  { value: 'none', label: 'Tidak Ada Tombol Aksi Lanjutan' },
  { value: 'morph_calculator', label: 'Morph Calculator (Simulasi Mendelian)', badge: 'Gratis' },
  { value: 'encyclopedia', label: 'Ensiklopedia Morph (Referensi Visual & Gen)', badge: 'Gratis' },
  { value: 'breeder_ai', label: 'Breeder AI Analysis (Evaluasi Proyek Tingkat Breeder)', badge: 'Fitur Premium' }
];

export default function AdminGeneticsGuide() {
  const [guides, setGuides] = useState<GeneticsGuideMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingEditorId, setLoadingEditorId] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState<'all' | GuideSpecies>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | GuideStatus>('all');
  const [accessFilter, setAccessFilter] = useState<'all' | GuideAccessLevel>('all');

  // Toast feedback
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' }[]>([]);
  const addToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Delete confirmation modal
  const [guideToDelete, setGuideToDelete] = useState<GeneticsGuideMeta | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Editor modal state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewMarkdown, setPreviewMarkdown] = useState(false);
  const [customCategoryMode, setCustomCategoryMode] = useState(false);
  const coverFileRef = useRef<HTMLInputElement>(null);
  const diagramFileRef = useRef<HTMLInputElement>(null);

  const emptyForm: GeneticsGuideFull = {
    title: '',
    slug: '',
    subtitle: '',
    category: 'Dasar Genetika',
    species: 'Umum',
    level: 'Pemula',
    order: 1,
    readTimeMinutes: 4,
    coverImageUrl: '',
    imageCaption: '',
    status: 'published',
    accessLevel: 'free',
    ctaType: 'none',
    ctaLabel: '',
    hasQuiz: false,
    hasGlossary: false,
    content: '',
    exampleTitle: 'Contoh Penerapan',
    exampleContent: '',
    warningTitle: '',
    warningContent: '',
    diagramImageUrl: '',
    diagramCaption: '',
    summaryPoints: [''],
    quiz: [],
    glossaryTerms: []
  };

  const [form, setForm] = useState<GeneticsGuideFull>(emptyForm);

  const fetchGuides = async (forceRefresh = false) => {
    setLoading(true);
    if (!forceRefresh) {
      const mem = getCachedGuides(true);
      if (mem && Array.isArray(mem)) {
        setGuides(mem);
        setLoading(false);
        return;
      }
    }

    try {
      const snap = await getDocs(query(collection(db, 'genetics_guides')));
      const list = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as GeneticsGuideMeta))
        .sort((a, b) => (a.order ?? 999) - (b.order ?? 999) || (a.title || '').localeCompare(b.title || ''));
      setGuides(list);
      setCachedGuides(list, true);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'genetics_guides');
      addToast('Gagal memuat daftar materi dari database.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuides();
  }, []);

  // Dynamic category list combining defaults + existing categories in DB
  const availableCategories = useMemo(() => {
    const set = new Set<string>(DEFAULT_GUIDE_CATEGORIES);
    guides.forEach(g => {
      if (g.category?.trim()) set.add(g.category.trim());
    });
    if (form.category?.trim()) set.add(form.category.trim());
    return Array.from(set);
  }, [guides, form.category]);

  const filteredGuides = useMemo(() => {
    return guides.filter(g => {
      if (g.category === 'Glosarium' || g.id === 'guide-07-glosarium') return false;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        g.title.toLowerCase().includes(q) ||
        (g.subtitle || '').toLowerCase().includes(q) ||
        g.category.toLowerCase().includes(q);
      const matchSpecies = speciesFilter === 'all' || g.species === speciesFilter;
      const matchStatus = statusFilter === 'all' || g.status === statusFilter;
      const matchAccess = accessFilter === 'all' || g.accessLevel === accessFilter;
      return matchSearch && matchSpecies && matchStatus && matchAccess;
    });
  }, [guides, searchQuery, speciesFilter, statusFilter, accessFilter]);

  const activeLessonGuides = useMemo(() => {
    return guides.filter(g => g.category !== 'Glosarium' && g.id !== 'guide-07-glosarium');
  }, [guides]);

  const stats = useMemo(() => ({
    total: activeLessonGuides.length,
    published: activeLessonGuides.filter(g => g.status === 'published').length,
    draft: activeLessonGuides.filter(g => g.status === 'draft').length,
    free: activeLessonGuides.filter(g => g.accessLevel === 'free').length,
    premium: activeLessonGuides.filter(g => g.accessLevel === 'premium').length
  }), [activeLessonGuides]);

  // Starter Seeder
  const handleSeedStarter = async () => {
    setSeeding(true);
    try {
      const { createdCount, skippedCount } = await seedStarterGuidesToFirestore();
      await fetchGuides(true);
      if (createdCount > 0) {
        addToast(
          `Berhasil menambahkan ${createdCount} materi pondasi awal (${skippedCount > 0 ? `${skippedCount} sudah ada & dilewati` : 'semua berstatus Gratis'}).`
        );
      } else {
        addToast(`Seluruh ${skippedCount} materi pondasi awal sudah tersedia di database (0 duplikasi dibuat).`);
      }
    } catch (err: any) {
      console.error('Gagal menjalankan Starter Seeder:', err);
      addToast(err?.message || 'Gagal menjalankan Starter Seeder', 'error');
    } finally {
      setSeeding(false);
    }
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    const nextOrder = guides.length > 0 ? Math.max(...guides.map(g => Number(g.order) || 0)) + 1 : 1;
    setEditingId(null);
    setPreviewMarkdown(false);
    setCustomCategoryMode(false);
    setForm({
      ...emptyForm,
      order: nextOrder,
      summaryPoints: ['']
    });
    setIsEditorOpen(true);
  };

  // Open Edit Modal (loads body from genetics_guide_contents)
  const handleOpenEdit = async (meta: GeneticsGuideMeta) => {
    if (!meta.id) return;
    setLoadingEditorId(meta.id);
    try {
      let bodyData = getCachedGuideBody(meta.id) as GeneticsGuideBody | null;
      if (!bodyData) {
        const bodySnap = await getDoc(doc(db, 'genetics_guide_contents', meta.id));
        if (bodySnap.exists()) {
          bodyData = bodySnap.data() as GeneticsGuideBody;
          setCachedGuideBody(meta.id, bodyData);
        }
      }

      setEditingId(meta.id);
      setPreviewMarkdown(false);
      setCustomCategoryMode(false);
      setForm({
        ...meta,
        content: bodyData?.content || '',
        exampleTitle: bodyData?.exampleTitle || 'Contoh Penerapan',
        exampleContent: bodyData?.exampleContent || '',
        warningTitle: bodyData?.warningTitle || '',
        warningContent: bodyData?.warningContent || '',
        diagramImageUrl: bodyData?.diagramImageUrl || '',
        diagramCaption: bodyData?.diagramCaption || '',
        summaryPoints: bodyData?.summaryPoints && bodyData.summaryPoints.length > 0 ? bodyData.summaryPoints : [''],
        quiz: bodyData?.quiz || [],
        glossaryTerms: bodyData?.glossaryTerms || []
      });
      setIsEditorOpen(true);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `genetics_guide_contents/${meta.id}`);
      addToast('Gagal memuat detail isi materi.', 'error');
    } finally {
      setLoadingEditorId(null);
    }
  };

  // Image Upload Helper
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, targetField: 'coverImageUrl' | 'diagramImageUrl') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const rawBase64 = String(ev.target?.result || '');
      if (!rawBase64) return;
      const compressed = await compressImage(rawBase64, 800, 520);
      setForm(prev => ({ ...prev, [targetField]: compressed }));
      addToast('Ilustrasi berhasil dikompresi & dimuat.');
    };
    reader.readAsDataURL(file);
  };

  // Save Guide (Atomic Batch Write to genetics_guides + genetics_guide_contents)
  const handleSaveGuide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      addToast('Judul materi wajib diisi.', 'error');
      return;
    }
    if (!form.category.trim()) {
      addToast('Kategori materi wajib diisi.', 'error');
      return;
    }
    if (!form.content.trim()) {
      addToast('Isi pembelajaran materi wajib diisi.', 'error');
      return;
    }

    setSaving(true);
    try {
      const cleanSlug = (form.slug?.trim() ? slugifyTitle(form.slug) : slugifyTitle(form.title));
      const targetId = editingId || generateSafeDocId(cleanSlug);

      const cleanedSummary = (form.summaryPoints || []).map(s => s.trim()).filter(Boolean);
      const cleanedQuiz = (form.quiz || [])
        .filter(q => q.question.trim() && q.options.some(o => o.trim()))
        .map((q, idx) => ({
          id: q.id || `quiz-${idx + 1}-${Date.now()}`,
          question: q.question.trim(),
          options: q.options.map(o => o.trim() || '-'),
          correctIndex: Math.min(Math.max(0, Number(q.correctIndex) || 0), q.options.length - 1),
          explanation: q.explanation.trim()
        }));
      const cleanedGlossary = (form.glossaryTerms || [])
        .filter(g => g.term.trim() && g.definition.trim())
        .map(g => ({
          term: g.term.trim(),
          definition: g.definition.trim(),
          species: g.species || 'Umum',
          category: (g.category || '').trim()
        }));

      const metaPayload: GeneticsGuideMeta = {
        title: form.title.trim().slice(0, 200),
        slug: cleanSlug.slice(0, 150),
        subtitle: (form.subtitle || '').trim().slice(0, 480),
        category: form.category.trim().slice(0, 100),
        species: form.species,
        level: form.level,
        order: Number(form.order) || 1,
        readTimeMinutes: Math.max(1, Number(form.readTimeMinutes) || 4),
        coverImageUrl: form.coverImageUrl || '',
        imageCaption: (form.imageCaption || '').trim(),
        status: form.status,
        accessLevel: form.accessLevel,
        ctaType: form.ctaType || 'none',
        ctaLabel: (form.ctaLabel || '').trim(),
        hasQuiz: cleanedQuiz.length > 0,
        hasGlossary: cleanedGlossary.length > 0,
        updatedAt: serverTimestamp(),
        ...(editingId ? {} : { createdAt: serverTimestamp() })
      };

      const bodyPayload: GeneticsGuideBody = {
        guideId: targetId,
        status: form.status,
        accessLevel: form.accessLevel,
        content: form.content.trim(),
        exampleTitle: (form.exampleTitle || '').trim(),
        exampleContent: (form.exampleContent || '').trim(),
        warningTitle: (form.warningTitle || '').trim(),
        warningContent: (form.warningContent || '').trim(),
        diagramImageUrl: form.diagramImageUrl || '',
        diagramCaption: (form.diagramCaption || '').trim(),
        summaryPoints: cleanedSummary,
        quiz: cleanedQuiz,
        glossaryTerms: cleanedGlossary,
        updatedAt: serverTimestamp()
      };

      const batch = writeBatch(db);
      const metaRef = doc(db, 'genetics_guides', targetId);
      const bodyRef = doc(db, 'genetics_guide_contents', targetId);

      if (editingId) {
        batch.set(metaRef, metaPayload, { merge: true });
      } else {
        batch.set(metaRef, metaPayload);
      }
      batch.set(bodyRef, bodyPayload);

      await batch.commit();
      clearCachedGuides(targetId);
      setIsEditorOpen(false);
      await fetchGuides(true);
      addToast(editingId ? 'Materi berhasil diperbarui!' : 'Materi baru berhasil ditambahkan!');
    } catch (err: any) {
      console.error('Gagal menyimpan materi:', err);
      handleFirestoreError(err, OperationType.WRITE, 'genetics_guides');
      addToast(err?.message || 'Gagal menyimpan materi.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Quick Toggle Status (Draft <-> Published) synced across both collections
  const handleQuickToggleStatus = async (guide: GeneticsGuideMeta) => {
    if (!guide.id) return;
    const nextStatus: GuideStatus = guide.status === 'published' ? 'draft' : 'published';
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'genetics_guides', guide.id), {
        status: nextStatus,
        updatedAt: serverTimestamp()
      });
      batch.set(
        doc(db, 'genetics_guide_contents', guide.id),
        { guideId: guide.id, status: nextStatus, accessLevel: guide.accessLevel, updatedAt: serverTimestamp() },
        { merge: true }
      );
      await batch.commit();
      clearCachedGuides(guide.id);
      setGuides(prev => prev.map(g => (g.id === guide.id ? { ...g, status: nextStatus } : g)));
      addToast(nextStatus === 'published' ? `"${guide.title}" diterbitkan!` : `"${guide.title}" disimpan ke Draft.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `genetics_guides/${guide.id}`);
      addToast('Gagal mengubah status publikasi.', 'error');
    }
  };

  // Quick Toggle Access (Free <-> Premium) synced across both collections & Firestore Rules
  const handleQuickToggleAccess = async (guide: GeneticsGuideMeta) => {
    if (!guide.id) return;
    const nextAccess: GuideAccessLevel = guide.accessLevel === 'free' ? 'premium' : 'free';
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'genetics_guides', guide.id), {
        accessLevel: nextAccess,
        updatedAt: serverTimestamp()
      });
      batch.set(
        doc(db, 'genetics_guide_contents', guide.id),
        { guideId: guide.id, status: guide.status, accessLevel: nextAccess, updatedAt: serverTimestamp() },
        { merge: true }
      );
      await batch.commit();
      clearCachedGuides(guide.id);
      setGuides(prev => prev.map(g => (g.id === guide.id ? { ...g, accessLevel: nextAccess } : g)));
      addToast(
        nextAccess === 'premium'
          ? `"${guide.title}" kini dilindungi sebagai Materi Premium.`
          : `"${guide.title}" dibuka sebagai Materi Gratis.`
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `genetics_guides/${guide.id}`);
      addToast('Gagal mengubah status akses materi.', 'error');
    }
  };

  // Quick Reorder
  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const swapIdx = direction === 'up' ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= filteredGuides.length) return;

    const current = filteredGuides[index];
    const target = filteredGuides[swapIdx];
    if (!current.id || !target.id) return;

    const orderA = current.order ?? index + 1;
    const orderB = target.order ?? swapIdx + 1;
    const newOrderCurrent = orderA === orderB ? (direction === 'up' ? Math.max(1, orderB - 1) : orderB + 1) : orderB;
    const newOrderTarget = orderA === orderB ? orderA : orderA;

    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'genetics_guides', current.id), { order: newOrderCurrent, updatedAt: serverTimestamp() });
      batch.update(doc(db, 'genetics_guides', target.id), { order: newOrderTarget, updatedAt: serverTimestamp() });
      await batch.commit();
      clearCachedGuides();
      await fetchGuides(true);
    } catch (err) {
      addToast('Gagal mengubah urutan materi.', 'error');
    }
  };

  // Delete Guide
  const handleConfirmDelete = async () => {
    if (!guideToDelete?.id) return;
    setDeleting(true);
    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, 'genetics_guides', guideToDelete.id));
      batch.delete(doc(db, 'genetics_guide_contents', guideToDelete.id));
      await batch.commit();
      clearCachedGuides(guideToDelete.id);
      setGuides(prev => prev.filter(g => g.id !== guideToDelete.id));
      addToast(`Materi "${guideToDelete.title}" telah dihapus.`);
      setGuideToDelete(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `genetics_guides/${guideToDelete.id}`);
      addToast('Gagal menghapus materi.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // Quiz Builder Helpers
  const addQuizItem = () => {
    const newItem: GuideQuizQuestion = {
      id: `q-${Date.now()}`,
      question: '',
      options: ['', '', '', ''],
      correctIndex: 0,
      explanation: ''
    };
    setForm(prev => ({ ...prev, quiz: [...(prev.quiz || []), newItem] }));
  };

  const updateQuizItem = (qIdx: number, updates: Partial<GuideQuizQuestion>) => {
    setForm(prev => ({
      ...prev,
      quiz: (prev.quiz || []).map((item, idx) => (idx === qIdx ? { ...item, ...updates } : item))
    }));
  };

  const removeQuizItem = (qIdx: number) => {
    setForm(prev => ({
      ...prev,
      quiz: (prev.quiz || []).filter((_, idx) => idx !== qIdx)
    }));
  };

  // Glossary Builder Helpers
  const addGlossaryTerm = () => {
    const newTerm: GuideGlossaryTerm = {
      term: '',
      definition: '',
      species: 'Umum',
      category: 'Umum'
    };
    setForm(prev => ({ ...prev, glossaryTerms: [...(prev.glossaryTerms || []), newTerm] }));
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toasts */}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 max-w-sm">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10 }}
              className={`px-4 py-3 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2.5 border ${
                t.type === 'error'
                  ? 'bg-rose-600 text-white border-rose-500'
                  : 'bg-slate-900 text-white border-slate-800'
              }`}
            >
              {t.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} className="text-emerald-400" />}
              <span>{t.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Top Action Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <GraduationCap size={24} />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Manajemen Panduan Genetika
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Kelola materi edukasi dinamis, pisahkan spesies LG & AFT, atur Draft/Publish, kuis, dan akses Gratis/Premium.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => fetchGuides(true)}
            disabled={loading}
            className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-all cursor-pointer"
            title="Muat Ulang Data Firestore"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>

          <button
            type="button"
            onClick={handleSeedStarter}
            disabled={seeding}
            className="px-4 py-3 rounded-2xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {seeding ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
            <span>Starter Seeder (Anti-Duplikat)</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Tambah Materi</span>
          </button>
        </div>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total Materi', value: stats.total, color: 'text-slate-800 dark:text-white' },
          { label: 'Terbit (Published)', value: stats.published, color: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Draft', value: stats.draft, color: 'text-amber-600 dark:text-amber-400' },
          { label: 'Akses Gratis', value: stats.free, color: 'text-blue-600 dark:text-blue-400' },
          { label: 'Akses Premium', value: stats.premium, color: 'text-purple-600 dark:text-purple-400' }
        ].map((s, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm"
          >
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{s.label}</p>
            <p className={`text-2xl font-black mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari judul, ringkasan, atau kategori..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-white focus:border-emerald-500 outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={speciesFilter}
            onChange={e => setSpeciesFilter(e.target.value as any)}
            className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 outline-none"
          >
            <option value="all">Semua Spesies</option>
            <option value="Umum">Umum (LG & AFT)</option>
            <option value="Leopard Gecko">Khusus Leopard Gecko</option>
            <option value="African Fat-Tailed Gecko">Khusus AFT</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 outline-none"
          >
            <option value="all">Semua Status</option>
            <option value="published">Published (Terbit)</option>
            <option value="draft">Draft (Tersembunyi)</option>
          </select>

          <select
            value={accessFilter}
            onChange={e => setAccessFilter(e.target.value as any)}
            className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 outline-none"
          >
            <option value="all">Semua Akses</option>
            <option value="free">Gratis</option>
            <option value="premium">Premium</option>
          </select>
        </div>
      </div>

      {/* Lessons List */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Memuat pustaka materi...</p>
        </div>
      ) : filteredGuides.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-3xl p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 mx-auto flex items-center justify-center">
            <BookOpen size={26} />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              {guides.length === 0 ? 'Database Panduan Genetika Masih Kosong' : 'Tidak Ada Materi yang Cocok dengan Filter'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
              {guides.length === 0
                ? 'Klik tombol "Starter Seeder (Anti-Duplikat)" di atas untuk mengisi 9 materi dasar (mencakup 7 kurikulum inti LG & AFT, semua berstatus Gratis), atau buat materi baru dari nol.'
                : 'Ubah kata kunci pencarian atau reset filter di atas.'}
            </p>
          </div>
          {guides.length === 0 && (
            <button
              type="button"
              onClick={handleSeedStarter}
              disabled={seeding}
              className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider inline-flex items-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer"
            >
              {seeding ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
              <span>Inisialisasi Materi Dasar Sekarang</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredGuides.map((guide, index) => (
            <div
              key={guide.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-emerald-500/40 transition-all shadow-sm"
            >
              <div className="flex items-start gap-3.5 min-w-0">
                {/* Order Controls */}
                <div className="flex flex-col items-center gap-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleMoveOrder(index, 'up')}
                    disabled={index === 0}
                    className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-white disabled:opacity-30 cursor-pointer"
                    title="Naikkan urutan"
                  >
                    <ArrowUp size={13} />
                  </button>
                  <span className="text-[11px] font-black text-slate-700 dark:text-slate-200 px-1">
                    #{guide.order}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleMoveOrder(index, 'down')}
                    disabled={index === filteredGuides.length - 1}
                    className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-white disabled:opacity-30 cursor-pointer"
                    title="Turunkan urutan"
                  >
                    <ArrowDown size={13} />
                  </button>
                </div>

                <div className="min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {guide.category}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                        guide.species === 'Leopard Gecko'
                          ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                          : guide.species === 'African Fat-Tailed Gecko'
                            ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300'
                            : 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300'
                      }`}
                    >
                      {guide.species === 'African Fat-Tailed Gecko' ? 'AFT' : guide.species}
                    </span>
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                      {guide.level}
                    </span>
                    {guide.hasQuiz && (
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-300">
                        + Kuis
                      </span>
                    )}
                    {guide.ctaType && guide.ctaType !== 'none' && (
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 inline-flex items-center gap-1">
                        <ExternalLink size={10} />
                        CTA: {guide.ctaType === 'breeder_ai' ? 'Breeder AI' : guide.ctaType === 'morph_calculator' ? 'Calculator' : 'Ensiklopedia'}
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-snug">
                    {guide.title}
                  </h3>
                  {guide.subtitle && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{guide.subtitle}</p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-800">
                {/* Toggle Gratis / Premium */}
                <button
                  type="button"
                  onClick={() => handleQuickToggleAccess(guide)}
                  className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer border ${
                    guide.accessLevel === 'premium'
                      ? 'bg-purple-50 dark:bg-purple-500/15 border-purple-200 dark:border-purple-500/30 text-purple-700 dark:text-purple-300'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                  title="Klik untuk mengganti akses Gratis / Premium"
                >
                  {guide.accessLevel === 'premium' ? <Lock size={12} /> : <Unlock size={12} />}
                  <span>{guide.accessLevel === 'premium' ? 'Premium' : 'Gratis'}</span>
                </button>

                {/* Toggle Draft / Published */}
                <button
                  type="button"
                  onClick={() => handleQuickToggleStatus(guide)}
                  className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer border ${
                    guide.status === 'published'
                      ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                      : 'bg-amber-50 dark:bg-amber-500/15 border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-300'
                  }`}
                  title="Klik untuk menerbitkan atau menyembunyikan ke Draft"
                >
                  {guide.status === 'published' ? <Eye size={12} /> : <EyeOff size={12} />}
                  <span>{guide.status === 'published' ? 'Published' : 'Draft'}</span>
                </button>

                {/* Edit */}
                <button
                  type="button"
                  onClick={() => handleOpenEdit(guide)}
                  disabled={loadingEditorId === guide.id}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {loadingEditorId === guide.id ? <Loader2 size={12} className="animate-spin" /> : <Edit3 size={12} />}
                  <span>Edit</span>
                </button>

                {/* Delete */}
                <button
                  type="button"
                  onClick={() => setGuideToDelete(guide)}
                  className="p-2 rounded-xl border border-rose-200 dark:border-rose-500/30 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all cursor-pointer"
                  title="Hapus materi"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {guideToDelete && (
          <div className="fixed inset-0 z-[180] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 flex items-center justify-center">
                <Trash2 size={22} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Hapus Materi Ini?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Anda akan menghapus permanen materi <strong>"{guideToDelete.title}"</strong> dari koleksi Panduan Genetika.
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setGuideToDelete(null)}
                  disabled={deleting}
                  className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                  className="flex-1 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                >
                  {deleting ? <Loader2 size={14} className="animate-spin" /> : null}
                  <span>Ya, Hapus</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Full Structured Editor Modal */}
      <AnimatePresence>
        {isEditorOpen && (
          <div className="fixed inset-0 z-[170] flex items-center justify-center p-2 sm:p-6 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl"
            >
              {/* Modal Header */}
              <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/70 dark:bg-slate-900">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    {editingId ? 'Edit Materi Panduan Genetika' : 'Buat Materi Panduan Genetika Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Perubahan disimpan langsung ke Firestore & dilindungi Security Rules.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSaveGuide} className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-7">
                {/* Section 1: Metadata Utama */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-emerald-600 flex items-center gap-2">
                    <span>1. Informasi Dasar & Klasifikasi</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                        Judul Materi *
                      </label>
                      <input
                        type="text"
                        required
                        value={form.title}
                        onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Contoh: 1. Dasar Genetika: Gen, Alel, Genotipe & Fenotipe"
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                        Ringkasan Singkat (Tampil di Kartu Materi)
                      </label>
                      <textarea
                        rows={2}
                        value={form.subtitle || ''}
                        onChange={e => setForm(prev => ({ ...prev, subtitle: e.target.value }))}
                        placeholder="Deskripsi singkat 1-2 kalimat agar pemula tahu apa yang dipelajari..."
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-500"
                      />
                    </div>

                    {/* Kategori Dinamis */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                          Kategori Materi *
                        </label>
                        <button
                          type="button"
                          onClick={() => setCustomCategoryMode(!customCategoryMode)}
                          className="text-[10px] font-black text-emerald-600 hover:underline cursor-pointer"
                        >
                          {customCategoryMode ? 'Pilih dari Daftar' : '+ Buat Kategori Baru'}
                        </button>
                      </div>
                      {customCategoryMode ? (
                        <input
                          type="text"
                          required
                          value={form.category}
                          onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
                          placeholder="Ketik nama kategori baru..."
                          className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-emerald-400 text-xs font-bold text-slate-900 dark:text-white outline-none"
                        />
                      ) : (
                        <select
                          value={form.category}
                          onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
                          className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none"
                        >
                          {availableCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      )}
                    </div>

                    {/* Spesies */}
                    <div>
                      <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                        Target Spesies *
                      </label>
                      <select
                        value={form.species}
                        onChange={e => setForm(prev => ({ ...prev, species: e.target.value as GuideSpecies }))}
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none"
                      >
                        <option value="Umum">Umum (Berlaku untuk LG & AFT)</option>
                        <option value="Leopard Gecko">Khusus Leopard Gecko (LG)</option>
                        <option value="African Fat-Tailed Gecko">Khusus African Fat-Tailed Gecko (AFT)</option>
                      </select>
                    </div>

                    {/* Level */}
                    <div>
                      <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                        Tingkat Pembelajaran
                      </label>
                      <select
                        value={form.level}
                        onChange={e => setForm(prev => ({ ...prev, level: e.target.value as GuideLevel }))}
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none"
                      >
                        <option value="Pemula">Pemula</option>
                        <option value="Menengah">Menengah</option>
                        <option value="Lanjutan">Lanjutan</option>
                      </select>
                    </div>

                    {/* Order & Read Time */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                          Urutan (#)
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={form.order}
                          onChange={e => setForm(prev => ({ ...prev, order: Number(e.target.value) || 1 }))}
                          className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                          Waktu Baca (Mnt)
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={60}
                          value={form.readTimeMinutes || 4}
                          onChange={e => setForm(prev => ({ ...prev, readTimeMinutes: Number(e.target.value) || 4 }))}
                          className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none"
                        />
                      </div>
                    </div>

                    {/* Status Publikasi */}
                    <div>
                      <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                        Status Publikasi
                      </label>
                      <select
                        value={form.status}
                        onChange={e => setForm(prev => ({ ...prev, status: e.target.value as GuideStatus }))}
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none"
                      >
                        <option value="published">Published (Tampil untuk Pengguna)</option>
                        <option value="draft">Draft (Disembunyikan / Hanya Admin)</option>
                      </select>
                    </div>

                    {/* Pengaturan Akses Gratis vs Premium */}
                    <div>
                      <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                        Akses Materi (Dilindungi Firestore Rules)
                      </label>
                      <select
                        value={form.accessLevel}
                        onChange={e => setForm(prev => ({ ...prev, accessLevel: e.target.value as GuideAccessLevel }))}
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none"
                      >
                        <option value="free">Gratis (Terbuka untuk Free & Premium)</option>
                        <option value="premium">Khusus Premium Aktif (Dikunci Security Rules)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 2: Gambar / Ilustrasi / Diagram */}
                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-black uppercase tracking-widest text-emerald-600 flex items-center gap-2">
                    <ImageIcon size={15} />
                    <span>2. Gambar Ilustrasi atau Diagram (Opsional)</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300">
                        URL Gambar / Upload Ilustrasi Sampul
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={form.coverImageUrl || ''}
                          onChange={e => setForm(prev => ({ ...prev, coverImageUrl: e.target.value }))}
                          placeholder="https://... atau klik Upload"
                          className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white outline-none"
                        />
                        <input
                          ref={coverFileRef}
                          type="file"
                          accept="image/*"
                          onChange={e => handleImageUpload(e, 'coverImageUrl')}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => coverFileRef.current?.click()}
                          className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer shrink-0"
                        >
                          <Upload size={14} />
                          <span>Upload</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        value={form.imageCaption || ''}
                        onChange={e => setForm(prev => ({ ...prev, imageCaption: e.target.value }))}
                        placeholder="Keterangan ilustrasi (opsional)..."
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 outline-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300">
                        Diagram Tambahan di Dalam Materi (Opsional)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={form.diagramImageUrl || ''}
                          onChange={e => setForm(prev => ({ ...prev, diagramImageUrl: e.target.value }))}
                          placeholder="https://... atau klik Upload"
                          className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white outline-none"
                        />
                        <input
                          ref={diagramFileRef}
                          type="file"
                          accept="image/*"
                          onChange={e => handleImageUpload(e, 'diagramImageUrl')}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => diagramFileRef.current?.click()}
                          className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer shrink-0"
                        >
                          <Upload size={14} />
                          <span>Upload</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        value={form.diagramCaption || ''}
                        onChange={e => setForm(prev => ({ ...prev, diagramCaption: e.target.value }))}
                        placeholder="Keterangan diagram (opsional)..."
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Isi Pembelajaran (Markdown) */}
                <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-widest text-emerald-600">
                      3. Isi Pembelajaran Utama *
                    </h4>
                    <button
                      type="button"
                      onClick={() => setPreviewMarkdown(!previewMarkdown)}
                      className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                    >
                      {previewMarkdown ? 'Kembali ke Editor Teks' : 'Lihat Pratinjau Baca'}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Mendukung format Markdown sederhana: gunakan <code>## Subjudul</code>, <code>**teks tebal**</code>, dan <code>* daftar poin</code>.
                  </p>

                  {previewMarkdown ? (
                    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown>{form.content || '*Belum ada isi materi...*'}</ReactMarkdown>
                    </div>
                  ) : (
                    <textarea
                      rows={10}
                      required
                      value={form.content}
                      onChange={e => setForm(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Tulis penjelasan materi yang ramah pemula di sini..."
                      className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-mono leading-relaxed text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500"
                    />
                  )}
                </div>

                {/* Section 4: Contoh Penerapan & Kotak Peringatan */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-200/70 dark:border-emerald-500/20 space-y-2.5">
                    <h5 className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      4A. Kotak Contoh Penerapan (Opsional)
                    </h5>
                    <input
                      type="text"
                      value={form.exampleTitle || ''}
                      onChange={e => setForm(prev => ({ ...prev, exampleTitle: e.target.value }))}
                      placeholder="Judul contoh (misal: Contoh Kasus Nyata)"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-slate-700 text-xs font-bold"
                    />
                    <textarea
                      rows={4}
                      value={form.exampleContent || ''}
                      onChange={e => setForm(prev => ({ ...prev, exampleContent: e.target.value }))}
                      placeholder="Isi contoh penerapan sederhana..."
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-slate-700 text-xs"
                    />
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-500/5 border border-amber-200/70 dark:border-amber-500/20 space-y-2.5">
                    <h5 className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                      4B. Kotak Peringatan / Catatan Penting (Opsional)
                    </h5>
                    <input
                      type="text"
                      value={form.warningTitle || ''}
                      onChange={e => setForm(prev => ({ ...prev, warningTitle: e.target.value }))}
                      placeholder="Judul peringatan (misal: Kesalahan Umum / Risiko)"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-slate-700 text-xs font-bold"
                    />
                    <textarea
                      rows={4}
                      value={form.warningContent || ''}
                      onChange={e => setForm(prev => ({ ...prev, warningContent: e.target.value }))}
                      placeholder="Isi peringatan atau catatan penting..."
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-slate-700 text-xs"
                    />
                  </div>
                </div>

                {/* Section 5: Rangkuman Materi */}
                <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-widest text-emerald-600 flex items-center gap-2">
                      <ListChecks size={15} />
                      <span>5. Poin Rangkuman (Key Takeaways)</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, summaryPoints: [...(prev.summaryPoints || []), ''] }))}
                      className="text-xs font-black text-emerald-600 hover:underline cursor-pointer"
                    >
                      + Tambah Poin
                    </button>
                  </div>

                  <div className="space-y-2">
                    {(form.summaryPoints || []).map((pt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-400 w-5">{idx + 1}.</span>
                        <input
                          type="text"
                          value={pt}
                          onChange={e => {
                            const updated = [...(form.summaryPoints || [])];
                            updated[idx] = e.target.value;
                            setForm(prev => ({ ...prev, summaryPoints: updated }));
                          }}
                          placeholder="Tulis kesimpulan singkat yang mudah diingat..."
                          className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setForm(prev => ({
                              ...prev,
                              summaryPoints: (prev.summaryPoints || []).filter((_, i) => i !== idx)
                            }))
                          }
                          className="p-2 text-slate-400 hover:text-rose-500 cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 6: Jembatan Kontekstual (CTA) */}
                <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-black uppercase tracking-widest text-emerald-600 flex items-center gap-2">
                    <ExternalLink size={15} />
                    <span>6. Jembatan Kontekstual (Tombol Aksi Lanjutan Opsional)</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                        Tujuan Fitur GFP
                      </label>
                      <select
                        value={form.ctaType || 'none'}
                        onChange={e => setForm(prev => ({ ...prev, ctaType: e.target.value as GuideCtaType }))}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                      >
                        {CTA_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    {form.ctaType && form.ctaType !== 'none' && (
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                          Teks Tombol Kustom (Opsional)
                        </label>
                        <input
                          type="text"
                          value={form.ctaLabel || ''}
                          onChange={e => setForm(prev => ({ ...prev, ctaLabel: e.target.value }))}
                          placeholder="Contoh: Coba Simulasikan di Morph Calculator"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 7: Kuis Singkat Opsional */}
                <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-widest text-emerald-600 flex items-center gap-2">
                      <HelpCircle size={15} />
                      <span>7. Kuis Evaluasi Singkat ({(form.quiz || []).length} Soal)</span>
                    </h4>
                    <button
                      type="button"
                      onClick={addQuizItem}
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-black cursor-pointer"
                    >
                      + Tambah Soal Kuis
                    </button>
                  </div>

                  <div className="space-y-4">
                    {(form.quiz || []).map((qItem, qIdx) => (
                      <div
                        key={qItem.id || qIdx}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-700 dark:text-slate-200">
                            Pertanyaan #{qIdx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeQuizItem(qIdx)}
                            className="text-xs font-bold text-rose-500 hover:underline cursor-pointer"
                          >
                            Hapus Soal
                          </button>
                        </div>

                        <input
                          type="text"
                          value={qItem.question}
                          onChange={e => updateQuizItem(qIdx, { question: e.target.value })}
                          placeholder="Tulis pertanyaan pilihan ganda..."
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {qItem.options.map((opt, optIdx) => (
                            <div key={optIdx} className="flex items-center gap-2">
                              <input
                                type="radio"
                                name={`correct-${qIdx}`}
                                checked={qItem.correctIndex === optIdx}
                                onChange={() => updateQuizItem(qIdx, { correctIndex: optIdx })}
                                className="accent-emerald-600 cursor-pointer"
                                title="Pilih sebagai jawaban benar"
                              />
                              <input
                                type="text"
                                value={opt}
                                onChange={e => {
                                  const nextOpts = [...qItem.options];
                                  nextOpts[optIdx] = e.target.value;
                                  updateQuizItem(qIdx, { options: nextOpts });
                                }}
                                placeholder={`Pilihan ${String.fromCharCode(65 + optIdx)}`}
                                className={`flex-1 px-3 py-2 rounded-xl border text-xs ${
                                  qItem.correctIndex === optIdx
                                    ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-400 font-bold'
                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                                }`}
                              />
                            </div>
                          ))}
                        </div>

                        <input
                          type="text"
                          value={qItem.explanation}
                          onChange={e => updateQuizItem(qIdx, { explanation: e.target.value })}
                          placeholder="Penjelasan mengapa jawaban tersebut benar (ditampilkan setelah pengguna menjawab)..."
                          className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 8: Daftar Istilah Glosarium (Opsional) */}
                <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-widest text-emerald-600">
                      8. Kamus Istilah / Glosarium Interaktif ({(form.glossaryTerms || []).length} Istilah — Opsional)
                    </h4>
                    <button
                      type="button"
                      onClick={addGlossaryTerm}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer"
                    >
                      + Tambah Istilah
                    </button>
                  </div>

                  {(form.glossaryTerms || []).length > 0 && (
                    <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                      {(form.glossaryTerms || []).map((gItem, gIdx) => (
                        <div
                          key={gIdx}
                          className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-12 gap-2 items-start"
                        >
                          <input
                            type="text"
                            value={gItem.term}
                            onChange={e => {
                              const next = [...(form.glossaryTerms || [])];
                              next[gIdx] = { ...next[gIdx], term: e.target.value };
                              setForm(prev => ({ ...prev, glossaryTerms: next }));
                            }}
                            placeholder="Istilah (mis: Het)"
                            className="sm:col-span-3 px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                          />
                          <select
                            value={gItem.species}
                            onChange={e => {
                              const next = [...(form.glossaryTerms || [])];
                              next[gIdx] = { ...next[gIdx], species: e.target.value as GuideSpecies };
                              setForm(prev => ({ ...prev, glossaryTerms: next }));
                            }}
                            className="sm:col-span-3 px-2.5 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                          >
                            <option value="Umum">Umum</option>
                            <option value="Leopard Gecko">Leopard Gecko</option>
                            <option value="African Fat-Tailed Gecko">AFT</option>
                          </select>
                          <input
                            type="text"
                            value={gItem.definition}
                            onChange={e => {
                              const next = [...(form.glossaryTerms || [])];
                              next[gIdx] = { ...next[gIdx], definition: e.target.value };
                              setForm(prev => ({ ...prev, glossaryTerms: next }));
                            }}
                            placeholder="Penjelasan mudah dipahami..."
                            className="sm:col-span-5 px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setForm(prev => ({
                                ...prev,
                                glossaryTerms: (prev.glossaryTerms || []).filter((_, i) => i !== gIdx)
                              }))
                            }
                            className="sm:col-span-1 p-2 text-rose-500 hover:bg-rose-50 rounded-lg flex items-center justify-center cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="pt-5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditorOpen(false)}
                    disabled={saving}
                    className="px-6 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-8 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                    <span>{editingId ? 'Simpan Perubahan' : 'Simpan Materi'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
