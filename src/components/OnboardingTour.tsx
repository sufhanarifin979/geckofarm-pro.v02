import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  BookOpen, 
  Heart, 
  Sparkles, 
  Banknote, 
  LayoutDashboard,
  Check,
  Loader2
} from 'lucide-react';

interface OnboardingTourProps {
  profile: UserProfile | null;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  forceOpen?: boolean;
  onCloseForceOpen?: () => void;
}

export default function OnboardingTour({ profile, setProfile, forceOpen, onCloseForceOpen }: OnboardingTourProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // Onboarding phase: 'welcome' | 'tour' | 'closed'
  const [phase, setPhase] = useState<'welcome' | 'tour' | 'closed'>('closed');
  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize/Check onboarding state
  useEffect(() => {
    console.log("OnboardingTour useEffect triggered. Profile:", profile, "forceOpen:", forceOpen);
    if (forceOpen) {
      console.log("OnboardingTour forcing open");
      setPhase('welcome');
      setCurrentStep(0);
    } else if (profile && profile.onboardingCompleted === false) {
      console.log("OnboardingTour opening because onboardingCompleted is false");
      setPhase('welcome');
      setCurrentStep(0);
    } else if (profile && profile.onboardingCompleted === undefined) {
      // Show onboarding if they don't have onboardingCompleted field
      console.log("OnboardingTour opening because onboardingCompleted is undefined");
      setPhase('welcome');
      setCurrentStep(0);
    } else {
      console.log("OnboardingTour not opening. Conditions did not match.");
    }
  }, [profile, forceOpen]);

  const steps = [
    {
      title: 'Registry',
      description: 'Tempat menyimpan seluruh data gecko.',
      detail: 'Mengelola data gecko, morf/genetika, status, foto, harga beli, hingga riwayat silsilah (sire/dam).',
      path: '/registry',
      icon: BookOpen,
      color: 'text-blue-500 bg-blue-500/10 border-blue-500/20'
    },
    {
      title: 'Breeding Pair',
      description: 'Kelola pairing, telur, dan hatchling.',
      detail: 'Mencatat status perkawinan indukan jantan-betina, jumlah telur, inkubasi, hingga anakan.',
      path: '/breeding',
      icon: Heart,
      color: 'text-rose-500 bg-rose-500/10 border-rose-500/20'
    },
    {
      title: 'Breeder AI',
      description: 'Analisis pairing dan prediksi hasil genetik.',
      detail: 'Menggunakan kalkulator genetik pintar untuk mensimulasikan persilangan morph indukan secara akurat.',
      path: '/morph-calculator',
      icon: Sparkles,
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/20'
    },
    {
      title: 'Finance',
      description: 'Catat penjualan, pengeluaran, dan profit farm.',
      detail: 'Melacak transaksi keuangan farm Anda, mulai dari pengeluaran pakan hingga profit hasil penjualan.',
      path: '/finance',
      icon: Banknote,
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
    },
    {
      title: 'Dashboard',
      description: 'Lihat ringkasan aktivitas farm.',
      detail: 'Melihat rangkuman populasi gecko, laporan keuangan terkini, dan to-do list harian.',
      path: '/',
      icon: LayoutDashboard,
      color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20'
    }
  ];

  // Navigate when step changes in tour phase
  useEffect(() => {
    if (phase === 'tour' && steps[currentStep]) {
      const targetPath = steps[currentStep].path;
      if (location.pathname !== targetPath) {
        navigate(targetPath);
      }
    }
  }, [currentStep, phase]);

  // Dispatch active tour path for sidebar highlighting
  useEffect(() => {
    const activePath = (phase === 'tour' && steps[currentStep]) ? steps[currentStep].path : null;
    const event = new CustomEvent('onboarding-tour-active-path', { detail: activePath });
    window.dispatchEvent(event);
    
    return () => {
      window.dispatchEvent(new CustomEvent('onboarding-tour-active-path', { detail: null }));
    };
  }, [phase, currentStep]);

  const saveOnboardingStatus = async (completed: boolean) => {
    if (!profile) return;
    setIsSaving(true);
    
    // Set the state locally first! This ensures responsiveness even under Firestore Quota Exceeded conditions
    setProfile(prev => prev ? { ...prev, onboardingCompleted: completed } : null);

    try {
      const userRef = doc(db, 'users', profile.uid);
      await updateDoc(userRef, { onboardingCompleted: completed });
    } catch (err) {
      console.warn("Error saving onboarding state to Firestore (offline fallback enabled):", err);
    } finally {
      setIsSaving(false);
      setPhase('closed');
      if (onCloseForceOpen) {
        onCloseForceOpen();
      }
    }
  };

  const handleSkip = () => {
    saveOnboardingStatus(true);
  };

  const handleStartTour = () => {
    setPhase('tour');
    setCurrentStep(0);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      saveOnboardingStatus(true);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <AnimatePresence>
      {phase !== 'closed' && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          {/* Backdrop overlay */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-md pointer-events-auto"
            onClick={phase === 'welcome' ? handleSkip : undefined}
          />

          {/* Modal card content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="bg-white border border-slate-200 shadow-2xl rounded-[2rem] md:rounded-[2.5rem] w-full max-w-lg max-h-[92vh] sm:max-h-[85vh] overflow-hidden relative z-[1000] flex flex-col p-5 sm:p-8 md:p-10 pointer-events-auto"
          >
          {phase === 'welcome' ? (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Header */}
              <div className="text-center mb-4 sm:mb-6 shrink-0">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                  Selamat Datang di<br />
                  Gecko Farm <span className="text-emerald-500">Pro</span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 sm:mt-2">
                  Kelola dan pantau peternakan gecko Anda secara efisien.
                </p>
              </div>

              {/* Description items - scrollable container for mobile screen support */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-3 sm:space-y-4 mb-5 sm:mb-8 max-h-[40vh] sm:max-h-none scrollbar-thin">
                <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100 hover:bg-emerald-50/30 hover:border-emerald-100 transition-all group">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0 border border-blue-100 group-hover:scale-105 transition-transform">
                    <BookOpen size={16} className="sm:w-[18px] sm:h-[18px]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm text-slate-900">Kelola Registry Gecko</h3>
                    <p className="text-[10px] sm:text-xs text-slate-500">Simpan detail rekam medis, galeri foto, status ketersediaan, dan riwayat silsilah.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100 hover:bg-emerald-50/30 hover:border-emerald-100 transition-all group">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0 border border-rose-100 group-hover:scale-105 transition-transform">
                    <Heart size={16} className="sm:w-[18px] sm:h-[18px]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm text-slate-900">Pantau Breeding Pair</h3>
                    <p className="text-[10px] sm:text-xs text-slate-500">Kelola perjodohan indukan jantan-betina secara dinamis beserta penetasan telur.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100 hover:bg-emerald-50/30 hover:border-emerald-100 transition-all group">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0 border border-amber-100 group-hover:scale-105 transition-transform">
                    <Sparkles size={16} className="sm:w-[18px] sm:h-[18px]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm text-slate-900">Analisis genetika dengan Breeder AI</h3>
                    <p className="text-[10px] sm:text-xs text-slate-500">Gunakan simulator kalkulator genetik pintar untuk memprediksi anakan morf gecko.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100 hover:bg-emerald-50/30 hover:border-emerald-100 transition-all group">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 group-hover:scale-105 transition-transform">
                    <Banknote size={16} className="sm:w-[18px] sm:h-[18px]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm text-slate-900">Kelola keuangan farm melalui Finance</h3>
                    <p className="text-[10px] sm:text-xs text-slate-500">Rekam setiap transaksi pengeluaran pakan, suplemen, serta pencatatan otomatis hasil penjualan.</p>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 shrink-0">
                <button
                  onClick={handleSkip}
                  disabled={isSaving}
                  className="flex-1 py-3 sm:py-4 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm uppercase tracking-wider transition-all active:scale-98 flex items-center justify-center"
                >
                  Lewati
                </button>
                <button
                  onClick={handleStartTour}
                  className="flex-1 py-3 sm:py-4 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all active:scale-98 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/10"
                >
                  Mulai Tour <ChevronRight size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Progress counter */}
              <div className="flex justify-between items-center mb-4 sm:mb-6 shrink-0">
                <span className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400 tracking-widest bg-slate-50 border px-2.5 py-1 rounded-full shadow-sm">
                  Langkah {currentStep + 1} dari {steps.length}
                </span>
                
                {/* Visual Step Dots */}
                <div className="flex items-center gap-1.5">
                  {steps.map((_, idx) => (
                    <div 
                      key={idx}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        idx === currentStep ? 'w-5 sm:w-6 bg-emerald-500' : 'w-1.5 bg-slate-200'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Tour Step Content Card */}
              <div className="flex-1 overflow-y-auto pr-1 flex flex-col items-center text-center py-4 sm:py-6 scrollbar-thin">
                {/* Step Icon */}
                <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-[1.5rem] sm:rounded-[2rem] border flex items-center justify-center mb-4 sm:mb-6 shadow-md transition-all shrink-0 ${steps[currentStep].color}`}>
                  {(() => {
                    const IconComponent = steps[currentStep].icon;
                    return <IconComponent size={28} className="sm:w-[36px] sm:h-[36px]" />;
                  })()}
                </div>

                <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight uppercase mb-2 shrink-0">
                  {steps[currentStep].title}
                </h2>
                
                <p className="text-slate-600 font-semibold max-w-sm text-xs sm:text-sm">
                  {steps[currentStep].description}
                </p>

                <div className="mt-4 sm:mt-6 bg-slate-50 border border-slate-100 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl max-w-sm w-full shrink-0 flex items-start gap-3 text-left">
                  <div className="text-emerald-500 shrink-0 mt-0.5">
                    <Check size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-black block mb-0.5">Fungsi Menu</span>
                    <p className="text-slate-600 font-semibold text-xs sm:text-[13px] leading-relaxed">
                      {steps[currentStep].detail}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tour Step Actions */}
              <div className="flex gap-2.5 sm:gap-3 pt-3 sm:pt-4 border-t border-slate-100 shrink-0">
                <button
                  onClick={handleBack}
                  disabled={currentStep === 0}
                  className="flex-1 py-2.5 sm:py-3.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-slate-100 text-slate-700 rounded-xl sm:rounded-2xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1"
                >
                  <ChevronLeft size={14} /> Back
                </button>
                <button
                  onClick={handleNext}
                  disabled={isSaving}
                  className="flex-1 py-2.5 sm:py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl sm:rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1 shadow-lg shadow-emerald-500/10"
                >
                  {isSaving ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : currentStep === steps.length - 1 ? (
                    <>Finish <Check size={14} className="ml-0.5" /></>
                  ) : (
                    <>Next <ChevronRight size={14} /></>
                  )}
                </button>
              </div>
            </div>
          )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
