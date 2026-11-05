import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  BookOpen,
  GraduationCap,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile } from '../../types';
import AdminEncyclopedia from '../AdminEncyclopedia';
import AdminGeneticsGuide from '../AdminGeneticsGuide';
import AdminGeneticsGlossary from '../AdminGeneticsGlossary';
import PremiumModal from '../PremiumModal';

// Sub-components
import Encyclopedia from './Encyclopedia';
import GeneticsGuide from './GeneticsGuide';

export default function Knowledge({ profile }: { profile: UserProfile | null }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState<'encyclopedia' | 'guide' | 'admin'>('encyclopedia');
  const [adminSubTab, setAdminSubTab] = useState<'encyclopedia' | 'guide' | 'glossary'>('guide');
  const [preferredSpecies, setPreferredSpecies] = useState<'Leopard Gecko' | 'African Fat-Tailed Gecko' | undefined>(
    undefined
  );
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);

  const isAdmin = profile?.email === 'sufhan.arifin979@gmail.com';
  const isLightMode = activeTab === 'encyclopedia' || activeTab === 'guide';

  // Sync URL query params (?tab=guide|encyclopedia&species=LG|AFT)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    const speciesParam = params.get('species');

    if (tabParam === 'guide' || tabParam === 'panduan') {
      setActiveTab('guide');
    } else if (tabParam === 'encyclopedia') {
      setActiveTab('encyclopedia');
    } else if (tabParam === 'admin' && isAdmin) {
      setActiveTab('admin');
    }

    if (speciesParam === 'AFT') {
      setPreferredSpecies('African Fat-Tailed Gecko');
    } else if (speciesParam === 'LG') {
      setPreferredSpecies('Leopard Gecko');
    }
  }, [location.search, isAdmin]);

  return (
    <div className={`flex flex-col min-h-screen transition-colors duration-500 ${isLightMode ? 'bg-white' : 'dark bg-slate-950'}`}>
      {/* Header */}
      <header
        className={`border-b px-4 sm:px-6 py-6 transition-all duration-500 ${
          isLightMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div>
              <h1
                className={`text-2xl font-black flex items-center gap-3 transition-colors ${
                  isLightMode ? 'text-slate-900' : 'text-white'
                }`}
              >
                {activeTab === 'guide' ? (
                  <GraduationCap className="text-emerald-500" size={28} />
                ) : (
                  <BookOpen className="text-emerald-500" size={28} />
                )}
                <span>{activeTab === 'guide' ? 'Panduan Genetika' : 'Ensiklopedia Morph'}</span>
              </h1>
              <p
                className={`text-sm font-medium transition-colors ${
                  isLightMode ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                Ensiklopedia Morph & Pusat Belajar Genetika Reptil
              </p>
            </div>
          </div>

          <div
            className={`flex items-center p-1 rounded-2xl overflow-x-auto no-scrollbar max-w-full transition-colors ${
              isLightMode ? 'bg-slate-100' : 'bg-slate-800'
            }`}
          >
            <button
              type="button"
              onClick={() => setActiveTab('encyclopedia')}
              className={`px-4 sm:px-6 py-2.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'encyclopedia'
                  ? isLightMode
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'bg-slate-900 text-emerald-500 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <BookOpen size={16} />
              <span>Ensiklopedia</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('guide')}
              className={`px-4 sm:px-6 py-2.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'guide'
                  ? isLightMode
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'bg-slate-900 text-emerald-500 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <GraduationCap size={16} />
              <span>Panduan Genetika</span>
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={() => setActiveTab('admin')}
                className={`px-4 sm:px-6 py-2.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'admin'
                    ? isLightMode
                      ? 'bg-white text-emerald-500 shadow-sm'
                      : 'bg-slate-900 text-emerald-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <Zap size={16} />
                <span>Admin</span>
              </button>
            )}
          </div>

          <div className="hidden lg:flex items-center gap-3">
            <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl flex items-center gap-2">
              <GraduationCap size={16} className="text-emerald-600 dark:text-emerald-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                Pusat Edukasi Genetika
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-8 pb-24 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'encyclopedia' ? (
              <motion.div
                key="encyclopedia"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
              >
                <Encyclopedia
                  initialSpecies={preferredSpecies}
                  onNavigateToLab={morph => {
                    const sp = (morph as any)?.species === 'African Fat-Tailed Gecko' ? 'AFT' : 'LG';
                    navigate(`/morph-calculator?species=${sp}`);
                  }}
                />
              </motion.div>
            ) : activeTab === 'guide' ? (
              <motion.div
                key="guide"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
              >
                <GeneticsGuide
                  profile={profile}
                  initialSpecies={preferredSpecies}
                  onNavigateToEncyclopedia={targetSpecies => {
                    if (targetSpecies) setPreferredSpecies(targetSpecies);
                    setActiveTab('encyclopedia');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onNavigateToAdminGuides={() => {
                    if (isAdmin) {
                      setAdminSubTab('guide');
                      setActiveTab('admin');
                    }
                  }}
                  onNavigateToAdminGlossary={() => {
                    if (isAdmin) {
                      setAdminSubTab('glossary');
                      setActiveTab('admin');
                    }
                  }}
                />
              </motion.div>
            ) : (
              <motion.div
                key="admin"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                className="space-y-6"
              >
                {/* Admin Sub-Navigation inside Knowledge */}
                <div className="flex flex-wrap items-center gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-2xl w-fit">
                  <button
                    type="button"
                    onClick={() => setAdminSubTab('guide')}
                    className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                      adminSubTab === 'guide'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <GraduationCap size={15} />
                    <span>Kelola Materi Belajar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdminSubTab('glossary')}
                    className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                      adminSubTab === 'glossary'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <BookOpen size={15} />
                    <span>Kelola Glosarium Istilah</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdminSubTab('encyclopedia')}
                    className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                      adminSubTab === 'encyclopedia'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <BookOpen size={15} />
                    <span>Kelola Ensiklopedia Morph</span>
                  </button>
                </div>

                {adminSubTab === 'guide' ? (
                  <AdminGeneticsGuide />
                ) : adminSubTab === 'glossary' ? (
                  <AdminGeneticsGlossary />
                ) : (
                  <AdminEncyclopedia />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <PremiumModal
        isOpen={isPremiumModalOpen}
        onClose={() => setIsPremiumModalOpen(false)}
        profile={profile}
      />
    </div>
  );
}
