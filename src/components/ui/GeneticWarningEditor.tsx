import React, { useState } from 'react';
import { ShieldAlert, Plus, Trash2, AlertTriangle, Sparkles, ChevronDown } from 'lucide-react';
import { GeneticWarning } from '../../types';
import { GENETIC_WARNING_TEMPLATES } from '../../lib/morphNormalizer';

interface GeneticWarningEditorProps {
  warnings: GeneticWarning[];
  onChange: (warnings: GeneticWarning[]) => void;
}

export function GeneticWarningEditor({ warnings = [], onChange }: GeneticWarningEditorProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleAddTemplate = (templateKey: string) => {
    const template = GENETIC_WARNING_TEMPLATES[templateKey];
    if (!template) return;

    const newWarning: GeneticWarning = {
      templateId: templateKey,
      title: template.title,
      description: template.description,
      type: 'genetic_warning'
    };

    onChange([...warnings, newWarning]);
    setIsDropdownOpen(false);
  };

  const handleUpdate = (index: number, updated: Partial<GeneticWarning>) => {
    const list = [...warnings];
    list[index] = { ...list[index], ...updated };
    onChange(list);
  };

  const handleRemove = (index: number) => {
    onChange(warnings.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-1.5">
            <ShieldAlert size={14} />
            Genetic Warnings & Health Risks (Template Selector)
          </label>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5">
            Peringatan genetik terstruktur yang digunakan oleh Breeder AI Analysis dan detail riset.
          </p>
        </div>

        {/* Add Warning Dropdown Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            <Plus size={14} />
            <span>+ Add Genetic Warning</span>
            <ChevronDown size={14} className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2 z-40 space-y-1 animate-in fade-in zoom-in-95 duration-150">
              <div className="text-[9px] font-black uppercase text-slate-400 px-3 py-1 tracking-wider border-b border-slate-100 dark:border-slate-800">
                Pilih Template Bawaan:
              </div>

              <button
                type="button"
                onClick={() => handleAddTemplate('enigma')}
                className="w-full text-left p-2.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors flex flex-col group cursor-pointer"
              >
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-rose-600 dark:group-hover:text-rose-400 flex items-center justify-between">
                  Enigma Warning
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 font-black uppercase">Neuro</span>
                </span>
                <span className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">Enigma Syndrome (head tilt, wobble)</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddTemplate('lemon_frost')}
                className="w-full text-left p-2.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors flex flex-col group cursor-pointer"
              >
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-rose-600 dark:group-hover:text-rose-400 flex items-center justify-between">
                  Lemon Frost (LF) Warning
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 font-black uppercase">Tumor</span>
                </span>
                <span className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">Malignant melanoma & tumor kulit</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddTemplate('white_yellow')}
                className="w-full text-left p-2.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors flex flex-col group cursor-pointer"
              >
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-rose-600 dark:group-hover:text-rose-400 flex items-center justify-between">
                  White & Yellow (WY) Warning
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 font-black uppercase">W&Y</span>
                </span>
                <span className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">W&Y syndrome & sensitivitas suhu</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddTemplate('super_form_lethal')}
                className="w-full text-left p-2.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors flex flex-col group cursor-pointer"
              >
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-rose-600 dark:group-hover:text-rose-400 flex items-center justify-between">
                  Super Form Lethal Warning
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 font-black uppercase">Lethal</span>
                </span>
                <span className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">Kematian embrio (Whiteout x Whiteout)</span>
              </button>

              <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>

              <button
                type="button"
                onClick={() => handleAddTemplate('custom')}
                className="w-full text-left p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 group cursor-pointer text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                <Plus size={14} className="text-slate-400" />
                <span>+ Custom Warning (Teks Bebas)</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Warnings List */}
      <div className="space-y-3">
        {warnings.map((w, idx) => (
          <div
            key={idx}
            className="p-4 bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-2xl space-y-3 relative transition-all"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1">
                <ShieldAlert size={16} className="text-rose-500 shrink-0" />
                <input
                  type="text"
                  value={w.title}
                  onChange={(e) => handleUpdate(idx, { title: e.target.value })}
                  placeholder="Judul Peringatan (e.g. Enigma Warning)..."
                  className="font-bold text-xs text-rose-900 dark:text-rose-200 bg-transparent border-b border-rose-300/40 dark:border-rose-800/40 focus:border-rose-500 outline-none w-full py-0.5"
                />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300">
                  {w.templateId || 'warning'}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-900/30 rounded-lg transition-colors cursor-pointer"
                  title="Hapus Warning"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <textarea
              rows={2}
              value={w.description}
              onChange={(e) => handleUpdate(idx, { description: e.target.value })}
              placeholder="Deskripsi detail risiko genetik..."
              className="w-full p-2.5 bg-white/80 dark:bg-slate-900/80 border border-rose-200/70 dark:border-rose-900/40 rounded-xl text-xs text-slate-700 dark:text-slate-300 leading-relaxed outline-none focus:border-rose-500 transition-all font-medium"
            />
          </div>
        ))}

        {warnings.length === 0 && (
          <div
            onClick={() => setIsDropdownOpen(true)}
            className="p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center cursor-pointer hover:border-rose-400/40 transition-all group"
          >
            <ShieldAlert size={24} className="mx-auto text-slate-300 dark:text-slate-600 mb-1 group-hover:text-rose-400 transition-colors" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Belum ada genetic warning ditambahkan. Klik untuk memilih template warning.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
