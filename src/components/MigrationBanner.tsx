import { useState, useEffect } from 'react';
import { X, ExternalLink, RefreshCw, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function MigrationBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const isDismissed = localStorage.getItem('geckofarm_migration_dismissed');
    if (!isDismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('geckofarm_migration_dismissed', 'true');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="mx-4 mt-2 mb-6"
          id="geckofarm-migration-banner"
        >
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl shadow-slate-950/20 text-white">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            
            {/* Header / Dismiss */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20 animate-pulse">
                  <RefreshCw size={20} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                    🚀 Geckofarm Pro Telah Diperbarui
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                    Sistem Infrastruktur Terbaru
                  </p>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="w-8 h-8 rounded-full bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-all border border-slate-700/50 active:scale-95 shrink-0"
                title="Tutup"
                id="close-migration-banner"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content body */}
            <div className="space-y-4">
              <p className="text-slate-200 text-xs sm:text-sm leading-relaxed max-w-3xl">
                Sistem Geckofarm Pro telah berhasil dipindahkan ke server dan database terbaru untuk meningkatkan stabilitas, keamanan, dan performa aplikasi.
              </p>

              {/* Checklist Group */}
              <div className="bg-slate-950/50 border border-slate-800/60 rounded-2xl p-4 space-y-3 max-w-3xl">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-slate-300 text-xs sm:text-sm font-semibold">
                    Seluruh data breeding, registry, pairing, dan clutch tetap tersedia.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-slate-300 text-xs sm:text-sm font-semibold">
                    Login menggunakan akun Google yang sama seperti sebelumnya.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-slate-300 text-xs sm:text-sm font-semibold">
                    Jika Anda masih menggunakan aplikasi lama, disarankan mengakses versi terbaru melalui:{' '}
                    <a
                      href="https://geckofarmpro.id"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 hover:text-emerald-300 transition-colors font-black underline inline-flex items-center gap-0.5"
                    >
                      geckofarmpro.id <ExternalLink size={12} />
                    </a>
                  </p>
                </div>
              </div>

              {/* Action Buttons & Note Text */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-800/50">
                <div className="text-[10px] sm:text-xs text-slate-400 max-w-md font-medium leading-relaxed">
                  Masih menggunakan aplikasi lama? Silakan install ulang Geckofarm Pro dari{' '}
                  <a href="https://geckofarmpro.id" target="_blank" rel="noopener noreferrer" className="text-emerald-400 font-bold hover:underline">
                    geckofarmpro.id
                  </a>{' '}
                  untuk mendapatkan fitur terbaru.
                </div>
                
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={handleDismiss}
                    className="px-4 py-2.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900 hover:bg-slate-800 text-xs font-black uppercase tracking-widest text-slate-300 transition-all active:scale-95"
                    id="dismiss-btn-migration"
                  >
                    Tutup
                  </button>
                  <a
                    href="https://geckofarmpro.id"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-emerald-500/10"
                    id="open-geckofarm-migration"
                  >
                    Buka GeckofarmPro.id <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
