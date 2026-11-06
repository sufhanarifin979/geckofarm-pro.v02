import React, { useState, useEffect } from 'react';
import {
  Award,
  Plus,
  Edit3,
  Trash2,
  Save,
  X,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Eye,
  Check,
  ChevronRight,
  BookOpen,
  Lock,
  Layers
} from 'lucide-react';
import { collection, doc, getDocs, setDoc, query, serverTimestamp } from 'firebase/firestore';
import { db, getCachedEvaluations, setCachedEvaluations, clearCachedEvaluations, isFirestoreQuotaExceeded } from '../lib/firebase';
import { ClassEvaluationData, ClassEvaluationQuestion, GuideLevel, GuideAccessLevel, GuideStatus } from '../types';
import { STARTER_CLASS_EVALUATIONS, seedStarterEvaluationsToFirestore } from './knowledge/starterEvaluationsData';

export default function AdminClassEvaluations() {
  const [evaluations, setEvaluations] = useState<ClassEvaluationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);

  // Edit State
  const [editingEval, setEditingEval] = useState<ClassEvaluationData | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'questions'>('info');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Load from Firestore or Fallback
  const loadEvaluations = async (forceNetwork = false) => {
    setLoading(true);
    setFeedback(null);

    if (!forceNetwork) {
      const cached = getCachedEvaluations(true);
      if (cached && cached.length > 0) {
        setEvaluations(cached);
        setLoading(false);
        setIsUsingFallback(false);
        return;
      }
    }

    try {
      const q = query(collection(db, 'class_evaluations'));
      const snap = await getDocs(q);

      if (!snap.empty) {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as ClassEvaluationData));
        list.sort((a, b) => (a.order || 0) - (b.order || 0));
        setEvaluations(list);
        setCachedEvaluations(list, true);
        setIsUsingFallback(false);
      } else {
        // Fallback to starter
        setEvaluations(STARTER_CLASS_EVALUATIONS);
        setIsUsingFallback(true);
      }
    } catch (e) {
      console.warn('Gagal memuat class_evaluations dari Firestore:', e);
      setEvaluations(STARTER_CLASS_EVALUATIONS);
      setIsUsingFallback(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvaluations();
  }, []);

  // Handle Seed
  const handleSeed = async () => {
    setSeeding(true);
    setSeedResult(null);
    try {
      const res = await seedStarterEvaluationsToFirestore();
      setSeedResult(`Berhasil: ${res.createdCount} ditambahkan, ${res.skippedCount} dilewati.`);
      await loadEvaluations(true);
    } catch (e: any) {
      setSeedResult(`Gagal sinkronisasi: ${e.message || String(e)}`);
    } finally {
      setSeeding(false);
    }
  };

  // Handle Save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEval) return;

    setSaving(true);
    setFeedback(null);

    try {
      const docRef = doc(db, 'class_evaluations', editingEval.id);
      const payload: ClassEvaluationData = {
        ...editingEval,
        updatedAt: serverTimestamp()
      };

      await setDoc(docRef, payload, { merge: true });
      clearCachedEvaluations();

      setFeedback({ type: 'success', message: 'Evaluasi akhir kelas berhasil disimpan ke Firestore!' });
      setTimeout(() => {
        setEditingEval(null);
        loadEvaluations(true);
      }, 900);
    } catch (err: any) {
      setFeedback({ type: 'error', message: `Gagal menyimpan: ${err.message || String(err)}` });
    } finally {
      setSaving(false);
    }
  };

  // Helper to update a question inside editingEval
  const handleUpdateQuestion = (qIndex: number, field: keyof ClassEvaluationQuestion, value: any) => {
    if (!editingEval) return;
    const questions = [...editingEval.questions];
    questions[qIndex] = {
      ...questions[qIndex],
      [field]: value
    };
    setEditingEval({ ...editingEval, questions });
  };

  const handleUpdateOption = (qIndex: number, optIndex: number, text: string) => {
    if (!editingEval) return;
    const questions = [...editingEval.questions];
    const currentOptions = [...questions[qIndex].options] as [string, string, string, string];
    currentOptions[optIndex] = text;
    questions[qIndex] = {
      ...questions[qIndex],
      options: currentOptions
    };
    setEditingEval({ ...editingEval, questions });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <Award size={26} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
              Kelola Rangkuman & Evaluasi Akhir Kelas
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Kelola intisari kurikulum, studi kasus terpadu, dan 10 pertanyaan evaluasi pilihan ganda per tingkat kelas.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isUsingFallback && (
            <button
              type="button"
              disabled={seeding}
              onClick={handleSeed}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer transition-all disabled:opacity-50"
            >
              <Sparkles size={14} />
              <span>{seeding ? 'Menyinkronkan...' : 'Sinkronkan Evaluasi ke Firestore'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => loadEvaluations(true)}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
            title="Muat Ulang Data"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {seedResult && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
          {seedResult}
        </div>
      )}

      {/* List of Evaluations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {evaluations.map(item => (
          <div
            key={item.id}
            className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between gap-5 relative overflow-hidden"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider ${
                    item.tier === 'Pemula'
                      ? 'bg-emerald-100 text-emerald-800'
                      : item.tier === 'Menengah'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-purple-100 text-purple-800'
                  }`}
                >
                  Kelas {item.tier}
                </span>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                      item.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {item.status}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                      item.accessLevel === 'premium' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {item.accessLevel}
                  </span>
                </div>
              </div>

              <h3 className="text-base font-black text-slate-900 leading-snug">
                {item.title}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                {item.subtitle}
              </p>

              <div className="pt-2 flex items-center gap-3 text-xs text-slate-600 font-medium">
                <span className="inline-flex items-center gap-1">
                  <BookOpen size={13} className="text-emerald-600" />
                  <span>{item.summaryModules?.length || 5} Modul</span>
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  <Award size={13} className="text-amber-600" />
                  <span>{item.questions?.length || 10} Soal Evaluasi</span>
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setEditingEval({ ...item });
                  setActiveTab('info');
                }}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Edit3 size={14} />
                <span>Edit Evaluasi</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editingEval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 max-w-4xl w-full my-8 space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-black">
                  <Award size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Edit {editingEval.title}
                  </h3>
                  <span className="text-xs text-slate-400 font-bold">
                    ID: {editingEval.id} • Kelas: {editingEval.tier}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingEval(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {feedback && (
              <div
                className={`p-4 rounded-2xl text-xs font-bold ${
                  feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {feedback.message}
              </div>
            )}

            {/* Tab Navigation inside modal */}
            <div className="flex gap-2 border-b border-slate-100 pb-2">
              <button
                type="button"
                onClick={() => setActiveTab('info')}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition-all ${
                  activeTab === 'info' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                Metadata & Ringkasan
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('questions')}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1.5 ${
                  activeTab === 'questions' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                <Award size={14} />
                <span>10 Soal Evaluasi ({editingEval.questions?.length || 0})</span>
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              {/* TAB 1: INFO & METADATA */}
              {activeTab === 'info' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-slate-700 uppercase mb-1">
                        Judul Rangkuman & Evaluasi
                      </label>
                      <input
                        type="text"
                        required
                        value={editingEval.title}
                        onChange={e => setEditingEval({ ...editingEval, title: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-700 uppercase mb-1">
                        Tingkat Kelas (Tier)
                      </label>
                      <select
                        value={editingEval.tier}
                        onChange={e => setEditingEval({ ...editingEval, tier: e.target.value as GuideLevel })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:border-emerald-500"
                      >
                        <option value="Pemula">Pemula</option>
                        <option value="Menengah">Menengah</option>
                        <option value="Lanjutan">Lanjutan</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-700 uppercase mb-1">
                        Status Publikasi
                      </label>
                      <select
                        value={editingEval.status}
                        onChange={e => setEditingEval({ ...editingEval, status: e.target.value as GuideStatus })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:border-emerald-500"
                      >
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-700 uppercase mb-1">
                        Tingkat Akses
                      </label>
                      <select
                        value={editingEval.accessLevel}
                        onChange={e => setEditingEval({ ...editingEval, accessLevel: e.target.value as GuideAccessLevel })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:border-emerald-500"
                      >
                        <option value="free">Gratis (Free)</option>
                        <option value="premium">Eksklusif Premium</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-700 uppercase mb-1">
                      Deskripsi / Subtitle
                    </label>
                    <textarea
                      rows={3}
                      value={editingEval.subtitle}
                      onChange={e => setEditingEval({ ...editingEval, subtitle: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 outline-none focus:border-emerald-500 font-medium"
                    />
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                    <span className="text-xs font-black text-slate-800 uppercase block">
                      Studi Kasus Terpadu:
                    </span>
                    <input
                      type="text"
                      value={editingEval.caseStudy?.title || ''}
                      onChange={e =>
                        setEditingEval({
                          ...editingEval,
                          caseStudy: { ...editingEval.caseStudy, title: e.target.value }
                        })
                      }
                      placeholder="Judul Studi Kasus..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                    />
                    <textarea
                      rows={2}
                      value={editingEval.caseStudy?.scenario || ''}
                      onChange={e =>
                        setEditingEval({
                          ...editingEval,
                          caseStudy: { ...editingEval.caseStudy, scenario: e.target.value }
                        })
                      }
                      placeholder="Deskripsi Skenario..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: 10 SOAL EVALUASI */}
              {activeTab === 'questions' && (
                <div className="space-y-6 max-h-[55vh] overflow-y-auto pr-1">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-black text-slate-800 uppercase">
                      Daftar 10 Pertanyaan Evaluasi Pilihan Ganda:
                    </span>
                    <span className="text-xs font-bold text-emerald-600">
                      Total: {editingEval.questions?.length || 0} Soal
                    </span>
                  </div>

                  {editingEval.questions.map((q, qIdx) => (
                    <div
                      key={q.id || qIdx}
                      className="p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="w-7 h-7 rounded-xl bg-slate-900 text-white text-xs font-black flex items-center justify-center">
                          {qIdx + 1}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-500">Kunci Benar:</span>
                          <select
                            value={q.correctIndex}
                            onChange={e => handleUpdateQuestion(qIdx, 'correctIndex', Number(e.target.value))}
                            className="px-3 py-1 rounded-lg border border-slate-300 text-xs font-black bg-white"
                          >
                            <option value={0}>Pilihan A</option>
                            <option value={1}>Pilihan B</option>
                            <option value={2}>Pilihan C</option>
                            <option value={3}>Pilihan D</option>
                          </select>
                        </div>
                      </div>

                      {/* Question Text */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                          Teks Pertanyaan
                        </label>
                        <input
                          type="text"
                          required
                          value={q.question}
                          onChange={e => handleUpdateQuestion(qIdx, 'question', e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white outline-none focus:border-emerald-500"
                        />
                      </div>

                      {/* 4 Options */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {q.options.map((opt, optIdx) => (
                          <div key={optIdx} className="space-y-1">
                            <span className="text-[10px] font-black uppercase text-slate-500 flex items-center justify-between">
                              <span>Pilihan {String.fromCharCode(65 + optIdx)}</span>
                              {q.correctIndex === optIdx && (
                                <span className="text-emerald-600 font-bold">★ Kunci Jawaban</span>
                              )}
                            </span>
                            <input
                              type="text"
                              required
                              value={opt}
                              onChange={e => handleUpdateOption(qIdx, optIdx, e.target.value)}
                              className={`w-full px-3 py-2 rounded-xl border text-xs bg-white outline-none ${
                                q.correctIndex === optIdx ? 'border-emerald-500 font-bold' : 'border-slate-300'
                              }`}
                            />
                          </div>
                        ))}
                      </div>

                      {/* Explanation */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                          Pembahasan Ilmiah
                        </label>
                        <textarea
                          rows={2}
                          required
                          value={q.explanation}
                          onChange={e => handleUpdateQuestion(qIdx, 'explanation', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white outline-none focus:border-emerald-500 font-medium"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Modal Footer Controls */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setEditingEval(null)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider inline-flex items-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer transition-all disabled:opacity-50"
                >
                  <Save size={16} />
                  <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
