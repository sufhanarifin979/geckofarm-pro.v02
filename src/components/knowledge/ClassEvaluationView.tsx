import React, { useState, useEffect, useMemo } from 'react';
import {
  Award,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  BookOpen,
  Target,
  FileText,
  Lock,
  Sparkles,
  ArrowRight,
  GraduationCap,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ClassEvaluationData,
  ClassEvaluationResult,
  UserProfile,
  GuideLevel
} from '../../types';
import { isSubscriptionActive } from '../../lib/subscriptionUtils';
import {
  getLearningProgress,
  saveClassEvaluationResult,
  updateClassEvaluationStatus
} from '../../lib/learningProgress';

interface ClassEvaluationViewProps {
  data: ClassEvaluationData;
  profile: UserProfile | null;
  onBack: () => void;
  onNavigateToTier?: (tier: GuideLevel) => void;
  onOpenPremiumModal: () => void;
}

export default function ClassEvaluationView({
  data,
  profile,
  onBack,
  onNavigateToTier,
  onOpenPremiumModal
}: ClassEvaluationViewProps) {
  const isPremiumUser = isSubscriptionActive(profile);
  const isLocked = data.accessLevel === 'premium' && !isPremiumUser;

  // Load existing progress for this tier
  const [userProgress, setUserProgress] = useState(() => getLearningProgress(profile?.uid));
  const currentResult: ClassEvaluationResult | null = useMemo(() => {
    return userProgress.evaluationResults?.[data.tier] || null;
  }, [userProgress, data.tier]);

  // Quiz Taking State
  const [isTakingQuiz, setIsTakingQuiz] = useState<boolean>(false);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showReviewAfterSubmit, setShowReviewAfterSubmit] = useState<boolean>(false);

  // Active Tab: 'summary' | 'competencies' | 'case_study' | 'quiz' | 'next'
  const [activeTab, setActiveTab] = useState<'summary' | 'competencies' | 'case_study' | 'quiz' | 'next'>('summary');

  // Update status to 'in_progress' when user opens this page if not yet completed
  useEffect(() => {
    if (!isLocked) {
      const currentStatus = userProgress.evaluationStatus?.[data.tier];
      if (!currentStatus || currentStatus === 'not_started') {
        const next = updateClassEvaluationStatus(profile?.uid, data.tier, 'in_progress');
        setUserProgress(next);
      }
    }
  }, [data.tier, isLocked, profile?.uid]);

  // Handle Option Select
  const handleSelectOption = (questionId: string, optionIdx: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionIdx }));
  };

  // Submit Quiz
  const handleSubmitQuiz = () => {
    const questions = data.questions || [];
    let correctCount = 0;

    questions.forEach(q => {
      if (answers[q.id] === q.correctIndex) {
        correctCount++;
      }
    });

    const score = correctCount * 10;
    const nextProgress = saveClassEvaluationResult(
      profile?.uid,
      data.tier,
      score,
      correctCount,
      questions.length,
      answers
    );

    setUserProgress(nextProgress);
    setIsTakingQuiz(false);
    setShowReviewAfterSubmit(true);
    setActiveTab('quiz');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Start / Retake Quiz
  const handleStartOrRetakeQuiz = () => {
    setAnswers({});
    setCurrentQuestionIdx(0);
    setIsTakingQuiz(true);
    setShowReviewAfterSubmit(false);
    setActiveTab('quiz');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = data.questions?.length || 10;
  const allAnswered = answeredCount === totalQuestions;

  // Evaluation Score Badge Styler
  const getScoreBadgeStyles = (category: string) => {
    switch (category) {
      case 'Sangat Baik':
        return {
          bg: 'bg-emerald-500/10 text-emerald-700 border-emerald-300',
          indicator: 'bg-emerald-500',
          text: 'Sangat Baik'
        };
      case 'Baik':
        return {
          bg: 'bg-blue-500/10 text-blue-700 border-blue-300',
          indicator: 'bg-blue-500',
          text: 'Baik'
        };
      case 'Cukup':
        return {
          bg: 'bg-amber-500/10 text-amber-800 border-amber-300',
          indicator: 'bg-amber-500',
          text: 'Cukup'
        };
      default:
        return {
          bg: 'bg-rose-500/10 text-rose-700 border-rose-300',
          indicator: 'bg-rose-500',
          text: 'Perlu Mempelajari Kembali Materi'
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer"
            >
              <ChevronLeft size={16} />
              <span>Kembali ke Katalog Materi</span>
            </button>

            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider ${
                  data.tier === 'Pemula'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : data.tier === 'Menengah'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                }`}
              >
                Kelas {data.tier}
              </span>

              {data.accessLevel === 'premium' ? (
                <span className="px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-purple-500/25 text-purple-200 border border-purple-400/30 inline-flex items-center gap-1">
                  <Lock size={12} />
                  <span>Premium</span>
                </span>
              ) : (
                <span className="px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Akses Gratis
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2 max-w-3xl">
            <h1 className="text-xl sm:text-3xl font-black tracking-tight text-white leading-tight">
              {data.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
              {data.subtitle}
            </p>
          </div>

          {/* Quick Stats / Progress Banner */}
          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-slate-300">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/5 border border-white/10">
              <BookOpen size={14} className="text-emerald-400" />
              <span>5 Materi Inti Terangkum</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/5 border border-white/10">
              <Award size={14} className="text-amber-400" />
              <span>10 Soal Evaluasi Akhir</span>
            </span>
            {currentResult && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span>Skor Terakhir: {currentResult.score}/100 ({currentResult.category})</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Locked Premium Banner (if applicable) */}
      {isLocked ? (
        <div className="bg-white rounded-3xl border border-purple-200 p-8 sm:p-12 text-center space-y-5 shadow-sm max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-purple-100 text-purple-700 mx-auto flex items-center justify-center shadow-inner">
            <Lock size={32} />
          </div>
          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-purple-100 text-purple-800">
              Modul Eksklusif GFP Premium
            </span>
            <h3 className="text-xl font-black text-slate-900">
              Rangkuman & Evaluasi Akhir Kelas Lanjutan Terkunci
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-lg mx-auto">
              Bagian penutup dan 10 soal uji kompetensi Kelas Lanjutan dilindungi khusus untuk pelanggan GFP Premium aktif. Tingkatkan akun Anda untuk membuka akses penuh ke seluruh analisis pemuliaan tingkat lanjut.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={onBack}
              className="px-5 py-3 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Kembali ke Daftar Materi
            </button>
            <button
              type="button"
              onClick={onOpenPremiumModal}
              className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-600/20 cursor-pointer inline-flex items-center justify-center gap-2"
            >
              <Sparkles size={16} />
              <span>Lihat Paket Premium</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Sub Navigation Bar for Sections */}
          {!isTakingQuiz && (
            <div className="flex items-center gap-1 sm:gap-2 p-1.5 bg-white rounded-2xl border border-slate-200 overflow-x-auto shadow-sm">
              <button
                type="button"
                onClick={() => setActiveTab('summary')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                  activeTab === 'summary'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <BookOpen size={14} />
                <span>A. Intisari Pembelajaran</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('competencies')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                  activeTab === 'competencies'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Target size={14} />
                <span>B. Kompetensi</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('case_study')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                  activeTab === 'case_study'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <FileText size={14} />
                <span>C. Studi Kasus</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('quiz')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                  activeTab === 'quiz'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                }`}
              >
                <Award size={14} />
                <span>D. Evaluasi Akhir</span>
                {currentResult && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-700 text-white font-bold">
                    {currentResult.score}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('next')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                  activeTab === 'next'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <ArrowRight size={14} />
                <span>E. Pengantar Berikutnya</span>
              </button>
            </div>
          )}

          {/* ============================================================= */}
          {/* SECTION A: INTISARI PEMBELAJARAN                              */}
          {/* ============================================================= */}
          {activeTab === 'summary' && !isTakingQuiz && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3 pb-1">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                    <BookOpen size={20} className="text-emerald-600" />
                    <span>A. Intisari Pembelajaran Kelas {data.tier}</span>
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Ringkasan sistematis konsep utama dari 5 materi pembelajaran yang wajib Anda ingat.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.summaryModules.map(m => (
                  <div
                    key={m.moduleNumber}
                    className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-black flex items-center justify-center shrink-0">
                        {m.moduleNumber}
                      </span>
                      <h3 className="text-xs sm:text-sm font-black text-slate-900 leading-snug">
                        {m.moduleTitle}
                      </h3>
                    </div>
                    <ul className="space-y-2">
                      {m.keyPoints.map((pt, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-slate-600 leading-relaxed font-medium">
                          <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveTab('competencies')}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white text-xs font-black uppercase tracking-wider inline-flex items-center gap-2 transition-all cursor-pointer"
                >
                  <span>Lanjut ke Kompetensi →</span>
                </button>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* SECTION B: KOMPETENSI YANG HARUS DIKUASAI                     */}
          {/* ============================================================= */}
          {activeTab === 'competencies' && !isTakingQuiz && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  <Target size={20} className="text-emerald-600" />
                  <span>B. Kompetensi yang Harus Dikuasai</span>
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Tolok ukur kemampuan praktis yang seharusnya sudah Anda kuasai setelah menyelesaikan kelas ini.
                </p>
              </div>

              <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
                <div className="space-y-3">
                  {data.competencies.map((comp, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3.5"
                    >
                      <div className="w-7 h-7 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                        {idx + 1}
                      </div>
                      <div className="space-y-0.5 flex-1">
                        <span className="text-xs sm:text-sm font-bold text-slate-900 leading-relaxed block">
                          {comp}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-between">
                <button
                  type="button"
                  onClick={() => setActiveTab('summary')}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  ← Kembali ke Intisari
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('case_study')}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white text-xs font-black uppercase tracking-wider inline-flex items-center gap-2 transition-all cursor-pointer"
                >
                  <span>Lanjut ke Studi Kasus →</span>
                </button>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* SECTION C: STUDI KASUS TERPADU                                */}
          {/* ============================================================= */}
          {activeTab === 'case_study' && !isTakingQuiz && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  <FileText size={20} className="text-emerald-600" />
                  <span>C. Studi Kasus Terpadu</span>
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Penerapan integratif konsep-konsep materi dalam skenario nyata persilangan reptil.
                </p>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-5">
                <div className="space-y-2">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                    Skenario Nyata
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    {data.caseStudy.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    {data.caseStudy.scenario}
                  </p>
                </div>

                <div className="space-y-2.5">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <Sparkles size={14} className="text-emerald-600" />
                    <span>Analisis Genetik Komprehensif:</span>
                  </h4>
                  <div className="space-y-2">
                    {data.caseStudy.geneticBreakdown.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100 text-xs text-emerald-950 font-medium leading-relaxed"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 text-white space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block">
                    Pelajaran Inti Studi Kasus:
                  </span>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                    {data.caseStudy.keyLesson}
                  </p>
                </div>
              </div>

              <div className="pt-2 flex justify-between">
                <button
                  type="button"
                  onClick={() => setActiveTab('competencies')}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  ← Kembali ke Kompetensi
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('quiz')}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider inline-flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-600/20"
                >
                  <Award size={15} />
                  <span>Lanjut ke Evaluasi Akhir →</span>
                </button>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* SECTION D: EVALUASI AKHIR (QUIZ MODE & RESULTS REVIEW)        */}
          {/* ============================================================= */}
          {activeTab === 'quiz' && (
            <div className="space-y-5">
              {/* If Quiz is NOT in progress and user has NOT just submitted, show Overview / Past Result Banner */}
              {!isTakingQuiz && (
                <div className="space-y-5">
                  {/* Results Banner (if already taken) */}
                  {currentResult && (
                    <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                        <div className="space-y-1">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                            Riwayat Hasil Evaluasi Terakhir
                          </span>
                          <h3 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                            <span>Skor Anda:</span>
                            <span className="text-emerald-600">{currentResult.score} / 100</span>
                            <span className="text-xs font-bold text-slate-400">({currentResult.percentage}%)</span>
                          </h3>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border flex items-center gap-2 ${
                              getScoreBadgeStyles(currentResult.category).bg
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${getScoreBadgeStyles(currentResult.category).indicator}`} />
                            <span>{currentResult.category}</span>
                          </span>
                        </div>
                      </div>

                      {/* Stat Counters */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                          <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Soal</span>
                          <span className="text-lg font-black text-slate-900">{currentResult.totalQuestions} Soal</span>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 text-center">
                          <span className="text-[10px] font-bold text-emerald-700 uppercase block">Jawaban Benar</span>
                          <span className="text-lg font-black text-emerald-700">{currentResult.totalCorrect}</span>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-100 text-center">
                          <span className="text-[10px] font-bold text-rose-700 uppercase block">Jawaban Salah</span>
                          <span className="text-lg font-black text-rose-700">
                            {currentResult.totalQuestions - currentResult.totalCorrect}
                          </span>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                          <span className="text-[10px] font-bold text-slate-500 uppercase block">Waktu Selesai</span>
                          <span className="text-xs font-bold text-slate-700 block mt-1">
                            {new Date(currentResult.completedAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center pt-2">
                        <button
                          type="button"
                          onClick={() => setShowReviewAfterSubmit(!showReviewAfterSubmit)}
                          className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                        >
                          {showReviewAfterSubmit ? 'Sembunyikan Pembahasan Soal' : 'Tinjau Pembahasan 10 Soal'}
                        </button>

                        <button
                          type="button"
                          onClick={handleStartOrRetakeQuiz}
                          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white text-xs font-black uppercase tracking-wider inline-flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                          <RotateCcw size={14} />
                          <span>Ulangi Evaluasi</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* If Never Taken Before, Show Welcome Start Card */}
                  {!currentResult && (
                    <div className="p-6 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-sm text-center space-y-6 max-w-2xl mx-auto">
                      <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center shadow-inner">
                        <GraduationCap size={32} />
                      </div>

                      <div className="space-y-2">
                        <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-800">
                          Evaluasi Pemahaman 10 Soal
                        </span>
                        <h3 className="text-xl font-black text-slate-900">
                          Siap Menguji Penguasaan Materi Kelas {data.tier}?
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
                          Evaluasi ini terdiri dari 10 pertanyaan pilihan ganda yang menguji konsep 5 materi pembelajaran. Setiap jawaban benar bernilai 10 poin (Skor maksimal 100).
                        </p>
                      </div>

                      {/* Criteria Reference */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-left p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                        <div className="p-2">
                          <span className="font-black text-emerald-600 block">90–100</span>
                          <span className="text-[11px] text-slate-500">Sangat Baik</span>
                        </div>
                        <div className="p-2">
                          <span className="font-black text-blue-600 block">80–89</span>
                          <span className="text-[11px] text-slate-500">Baik</span>
                        </div>
                        <div className="p-2">
                          <span className="font-black text-amber-600 block">70–79</span>
                          <span className="text-[11px] text-slate-500">Cukup</span>
                        </div>
                        <div className="p-2">
                          <span className="font-black text-rose-600 block">&lt; 70</span>
                          <span className="text-[11px] text-slate-500">Perlu Review</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleStartOrRetakeQuiz}
                        className="px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-600/25 transition-all cursor-pointer inline-flex items-center gap-2"
                      >
                        <Award size={16} />
                        <span>Mulai Evaluasi Akhir Sekarang</span>
                      </button>
                    </div>
                  )}

                  {/* Review Mode (All 10 Questions with user choices & explanations) */}
                  {showReviewAfterSubmit && currentResult && (
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                          <FileText size={16} className="text-emerald-600" />
                          <span>Pembahasan Lengkap 10 Soal Evaluasi</span>
                        </h3>
                      </div>

                      <div className="space-y-4">
                        {data.questions.map((q, qIndex) => {
                          const userChoice = currentResult.answers?.[q.id];
                          const isCorrect = userChoice === q.correctIndex;

                          return (
                            <div
                              key={q.id}
                              className={`p-5 sm:p-6 rounded-3xl border bg-white shadow-sm space-y-4 ${
                                isCorrect ? 'border-emerald-200' : 'border-rose-200'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="space-y-1">
                                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                    Pertanyaan {qIndex + 1} dari 10
                                  </span>
                                  <h4 className="text-xs sm:text-sm font-black text-slate-900 leading-snug">
                                    {q.question}
                                  </h4>
                                </div>
                                <span
                                  className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider shrink-0 inline-flex items-center gap-1 ${
                                    isCorrect
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-rose-100 text-rose-800'
                                  }`}
                                >
                                  {isCorrect ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                                  <span>{isCorrect ? 'Benar (+10)' : 'Salah (0)'}</span>
                                </span>
                              </div>

                              <div className="space-y-2">
                                {q.options.map((opt, optIdx) => {
                                  const isSelected = userChoice === optIdx;
                                  const isTheCorrectOption = optIdx === q.correctIndex;

                                  let optStyles = 'bg-slate-50 border-slate-200 text-slate-700';
                                  if (isTheCorrectOption) {
                                    optStyles = 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold';
                                  } else if (isSelected && !isCorrect) {
                                    optStyles = 'bg-rose-50 border-rose-300 text-rose-900 line-through';
                                  }

                                  return (
                                    <div
                                      key={optIdx}
                                      className={`p-3 rounded-2xl border text-xs flex items-center justify-between gap-2 ${optStyles}`}
                                    >
                                      <div className="flex items-center gap-2.5">
                                        <span className="w-5 h-5 rounded-lg bg-white/80 border border-slate-300 text-[10px] font-black flex items-center justify-center shrink-0">
                                          {String.fromCharCode(65 + optIdx)}
                                        </span>
                                        <span>{opt}</span>
                                      </div>
                                      {isTheCorrectOption && (
                                        <span className="text-[10px] font-bold text-emerald-700 shrink-0">
                                          Kunci Benar
                                        </span>
                                      )}
                                      {isSelected && !isCorrect && (
                                        <span className="text-[10px] font-bold text-rose-700 shrink-0">
                                          Pilihan Anda
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Explanation Box */}
                              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                                  Pembahasan Ilmiah:
                                </span>
                                <p className="text-slate-700 leading-relaxed font-medium">
                                  {q.explanation}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Quiz Taking Active Mode */}
              {isTakingQuiz && (
                <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
                  {/* Progress Header */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-black text-slate-700">
                        Soal {currentQuestionIdx + 1} dari {totalQuestions}
                      </span>
                      <span className="font-bold text-slate-500">
                        Terjawab: {answeredCount} / {totalQuestions}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-300"
                        style={{ width: `${((currentQuestionIdx + 1) / totalQuestions) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Question Card */}
                  {data.questions[currentQuestionIdx] && (
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                          Pertanyaan No. {currentQuestionIdx + 1}
                        </span>
                        <h3 className="text-sm sm:text-base font-black text-slate-900 leading-snug">
                          {data.questions[currentQuestionIdx].question}
                        </h3>
                      </div>

                      {/* Options */}
                      <div className="space-y-2.5">
                        {data.questions[currentQuestionIdx].options.map((opt, optIdx) => {
                          const qId = data.questions[currentQuestionIdx].id;
                          const isSelected = answers[qId] === optIdx;

                          return (
                            <button
                              key={optIdx}
                              type="button"
                              onClick={() => handleSelectOption(qId, optIdx)}
                              className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border text-xs sm:text-sm font-medium transition-all flex items-center justify-between gap-3 cursor-pointer ${
                                isSelected
                                  ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold shadow-sm'
                                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <span
                                  className={`w-6 h-6 rounded-xl flex items-center justify-center text-xs font-black shrink-0 transition-colors ${
                                    isSelected
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                                  }`}
                                >
                                  {String.fromCharCode(65 + optIdx)}
                                </span>
                                <span>{opt}</span>
                              </div>
                              <span
                                className={`w-4 h-4 rounded-full border-2 shrink-0 ${
                                  isSelected ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'
                                }`}
                              />
                            </button>
                          );
                        })}
                      </div>

                      {/* Question Navigation Numbers */}
                      <div className="pt-2 flex flex-wrap items-center gap-1.5">
                        {data.questions.map((q, idx) => {
                          const isDone = answers[q.id] !== undefined;
                          const isCurrent = idx === currentQuestionIdx;

                          return (
                            <button
                              key={q.id}
                              type="button"
                              onClick={() => setCurrentQuestionIdx(idx)}
                              className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                isCurrent
                                  ? 'bg-slate-900 text-white ring-2 ring-emerald-500'
                                  : isDone
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                              }`}
                            >
                              {idx + 1}
                            </button>
                          );
                        })}
                      </div>

                      {/* Navigation Controls */}
                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                        <button
                          type="button"
                          disabled={currentQuestionIdx === 0}
                          onClick={() => setCurrentQuestionIdx(prev => Math.max(0, prev - 1))}
                          className={`px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 inline-flex items-center gap-1.5 transition-all ${
                            currentQuestionIdx === 0 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-50 cursor-pointer'
                          }`}
                        >
                          <ChevronLeft size={16} />
                          <span>Sebelumnya</span>
                        </button>

                        {currentQuestionIdx < totalQuestions - 1 ? (
                          <button
                            type="button"
                            onClick={() => setCurrentQuestionIdx(prev => Math.min(totalQuestions - 1, prev + 1))}
                            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <span>Selanjutnya</span>
                            <ChevronRight size={16} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={!allAnswered}
                            onClick={handleSubmitQuiz}
                            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider inline-flex items-center gap-2 shadow-lg transition-all ${
                              allAnswered
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 cursor-pointer'
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            <Award size={16} />
                            <span>Selesaikan & Lihat Skor</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ============================================================= */}
          {/* SECTION E: PENGANTAR KELAS BERIKUTNYA / PENUTUP                */}
          {/* ============================================================= */}
          {activeTab === 'next' && !isTakingQuiz && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  <ArrowRight size={20} className="text-emerald-600" />
                  <span>E. {data.nextTierIntro.targetTierTitle}</span>
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Langkah strategis Anda selanjutnya dalam program pemuliaan reptil.
                </p>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
                <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                    Arah Pembelajaran
                  </span>
                  <p className="text-xs sm:text-sm text-emerald-950 font-medium leading-relaxed">
                    {data.nextTierIntro.description}
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                    Materi yang Akan Anda Pelajari:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {data.nextTierIntro.highlightTopics.map((topic, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-2.5 text-xs text-slate-800 font-bold"
                      >
                        <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                        <span>{topic}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-end items-center">
                  <button
                    type="button"
                    onClick={() => setActiveTab('quiz')}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    ← Kembali ke Evaluasi
                  </button>

                  {data.nextTierIntro.targetTierLevel && onNavigateToTier && (
                    <button
                      type="button"
                      onClick={() => onNavigateToTier(data.nextTierIntro.targetTierLevel!)}
                      className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider inline-flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
                    >
                      <span>Masuk ke {data.nextTierIntro.targetTierTitle}</span>
                      <ArrowRight size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
