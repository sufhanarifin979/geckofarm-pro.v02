import React, { useState, useEffect, useMemo } from 'react';
import {
  collection,
  query,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
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
  EyeOff,
  Eye,
  AlertTriangle,
  Lightbulb,
  GraduationCap,
  RefreshCw,
  SlidersHorizontal,
  Check,
  ChevronRight,
  Filter
} from 'lucide-react';
import {
  db,
  getCachedGlossary,
  setCachedGlossary,
  clearCachedGlossary,
  handleFirestoreError,
  OperationType
} from '../lib/firebase';
import { GeneticsGlossaryItem, GlossaryCategory, GuideSpecies, GuideStatus } from '../types';
import {
  DEFAULT_GLOSSARY_CATEGORIES,
  STARTER_GLOSSARY_ITEMS,
  seedStarterGlossaryToFirestore
} from './knowledge/starterGlossaryData';
import { STARTER_GENETICS_GUIDES } from './knowledge/starterGuidesData';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 100) || `istilah-${Date.now()}`;
}

export default function AdminGeneticsGlossary() {
  const [terms, setTerms] = useState<GeneticsGlossaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [speciesFilter, setSpeciesFilter] = useState<'all' | GuideSpecies>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | GuideStatus>('all');

  // Form Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GeneticsGlossaryItem | null>(null);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const emptyForm: GeneticsGlossaryItem = {
    id: '',
    term: '',
    slug: '',
    category: 'Dasar Genetika',
    species: 'Umum',
    shortDefinition: '',
    definition: '',
    breedingExample: '',
    importantNotes: '',
    relatedGuideId: '',
    relatedGuideTitle: '',
    order: (terms.length > 0 ? Math.max(...terms.map(t => t.order || 0)) + 1 : 1),
    status: 'published'
  };

  const [form, setForm] = useState<GeneticsGlossaryItem>(emptyForm);

  // Load terms
  const loadTerms = async (forceNetwork = false) => {
    setLoading(true);

    if (!forceNetwork) {
      const mem = getCachedGlossary(true);
      if (mem && Array.isArray(mem) && mem.length > 0) {
        setTerms(mem);
        setLoading(false);
        return;
      }
    }

    try {
      const snap = await getDocs(query(collection(db, 'genetics_glossary')));
      if (snap.docs.length > 0) {
        const list = snap.docs
          .map(d => ({ id: d.id, ...d.data() } as GeneticsGlossaryItem))
          .sort((a, b) => (a.order ?? 999) - (b.order ?? 999) || (a.term || '').localeCompare(b.term || ''));
        setTerms(list);
        setCachedGlossary(list, true);
      } else {
        // Fallback to local starter
        setTerms(STARTER_GLOSSARY_ITEMS);
      }
    } catch (err) {
      console.warn('Gagal memuat glosarium dari Firestore, gunakan starter:', err);
      setTerms(STARTER_GLOSSARY_ITEMS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTerms();
  }, []);

  const handleOpenAdd = () => {
    const nextOrder = terms.length > 0 ? Math.max(...terms.map(t => t.order || 0)) + 1 : 1;
    setEditingItem(null);
    setForm({
      ...emptyForm,
      order: nextOrder
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: GeneticsGlossaryItem) => {
    setEditingItem(item);
    setForm({ ...item });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.term.trim()) {
      showToast('Nama istilah tidak boleh kosong!', 'error');
      return;
    }
    if (!form.shortDefinition.trim()) {
      showToast('Definisi singkat tidak boleh kosong!', 'error');
      return;
    }
    if (!form.definition.trim()) {
      showToast('Penjelasan lengkap tidak boleh kosong!', 'error');
      return;
    }

    setSaving(true);
    const slug = form.slug.trim() || slugify(form.term);
    const docId = editingItem ? editingItem.id : (form.id.trim() || `term-${slug}`);

    // If related guide is selected from predefined list, sync title
    let guideTitle = form.relatedGuideTitle || '';
    if (form.relatedGuideId) {
      const matchGuide = STARTER_GENETICS_GUIDES.find(g => g.id === form.relatedGuideId);
      if (matchGuide) {
        guideTitle = matchGuide.title;
      }
    }

    const payload: GeneticsGlossaryItem = {
      id: docId,
      term: form.term.trim(),
      slug,
      category: form.category,
      species: form.species,
      shortDefinition: form.shortDefinition.trim(),
      definition: form.definition.trim(),
      breedingExample: (form.breedingExample || '').trim(),
      importantNotes: (form.importantNotes || '').trim(),
      relatedGuideId: form.relatedGuideId || '',
      relatedGuideTitle: guideTitle,
      order: Number(form.order) || 1,
      status: form.status,
      updatedAt: serverTimestamp(),
      ...(editingItem ? {} : { createdAt: serverTimestamp() })
    };

    try {
      await setDoc(doc(db, 'genetics_glossary', docId), payload);
      clearCachedGlossary();
      showToast(`Istilah "${payload.term}" berhasil disimpan.`);
      setIsModalOpen(false);
      await loadTerms(true);
    } catch (err: any) {
      console.error('Gagal menyimpan istilah glosarium:', err);
      showToast(`Gagal menyimpan: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: GeneticsGlossaryItem) => {
    if (!window.confirm(`Yakin ingin menghapus istilah "${item.term}"?`)) return;
    setDeletingId(item.id);
    try {
      await deleteDoc(doc(db, 'genetics_glossary', item.id));
      clearCachedGlossary();
      showToast(`Istilah "${item.term}" telah dihapus.`);
      await loadTerms(true);
    } catch (err: any) {
      console.error('Gagal menghapus istilah:', err);
      showToast(`Gagal menghapus: ${err.message}`, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleStatus = async (item: GeneticsGlossaryItem) => {
    const nextStatus: GuideStatus = item.status === 'published' ? 'draft' : 'published';
    try {
      await setDoc(
        doc(db, 'genetics_glossary', item.id),
        { status: nextStatus, updatedAt: serverTimestamp() },
        { merge: true }
      );
      clearCachedGlossary();
      showToast(`Status "${item.term}" diubah ke ${nextStatus}.`);
      setTerms(prev => prev.map(t => (t.id === item.id ? { ...t, status: nextStatus } : t)));
    } catch (err: any) {
      console.error('Gagal mengubah status:', err);
      showToast('Gagal mengubah status istilah', 'error');
    }
  };

  const handleSeedAll = async () => {
    if (!window.confirm('Sinkronkan seluruh istilah starter ke Firestore sekarang?')) return;
    setSeeding(true);
    try {
      const res = await seedStarterGlossaryToFirestore();
      showToast(`Berhasil menyinkronkan ${res.count} istilah ke Firestore.`);
      await loadTerms(true);
    } catch (err: any) {
      console.error('Gagal seeding glosarium:', err);
      showToast('Gagal sinkronisasi glosarium', 'error');
    } finally {
      setSeeding(false);
    }
  };

  // Filtered terms
  const filteredTerms = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return terms.filter(item => {
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      if (speciesFilter !== 'all' && item.species !== speciesFilter) return false;
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (q) {
        const inTerm = (item.term || '').toLowerCase().includes(q);
        const inShort = (item.shortDefinition || '').toLowerCase().includes(q);
        const inDef = (item.definition || '').toLowerCase().includes(q);
        if (!inTerm && !inShort && !inDef) return false;
      }
      return true;
    });
  }, [terms, searchQuery, categoryFilter, speciesFilter, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl border text-sm font-bold flex items-center gap-2 animate-in slide-in-from-bottom-3 duration-200 ${
            toast.type === 'success'
              ? 'bg-emerald-900 border-emerald-700 text-emerald-100'
              : 'bg-rose-900 border-rose-700 text-rose-100'
          }`}
        >
          {toast.type === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl text-white">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider">
              Admin Console
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black flex items-center gap-2.5">
            <BookOpen className="text-emerald-500" size={24} />
            <span>Kelola Glosarium Genetika & Breeding</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Kelola {terms.length} istilah referensi, definisi lengkap, contoh breeding, dan referensi silang ke materi pembelajaran.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleSeedAll}
            disabled={seeding}
            className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw size={14} className={seeding ? 'animate-spin' : ''} />
            <span>{seeding ? 'Menyinkronkan...' : 'Sinkronkan Starter'}</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all inline-flex items-center gap-2 shadow-lg shadow-emerald-950/40 cursor-pointer"
          >
            <Plus size={16} />
            <span>Tambah Istilah</span>
          </button>
        </div>
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative col-span-1 sm:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari nama istilah atau isi definisi..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">Semua Kategori ({terms.length})</option>
              {DEFAULT_GLOSSARY_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">Semua Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>
      </div>

      {/* Terms Table / List */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-black uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">Urutan</th>
                <th className="py-3.5 px-4">Istilah & Slug</th>
                <th className="py-3.5 px-4">Kategori</th>
                <th className="py-3.5 px-4">Spesies</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <RefreshCw className="animate-spin mx-auto mb-2 text-emerald-500" size={20} />
                    <span>Memuat daftar glosarium...</span>
                  </td>
                </tr>
              ) : filteredTerms.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Tidak ada istilah yang sesuai dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                filteredTerms.map(item => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                      {item.order}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <span className="font-bold text-white text-sm">{item.term}</span>
                        <div className="text-[11px] text-slate-400 line-clamp-1 max-w-md">
                          {item.shortDefinition}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          id: {item.id}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full bg-slate-800 text-emerald-400 border border-slate-700 font-bold text-[10px]">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-slate-400 text-[11px]">
                        {item.species}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(item)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                          item.status === 'published'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {item.status === 'published' ? <Eye size={11} /> : <EyeOff size={11} />}
                        <span>{item.status}</span>
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                          title="Edit Istilah"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          disabled={deletingId === item.id}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-400 transition-all cursor-pointer"
                          title="Hapus Istilah"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL EDITOR: TAMBAH / EDIT ISTILAH */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6 text-white"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Title */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <h3 className="text-xl font-black text-white">
                  {editingItem ? `Edit Istilah: ${editingItem.term}` : 'Tambah Istilah Glosarium Baru'}
                </h3>
                <p className="text-xs text-slate-400">
                  Pastikan informasi definisi, contoh penerapan, dan catatan penting akurat untuk pemula.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Term Name */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-300">
                    Nama Istilah <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.term}
                    onChange={e => {
                      const val = e.target.value;
                      setForm(prev => ({
                        ...prev,
                        term: val,
                        slug: prev.slug || slugify(val)
                      }));
                    }}
                    placeholder="Contoh: Heterozygous (Het)"
                    required
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Slug */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    Slug URL
                  </label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={e => setForm(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="contoh: het-heterozygous"
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono text-xs"
                  />
                </div>

                {/* Kategori */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    Kategori <span className="text-emerald-400">*</span>
                  </label>
                  <select
                    value={form.category}
                    onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    {DEFAULT_GLOSSARY_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Spesies */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    Spesies Target
                  </label>
                  <select
                    value={form.species}
                    onChange={e => setForm(prev => ({ ...prev, species: e.target.value as any }))}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Umum">Umum (Leopard Gecko & AFT)</option>
                    <option value="Leopard Gecko">Khusus Leopard Gecko (LG)</option>
                    <option value="African Fat-Tailed Gecko">Khusus African Fat-Tailed Gecko (AFT)</option>
                  </select>
                </div>

                {/* Urutan & Status */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">
                      Urutan Tampilan
                    </label>
                    <input
                      type="number"
                      value={form.order}
                      onChange={e => setForm(prev => ({ ...prev, order: Number(e.target.value) }))}
                      className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">
                      Status Publikasi
                    </label>
                    <select
                      value={form.status}
                      onChange={e => setForm(prev => ({ ...prev, status: e.target.value as any }))}
                      className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Definisi Singkat */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Definisi Singkat (Untuk kartu ringkas) <span className="text-emerald-400">*</span>
                </label>
                <textarea
                  rows={2}
                  value={form.shortDefinition}
                  onChange={e => setForm(prev => ({ ...prev, shortDefinition: e.target.value }))}
                  placeholder="Ringkasan 1-2 kalimat padat arti istilah..."
                  required
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500 leading-relaxed"
                />
              </div>

              {/* Penjelasan Lengkap */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Penjelasan Mendalam <span className="text-emerald-400">*</span>
                </label>
                <textarea
                  rows={4}
                  value={form.definition}
                  onChange={e => setForm(prev => ({ ...prev, definition: e.target.value }))}
                  placeholder="Penjelasan menyeluruh mengenai konsep, mekanisme kerja alel, dan dampaknya..."
                  required
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500 leading-relaxed"
                />
              </div>

              {/* Contoh Penerapan dalam Breeding */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Lightbulb size={13} className="text-emerald-400" />
                  <span>Contoh Penerapan dalam Breeding (Opsional)</span>
                </label>
                <textarea
                  rows={2}
                  value={form.breedingExample || ''}
                  onChange={e => setForm(prev => ({ ...prev, breedingExample: e.target.value }))}
                  placeholder="Contoh nyata pada persilangan indukan (misal: Mack Snow x Mack Snow)..."
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500 leading-relaxed"
                />
              </div>

              {/* Catatan Penting / Kesalahan yang Perlu Dihindari */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <AlertTriangle size={13} className="text-rose-400" />
                  <span>Catatan Penting / Kesalahan Umum yang Perlu Dihindari (Opsional)</span>
                </label>
                <textarea
                  rows={2}
                  value={form.importantNotes || ''}
                  onChange={e => setForm(prev => ({ ...prev, importantNotes: e.target.value }))}
                  placeholder="Hal krusial yang sering salah dipahami penghobi..."
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500 leading-relaxed"
                />
              </div>

              {/* Referensi Materi Terkait */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <GraduationCap size={13} className="text-emerald-400" />
                  <span>Tautkan ke Materi Pembelajaran Terkait (Opsional)</span>
                </label>
                <select
                  value={form.relatedGuideId || ''}
                  onChange={e => {
                    const selId = e.target.value;
                    const matched = STARTER_GENETICS_GUIDES.find(g => g.id === selId);
                    setForm(prev => ({
                      ...prev,
                      relatedGuideId: selId,
                      relatedGuideTitle: matched ? matched.title : ''
                    }));
                  }}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- Tidak Ditautkan ke Materi Spesifik --</option>
                  {STARTER_GENETICS_GUIDES.filter(g => g.category !== 'Glosarium' && g.id !== 'guide-07-glosarium').map(g => (
                    <option key={g.id} value={g.id}>
                      [{g.level}] {g.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Form Buttons */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all inline-flex items-center gap-2 shadow-lg shadow-emerald-950/40 cursor-pointer"
                >
                  <Save size={15} />
                  <span>{saving ? 'Menyimpan...' : 'Simpan Istilah'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
