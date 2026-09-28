import React, { useState } from 'react';
import { 
  Dna, 
  ExternalLink, 
  Info,
  ShieldCheck,
  ShieldAlert,
  Trophy, 
  Zap, 
  ArrowLeft, 
  User, 
  Link as LinkIcon,
  Search,
  ArrowLeftRight,
  FlaskConical,
  Eye,
  Calendar,
  Sparkles,
  Layers,
  ChevronRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
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

interface MorphDetailProps {
  morph: MorphEntry;
  onBack: () => void;
  onOpenCompare?: (morph: MorphEntry) => void;
  onNavigateToLab?: (morph: MorphEntry) => void;
}

export default function MorphDetail({ morph, onBack, onOpenCompare, onNavigateToLab }: MorphDetailProps) {
  const navigate = useNavigate();
  const [photoStage, setPhotoStage] = useState<'adult' | 'baby' | 'eye'>('adult');

  const currentPhoto = photoStage === 'baby' 
    ? (morph.image_url_baby || morph.image_url) 
    : photoStage === 'eye' 
    ? (morph.image_url_eye || morph.image_url)
    : morph.image_url;

  const categories = normalizeCategories(morph.category);
  const inheritanceTypes = normalizeInheritance(morph.inheritance_type);
  const rarity = normalizeRarity(morph.rarity);
  const formulas = normalizeGeneticFormula(morph);
  const warnings = normalizeGeneticWarnings(morph);
  const signatures = normalizeGeneticSignatures(morph);
  const combos = normalizeComboPotential(morph);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20 animate-in fade-in duration-300">
      
      {/* Main Info */}
      <div className="lg:col-span-2 space-y-8">
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 p-12 opacity-[0.02] dark:opacity-[0.05] -rotate-12 translate-x-1/4 -translate-y-1/4 pointer-events-none">
            <Dna size={400} />
          </div>

          <div className="relative z-10">
            {/* Badges Row */}
            <div className="flex flex-wrap items-center gap-2.5 mb-6">
              {inheritanceTypes.map((inh, i) => (
                <span key={`inh-${i}`} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                  inh === 'Dominant' ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30' : 
                  inh === 'Recessive' ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30' : 
                  inh === 'Incomplete Dominant' ? 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30' :
                  'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30'
                }`}>
                  {inh}
                </span>
              ))}

              {categories.map((cat, i) => (
                <span key={`cat-${i}`} className="px-4 py-1.5 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-800 flex items-center gap-1.5 shadow-sm">
                  <Zap size={13} className="text-emerald-400" />
                  {cat}
                </span>
              ))}

              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                rarity === 'Legendary' 
                  ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30 font-black' 
                  : rarity === 'Epic'
                  ? 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30 font-black'
                  : rarity === 'Rare'
                  ? 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
              }`}>
                {rarity}
              </span>

              {morph.species && (
                <span className="px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                  {morph.species === 'African Fat-Tailed Gecko' ? 'AFT (Fat-Tailed)' : 'Leopard Gecko'}
                </span>
              )}
            </div>

            {/* Morph Name */}
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white leading-tight tracking-tight mb-6">
              {morph.name}
            </h2>

            {/* Action Bar (Registry & Lab & Compare) */}
            <div className="flex flex-wrap gap-3 mb-8">
              <button
                onClick={() => navigate(`/registry?search=${encodeURIComponent(morph.name)}`)}
                className="px-5 py-3 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                <Search size={16} /> Cari di Koleksi Saya
              </button>

              {onOpenCompare && (
                <button
                  onClick={() => onOpenCompare(morph)}
                  className="px-5 py-3 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
                >
                  <ArrowLeftRight size={16} /> Bandingkan Morph Ini
                </button>
              )}

              {onNavigateToLab && (
                <button
                  onClick={() => onNavigateToLab(morph)}
                  className="px-5 py-3 rounded-2xl bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
                >
                  <FlaskConical size={16} /> Buka di Lab Genetik
                </button>
              )}
            </div>

            {/* Description */}
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Layers size={14} className="text-emerald-500" />
                Deskripsi Visual & Riset
              </h4>
              <p className="text-base sm:text-lg font-medium text-slate-600 dark:text-slate-400 leading-relaxed mb-8 whitespace-pre-wrap">
                {morph.description}
              </p>

              {/* Selection & Grading Priority */}
              {morph.selection_priority && morph.selection_priority.length > 0 && (
                <div className="mb-8 p-8 bg-slate-950 rounded-[2rem] border border-slate-800 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                    <Trophy size={80} className="text-emerald-500" />
                  </div>
                  <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Trophy size={14} />
                    Visual Selection & Grading Guide
                  </h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {morph.selection_priority.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-3 bg-slate-900/50 p-4 rounded-2xl border border-slate-800/50">
                        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] shrink-0" />
                        <span className="text-xs font-bold text-slate-200 leading-tight uppercase tracking-tight">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Breeder Research Insights */}
              {morph.breeder_notes && (
                <div className="mb-8">
                   <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                     <ShieldCheck size={14} />
                     Breeder Research Insights
                   </h4>
                   <div className="text-sm font-bold text-slate-800 dark:text-slate-200 bg-emerald-50/50 dark:bg-emerald-500/5 p-6 rounded-3xl border-l-4 border-emerald-500 leading-relaxed italic">
                     {morph.breeder_notes}
                   </div>
                </div>
              )}
            </div>

            {/* Health Risks / Genetic Warnings (Structured multi-entry) */}
            {warnings.length > 0 && (
              <div className="space-y-3 mb-10">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                  <ShieldAlert size={18} />
                  <h4 className="text-xs font-black uppercase tracking-widest">
                    Genetic Concerns & Health Warnings ({warnings.length})
                  </h4>
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                  {warnings.map((w, idx) => (
                    <div 
                      key={idx} 
                      className="p-5 bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-3xl space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-black text-sm text-rose-900 dark:text-rose-200 flex items-center gap-2">
                          <ShieldAlert size={15} className="text-rose-500 shrink-0" />
                          {w.title}
                        </span>
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300">
                          {w.templateId}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-rose-800/90 dark:text-rose-300/90 leading-relaxed pl-6">
                        {w.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Genetic Formula & Metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 border-t border-slate-100 dark:border-slate-800">
               <div className="space-y-2">
                  <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Genetic Formula</div>
                  <div className="text-base font-mono font-black text-slate-900 dark:text-white truncate">
                    {formulas.length > 0 ? formulas.join(' + ') : (morph.genetics || 'Unknown')}
                  </div>
                  {formulas.length > 1 && (
                    <div className="flex flex-wrap gap-1.5">
                      {formulas.map((f, i) => (
                        <span key={i} className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                          {f}
                        </span>
                      ))}
                    </div>
                  )}
               </div>
               <div className="space-y-1">
                  <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Tahun Ditemukan</div>
                  <div className="text-base font-black text-slate-900 dark:text-white">{morph.discovery_year || 'Historical'}</div>
               </div>
               <div className="space-y-1">
                  <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Slug Reference</div>
                  <div className="text-base font-mono font-black text-slate-400 dark:text-slate-600 truncate">{morph.slug}</div>
               </div>
            </div>
          </div>
        </div>

        {/* Citations & Breeders */}
        <div className="bg-slate-950 rounded-[2.5rem] p-8 sm:p-10 text-white relative overflow-hidden group border border-slate-800">
          <div className="relative z-10 space-y-8">
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight mb-6 flex items-center gap-4">
                <span className="p-3 bg-emerald-500 rounded-2xl shadow-lg shadow-emerald-500/20">
                  <User size={24} className="text-white" />
                </span>
                Credited Discoverers & Lineage Origin
              </h3>
              <div className="flex flex-wrap gap-2">
                {morph.credited_breeders?.length ? morph.credited_breeders.map((breeder, i) => (
                  <span key={i} className="px-5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-black text-emerald-400 tracking-widest uppercase">
                    {breeder}
                  </span>
                )) : (
                  <span className="text-slate-500 text-xs italic">Informasi penemu belum diindeks secara detail dalam arsip riset.</span>
                )}
              </div>
            </div>

            {morph.reference_links?.length ? (
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight mb-6 flex items-center gap-4">
                  <span className="p-3 bg-indigo-500 rounded-2xl shadow-lg shadow-indigo-500/20">
                    <LinkIcon size={24} className="text-white" />
                  </span>
                  Research References
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {morph.reference_links.map((link, i) => (
                    <a 
                      key={i} 
                      href={link.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-2xl flex items-center justify-between group/link transition-all"
                    >
                      <span className="text-xs font-black uppercase tracking-widest text-slate-200">{link.title}</span>
                      <ExternalLink size={16} className="text-slate-500 group-hover/link:text-indigo-400 transition-colors" />
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Sidebar: Photo Gallery & Stage Switcher */}
      <div className="space-y-6">
        <button 
          onClick={onBack}
          className="w-full py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center gap-3 cursor-pointer"
        >
          <ArrowLeft size={18} />
          Kembali ke Katalog
        </button>

        {/* Hero Photo Box with Stage Switcher */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          
          <div className="aspect-[4/5] bg-slate-100 dark:bg-slate-800 rounded-[2rem] overflow-hidden group relative flex items-center justify-center border border-slate-100 dark:border-slate-700 shadow-inner">
            {currentPhoto ? (
              <img 
                src={currentPhoto} 
                alt={morph.name} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="text-center p-8">
                <Dna size={64} className="text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Foto Belum Tersedia</p>
              </div>
            )}

            <div className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur-md px-3.5 py-1.5 rounded-full text-white text-[9px] font-black uppercase tracking-wider border border-white/10 flex items-center gap-1.5 shadow-md">
              <Sparkles size={11} className="text-amber-400" />
              {photoStage === 'baby' ? 'Fase Baby / Anakan' : photoStage === 'eye' ? 'Detail Mata (Eye Focus)' : 'Fase Dewasa (Adult)'}
            </div>
          </div>

          {/* Photo Stage Switcher Buttons */}
          <div className="grid grid-cols-3 gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
            <button
              onClick={() => setPhotoStage('adult')}
              className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                photoStage === 'adult' 
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              Dewasa
            </button>
            <button
              onClick={() => setPhotoStage('baby')}
              className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                photoStage === 'baby' 
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              Baby {morph.image_url_baby && '•'}
            </button>
            <button
              onClick={() => setPhotoStage('eye')}
              className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                photoStage === 'eye' 
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              Mata {morph.image_url_eye && '•'}
            </button>
          </div>
        </div>

        {/* Genetic Signatures & Combo Potential */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div>
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Zap size={14} className="text-emerald-500" />
              Genetic Signatures ({signatures.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {signatures.length ? signatures.map((t, i) => (
                <span key={i} className="text-[9px] font-black px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 rounded-xl uppercase tracking-tight">
                  {t}
                </span>
              )) : <span className="text-[9px] font-bold text-slate-400 uppercase italic">Menunggu pembaruan profil...</span>}
            </div>
          </div>
          
          <div>
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Sparkles size={14} className="text-indigo-500" />
              Combo Potential ({combos.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {combos.length ? combos.map((c, i) => (
                <span key={i} className="text-[9px] font-black px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 rounded-xl uppercase tracking-tight">
                  {c}
                </span>
              )) : <span className="text-[9px] font-bold text-slate-400 uppercase italic">Kombinasi belum diuji...</span>}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
